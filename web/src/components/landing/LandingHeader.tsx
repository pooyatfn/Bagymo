"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui";

export function LandingHeader() {
  const { user } = useAuth();
  const navLinks = [
    { label: "ویژگی‌ها", href: "#features" },
    { label: "چگونه کار می‌کند", href: "#how-it-works" },
    { label: "باشگاه‌ها", href: "#venues" },
    { label: "پرسش‌ها", href: "#faq" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/20 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
        <Link href="/" className="text-xl font-bold text-emerald-700">
          باجیمو
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-emerald-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={dashboardPath(user.role)}>داشبورد</Link>
            </Button>
          ) : (
            <Button variant="primary" size="sm" asChild>
              <Link href="/login">ورود / ثبت نام</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

function dashboardPath(role: string) {
  const paths: Record<string, string> = {
    user: "/user/dashboard",
    company_admin: "/company/dashboard",
    company_hr: "/company/dashboard",
    venue_staff: "/venue/dashboard",
    admin: "/admin",
  };
  return paths[role] || "/login";
}
