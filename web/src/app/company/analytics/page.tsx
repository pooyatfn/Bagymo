"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function AnalyticsPage() {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/billing/company-analytics/")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-emerald-700">باجیمو</Link>
          <div className="flex items-center gap-3">
            <Link href="/company/dashboard" className="text-sm text-gray-600 hover:underline">داشبورد</Link>
            <Link href="/company/invoices" className="text-sm text-gray-600 hover:underline">فاکتورها</Link>
            <span className="text-sm text-gray-600">{user.phone_number}</span>
            <button onClick={() => { logout(); window.location.href = "/login"; }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">گزارش و تحلیل</h1>

        {loading ? (
          <p className="text-gray-600 text-center py-8">در حال بارگذاری...</p>
        ) : !data ? (
          <p className="text-gray-600 text-center py-8">خطا در دریافت اطلاعات.</p>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">کل رزروها (انجام شده)</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{data.total_bookings}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">کل هزینه</p>
                <p className="mt-1 text-3xl font-bold text-emerald-700">{formatTomans(data.total_spend)}</p>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">کارمزد پلتفرم</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">{formatTomans(data.total_commission)}</p>
              </div>
            </div>

            {/* Top employees */}
            <div className="mb-8 rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">پرتکل‌ترین کارمندان</h2>
              {data.top_employees.length === 0 ? (
                <p className="text-gray-600 text-center py-4">داده‌ای موجود نیست.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-right">
                        <th className="pb-2 font-medium text-gray-600">نام</th>
                        <th className="pb-2 font-medium text-gray-600">تلفن</th>
                        <th className="pb-2 font-medium text-gray-600 text-left">رزرو</th>
                        <th className="pb-2 font-medium text-gray-600 text-left">هزینه کل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_employees.map((e: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2.5 text-gray-900 font-medium">{e.employee__name}</td>
                          <td className="py-2.5 text-gray-600">{e.employee__phone_number}</td>
                          <td className="py-2.5 text-left text-gray-900">{e.bookings}</td>
                          <td className="py-2.5 text-left text-emerald-700 font-medium">{formatTomans(e.total_spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Venue breakdown */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">بازشگاه‌ها</h2>
              {data.venue_breakdown.length === 0 ? (
                <p className="text-gray-600 text-center py-4">داده‌ای موجود نیست.</p>
              ) : (
                <div className="space-y-3">
                  {data.venue_breakdown.map((v: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{v.venue__name}</p>
                        <p className="text-xs text-gray-600">{v.bookings} رزرو</p>
                      </div>
                      <p className="font-bold text-emerald-700">{formatTomans(v.total_spent)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
