import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";
import { BuildingIcon, StoreIcon } from "@/components/icons";

const COLUMNS = [
  {
    title: "باجیمو",
    links: [
      { label: "ویژگی‌ها", href: "/#features" },
      { label: "پنل‌های اختصاصی", href: "/#panels" },
      { label: "مجموعه‌ها", href: "/venues" },
    ],
  },
  {
    title: "شروع کنید",
    links: [
      { label: "ثبت سازمان", href: "/company/register" },
      { label: "ثبت مجموعه ورزشی", href: "/venue/register" },
      { label: "ورود کارکنان", href: "/login" },
      { label: "ورود مدیران سازمان", href: "/login?tab=email" },
    ],
  },
  {
    title: "راهنما",
    links: [
      { label: "سؤالات متداول", href: "/faq" },
      { label: "تماس با ما", href: "/contact" },
      { label: "قوانین و مقررات", href: "/terms" },
      { label: "حریم خصوصی", href: "/privacy" },
    ],
  },
];

/** Site footer: call-to-action band + dark multi-column footer. */
export function LandingFooter({ cta = true }: { cta?: boolean }) {
  return (
    <footer>
      {cta && (
        <div className="bg-canvas">
          <div className="site-container">
            <div className="relative translate-y-1/2 overflow-hidden rounded-3xl bg-gradient-to-l from-brand-600 via-brand-700 to-brand-900 px-6 py-10 text-white shadow-[var(--shadow-pop)] sm:px-12 lg:flex lg:items-center lg:justify-between">
              <div className="pointer-events-none absolute -start-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <h2 className="text-2xl font-extrabold sm:text-3xl">رفاه کارکنان را از همین امروز شروع کنید</h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-white/80">
                  سازمان خود را ثبت کنید، بودجه هر نفر را مشخص کنید و بقیه را به باجیمو بسپارید.
                </p>
              </div>
              <div className="relative mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
                <Button asChild size="lg" variant="outline" className="border-transparent text-brand-800">
                  <Link href="/company/register">
                    <BuildingIcon className="h-5 w-5" /> ثبت سازمان
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-white/10 text-white ring-1 ring-inset ring-white/30 hover:bg-white/20">
                  <Link href="/venue/register">
                    <StoreIcon className="h-5 w-5" /> ثبت مجموعه
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`bg-brand-950 text-white/70 ${cta ? "pt-28" : ""}`}>
        <div className={`site-container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12`}>
          <div className="lg:col-span-6">
            <Logo light />
            <p className="mt-5 max-w-md text-sm leading-7">
              پلتفرم بودجه رفاهی سازمانی. سازمان بودجه تعیین می‌کند، کارمند باشگاه، استخر یا سینما رزرو می‌کند و مجموعه با کد ورود مهمان را
              می‌پذیرد؛ گزارش و تسویه‌حساب خودکار است.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {["بدون کارت هدیه", "بدون فاکتور کاغذی", "لغو و بازگشت خودکار مبلغ"].map((t) => (
                <span key={t} className="rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {COLUMNS.map((c) => (
            <div key={c.title} className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className={`site-container flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row`}>
            <p>© {new Date().getFullYear()} باجیمو. همه حقوق محفوظ است.</p>
            <p className="text-white/50">همه مبالغ به تومان است.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
