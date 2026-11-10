"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import LocationPicker from "@/components/LocationPicker";
import { Badge, Button, Card, EmptyState, fieldClass, LoadingState, Modal, Skeleton, Textarea, useToast } from "@/components/ui";
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon, ClockIcon, MapPinIcon, SearchIcon, StarIconSolid, XMarkIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { apiErrorDetail } from "@/lib/errors";
import { formatClock, formatDate, formatNumber, formatTomans, formatTomansShort, GENDER_LABELS } from "@/lib/format";
import type { GenderSlot, Offer, TimeSlot, Venue, VenueRating } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type LatLng = { lat: number; lng: number };

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Can a user of `gender` use a venue whose current policy is `policy`? */
function genderAllowed(policy: string | undefined, gender?: string | null) {
  if (!gender || !policy || policy === "mixed") return true;
  return policy === gender;
}

export default function DiscoverPage() {
  const { user, refreshUser } = useAuth();
  const { data, loading } = useApi<Venue[]>("/catalog/venues/");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [location, setLocation] = useState<LatLng | null>(null);
  const [locError, setLocError] = useState("");
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<Venue | null>(null);

  const venues = useMemo(() => data || [], [data]);

  // deep link: /user/discover?venue=12 opens that venue's booking sheet
  const [deepLink, setDeepLink] = useState<number | null>(() =>
    typeof window === "undefined" ? null : Number(new URLSearchParams(window.location.search).get("venue")) || null,
  );
  const sheet = selected ?? (deepLink ? (venues.find((v) => v.id === deepLink) ?? null) : null);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    venues.forEach((v) => v.category_slug && seen.set(v.category_slug, categoryMeta(v.category_slug, v.category_name).label));
    return Array.from(seen, ([slug, label]) => ({ slug, label }));
  }, [venues]);

  const distanceOf = (v: Venue) => (location && v.lat != null && v.lng != null ? haversineKm(location, { lat: v.lat, lng: v.lng }) : null);

  const filtered = venues
    .filter((v) => {
      const q = search.trim();
      if (q && !v.name?.includes(q) && !v.district?.includes(q) && !v.address?.includes(q)) return false;
      if (category !== "all" && v.category_slug !== category) return false;
      return genderAllowed(v.gender_for_now || v.gender_policy, user?.gender);
    })
    .sort((a, b) => {
      const da = distanceOf(a);
      const db = distanceOf(b);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });

  const useGps = () => {
    if (!navigator.geolocation) {
      setLocError("مرورگر شما از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocError(
          err.code === 1
            ? "اجازه دسترسی به موقعیت داده نشد. از تنظیمات مرورگر اجازه دهید یا روی نقشه انتخاب کنید."
            : "دریافت موقعیت ممکن نشد. لطفاً موقعیت را روی نقشه انتخاب کنید.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 },
    );
  };

  return (
    <PageShell
      roles={["user"]}
      title="کشف مجموعه‌ها"
      subtitle="باشگاه، استخر، سینما و مجموعه‌های طرف قرارداد را پیدا کنید و با بودجه شرکت رزرو کنید."
      maxWidth="7xl"
      action={
        user && (
          <Badge variant="brand" className="px-3 py-1.5 text-sm">
            بودجه شما: {formatTomansShort(user.remaining_budget)}
          </Badge>
        )
      }
    >
      {/* Toolbar */}
      <Card p="sm" className="mb-6 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام مجموعه، محله یا آدرس…"
              className={cn(fieldClass(), "h-11 ps-10")}
              aria-label="جستجو"
            />
          </div>
          <div className="flex items-center gap-2">
            {location ? (
              <Button variant="secondary" onClick={() => setLocation(null)} icon={<XMarkIcon />}>
                مرتب‌سازی بر اساس فاصله
              </Button>
            ) : (
              <Button variant="outline" onClick={useGps} loading={locating} icon={<MapPinIcon />}>
                نزدیک من
              </Button>
            )}
            <div className="inline-flex rounded-xl bg-gray-100/80 p-1" role="tablist" aria-label="نوع نمایش">
              {(["list", "map"] as const).map((k) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={view === k}
                  onClick={() => setView(k)}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
                    view === k ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
                  )}
                >
                  {k === "list" ? "فهرست" : "نقشه"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {categories.length > 1 && (
          <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
            {[{ slug: "all", label: "همه" }, ...categories].map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                className={cn(
                  "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition",
                  category === c.slug ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink-700 hover:border-gray-300",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {!location && (locError || view === "map") && (
          <div className="space-y-2">
            {locError && <p className="text-xs text-amber-700">{locError}</p>}
            <LocationPicker onPick={(lat, lng) => setLocation({ lat, lng })} buttonText="انتخاب موقعیت من روی نقشه" />
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {view === "map" && (
            <Card p="none" className="mb-6 h-[460px] overflow-hidden">
              <MapView venues={filtered} userLocation={location} onSelect={setSelected} />
            </Card>
          )}

          <p className="mb-3 text-sm text-ink-500">{formatNumber(filtered.length)} مجموعه</p>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<SearchIcon />}
                title="مجموعه‌ای پیدا نشد"
                description="عبارت جستجو یا دسته‌بندی را تغییر دهید."
                action={
                  (search || category !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setCategory("all");
                      }}
                    >
                      پاک کردن فیلترها
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((v) => (
                <VenueCard key={v.id} venue={v} distance={distanceOf(v)} onOpen={() => setSelected(v)} />
              ))}
            </div>
          )}
        </>
      )}

      {sheet && (
        <VenueSheet
          venue={sheet}
          remainingBudget={user?.remaining_budget ?? 0}
          onClose={() => {
            setSelected(null);
            setDeepLink(null);
          }}
          onBooked={refreshUser}
        />
      )}
    </PageShell>
  );
}

