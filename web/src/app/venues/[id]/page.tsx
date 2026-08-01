"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Card, LoadingState, Badge } from "@/components/ui";
import { formatTomans } from "@/lib/format";
import { MapPinIcon, StarIconSolid, DumbbellIcon, PoolIcon, FilmIcon, YogaIcon, BallIcon, MapPinIcon as MapPin } from "@/components/icons";
import { Venue, Offer, VenueRating } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

const categoryLabels: Record<string, string> = {
  gym: "بدنسازی",
  pool: "استخر",
  cinema: "سینما",
  yoga: "یوگا",
  sport: "مجتمع ورزشی",
};

const categoryIcons: Record<string, React.ReactNode> = {
  gym: <DumbbellIcon className="h-10 w-10 text-emerald-600/30" />,
  pool: <PoolIcon className="h-10 w-10 text-blue-600/30" />,
  cinema: <FilmIcon className="h-10 w-10 text-purple-600/30" />,
  yoga: <YogaIcon className="h-10 w-10 text-amber-600/30" />,
  sport: <BallIcon className="h-10 w-10 text-green-600/30" />,
};

function categoryIcon(slug: string): React.ReactNode {
  return categoryIcons[slug] || <MapPin className="h-10 w-10 text-emerald-600/30" />;
}

export default function VenueDetailPage() {
  const params = useParams();
  const venueId = params.id as string;
  const { data: venue, loading: venueLoading, refetch } = useApi<Venue>(venueId ? `/catalog/venues/${venueId}/` : null);
  const { data: offers, loading: offersLoading } = useApi<Offer[]>(venueId ? `/catalog/venues/${venueId}/offers/` : null);
  const { data: ratings, loading: ratingsLoading } = useApi<VenueRating[]>(venueId ? `/catalog/venues/${venueId}/ratings/` : null);

  if (venueLoading) {
    return (
      <PageShell title="مجتمع" maxWidth="5xl" padded={false}>
        <div className="flex h-[50vh] items-center justify-center">
          <LoadingState message="در حال بارگذاری..." />
        </div>
      </PageShell>
    );
  }

  if (!venue) {
    return (
      <PageShell title="مجتمع یافت نشد" maxWidth="5xl" padded={false}>
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-center text-gray-600">مجتمع یافت نشد.</p>
        </div>
      </PageShell>
    );
  }

  const genderLabels: Record<string, string> = {
    mixed: "مختلط",
    male: "فقط آقایان",
    female: "فقط بانوان",
  };

  return (
    <PageShell title={venue.name} maxWidth="5xl" padded={false}>
      <div className="space-y-8 px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-32 w-32 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
              {(() => categoryIcon(venue.category_slug))()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <Badge variant="info" size="md">
                  {categoryLabels[venue.category_slug] || venue.category_name}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {venue.district}، {venue.city}
              </p>
              {venue.address && (
                <p className="mt-1 text-sm text-gray-500 truncate max-w-xs">
                  {venue.address}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {venue.description && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">درباره مجتمع</h2>
                <p className="text-gray-600 leading-relaxed">{venue.description}</p>
              </div>
            )}

            {/* Gender Policy */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">سیاست جنسیتی</h2>
              <div className="flex items-center gap-2">
                <Badge variant="info" size="md">
                  {genderLabels[venue.gender_policy] || venue.gender_policy}
                </Badge>
                {venue.gender_slots && venue.gender_slots.length > 0 && (
                  <span className="text-sm text-gray-600">(سانس‌های زمان‌بندی شده دارد)</span>
                )}
              </div>
            </div>

            {/* Offers */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">آفرها و خدمات</h2>
              {offersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : offers?.length ? (
                <div className="space-y-3">
                  {offers.map((o) => (
                    <div
                      key={o.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{o.name}</h3>
                            {o.gender_restriction === "male" && (
                              <Badge variant="info" size="sm">آقایان</Badge>
                            )}
                            {o.gender_restriction === "female" && (
                              <Badge variant="warning" size="sm">بانوان</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {o.duration_minutes} دقیقه · {o.gender_restriction === "male" ? "فقط آقایان" : o.gender_restriction === "female" ? "فقط بانوان" : "مختلط"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <p className="font-bold text-emerald-700 text-lg">{formatTomans(o.price)} تومان</p>
                          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                            رزرو
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  هنوز آفر فعالی برای این مجتمع وجود ندارد.
                </div>
              )}
            </div>

            {/* Ratings */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">نظرات کاربران</h2>
              {ratingsLoading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : ratings?.length ? (
                <div className="space-y-3">
                  {ratings.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-600 text-sm">{"★".repeat(r.score)}</span>
                        <span className="text-xs text-gray-600">{r.user_name || r.user_phone}</span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  هنوز نظری ثبت نشده.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 sticky top-24">
              <h3 className="mb-4 font-semibold text-gray-900">اطلاعات تماس</h3>
              <div className="space-y-3">
                {venue.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{venue.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{venue.district}، {venue.city}</span>
                </div>
                {venue.address && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-emerald-600 mt-1" />
                    <span>{venue.address}</span>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  سیاست جنسیت: <span className="font-medium">{genderLabels[venue.gender_policy] || venue.gender_policy}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}