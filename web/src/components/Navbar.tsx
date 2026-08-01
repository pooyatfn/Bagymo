"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "./icons";

interface NavLink {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

const NAV_CONFIG: Record<string, NavLink[]> = {
  user: [
    { label: "داشبورد", href: "/user/dashboard", icon: <Bars3Icon /> },
    { label: "کشف باشگاه‌ها", href: "/user/discover", icon: <Bars3Icon /> },
    { label: "رزروهای من", href: "/user/bookings", icon: <Bars3Icon /> },
    { label: "شرکت من", href: "/user/company", icon: <Bars3Icon /> },
    { label: "پروفایل", href: "/profile", icon: <Bars3Icon /> },
  ],
  venue_staff: [
    { label: "داشبورد", href: "/venue/dashboard", icon: <Bars3Icon /> },
    { label: "آفرها", href: "/venue/offers", icon: <Bars3Icon /> },
    { label: "تسویه‌حساب", href: "/venue/settlements", icon: <Bars3Icon /> },
    { label: "پروفایل باشگاه", href: "/venue/register", icon: <Bars3Icon /> },
  ],
  company_admin: [
    { label: "داشبورد", href: "/company/dashboard", icon: <Bars3Icon /> },
    { label: "گزارش و تحلیل", href: "/company/analytics", icon: <Bars3Icon /> },
    { label: "فاکتورها", href: "/company/invoices", icon: <Bars3Icon /> },
    { label: "پروفایل", href: "/profile", icon: <Bars3Icon /> },
  ],
  admin: [
    { label: "پنل مدیریت", href: "/admin", icon: <Bars3Icon /> },
    { label: "پروفایل", href: "/profile", icon: <Bars3Icon /> },
  ],
};

const roleLabels: Record<string, string> = {
  user: "کاربر",
  company_admin: "مدیر شرکت",
  company_hr: "منابع انسانی",
  venue_staff: "پرسنل باشگاه",
  admin: "مدیر سیستم",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = user ? (NAV_CONFIG[user.role] || []) : [];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [drawerOpen]);

  // Skip rendering the role-nav on the marketing landing page and login.
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <>
      <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
              aria-label="منو"
            >
              {drawerOpen ? <XMarkIcon /> : <Bars3Icon />}
            </button>
            <Link href="/" className="text-xl font-bold text-emerald-700">
              باجیمو
            </Link>
          </div>

          {/* Desktop links */}
          {links.length > 0 && (
            <div className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* User actions */}
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 sm:inline-flex">
                <span className="hidden sm:inline">{user.name || user.phone_number}</span>
                <span className="text-xs" aria-label={user.role}>
                  {roleLabels[user.role] || ""}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-red-600"
              >
                خروج
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed top-0 left-0 z-50 h-full w-72 max-w-xs overflow-y-auto bg-white shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <Link href="/" className="text-xl font-bold text-emerald-700">
                باجیمو
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon />
              </button>
            </div>
            <nav className="py-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-medium ${
                    isActive(link.href)
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            {user && (
              <div className="border-t border-gray-200 px-5 py-4">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  خروج
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
