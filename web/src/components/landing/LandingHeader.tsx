"use client";
/**
 * Public site header (landing + public pages).
 *  - thin utility strip with the three audiences' entry points
 *  - main bar: logo, section nav, sign-in / panel buttons
 *  - slide-down menu on mobile
 * `solid` forces the opaque style (used on pages that aren't the landing hero).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { homePathFor, ROLE_LABELS } from "@/lib/roles";
import { Logo } from "@/components/Logo";
import { Avatar, Button } from "@/components/ui";
import { ArrowLeftIcon, Bars3Icon, BuildingIcon, StoreIcon, UserIcon, XMarkIcon } from "@/components/icons";

export const SITE_CONTAINER = "site-container";

const NAV = [
  { label: "ویژگی‌ها", href: "/#features" },
  { label: "پنل‌ها", href: "/#panels" },
  { label: "مجموعه‌ها", href: "/venues" },
  { label: "سؤالات متداول", href: "/faq" },
  { label: "تماس با ما", href: "/contact" },
];

const AUDIENCE = [
  { label: "سازمان‌ها", href: "/company/register", icon: <BuildingIcon /> },
  { label: "مجموعه‌های ورزشی", href: "/venue/register", icon: <StoreIcon /> },
  { label: "کارکنان", href: "/login", icon: <UserIcon /> },
];

export function LandingHeader({ solid = false }: { solid?: boolean }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const opaque = solid || scrolled || open;

  return (
    <header className="sticky top-0 z-40">
      {/* utility strip */}
      <div className="hidden bg-brand-950 text-white/80 md:block">
        <div className={cn(SITE_CONTAINER, "flex h-9 items-center justify-between text-xs")}>
          <p>باجیمو؛ بودجه ورزش و تفریح کارکنان، ساده و شفاف</p>
          <nav className="flex items-center gap-5" aria-label="ورود سریع">
            {AUDIENCE.map((a) => (
              <Link key={a.href} href={a.href} className="inline-flex items-center gap-1.5 transition hover:text-white [&>svg]:h-3.5 [&>svg]:w-3.5">
                {a.icon}
                {a.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* main bar */}
      <div className={cn("transition-colors", opaque ? "border-b border-line bg-surface/95 shadow-[var(--shadow-card)] backdrop-blur" : "bg-transparent")}>
        <div className={cn(SITE_CONTAINER, "flex h-[4.5rem] items-center gap-3 sm:gap-6")}>
          <Link href="/" aria-label="باجیمو" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="بخش‌های سایت">
            {NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-800"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex-1 lg:hidden" />

          {user ? (
            <Link
              href={homePathFor(user.role)}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface py-1.5 pe-3 ps-1.5 shadow-sm transition hover:border-brand-300"
            >
              <Avatar name={user.name || user.phone_number} size="sm" />
              <span className="hidden text-start leading-tight sm:block">
                <span className="block text-sm font-medium text-ink-900">ورود به پنل</span>
                <span className="block text-[11px] text-ink-500">{ROLE_LABELS[user.role]}</span>
              </span>
              <ArrowLeftIcon className="h-4 w-4 text-ink-400" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/login">ورود</Link>
              </Button>
              <Button asChild>
                <Link href="/company/register">ثبت سازمان</Link>
              </Button>
            </div>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-ink-700 hover:bg-canvas lg:hidden"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
          >
            {open ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>

        {/* mobile menu */}
        {open && (
          <div className="animate-slide-up border-t border-line bg-surface lg:hidden">
            <nav className={cn(SITE_CONTAINER, "grid gap-1 py-4")}>
              {NAV.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-canvas">
                  {l.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-2 border-t border-line pt-4">
                {AUDIENCE.map((a) => (
                  <Link
                    key={a.href}
                    href={a.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink-900 [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-brand-600"
                  >
                    {a.icon}
                    {a.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
