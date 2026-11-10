import Link from "next/link";
import { ArrowLeftIcon } from "@/components/icons";
import { categoryMeta, CATEGORY_OPTIONS } from "@/lib/categories";
import { cn } from "@/lib/cn";

const BLURBS: Record<string, string> = {
  gym: "باشگاه‌های بدنسازی و فیتنس با جلسه‌های تکی یا اشتراک.",
  pool: "استخر، سونا و جکوزی با سانس‌های آقایان و بانوان.",
  cinema: "بلیت سینما برای آخر هفته، با بودجه رفاهی.",
  yoga: "کلاس‌های یوگا و مدیتیشن برای آرامش بعد از کار.",
  sport: "سالن‌ها و مجموعه‌های ورزشی؛ از اسکواش تا فوتسال.",
};

/** Service categories available on the platform (same slugs as the API). */
export function CategoriesSection() {
  return (
    <section id="categories" className="scroll-mt-28 py-20">
      <div className="site-container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">خدمات</p>
            <h2 className="mt-2 text-3xl font-bold text-ink-900">یک بودجه، چند جور تفریح و ورزش</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-ink-500">کارمند خودش انتخاب می‌کند بودجه‌اش را کجا خرج کند.</p>
          </div>
          <Link href="/venues" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            مشاهده مجموعه‌ها <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CATEGORY_OPTIONS.map((c) => {
            const meta = categoryMeta(c.slug);
            return (
              <div
                key={c.slug}
                className="group rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-pop)]"
              >
                <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition group-hover:scale-105 [&>svg]:h-7 [&>svg]:w-7", meta.tint)}>
                  {meta.icon}
                </span>
                <h3 className="mt-5 text-lg font-bold text-ink-900">{c.label}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-500">{BLURBS[c.slug]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
