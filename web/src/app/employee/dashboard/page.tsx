"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function EmployeeDashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get("/bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
    api.get("/catalog/venues/").then((r) => setVenues((r.data.results || r.data).slice(0, 3))).catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجیمو</span>
          <div className="flex items-center gap-4">
            <Link href="/employee/discover" className="text-sm text-emerald-600 hover:underline">
              کشف باشگاه‌ها
            </Link>
            <Link href="/employee/bookings" className="text-sm text-gray-600 hover:underline">
              رزروهای من
            </Link>
            <Link href="/profile" className="text-sm text-gray-600 hover:underline">
              پروفایل
            </Link>
            <span className="text-sm text-gray-600">{user.phone_number}</span>
            <button onClick={() => { logout(); window.location.href = "/login"; }} className="text-sm text-red-500 hover:underline">
              خروج
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">داشبورد کارمند</h1>

        {/* Budget Card */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-gray-600">بودجه باقیمانده</h2>
          <p className="text-3xl font-bold text-emerald-700">{formatTomans(user.remaining_budget)}</p>
          <p className="mt-1 text-sm text-gray-600">
            از {formatTomans(user.annual_budget)} سالانه &middot; مصرف شده: {formatTomans(user.annual_budget - user.remaining_budget)}
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(((user.annual_budget - user.remaining_budget) / user.annual_budget) * 100, 100)}%` }}
            />
          </div>
          {((user.annual_budget - user.remaining_budget) / user.annual_budget) * 100 > 80 && (
            <p className="mt-2 text-sm text-amber-600">بیش از ۸۰٪ بودجه سالانه خود را مصرف کرده‌اید.</p>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">رزروهای اخیر</h2>
            <Link href="/employee/bookings" className="text-sm text-emerald-600 hover:underline">مشاهده همه</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">هنوز رزروی ندارید. باشگاه‌ها را کشف کنید.</p>
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b: any) => (
                <Link key={b.id} href="/employee/bookings" className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50 block">
                  <div>
                    <p className="font-medium text-gray-900">{b.offer_name || `رزرو #${b.id}`}</p>
                    <p className="text-sm text-gray-600">
                      {b.venue_name || ""} &middot; {b.status === "paid" || b.status === "reserved" ? "رزرو شده" : b.status}
                    </p>
                    {b.reserved_at && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(b.reserved_at).toLocaleDateString("fa-IR")} ساعت {new Date(b.reserved_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatTomans(b.price)}</p>
                    {b.check_in_code && (b.status === "paid" || b.status === "reserved") && (
                      <p className="text-xs text-emerald-600 font-mono mt-0.5">{b.check_in_code}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Venues */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">باشگاه‌های نزدیک</h2>
            <Link href="/employee/discover" className="text-sm text-emerald-600 hover:underline">مشاهده همه</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {venues.map((v: any) => (
              <div key={v.id} className="rounded-lg bg-white p-4 shadow-sm">
                <p className="font-medium text-gray-900">{v.name}</p>
                <p className="mt-1 text-sm text-gray-600">{v.category_name} &middot; {v.district}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
