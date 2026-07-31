"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "companies" | "venues" | "bookings">("overview");
  const [companies, setCompanies] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.get("/companies/employees/").then((r) => setCompanies(r.data.results || r.data)).catch(() => {});
    api.get("/catalog/venues/").then((r) => setVenues(r.data.results || r.data)).catch(() => {});
    api.get("/billing/company-bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">دسترسی غیرمجاز</p>
      </div>
    );
  }

  const totalRevenue = bookings.reduce((s, b) => s + (b.status !== "cancelled" ? b.price : 0), 0);
  const platformMargin = Math.round(totalRevenue * 0.06);
  const totalBookings = bookings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجم — پنل مدیریت</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.phone_number}</span>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">پنل مدیریت</h1>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">تعداد شرکت‌ها</p>
            <p className="text-xl font-bold text-gray-900">{new Set(bookings.map((b: any) => b.employee_phone)).size || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">تعداد باشگاه‌ها</p>
            <p className="text-xl font-bold text-gray-900">{venues.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">تعداد رزروها</p>
            <p className="text-xl font-bold text-gray-900">{totalBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">درآمد پلتفرم (۶٪)</p>
            <p className="text-xl font-bold text-emerald-700">{formatTomans(platformMargin)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: "overview", label: "نمای کلی" },
            { key: "companies", label: "شرکت‌ها" },
            { key: "venues", label: "باشگاه‌ها" },
            { key: "bookings", label: "رزروها" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Venues Tab */}
        {tab === "venues" && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">نام</th>
                  <th className="px-4 py-3 font-medium text-gray-600">دسته</th>
                  <th className="px-4 py-3 font-medium text-gray-600">منطقه</th>
                  <th className="px-4 py-3 font-medium text-gray-600">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {venues.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                    <td className="px-4 py-3 text-gray-600">{v.category_name || v.category}</td>
                    <td className="px-4 py-3 text-gray-600">{v.district} &middot; {v.city}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${v.is_verified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {v.is_verified ? "تایید شده" : "در انتظار"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">کارمند</th>
                  <th className="px-4 py-3 font-medium text-gray-600">باشگاه</th>
                  <th className="px-4 py-3 font-medium text-gray-600">آفر</th>
                  <th className="px-4 py-3 font-medium text-gray-600">مبلغ</th>
                  <th className="px-4 py-3 font-medium text-gray-600">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.employee_name || b.employee_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.venue_name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.offer_name}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatTomans(b.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        b.status === "completed" || b.status === "checked_in" ? "bg-emerald-100 text-emerald-700" :
                        b.status === "cancelled" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Overview / Companies tab */}
        {(tab === "overview" || tab === "companies") && (
          <p className="rounded-lg bg-white p-6 text-center text-gray-400 shadow-sm">
            {tab === "overview" ? "نمای کلی به‌زودی" : "لیست شرکت‌ها به‌زودی"}
          </p>
        )}
      </main>
    </div>
  );
}