function VenueCard({ venue: v, distance, onOpen }: { venue: Venue; distance: number | null; onOpen: () => void }) {
  const cat = categoryMeta(v.category_slug, v.category_name);
  const prices = (v.offers || []).filter((o) => o.is_active !== false).map((o) => o.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const gender = v.gender_for_now || v.gender_policy;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-5 text-start shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[var(--shadow-pop)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6", cat.tint)}>{cat.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-ink-900 group-hover:text-brand-800">{v.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-500">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            {[v.district, v.city === "Tehran" ? "تهران" : v.city].filter(Boolean).join("، ")}
          </p>
        </div>
      </div>

      {v.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-ink-500">{v.description}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Badge variant="neutral" size="sm">{cat.label}</Badge>
        {gender && gender !== "mixed" && (
          <Badge variant={gender === "female" ? "warning" : "info"} size="sm">
            اکنون: {GENDER_LABELS[gender]}
          </Badge>
        )}
        {distance != null && (
          <Badge variant="brand" size="sm">
            {formatNumber(Math.round(distance * 10) / 10)} کیلومتر
          </Badge>
        )}
      </div>

      <div className="min-h-4 flex-1" />
      <div className="flex items-end justify-between gap-2 border-t border-line pt-4">
        <div className="flex items-center gap-1 text-sm">
          {v.avg_rating != null ? (
            <>
              <StarIconSolid className="h-4 w-4 text-amber-400" />
              <span className="font-semibold text-ink-900">{formatNumber(v.avg_rating)}</span>
              <span className="text-xs text-ink-500">({formatNumber(v.rating_count)})</span>
            </>
          ) : (
            <span className="text-xs text-ink-400">بدون امتیاز</span>
          )}
        </div>
        {minPrice != null && (
          <p className="text-sm text-ink-500">
            از <span className="tabular font-bold text-ink-900">{formatTomans(minPrice)}</span>
          </p>
        )}
      </div>
    </button>
  );
}

const DAYS: Record<GenderSlot["day_of_week"], string> = {
  sat: "شنبه",
  sun: "یکشنبه",
  mon: "دوشنبه",
  tue: "سه‌شنبه",
  wed: "چهارشنبه",
  thu: "پنجشنبه",
  fri: "جمعه",
};

type Step = "offers" | "slots" | "done";

function VenueSheet({
  venue,
  remainingBudget,
  onClose,
  onBooked,
}: {
  venue: Venue;
  remainingBudget: number;
  onClose: () => void;
  onBooked: () => void;
}) {
  const toast = useToast();
  const { data: offers, loading: offersLoading } = useApi<Offer[]>(`/catalog/venues/${venue.id}/offers/`);
  const { data: ratings, refetch: refetchRatings } = useApi<VenueRating[]>(`/catalog/venues/${venue.id}/ratings/`);
  const [step, setStep] = useState<Step>("offers");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [booking, setBooking] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(false);

  const cat = categoryMeta(venue.category_slug, venue.category_name);

  const pickOffer = async (o: Offer) => {
    setOffer(o);
    setSlotId(null);
    setSlots(null);
    setStep("slots");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.get<TimeSlot[]>(`/catalog/offer-timeslots/${o.id}/`, { params: { date: today, upcoming: 1 } });
      setSlots(res.data);
    } catch {
      setSlots([]);
    }
  };

  const book = async () => {
    if (!offer) return;
    setBooking(true);
    try {
      const res = await api.post<{ check_in_code: string }>("/bookings/", {
        offer_id: offer.id,
        ...(slotId ? { timeslot_id: slotId } : {}),
      });
      setCode(res.data.check_in_code);
      setStep("done");
      onBooked();
    } catch (err) {
      toast.error("رزرو انجام نشد", apiErrorDetail(err, "لطفاً دوباره تلاش کنید."));
    }
    setBooking(false);
  };

  const submitRating = async () => {
    setRating(true);
    try {
      await api.post(`/catalog/venues/${venue.id}/rate/`, { score, comment });
      setComment("");
      toast.success("نظر شما ثبت شد", "ممنون که تجربه‌تان را به اشتراک گذاشتید.");
      refetchRatings();
    } catch (err) {
      toast.error("ثبت نظر ممکن نشد", apiErrorDetail(err));
    }
    setRating(false);
  };

  const slotGroups = (venue.gender_slots || []).reduce<Partial<Record<GenderSlot["day_of_week"], GenderSlot[]>>>((acc, s) => {
    (acc[s.day_of_week] ??= []).push(s);
    return acc;
  }, {});

  const insufficient = offer ? offer.price > remainingBudget : false;

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5", cat.tint)}>{cat.icon}</span>
          <span className="min-w-0">
            <span className="block truncate">{venue.name}</span>
            <span className="block truncate text-xs font-normal text-ink-500">
              {cat.label} · {venue.district || venue.city}
            </span>
          </span>
        </span>
      }
    >
      {step === "done" && offer ? (
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <CheckCircleIcon className="h-9 w-9" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-ink-900">رزرو شما ثبت شد</h3>
          <p className="mt-1 text-sm text-ink-500">
            {offer.name} · {formatTomans(offer.price)} از بودجه شما کسر شد.
          </p>
          {code && (
            <div className="mt-6 w-full max-w-xs rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-5">
              <p className="text-xs text-ink-500">کد ورود — هنگام مراجعه به پذیرش نشان دهید</p>
              <p dir="ltr" className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-brand-700">
                {code}
              </p>
            </div>
          )}
          <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button asChild>
              <Link href="/user/bookings">مشاهده رزروهای من</Link>
            </Button>
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
          </div>
        </div>
      ) : step === "slots" && offer ? (
        <div>
          <button onClick={() => setStep("offers")} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
            <ArrowLeftIcon className="h-4 w-4 rotate-180" /> بازگشت به خدمات
          </button>
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-canvas p-4">
            <div>
              <p className="font-semibold text-ink-900">{offer.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-500">
                <ClockIcon className="h-4 w-4" /> {formatNumber(offer.duration_minutes)} دقیقه
              </p>
            </div>
            <p className="tabular text-lg font-bold text-brand-700">{formatTomans(offer.price)}</p>
          </div>

          {slots === null ? (
            <LoadingState message="در حال دریافت سانس‌ها…" className="py-8" />
          ) : slots.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-500">
              این خدمت سانس مشخصی ندارد؛ کد ورود شما در ساعات کاری مجموعه معتبر است.
            </p>
          ) : (
            <>
              <p className="mb-2 text-sm font-medium text-ink-700">انتخاب سانس</p>
              <div className="scroll-thin grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {slots.map((s) => (
                  <button
                    key={s.id}
                    disabled={!s.is_available}
                    onClick={() => setSlotId(s.id === slotId ? null : s.id)}
                    aria-pressed={s.id === slotId}
                    className={cn(
                      "rounded-xl border p-3 text-start text-sm transition",
                      !s.is_available
                        ? "cursor-not-allowed border-line bg-canvas text-ink-400"
                        : s.id === slotId
                          ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                          : "border-line hover:border-brand-300",
                    )}
                  >
                    <span className="flex items-center gap-1.5 font-medium text-ink-900">
                      <CalendarIcon className="h-4 w-4 text-ink-400" />
                      {formatDate(s.date, { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="mt-1 flex items-center justify-between text-xs">
                      <span className="tabular text-ink-700">
                        {formatClock(s.start_time)} تا {formatClock(s.end_time)}
                      </span>
                      <span className={s.is_available ? "text-brand-700" : "text-red-500"}>
                        {!s.is_available ? "تکمیل" : s.capacity === 0 ? "آزاد" : `${formatNumber(s.remaining)} جای خالی`}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {insufficient && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">بودجه باقی‌مانده شما برای این خدمت کافی نیست.</p>
          )}
          <Button
            className="mt-5 w-full"
            size="lg"
            onClick={book}
            loading={booking}
            disabled={insufficient || slots === null || (slots.length > 0 && !slotId)}
          >
            {slots && slots.length > 0 && !slotId ? "یک سانس انتخاب کنید" : `تایید و رزرو · ${formatTomans(offer.price)}`}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {venue.address && (
            <p className="flex items-start gap-2 text-sm text-ink-500">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" /> {venue.address}
            </p>
          )}
          {venue.description && <p className="text-sm leading-7 text-ink-700">{venue.description}</p>}

          {Object.keys(slotGroups).length > 0 ? (
            <div className="rounded-2xl bg-canvas p-4">
              <p className="mb-3 text-xs font-semibold text-ink-500">برنامه سانس‌های آقایان و بانوان</p>
              <div className="space-y-2">
                {(Object.keys(DAYS) as GenderSlot["day_of_week"][])
                  .filter((d) => slotGroups[d])
                  .map((d) => (
                    <div key={d} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="w-16 font-medium text-ink-700">{DAYS[d]}</span>
                      {slotGroups[d]!.map((s) => (
                        <Badge key={s.id} size="sm" variant={s.gender === "male" ? "info" : s.gender === "female" ? "warning" : "neutral"}>
                          {formatClock(s.start_time)}–{formatClock(s.end_time)} {GENDER_LABELS[s.gender]}
                        </Badge>
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            venue.gender_policy !== "mixed" && (
              <Badge variant={venue.gender_policy === "female" ? "warning" : "info"}>ویژه {GENDER_LABELS[venue.gender_policy]}</Badge>
            )
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink-900">خدمات قابل رزرو</h3>
            {offersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : !offers?.length ? (
              <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-ink-500">در حال حاضر خدمتی برای رزرو فعال نیست.</p>
            ) : (
              <ul className="space-y-2">
                {offers.map((o) => (
                  <li key={o.id} className="flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-brand-200">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink-900">{o.name}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {formatNumber(o.duration_minutes)} دقیقه
                        {o.gender_restriction !== "mixed" && ` · ویژه ${GENDER_LABELS[o.gender_restriction]}`}
                      </p>
                      {o.description && <p className="mt-1 line-clamp-1 text-xs text-ink-500">{o.description}</p>}
                    </div>
                    <p className="tabular shrink-0 text-sm font-bold text-ink-900">{formatTomans(o.price)}</p>
                    <Button size="sm" onClick={() => pickOffer(o)}>
                      رزرو
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-t border-line pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink-900">نظرات همکاران</h3>
              {venue.avg_rating != null && (
                <span className="flex items-center gap-1 text-sm">
                  <StarIconSolid className="h-4 w-4 text-amber-400" />
                  <b>{formatNumber(venue.avg_rating)}</b>
                  <span className="text-xs text-ink-500">از {formatNumber(venue.rating_count)} نظر</span>
                </span>
              )}
            </div>
            {!ratings?.length ? (
              <p className="mb-4 text-sm text-ink-500">هنوز نظری ثبت نشده است.</p>
            ) : (
              <ul className="scroll-thin mb-4 max-h-48 space-y-2 overflow-y-auto">
                {ratings.map((r) => (
                  <li key={r.id} className="rounded-xl bg-canvas p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-ink-700">{r.user_name || "کاربر باجیمو"}</span>
                      <span className="flex" aria-label={`${r.score} از ۵`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIconSolid key={i} className={cn("h-3.5 w-3.5", i < r.score ? "text-amber-400" : "text-gray-200")} />
                        ))}
                      </span>
                    </div>
                    {r.comment && <p className="mt-1.5 text-sm text-ink-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-2xl border border-line p-4">
              <p className="mb-2 text-xs font-medium text-ink-500">امتیاز شما (پس از استفاده از خدمات)</p>
              <div className="mb-3 flex gap-1" role="radiogroup" aria-label="امتیاز">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} role="radio" aria-checked={s === score} onClick={() => setScore(s)} className="p-0.5" aria-label={`${s} ستاره`}>
                    <StarIconSolid className={cn("h-6 w-6 transition", s <= score ? "text-amber-400" : "text-gray-200 hover:text-amber-200")} />
                  </button>
                ))}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="تجربه‌تان را بنویسید (اختیاری)" rows={2} />
              <div className="mt-3 flex justify-end">
                <Button variant="secondary" size="sm" onClick={submitRating} loading={rating}>
                  ثبت نظر
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
