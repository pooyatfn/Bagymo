"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";
import { BuildingIcon, SparklesIcon } from "@/components/icons";

const footerLinks = [
  {
    title: "محصول",
    links: [
      { label: "ویژگی‌ها", href: "#features" },
      { label: "چگونه کار می‌کند", href: "#how-it-works" },
      { label: "باشگاه‌ها", href: "#venues" },
    ],
  },
  {
    title: "منابع",
    links: [
      { label: "مرکز کمک", href: "#" },
      { label: "وبلاگ", href: "#" },
    ],
  },
  {
    title: "قوانین",
    links: [
      { label: "حریم خصوصی", href: "#" },
      { label: "قوانین استفاده", href: "#" },
      { label: "قوانین بازگشت پول", href: "#" },
    ],
  },
];

export function LandingFooter() {
  const { user } = useAuth();
  const dashboardPath =
    user &&
    ({
      employee: "/employee/dashboard",
      company_admin: "/company/dashboard",
      company_hr: "/company/dashboard",
      venue_staff: "/venue/dashboard",
      admin: "/admin",
    }[user.role] || "/");

  return (
    <footer className="border-t border-gray-200 bg-white pt-10 mt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div className="text-center sm:text-right">
            <div className="flex items-center gap-2 justify-center sm:justify-end">
              <SparklesIcon className="h-6 w-6 text-emerald-700" />
              <span className="text-xl font-bold text-emerald-700">باجیمو</span>
            </div>
            <p className="mt-2 text-sm text-gray-600 max-w-xs">
              پلتفرم سلامت سازمانی — بودجه سلامت برای کارکنان، دسترسی به سلول‌های فیتنس، استخر و سینما.
            </p>
            {dashboardPath && (
              <Button variant="ghost" size="sm" className="mt-3" asChild>
                <Link href={dashboardPath}>رفتن به داشبورد</Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-center sm:text-right">
            {footerLinks.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-gray-900">{col.title}</h4>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={`${col.title}-${l.label}`}>
                      <Link
                        href={l.href}
                        className="text-sm text-gray-600 hover:text-emerald-700"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 text-center text-xs text-gray-600">
          <p className="flex items-center gap-1">
            <BuildingIcon className="h-4 w-4" />
            <span>© {new Date().getFullYear()} باجیمو. تمامی حقوق محفظه است.</span>
          </p>
          <div className="flex flex-wrap items-center gap-1 justify-center">
            <span>برای کسب‌وکارها:</span>
            <Link
              href="/venue/register"
              className="font-medium text-emerald-700 hover:underline"
            >
              ثبت باشگاه
            </Link>
            <span>·</span>
            <Link href="/login" className="font-medium text-emerald-700 hover:underline">
              ورود
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
