"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LocationPicker from "@/components/LocationPicker";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function DiscoverPage() {
  const { user, refreshUser } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [booking, setBooking] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "map">("list");
  const [venueRatings, setVenueRatings] = useState<any[]>([]);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.get("/catalog/venues/").then((r) => setVenues(r.data.results || r.data)).catch(() => {});
  }, [user?.id]);

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
        const msg = err.code === 1 ? "دسترسی به موقعیت مکانی رد شد. از تنظیمات مرورگر اجازه دهید."
          : err.code === 2 ? "موقعیت مکانی در دسترس نیست. روی دسکتاپ ممکن است GPS فعال نباشد."
          : err.code === 3 ? "دریافت موقعیت مکانی بیش از حد طول کشید."
          : "خطا در دریافت موقعیت مکانی.";
        setLocationError(msg);
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  };

  const loadOffers = async (venueId: number) => {
    const res = await api.get(`/catalog/venues/${venueId}/offers/`);
    setOffers(res.data);
  };

  const loadTimeslots = async (offerId: number) => {
    const res = await api.get(`/catalog/offer-timeslots/${offerId}/`);
    setTimeslots(res.data);
  };

  const loadRatings = async (venueId: number) => {
    const res = await api.get(`/catalog/venues/${venueId}/ratings/`);
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
      setVenues((prev) => prev.map((v) =>
        v.id === selectedVenue.id ? { ...v, avg_rating: ratingScore, rating_count: (v.rating_count || 0) + 1 } : v
      ));
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در ارسال نظر");
    }
    setSubmittingRating(false);
  };

  const handleSelectOffer = async (offer: any) => {
    setSelectedOffer(offer);
    setSelectedSlot(null);
    await loadTimeslots(offer.id);
  };

  const handleBook = async () => {
    if (!selectedOffer) return;
    setBooking(selectedOffer.id);
    try {
      const payload: any = { offer_id: selectedOffer.id };
      if (selectedSlot) payload.timeslot_id = selectedSlot;
      const res = await api.post("/bookings/", payload);
      alert(`رزرو شد! کد ورود: ${res.data.check_in_code}`);
      setBooking(null);
      setSelectedOffer(null);
      setSelectedSlot(null);
      setSelectedVenue(null);
      refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.response?.data?.timeslot_id?.[0] || "خطا در رزرو");
      setBooking(null);
    }
  };

  if (!user) return null;

  const userGender = (user as any).gender;

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filtered = venues
    .filter((v: any) => {
      const matchesSearch = !search || v.name?.includes(search) || v.district?.includes(search);
      if (!matchesSearch) return false;
      const currentGender = v.gender_for_now || v.gender_policy;
      if (!userGender) return true;
      if (userGender === "male") return currentGender === "mixed" || currentGender === "male";
      if (userGender === "female") return currentGender === "mixed" || currentGender === "female";
      return true;
    })
    .map((v: any) => ({
      ...v,
      _distance: userLocation && v.lat && v.lng
        ? haversine(userLocation.lat, userLocation.lng, v.lat, v.lng)
        : null,
    }))
    .sort((a: any, b: any) => {
      if (a._distance === null) return 1;
      if (b._distance === null) return -1;
      return a._distance - b._distance;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">کشف باشگاه‌ها</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "list" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              لیست
            </button>
            <button
              onClick={() => setView("map")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${view === "map" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            >
              نقشه
            </button>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو بر اساس نام یا منطقه..."
          className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />

        {!userLocation && (
          <div className="mb-4 space-y-3">
            <LocationPicker
              onPick={(lat, lng) => {
                setUserLocation({ lat, lng });
                setLocationError("");
              }}
              initialCenter={[35.6892, 51.3890]}
              buttonText="📍 انتخاب موقعیت از نقشه"
            />
            <button
              onClick={requestLocation}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              📡 استفاده از موقعیت خودکار (GPS)
            </button>
            {locationError && <p className="text-xs text-amber-600">{locationError}</p>}
          </div>
        )}

        {userLocation && (
          <div className="mb-4 flex items-center justify-end rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2">
            <button onClick={() => setUserLocation(null)} className="text-xs text-red-500 hover:underline">حذف موقعیت</button>
          </div>
        )}

        {view === "map" ? (
          <div className="mb-6 h-[500px] rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <MapView
              venues={filtered}
              userLocation={userLocation}
              onSelect={(v: any) => { setSelectedVenue(v); loadOffers(v.id); loadRatings(v.id); }}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v: any) => (
            <div
              key={v.id}
              onClick={() => { setSelectedVenue(v); loadOffers(v.id); loadRatings(v.id); }}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate">{v.name}</h3>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{v.category_name}</span>
                  {(v.gender_for_now || v.gender_policy) === "male" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">آقایان</span>}
                  {(v.gender_for_now || v.gender_policy) === "female" && <span className="rounded-full bg-pink-50 px-2 py-0.5 text-xs font-medium text-pink-700">بانوان</span>}
                </div>
              </div>
              <p className="text-sm text-gray-600">{v.district} &middot; {v.city}</p>
              {v.address && <p className="mt-1 text-xs text-gray-600 truncate">{v.address}</p>}
              {v._distance != null && (
                <p className="mt-1 text-xs text-emerald-600">{v._distance.toFixed(1)} کیلومتر</p>
              )}
              {v.avg_rating != null && (
                <p className="mt-1 text-sm text-amber-600">&#9733; {v.avg_rating} <span className="text-xs text-gray-600">({v.rating_count} نظر)</span></p>
              )}
              {v.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{v.description}</p>}
            </div>
          ))}
        </div>

        {/* Offer Modal */}
        {selectedVenue && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4" onClick={() => { setSelectedVenue(null); setSelectedOffer(null); setTimeslots([]); }}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">{selectedVenue.name}</h2>
                <button onClick={() => { setSelectedVenue(null); setSelectedOffer(null); setTimeslots([]); }} className="text-gray-600 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <p className="mb-1 text-sm text-gray-600">{selectedVenue.district} &middot; {selectedVenue.city}</p>
              {selectedVenue.address && <p className="mb-3 text-sm text-gray-600">{selectedVenue.address}</p>}

              {/* Gender schedule */}
              {selectedVenue.gender_slots && selectedVenue.gender_slots.length > 0 && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-600">سانس‌ها:</p>
                  <div className="space-y-1">
                    {(() => {
                      const dayMap: Record<string, string> = {sat:"شنبه",sun:"یکشنبه",mon:"دوشنبه",tue:"سه‌شنبه",wed:"چهارشنبه",thu:"پنجشنبه",fri:"جمعه"};
                      const grouped: Record<string, any[]> = {};
                      selectedVenue.gender_slots.forEach((s: any) => {
                        if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
                        grouped[s.day_of_week].push(s);
                      });
                      return Object.entries(grouped).map(([day, slots]) => (
                        <div key={day} className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-gray-700 w-20">{dayMap[day] || day}</span>
                          {slots.map((s: any, i: number) => (
                            <span key={i} className={`rounded px-1.5 py-0.5 ${s.gender === "male" ? "bg-blue-100 text-blue-700" : s.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-700"}`}>
                              {s.start_time?.slice(0,5)}-{s.end_time?.slice(0,5)} {s.gender === "male" ? "آقایان" : s.gender === "female" ? "بانوان" : ""}
                            </span>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              {!selectedVenue.gender_slots?.length && selectedVenue.gender_policy !== "mixed" && (
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">
                    سیاست جنسیت: {selectedVenue.gender_policy === "male" ? "آقایان" : "بانوان"}
                  </p>
                </div>
              )}

              {selectedOffer ? (
                /* Timeslot selection */
                <div>
                  <button onClick={() => { setSelectedOffer(null); setTimeslots([]); }} className="mb-3 text-sm text-emerald-600 hover:underline">بازگشت به لیست آفرها</button>
                  <p className="mb-1 font-semibold text-gray-900">{selectedOffer.name}</p>
                  <p className="mb-3 text-sm text-gray-600">{selectedOffer.duration_minutes} دقیقه &middot; {formatTomans(selectedOffer.price)}</p>
                  {timeslots.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 mb-3">زمان رزرو موجود نیست.</p>
                      <button
                        onClick={handleBook}
                        disabled={booking !== null}
                        className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {booking ? "در حال رزرو..." : "رزرو بدون انتخاب زمان"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-xs font-medium text-gray-600">زمان مورد نظر را انتخاب کنید:</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {timeslots.map((s: any) => (
                          <button
                            key={s.id}
                            onClick={() => setSelectedSlot(s.id === selectedSlot ? null : s.id)}
                            disabled={!s.is_available}
                            className={`w-full rounded-lg border p-3 text-right text-sm transition ${
                              !s.is_available ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                              : s.id === selectedSlot ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                              : "border-gray-200 hover:border-emerald-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{s.date} &middot; {s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</span>
                              {s.is_available ? (
                                <span className="text-xs text-emerald-600">{s.remaining > 0 ? `${s.remaining} ظرفیت` : "موجود"}</span>
                              ) : (
                                <span className="text-xs text-red-400">تکمیل</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleBook}
                        disabled={booking !== null}
                        className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {booking ? "در حال رزرو..." : "رزرو"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Offer list */
                offers.length === 0 ? (
                  <p className="py-8 text-center text-gray-600">آفری موجود نیست.</p>
                ) : (
                  <div className="space-y-3">
                    {offers.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                        <div>
                          <p className="font-medium text-gray-900">{o.name}</p>
                          <p className="text-sm text-gray-600">{o.duration_minutes} دقیقه &middot; {o.gender_restriction === "male" ? "آقایان" : o.gender_restriction === "female" ? "بانوان" : ""}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-emerald-700">{formatTomans(o.price)}</p>
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
                )
              )}

              {/* Rating Section */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">نظرات کاربران</h3>
                {venueRatings.length === 0 ? (
                  <p className="text-xs text-gray-600 mb-3">هنوز نظری ثبت نشده.</p>
                ) : (
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {venueRatings.map((r: any) => (
                      <div key={r.id} className="rounded-lg bg-gray-50 p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-amber-600 text-xs">{"★".repeat(r.score)}</span>
                          <span className="text-xs text-gray-600">{r.user_name || r.user_phone}</span>
                        </div>
                        {r.comment && <p className="text-xs text-gray-700">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-700">نظر شما:</p>
                  <div className="mb-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setRatingScore(s)}
                        className={`text-lg ${s <= ratingScore ? "text-amber-500" : "text-gray-300"}`}>
                        &#9733;
                      </button>
                    ))}
                  </div>
                  <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="نظر خود را بنویسید (اختیاری)"
                    className="mb-2 w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-emerald-500 focus:outline-none" rows={2} />
                  <button onClick={handleSubmitRating} disabled={submittingRating}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {submittingRating ? "در حال ارسال..." : "ارسال نظر"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
