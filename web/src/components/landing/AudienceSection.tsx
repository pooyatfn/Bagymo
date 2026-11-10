import Link from "next/link";
import { audiences } from "@/lib/landingData";
import { BuildingIcon, CheckIcon, StoreIcon, UserIcon, ArrowLeftIcon } from "@/components/icons";

const icons: Record<string, React.ReactNode> = {
  company: <BuildingIcon />,
  employee: <UserIcon />,
  venue: <StoreIcon />,
};

export function AudienceSection() {
  return (
    <section className="py-20">
      <div className="site-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold text-brand-700">یک پلتفرم، سه پنل</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-900">برای همه طرف‌های رفاه سازمانی</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {audiences.map((a, i) => (
            <div
              key={a.key}
              className={
                i === 0
                  ? "flex flex-col rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white shadow-[var(--shadow-pop)]"
                  : "flex flex-col rounded-3xl border border-line bg-surface p-7 shadow-[var(--shadow-card)]"
              }
            >
              <span
                className={
                  "flex h-11 w-11 items-center justify-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6 " +
                  (i === 0 ? "bg-white/10 ring-1 ring-white/15" : "bg-brand-50 text-brand-700")
                }
              >
                {icons[a.key]}
              </span>
              <h3 className="mt-5 text-lg font-bold">{a.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {a.points.map((p) => (
                  <li key={p} className={"flex items-center gap-2 text-sm " + (i === 0 ? "text-white/85" : "text-ink-700")}>
                    <CheckIcon className={"h-4 w-4 shrink-0 " + (i === 0 ? "text-brand-300" : "text-brand-600")} /> {p}
                  </li>
                ))}
              </ul>
              <div className="min-h-6 flex-1" />
              <Link
                href={a.cta.href}
                className={"inline-flex items-center gap-1.5 text-sm font-semibold " + (i === 0 ? "text-white hover:text-brand-100" : "text-brand-700 hover:text-brand-800")}
              >
                {a.cta.label} <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
