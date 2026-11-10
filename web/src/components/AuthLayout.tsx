import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { BuildingIcon, CheckIcon, StoreIcon, UserIcon } from "@/components/icons";

const POINTS = [
  { icon: <BuildingIcon />, title: "برای سازمان‌ها", text: "بودجه رفاهی هر کارمند را تعریف کنید و مصرف را لحظه‌ای ببینید." },
  { icon: <UserIcon />, title: "برای کارکنان", text: "باشگاه، استخر و سینما را رزرو کنید؛ هزینه از بودجه شرکت کسر می‌شود." },
  { icon: <StoreIcon />, title: "برای مجموعه‌ها", text: "مشتری سازمانی ثابت بگیرید و تسویه منظم داشته باشید." },
];

/** Split-screen layout for sign-in and registration pages. */
export function AuthLayout({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="relative hidden w-[42%] max-w-xl overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-10 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -start-24 -top-24 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 end-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <Link href="/" className="relative">
          <Logo light />
        </Link>
        <div className="relative my-auto">
          <h2 className="text-3xl font-extrabold leading-[1.5]">
            رفاه کارکنان،
            <br />
            ساده و شفاف.
          </h2>
          <ul className="mt-10 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 [&>svg]:h-5 [&>svg]:w-5">
                  {p.icon}
                </span>
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-xs text-white/60">
          <CheckIcon className="h-4 w-4" /> بدون نیاز به کارت هدیه و فاکتور کاغذی
        </p>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:hidden">
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>{children}</div>
        </div>
        <p className="pb-6 text-center text-xs text-ink-400">© {new Date().getFullYear()} باجیمو</p>
      </main>
    </div>
  );
}
