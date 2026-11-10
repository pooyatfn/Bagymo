"use client";
/**
 * Authenticated panel layout.
 *  - right-hand (RTL start) sidebar with the role's navigation (drawer on mobile)
 *  - sticky top bar: breadcrumb, budget, a role-specific quick action and the user menu
 *  - slim footer
 * Content uses the whole remaining width (capped at 1600px) so wide monitors
 * aren't left with empty margins.
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatDate, formatTomansShort } from "@/lib/format";
import { ROLE_HOME, ROLE_LABELS } from "@/lib/roles";
import type { User, UserRole } from "@/lib/types";
import { Avatar, Progress } from "@/components/ui";
import { Logo } from "@/components/Logo";
import {
  BanknotesIcon,
  Bars3Icon,
  BuildingIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  HomeIcon,
  LogoutIcon,
  QrIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  StoreIcon,
  TagIcon,
  UserGroupIcon,
  UserIcon,
  WalletIcon,
  XMarkIcon,
} from "@/components/icons";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const companyNav: NavItem[] = [
  { label: "داشبورد", href: "/company/dashboard", icon: <HomeIcon /> },
  { label: "گزارش و تحلیل", href: "/company/analytics", icon: <ChartBarIcon /> },
  { label: "فاکتورها و رزروها", href: "/company/invoices", icon: <ReceiptIcon /> },
  { label: "پروفایل", href: "/profile", icon: <UserIcon /> },
];

export const NAV: Record<UserRole, NavItem[]> = {
  user: [
    { label: "داشبورد", href: "/user/dashboard", icon: <HomeIcon /> },
    { label: "کشف مجموعه‌ها", href: "/user/discover", icon: <SearchIcon /> },
    { label: "رزروهای من", href: "/user/bookings", icon: <CalendarIcon /> },
    { label: "شرکت من", href: "/user/company", icon: <BuildingIcon /> },
    { label: "پروفایل", href: "/profile", icon: <UserIcon /> },
  ],
  company_admin: companyNav,
  company_hr: companyNav,
  venue_staff: [
    { label: "داشبورد و پذیرش", href: "/venue/dashboard", icon: <HomeIcon /> },
    { label: "خدمات و سانس‌ها", href: "/venue/offers", icon: <TagIcon /> },
    { label: "تسویه‌حساب", href: "/venue/settlements", icon: <BanknotesIcon /> },
    { label: "پروفایل مجموعه", href: "/venue/register", icon: <StoreIcon /> },
  ],
  admin: [
    { label: "پنل مدیریت", href: "/admin", icon: <ShieldCheckIcon /> },
    { label: "پروفایل", href: "/profile", icon: <UserIcon /> },
  ],
};

/** One prominent shortcut per role, shown in the top bar. */
const QUICK_ACTION: Partial<Record<UserRole, NavItem>> = {
  user: { label: "رزرو جدید", href: "/user/discover", icon: <SearchIcon /> },
  company_admin: { label: "مدیریت کارکنان", href: "/company/dashboard", icon: <UserGroupIcon /> },
  company_hr: { label: "مدیریت کارکنان", href: "/company/dashboard", icon: <UserGroupIcon /> },
  venue_staff: { label: "ثبت ورود مهمان", href: "/venue/dashboard", icon: <QrIcon /> },
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function Sidebar({ user, pathname, onNavigate, onLogout }: { user: User; pathname: string; onNavigate?: () => void; onLogout: () => void }) {
  const links = NAV[user.role] ?? [];
  const usedPct = user.annual_budget ? ((user.annual_budget - user.remaining_budget) / user.annual_budget) * 100 : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Link href="/" onClick={onNavigate} aria-label="صفحه اصلی باجیمو">
          <Logo />
        </Link>
      </div>

      <p className="px-5 pb-2 pt-5 text-[11px] font-semibold tracking-wide text-ink-400">پنل {ROLE_LABELS[user.role]}</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {links.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-800" : "text-ink-500 hover:bg-canvas hover:text-ink-900",
              )}
            >
              {active && <span className="absolute inset-y-2 -start-3 w-1 rounded-e-full bg-brand-600" />}
              <span className={cn("[&>svg]:h-5 [&>svg]:w-5", active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-700")}>{l.icon}</span>
              {l.label}
            </Link>
          );
        })}
      </nav>

      {user.role === "user" && user.annual_budget > 0 && (
        <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white">
          <p className="flex items-center gap-1.5 text-xs text-white/75">
            <WalletIcon className="h-3.5 w-3.5" /> بودجه باقی‌مانده
          </p>
          <p className="tabular mt-1 text-lg font-bold">{formatTomansShort(user.remaining_budget)}</p>
          <Progress value={usedPct} tone="white" className="mt-3 h-1.5" label="میزان مصرف بودجه" />
        </div>
      )}

      <div className="shrink-0 border-t border-line p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogoutIcon className="h-5 w-5 -scale-x-100" /> خروج از حساب
        </button>
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-xl p-1.5 pe-2 transition hover:bg-canvas"
      >
        <Avatar name={user.name || user.phone_number} size="sm" />
        <span className="hidden text-start leading-tight md:block">
          <span className="block max-w-36 truncate text-sm font-medium text-ink-900">{user.name || "کاربر باجیمو"}</span>
          <span className="block text-[11px] text-ink-500">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDownIcon className={cn("hidden h-4 w-4 text-ink-400 transition md:block", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full z-40 mt-2 w-60 animate-slide-up rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-pop)]">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-ink-900">{user.name || "کاربر باجیمو"}</p>
            <p className="mt-0.5 text-xs text-ink-500" dir="ltr" style={{ textAlign: "right" }}>
              {user.phone_number}
            </p>
            {user.company_name && <p className="mt-1 truncate text-xs text-ink-500">{user.company_name}</p>}
          </div>
          <Link role="menuitem" href="/profile" onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-canvas">
            <UserIcon className="h-4 w-4 text-ink-400" /> پروفایل و تنظیمات
          </Link>
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-canvas">
            <HomeIcon className="h-4 w-4 text-ink-400" /> صفحه اصلی سایت
          </Link>
          <button role="menuitem" onClick={onLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            <LogoutIcon className="h-4 w-4 -scale-x-100" /> خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}

