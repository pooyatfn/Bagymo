import { ReactNode } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

/** Shell for the public content pages (FAQ, contact, terms, …): site header, title band, footer. */
export function SitePage({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink-900">
      <LandingHeader solid />
      <div className="border-b border-line bg-surface">
        <div className="site-container py-12 lg:py-16">
          {eyebrow && <p className="text-sm font-semibold text-brand-700">{eyebrow}</p>}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {lead && <p className="mt-4 max-w-2xl text-base leading-8 text-ink-500">{lead}</p>}
        </div>
      </div>
      <main className="site-container flex-1 py-12 lg:py-16">{children}</main>
      <LandingFooter cta={false} />
    </div>
  );
}

/** A titled block of legal / long-form text. */
export function Prose({ sections }: { sections: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <nav aria-label="فهرست" className="lg:col-span-3">
        <ul className="space-y-1 rounded-2xl border border-line bg-surface p-3 text-sm shadow-[var(--shadow-card)] lg:sticky lg:top-36">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="flex gap-2 rounded-xl px-3 py-2 text-ink-700 transition hover:bg-brand-50 hover:text-brand-800">
                <span className="tabular text-ink-400">{(i + 1).toLocaleString("fa-IR")}.</span>
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-5 lg:col-span-9">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-36 rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
            <h2 className="text-lg font-bold">
              {(i + 1).toLocaleString("fa-IR")}. {s.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-8 text-ink-700 [&_li]:ms-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
