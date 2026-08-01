"use client";
import { ReactNode } from "react";
import { usePublicVenues, VenueLite } from "@/lib/usePublicData";
import { placeholderVenues } from "@/lib/landingData";
import { Card, LoadingState, Badge } from "@/components/ui";
import { MapPinIcon, StarIconSolid, DumbbellIcon, PoolIcon, FilmIcon, YogaIcon, BallIcon } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui";

function VenueCard({ v }: { v: VenueLite }) {
  const categoryLabels: Record<string, string> = {
    gym: "بدنسازی",
    pool: "استخر",
    cinema: "سینما",
    yoga: "یوگا",
    sport: "ورزشگاه",
  };
  return (
    <Link href="/login" className="group">
      <Card hover border className="flex h-full flex-col p-0 overflow-hidden">
        <div className="relative h-40 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
          {categoryIcon(v.category_slug)}
          {v.avg_rating != null && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-amber-600">
              <StarIconSolid className="h-3 w-3" />
              {v.avg_rating}
            </div>
          )}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
              {v.name}
            </h3>
            <Badge variant="info" size="sm">
              {categoryLabels[v.category_slug] || v.category_name}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mb-1 flex items-center">
            <MapPinIcon className="h-3 w-3 mr-1" />
            {v.district}، {v.city}
          </p>
          {v.description && (
            <p className="mt-2 line-clamp-2 text-xs text-gray-600 flex-1">
              {v.description}
            </p>
          )}
          {v.offers && v.offers.length > 0 && (
            <div className="mt-4 text-xs text-gray-600">
              <span className="font-medium text-gray-900">
                {new Intl.NumberFormat("fa-IR").format(v.offers[0].price)} تومان
              </span>
              <span className="mx-1">·</span>
              <span>{v.offers[0].duration_minutes} دقیقه</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

const categoryIcons: Record<string, ReactNode> = {
  gym: <DumbbellIcon className="h-10 w-10 text-emerald-600/30" />,
  pool: <PoolIcon className="h-10 w-10 text-blue-600/30" />,
  cinema: <FilmIcon className="h-10 w-10 text-purple-600/30" />,
  yoga: <YogaIcon className="h-10 w-10 text-amber-600/30" />,
  sport: <BallIcon className="h-10 w-10 text-green-600/30" />,
};

function categoryIcon(slug: string): ReactNode {
  return categoryIcons[slug] || <MapPinIcon className="h-10 w-10 text-emerald-600/30" />;
}

export function VenuesShowcase() {
  const result = usePublicVenues(9);
  const venues: VenueLite[] = result.data?.length
    ? (result.data as VenueLite[])
    : placeholderVenues;

  return (
    <section id="venues" className="bg-gray-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">شبکه شریکان ما</h2>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            باشگاه‌ها، استخرها، سینماها و استودیوهای یوگا با قرارداد مستقیم و قیمت‌های ویژه.
          </p>
        </div>

        {result.loading ? (
          <LoadingState message="در حال دریافت باشگاه‌ها..." className="py-12" />
        ) : (
          <>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((v) => (
                <VenueCard key={v.id} v={v} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button variant="primary" asChild>
                <Link href="/login">همه باشگاه‌ها را ببینید</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
