"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { SitePage } from "@/components/site/SitePage";
import { VenueCard } from "@/components/site/VenueCard";
import { usePublicVenues } from "@/lib/usePublicData";
import { Button, Skeleton } from "@/components/ui";
import { SearchIcon, StoreIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";

/** Public list of active venues (no login needed). Booking still happens in the employee panel. */
export default function VenuesPage() {
  const { data, loading, error, refetch } = usePublicVenues();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const venues = useMemo(() => data ?? [], [data]);
  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    venues.forEach((v) => v.category_slug && seen.set(v.category_slug, categoryMeta(v.category_slug, v.category_name).label));
    return [...seen.entries()];
  }, [venues]);

  const q = query.trim().toLowerCase();
  const filtered = venues.filter(
    (v) =>
      (!category || v.category_slug === category) &&
      (!q || [v.name, v.district, v.city, v.address].some((f) => (f || "").toLowerCase().includes(q))),
  );

  return (
    <SitePage
      eyebrow="شبکه مجموعه‌ها"
      title="مجموعه‌های طرف قرارداد"
      lead="باشگاه‌ها، استخرها، سینماها و مراکزی که کارکنان می‌توانند با بودجه رفاهی خود در آن‌ها رزرو کنند."
    >
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <Notice title="فهرست مجموعه‌ها بارگذاری نشد" text="اتصال به سرور برقرار نشد. کمی بعد دوباره تلاش کنید.">
          <Button onClick={() => refetch()}>تلاش دوباره</Button>
        </Notice>
      ) : venues.length === 0 ? (
        <Notice title="هنوز مجموعه‌ای فعال نشده است" text="به‌محض تأیید اولین مجموعه‌ها، فهرست آن‌ها این‌جا نمایش داده می‌شود.">
          <Button asChild>
            <Link href="/venue/register">ثبت مجموعه</Link>
          </Button>
        </Notice>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی نام مجموعه، محله یا شهر…"
                aria-label="جستجوی مجموعه"
                className="h-11 w-full rounded-xl border border-line bg-surface pe-3.5 ps-10 text-sm shadow-sm transition placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="دسته‌بندی">
              {[["", "همه"], ...categories].map(([slug, label]) => (
                <button
                  key={slug || "all"}
                  onClick={() => setCategory(slug)}
                  aria-pressed={category === slug}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    category === slug ? "bg-brand-600 text-white shadow-sm" : "border border-line bg-surface text-ink-700 hover:border-brand-300",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-6 text-sm text-ink-500">{formatNumber(filtered.length)} مجموعه</p>
          {filtered.length === 0 ? (
            <div className="mt-4">
              <Notice title="مجموعه‌ای با این مشخصات پیدا نشد" text="عبارت جستجو یا دسته‌بندی را تغییر دهید." />
            </div>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((v) => (
                <VenueCard key={v.id} v={v} />
              ))}
            </div>
          )}
        </>
      )}
    </SitePage>
  );
}

function Notice({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <StoreIcon className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-7 text-ink-500">{text}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
