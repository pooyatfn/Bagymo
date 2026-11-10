import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/site/SitePage";
import { ArrowLeftIcon, ChevronDownIcon } from "@/components/icons";
import { faqGroups } from "@/lib/landingData";

export const metadata: Metadata = { title: "سؤالات متداول" };

export default function FaqPage() {
  return (
    <SitePage eyebrow="راهنما" title="سؤالات متداول" lead="پاسخ پرسش‌های رایج کارکنان، سازمان‌ها و مجموعه‌ها.">
      <div className="grid gap-10 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-card)] lg:sticky lg:top-36">
            <ul className="space-y-1 text-sm">
              {faqGroups.map((g) => (
                <li key={g.title}>
                  <a href={`#${g.title}`} className="block rounded-xl px-3 py-2 text-ink-700 transition hover:bg-brand-50 hover:text-brand-800">
                    {g.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-line p-3">
              <p className="text-sm text-ink-500">پاسخ‌تان را پیدا نکردید؟</p>
              <Link href="/contact" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                تماس با ما <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
        <div className="space-y-10 lg:col-span-9">
          {faqGroups.map((g) => (
            <section key={g.title} id={g.title} className="scroll-mt-36">
              <h2 className="text-lg font-bold">{g.title}</h2>
              <div className="mt-4 space-y-3">
                {g.items.map((f) => (
                  <details key={f.q} className="group rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-semibold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-500 transition group-open:rotate-180 group-open:bg-brand-50 group-open:text-brand-700">
                        <ChevronDownIcon className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="px-6 pb-6 text-sm leading-8 text-ink-500">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SitePage>
  );
}
