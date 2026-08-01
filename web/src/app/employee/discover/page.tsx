"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Button, Card, LoadingState, EmptyState, Modal } from "@/components/ui";
import { Badge } from "@/components/ui";
import dynamic from "next/dynamic";
import LocationPicker from "@/components/LocationPicker";
import { MapPinIcon } from "@/components/icons";
import { formatTomans } from "@/lib/format";
import { Venue, Offer, TimeSlot, VenueRating, GenderSlot } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

export default function DiscoverPage() {
  const { user, refreshUser } = useAuth();
  const { data: venuesData, loading: venuesLoading, refetch } = useApi<Venue[]>("/catalog/venues/");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [booking, setBooking] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [venueRatings, setVenueRatings] = useState<VenueRating[]>([]);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  const venuesList = venuesData || [];

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند");
      return;
    }
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError("");
      },
      (err) => {
        const msg =
          err.code === 1
            ? "دسترسی به موقعیت مکانی رد شد. از تنظیمات مرورگر اجازه دهید."
            : err.code === 2
            ? "موقعیت مکانی در دسترس نیست. روی دسکتاپ ممکن است GPS فعال نباشد."
            : err.code === 3
            ? "دریافت موقعیت مکانی بیش از حد طول کشید."
            : "خطا در دریافت موقعیت مکانی.";
        setLocationError(msg);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  };

  const loadOffers = async (venueId: number) => {
    const res = await api.get<Offer[]>(`/catalog/venues/${venueId}/offers/`);
    setOffers(res.data);
  };

  const loadTimeslots = async (offerId: number) => {
    const res = await api.get<TimeSlot[]>(`/catalog/offer-timeslots/${offerId}/`);
    setTimeslots(res.data);
  };

  const loadRatings = async (venueId: number) => {
    const res = await api.get<VenueRating[]>(`/catalog/venues/${venueId}/ratings/`);
    setVenueRatings(res.data);
  };

  const handleSubmitRating = async () => {
    if (!selectedVenue) return;
    setSubmittingRating(true);
    try {
      await api.post(`/catalog/venues/${selectedVenue.id}/rate/`, {
        score: ratingScore,
        comment: ratingComment,
      });
      setRatingComment("");
      setRatingScore(5);
      loadRatings(selectedVenue.id);
      refetch();
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } };
      alert(e.response?.data?.detail || "خطا در ارسال نظر");
    }
    setSubmittingRating(false);
  };

  const handleSelectOffer = async (offer: Offer) => {
    setSelectedOffer(offer);
    setSelectedSlot(null);
    await loadTimeslots(offer.id);
  };

  const handleBook = async () => {
    if (!selectedOffer) return;
    setBooking(selectedOffer.id);
    try {
      const payload: { offer_id: number; timeslot_id?: number } = {
        offer_id: selectedOffer.id,
      };
      if (selectedSlot) payload.timeslot_id = selectedSlot;
      const res = await api.post<{ check_in_code: string }>("/bookings/", payload);
      alert(`رزرو شد! کد ورود: ${res.data.check_in_code}`);
      setBooking(null);
      setSelectedOffer(null);
      setSelectedSlot(null);
      setSelectedVenue(null);
      refreshUser();
    } catch (err) {
      const e = err as { response?: { data?: Record<string, unknown> } };
      alert(
        String(
          e.response?.data?.detail ||
            e.response?.data?.timeslot_id ||
            "خطا در رزرو"
        )
      );
      setBooking(null);
    }
  };

  const closeVenue = () => {
    setSelectedVenue(null);
    setSelectedOffer(null);
    setTimeslots([]);
    setOffers([]);
  };

  if (!user) return null;

  const userGender = (user as { gender?: string }).gender;

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getDistance = (v: Venue): number | null => {
    if (!userLocation || !v.lat || !v.lng) return null;
    return haversine(userLocation.lat, userLocation.lng, v.lat, v.lng);
  };

  const filtered: Venue[] = (venuesList || []).filter((v: Venue) => {
      const matchesSearch =
        !search ||
        v.name?.includes(search) ||
        v.district?.includes(search || "");
      if (!matchesSearch) return false;
      const currentGender = v.gender_for_now || v.gender_policy;
      if (!userGender) return true;
      if (userGender === "male")
        return currentGender === "mixed" || currentGender === "male";
      if (userGender === "female")
        return currentGender === "mixed" || currentGender === "female";
      return true;
    })
    .sort((a, b) => {
      const da = getDistance(a);
      const db = getDistance(b);
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });

  return (
    <PageShell title="کشف باشگاه‌ها" maxWidth="7xl" padded={false}>
      {venuesLoading ? (
        <LoadingState message="در حال بارگذاری باشگاه‌ها..." />
      ) : (
        <div className="px-4 sm:px-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              کشف باشگاه‌ها
            </h1>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو بر اساس نام یا منطقه..."
                className="w-full sm:w-64 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
                <button
                  onClick={() => setView("list")}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  لیست
                </button>
                <button
                  onClick={() => setView("map")}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${view === "map" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  نقشه
                </button>
              </div>
            </div>
          </div>

          {!userLocation && (
            <div className="mb-4 space-y-3">
              <LocationPicker
                onPick={(lat, lng) => {
                  setUserLocation({ lat, lng });
                  setLocationError("");
                }}
                initialCenter={[35.6892, 51.389]}
                buttonText="انتخاب موقعیت از نقشه"
              />
              <button
                onClick={requestLocation}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <MapPinIcon className="h-4 w-4" />
                استفاده از موقعیت خودکار (GPS)
              </button>
              {locationError && (
                <p className="text-xs text-amber-600">{locationError}</p>
              )}
            </div>
          )}

          {userLocation && (
            <div className="mb-4 flex items-center justify-end rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2">
              <button
                onClick={() => setUserLocation(null)}
                className="text-xs text-red-500 hover:underline"
              >
                حذف موقعیت
              </button>
            </div>
          )}

          {view === "map" && (
            <div className="mb-6 h-[500px] rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <MapView
                venues={filtered}
                userLocation={userLocation}
                onSelect={(v: Venue) => {
                  setSelectedVenue(v);
                  loadOffers(v.id);
                  loadRatings(v.id);
                }}
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="باشگاهی یافت نشد"
              description="جست‌واژه یا موقعیت خود را تغییر دهید."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => (
                <Card
                  key={v.id}
                  hover
                  className="cursor-pointer p-5"
                  onClick={() => {
                    setSelectedVenue(v);
                    loadOffers(v.id);
                    loadRatings(v.id);
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {v.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Badge variant="info" size="sm">
                        {v.category_name}
                      </Badge>
                      {v.gender_for_now === "male" && (
                        <Badge variant="info" size="sm">آقایان</Badge>
                      )}
                      {v.gender_for_now === "female" && (
                        <Badge variant="warning" size="sm">بانوان</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {v.district} · {v.city}
                  </p>
                  {v.address && (
                    <p className="mt-1 text-xs text-gray-600 truncate">
                      {v.address}
                    </p>
                  )}
                  {(() => {
                    const d = getDistance(v);
                    return d != null ? (
                      <p className="mt-1 text-xs text-emerald-600">
                        {d.toFixed(1)} کیلومتر
                      </p>
                    ) : null;
                  })()}
                  {v.avg_rating != null && (
                    <p className="mt-1 text-sm text-amber-600">
                      ★ {v.avg_rating}{" "}
                      <span className="text-xs text-gray-600">
                        ({v.rating_count} نظر)
                      </span>
                    </p>
                  )}
                  {v.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {v.description}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Venue Detail Modal */}
      {selectedVenue && (
        <Modal open={!!selectedVenue} onClose={closeVenue} className="max-w-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedVenue.name}
            </h2>
            <button
              onClick={closeVenue}
              className="text-2xl text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="mb-1 text-sm text-gray-600">
            {selectedVenue.district} · {selectedVenue.city}
          </p>
          {selectedVenue.address && (
            <p className="mb-3 text-sm text-gray-600">
              {selectedVenue.address}
            </p>
          )}

          {selectedVenue.gender_slots && selectedVenue.gender_slots.length > 0 && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-600">سانس‌ها:</p>
              <div className="space-y-1">
                {genderSlotGroups(selectedVenue.gender_slots).map((g) => (
                  <div
                    key={g.day}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-20 font-medium text-gray-700">
                      {g.label}
                    </span>
                    {g.slots.map((s) => (
                      <span
                        key={s.id}
                        className={`rounded px-1.5 py-0.5 ${
                          s.gender === "male"
                            ? "bg-blue-100 text-blue-700"
                            : s.gender === "female"
                            ? "bg-pink-100 text-pink-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}{" "}
                        {s.gender === "male"
                          ? "آقایان"
                          : s.gender === "female"
                          ? "بانوان"
                          : ""}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {!selectedVenue.gender_slots?.length &&
            selectedVenue.gender_policy !== "mixed" && (
              <div className="mb-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-600">
                  سیاست جنسیت:{" "}
                  {selectedVenue.gender_policy === "male"
                    ? "آقایان"
                    : "بانوان"}
                </p>
              </div>
            )}

          {selectedOffer ? (
            <div>
              <button
                onClick={() => {
                  setSelectedOffer(null);
                  setTimeslots([]);
                }}
                className="mb-3 text-sm text-emerald-600 hover:underline"
              >
                بازگشت به لیست آفرها
              </button>
              <p className="mb-1 font-semibold text-gray-900">
                {selectedOffer.name}
              </p>
              <p className="mb-3 text-sm text-gray-600">
                {selectedOffer.duration_minutes} دقیقه ·{" "}
                {formatTomans(selectedOffer.price)}
              </p>
              {timeslots.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-3">زمان رزرو موجود نیست.</p>
                  <Button
                    variant="primary"
                    onClick={handleBook}
                    loading={booking === selectedOffer.id}
                    disabled={booking !== null}
                  >
                    {booking ? "در حال رزرو..." : "رزرو بدون انتخاب زمان"}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-xs font-medium text-gray-600">
                    زمان مورد نظر را انتخاب کنید:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {timeslots.map((s) => (
                      <button
                        key={s.id}
                        onClick={() =>
                          setSelectedSlot(s.id === selectedSlot ? null : s.id)
                        }
                        disabled={!s.is_available}
                        className={`w-full rounded-lg border p-3 text-right text-sm transition ${
                          !s.is_available
                            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                            : s.id === selectedSlot
                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {s.date} · {s.start_time?.slice(0, 5)} -{" "}
                            {s.end_time?.slice(0, 5)}
                          </span>
                          {s.is_available ? (
                            <span className="text-xs text-emerald-600">
                              {s.remaining > 0
                                ? `${s.remaining} ظرفیت`
                                : "موجود"}
                            </span>
                          ) : (
                            <span className="text-xs text-red-400">تکمیل</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    className="mt-4 w-full"
                    onClick={handleBook}
                    loading={booking === selectedOffer.id}
                    disabled={booking !== null}
                  >
                    {booking ? "در حال رزرو..." : "رزرو"}
                  </Button>
                </>
              )}
            </div>
          ) : offers.length === 0 ? (
            <p className="py-8 text-center text-gray-600">آفری موجود نیست.</p>
          ) : (
            <div className="space-y-3">
              {offers.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{o.name}</p>
                    <p className="text-sm text-gray-600">
                      {o.duration_minutes} دقیقه{" "}
                      {o.gender_restriction === "male"
                        ? "آقایان"
                        : o.gender_restriction === "female"
                        ? "بانوان"
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-emerald-700">
                      {formatTomans(o.price)}
                    </p>
                    <button
                      onClick={() => handleSelectOffer(o)}
                      className="mt-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      انتخاب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rating Section */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              نظرات کاربران
            </h3>
            {venueRatings.length === 0 ? (
              <p className="text-xs text-gray-600 mb-3">
                هنوز نظری ثبت نشده.
              </p>
            ) : (
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {venueRatings.map((r) => (
                  <div key={r.id} className="rounded-lg bg-gray-50 p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-600 text-xs">
                        {"★".repeat(r.score)}
                      </span>
                      <span className="text-xs text-gray-600">
                        {r.user_name || r.user_phone}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-gray-700">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-700">
                نظر شما:
              </p>
              <div className="mb-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRatingScore(s)}
                    className={`text-lg ${s <= ratingScore ? "text-amber-500" : "text-gray-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="نظر خود را بنویسید (اختیاری)"
                className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none"
                rows={2}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitRating}
                loading={submittingRating}
              >
                {submittingRating ? "در حال ارسال..." : "ارسال نظر"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

type DayGroup = { day: string; label: string; slots: GenderSlot[] };

function genderSlotGroups(slots: GenderSlot[]): DayGroup[] {
  const dayMap: Record<GenderSlot["day_of_week"], string> = {
    sat: "شنبه",
    sun: "یکشنبه",
    mon: "دوشنبه",
    tue: "سه‌شنبه",
    wed: "چهارشنبه",
    thu: "پنجشنبه",
    fri: "جمعه",
  };
  const grouped: Partial<Record<GenderSlot["day_of_week"], GenderSlot[]>> = {};
  slots.forEach((s) => {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week]!.push(s);
  });
  return (Object.keys(dayMap) as GenderSlot["day_of_week"][])
    .filter((day) => grouped[day])
    .map((day) => ({
      day,
      label: dayMap[day],
      slots: grouped[day]!,
    }));
}
