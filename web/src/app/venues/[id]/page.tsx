"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Badge, Button, Card, CardHeader, EmptyState, LoadingState } from "@/components/ui";
import { ArrowLeftIcon, ClockIcon, MapPinIcon, StarIconSolid, StoreIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatNumber, formatTomans, GENDER_LABELS } from "@/lib/format";
import type { Offer, Venue, VenueRating } from "@/lib/types";

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: venue, loading } = useApi<Venue>(id ? `/catalog/venues/${id}/` : null);
  const { data: offers } = useApi<Offer[]>(id ? `/catalog/venues/${id}/offers/` : null);
  const { data: ratings } = useApi<VenueRating[]>(id && user ? `/catalog/venues/${id}/ratings/` : null);

  const back = (
    <Link href={user?.role === "user" ? "/user/discover" : "/venues"} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800">
      <ArrowLeftIcon className="h-4 w-4 rotate-180" /> {user?.role === "user" ? "بازگشت به کشف مجموعه‌ها" : "همه مجموعه‌ها"}
    </Link>
  );

  if (loading) return <PageShell access="public">{<LoadingState />}</PageShell>;
  if (!venue)
    return (
      <PageShell access="public" eyebrow={back}>
        <Card>
          <EmptyState icon={<StoreIcon />} title="مجموعه پیدا نشد" description="ممکن است این مجموعه غیرفعال شده باشد." />
        </Card>
      </PageShell>
    );

  const cat = categoryMeta(venue.category_slug, venue.category_name);
  const bookHref = user?.role === "user" ? `/user/discover?venue=${venue.id}` : `/login?redirect=${encodeURIComponent(`/user/discover?venue=${venue.id}`)}`;

  return (
    <PageShell access="public" maxWidth="xl" eyebrow={back}>
      <Card p="lg" className="mb-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl [&>svg]:h-8 [&>svg]:w-8", cat.tint)}>{cat.icon}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ink-900">{venue.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-500">
              <span>{cat.label}</span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" /> {[venue.district, venue.city === "Tehran" ? "تهران" : venue.city].filter(Boolean).join("، ")}
              </span>
              {venue.avg_rating != null && (
                <span className="flex items-center gap-1">
                  <StarIconSolid className="h-4 w-4 text-amber-400" /> {formatNumber(venue.avg_rating)} ({formatNumber(venue.rating_count)} نظر)
                </span>
              )}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={bookHref}>رزرو با بودجه سازمان</Link>
          </Button>
        </div>
        {venue.description && <p className="mt-6 border-t border-line pt-6 text-sm leading-7 text-ink-700">{venue.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {venue.gender_policy !== "mixed" && <Badge variant="info">ویژه {GENDER_LABELS[venue.gender_policy]}</Badge>}
          {venue.address && <Badge>{venue.address}</Badge>}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="خدمات" />
          {!offers?.length ? (
            <p className="py-6 text-center text-sm text-ink-500">خدمتی برای نمایش وجود ندارد.</p>
          ) : (
            <ul className="divide-y divide-line">
              {offers.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{o.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
                      <ClockIcon className="h-3.5 w-3.5" /> {formatNumber(o.duration_minutes)} دقیقه
                      {o.gender_restriction !== "mixed" && ` · ویژه ${GENDER_LABELS[o.gender_restriction]}`}
                    </p>
                  </div>
                  <p className="tabular shrink-0 font-semibold text-ink-900">{formatTomans(o.price)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="نظرات همکاران" />
          {!user ? (
            <p className="py-6 text-center text-sm text-ink-500">برای دیدن نظرات همکاران وارد شوید.</p>
          ) : !ratings?.length ? (
            <p className="py-6 text-center text-sm text-ink-500">هنوز نظری ثبت نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {ratings.slice(0, 6).map((r) => (
                <li key={r.id} className="rounded-xl bg-canvas p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{r.user_name || "کاربر باجیمو"}</span>
                    <span className="flex">
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
        </Card>
      </div>

    </PageShell>
  );
}