function TopBar({ user, pathname, onMenu, onLogout }: { user: User; pathname: string; onMenu: () => void; onLogout: () => void }) {
  const current = (NAV[user.role] ?? []).find((l) => isActive(pathname, l.href));
  const quick = QUICK_ACTION[user.role];
  const showQuick = quick && !isActive(pathname, quick.href);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenu} className="-ms-2 rounded-lg p-2 text-ink-700 hover:bg-canvas lg:hidden" aria-label="باز کردن منو">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <Link href="/" className="lg:hidden" aria-label="باجیمو">
          <Logo size="sm" />
        </Link>

        {/* breadcrumb */}
        <nav aria-label="مسیر" className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
          <Link href={ROLE_HOME[user.role]} className="text-ink-500 transition hover:text-ink-900">
            پنل {ROLE_LABELS[user.role]}
          </Link>
          {current && (
            <>
              <ChevronLeftIcon className="h-4 w-4 text-ink-400" />
              <span className="truncate font-semibold text-ink-900">{current.label}</span>
            </>
          )}
        </nav>

        <div className="flex-1" />

        <span className="hidden text-xs text-ink-500 xl:block">{formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</span>

        {user.role === "user" && user.annual_budget > 0 && (
          <Link
            href="/user/dashboard"
            className="hidden items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-brand-600/15 transition hover:bg-brand-100 sm:flex"
            title="بودجه باقی‌مانده"
          >
            <WalletIcon className="h-4 w-4" />
            <span className="tabular">{formatTomansShort(user.remaining_budget)}</span>
          </Link>
        )}

        {showQuick && (
          <Link
            href={quick.href}
            className="hidden items-center gap-2 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 md:flex [&>svg]:h-4 [&>svg]:w-4"
          >
            {quick.icon}
            {quick.label}
          </Link>
        )}

        <span className="hidden h-6 w-px bg-line md:block" />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}

function PanelFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-ink-500 sm:flex-row sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} باجیمو — پلتفرم بودجه رفاهی سازمانی</p>
        <nav className="flex items-center gap-5">
          <Link href="/faq" className="transition hover:text-ink-900">
            سؤالات متداول
          </Link>
          <Link href="/contact" className="transition hover:text-ink-900">
            تماس با ما
          </Link>
          <Link href="/" className="transition hover:text-ink-900">
            صفحه اصلی
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="page-backdrop-muted min-h-screen">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 border-e border-line bg-surface lg:block">
        <Sidebar user={user} pathname={pathname} onLogout={handleLogout} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink-900/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] animate-slide-in bg-surface shadow-[var(--shadow-pop)]">
            <button onClick={() => setOpen(false)} className="absolute end-3 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-canvas" aria-label="بستن منو">
              <XMarkIcon className="h-5 w-5" />
            </button>
            <Sidebar user={user} pathname={pathname} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col lg:ps-64">
        <TopBar user={user} pathname={pathname} onMenu={() => setOpen(true)} onLogout={handleLogout} />
        <div className="flex-1">{children}</div>
        <PanelFooter />
      </div>
    </div>
  );
}
