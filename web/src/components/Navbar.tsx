"use client";
import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
}

const NAV_CONFIG: Record<string, NavLink[]> = {
  employee: [
    { label: "داشبورد", href: "/employee/dashboard" },
    { label: "کشف باشگاه‌ها", href: "/employee/discover" },
    { label: "رزروهای من", href: "/employee/bookings" },
    { label: "پروفایل", href: "/profile" },
  ],
  venue_staff: [
    { label: "داشبورد", href: "/venue/dashboard" },
    { label: "آفرها", href: "/venue/offers" },
    { label: "تسویه‌حساب", href: "/venue/settlements" },
    { label: "پروفایل باشگاه", href: "/venue/register" },
  ],
  company_admin: [
    { label: "داشبورد", href: "/company/dashboard" },
    { label: "گزارش و تحلیل", href: "/company/analytics" },
    { label: "فاکتورها", href: "/company/invoices" },
    { label: "پروفایل", href: "/profile" },
  ],
  admin: [
    { label: "پنل مدیریت", href: "/admin" },
    { label: "پروفایل", href: "/profile" },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = user ? (NAV_CONFIG[user.role] || []) : [];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-700">باجیمو</Link>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm hover:underline hidden sm:inline ${
                isActive(link.href)
                  ? "font-medium text-emerald-700"
                  : "text-gray-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <>
              <span className="text-sm text-gray-600 hidden sm:inline">{user.name || user.phone_number}</span>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">خروج</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
