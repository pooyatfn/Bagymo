import Link from "next/link";
import { Button } from "@/components/ui";
import { BuildingIcon, StoreIcon, UserIcon } from "@/components/icons";

const FLOW = [
  { icon: <BuildingIcon />, who: "سازمان", text: "برای هر کارمند بودجه رفاهی تعیین می‌کند." },
  { icon: <UserIcon />, who: "کارمند", text: "مجموعه و سانس را انتخاب و رزرو می‌کند و کد ورود می‌گیرد." },
  { icon: <StoreIcon />, who: "مجموعه", text: "کد ورود مهمان را ثبت می‌کند و تسویه دوره‌ای می‌گیرد." },
];

/** How a booking moves between the three sides. Purely explanatory: no account data, no sample numbers. */
function FlowCard() {
  return (
    <div className="relative mx-auto w-full max-w-md xl:max-w-lg">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 to-sky-200/40 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-pop)] sm:p-8">
        <p className="text-sm font-semibold text-brand-700">باجیمو چطور کار می‌کند؟</p>
        <ol className="mt-6">
          {FLOW.map((f, i) => (
            <li key={f.who} className="relative flex gap-4 pb-7 last:pb-0">
              {i < FLOW.length - 1 && <span className="absolute bottom-0 start-6 top-12 w-px -translate-x-1/2 bg-line rtl:translate-x-1/2" aria-hidden="true" />}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 [&>svg]:h-6 [&>svg]:w-6">{f.icon}</span>
              <div className="pt-0.5">
                <p className="font-semibold text-ink-900">{f.who}</p>
                <p className="mt-1 text-sm leading-7 text-ink-500">{f.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-wrap gap-2 border-t border-line pt-5 text-xs text-ink-700">
          {["بدون کارت هدیه", "بدون فاکتور کاغذی", "بازگشت خودکار مبلغ رزرو استفاده‌نشده"].map((t) => (
            <span key={t} className="rounded-full bg-canvas px-3 py-1.5">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_80%_-10%,var(--color-brand-100),transparent),radial-gradient(40rem_24rem_at_0%_10%,#e0f2fe,transparent)]" />
      <div className="site-container grid items-center gap-14 pb-24 pt-10 md:grid-cols-2 md:pt-16 xl:gap-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-xs font-medium text-brand-800 shadow-sm ring-1 ring-brand-600/15">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> پلتفرم بودجه رفاهی سازمانی
          </span>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.35] tracking-tight text-ink-900 sm:text-5xl sm:leading-[1.3] xl:text-6xl xl:leading-[1.3]">
            بودجه رفاهی کارکنان را
            <span className="block text-brand-700">به ورزش و تفریح تبدیل کنید.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-ink-500 xl:text-lg xl:leading-9">
            سازمان بودجه هر نفر را تعیین می‌کند، کارمند از بین باشگاه‌ها، استخرها و سینماهای طرف قرارداد رزرو می‌کند و مجموعه با کد ورود
            مهمان را می‌پذیرد. گزارش و تسویه‌حساب، خودکار و شفاف.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/company/register">
                <BuildingIcon className="h-5 w-5" /> ثبت سازمان
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/venue/register">
                <StoreIcon className="h-5 w-5" /> ثبت مجموعه ورزشی
              </Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-ink-500">
            کارمند هستید؟{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
              با شماره موبایل وارد شوید
            </Link>
          </p>
        </div>
        <FlowCard />
      </div>
    </section>
  );
}
