"use client";
import Link from "next/link";
import { usePublicVenues } from "@/lib/usePublicData";
import { Button, Skeleton } from "@/components/ui";
import { StoreIcon } from "@/components/icons";
import { VenueCard } from "@/components/site/VenueCard";

/** Live venues from the API. Nothing is invented: with no active venue it shows an empty state. */
export function VenuesShowcase() {
  const { data, loading } = usePublicVenues();
  const venues = (data ?? []).slice(0, 8);

  return (
    <section id="venues" className="scroll-mt-28 border-t border-line/70 bg-canvas/60 pb-36 pt-20">
      <div className="site-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold text-brand-700">شبکه مجموعه‌ها</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-900">از بدنسازی تا سینما</h2>
          <p className="mt-3 text-sm leading-7 text-ink-500">مجموعه‌های طرف قرارداد با قیمت سازمانی؛ کارکنان با یک کد وارد می‌شوند.</p>
        </div>
        {loading ? (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <StoreIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-ink-900">هنوز مجموعه‌ای فعال نشده است</p>
            <p className="mt-2 text-sm leading-7 text-ink-500">صاحب باشگاه، استخر یا سینما هستید؟ اولین مجموعه باجیمو باشید.</p>
            <Button asChild className="mt-6">
              <Link href="/venue/register">ثبت مجموعه</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {venues.map((v) => (
                <VenueCard key={v.id} v={v} />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild variant="outline">
                <Link href="/venues">مشاهده همه مجموعه‌ها</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
