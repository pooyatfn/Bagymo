"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function VenueSettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<"settlements" | "reservations">("reservations");

  useEffect(() => {
    if (!user) return;
    api.get("/billing/venue-settlements/").then((r) => setSettlements(r.data.results || r.data)).catch(() => {});
    api.get("/bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
  }, [user?.id]);

  if (!user) return null;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    processing: "bg-blue-100 text-blue-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "در انتظار",
    processing: "در حال پردازش",
    paid: "پرداخت شده",
    failed: "ناموفق",
  };

  const bookingStatusColors: Record<string, string> = {
    reserved: "bg-blue-100 text-blue-700",
    checked_in: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    expired: "bg-amber-100 text-amber-700",
  };

  const bookingStatusLabels: Record<string, string> = {
    reserved: "رزرو شده",
    checked_in: "ورود تایید شده",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
    expired: "منقضی شده",
  };

  const totalPayout = settlements.reduce((s, b) => s + (b.total_net_payout || 0), 0);
  const totalRes = bookings.length;
  const checkedIn = bookings.filter((b) => b.status === "checked_in" || b.status === "completed").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">گزارش تسویه‌حساب</h1>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">کل دریافتی</p>
            <p className="text-xl font-bold text-emerald-700">{formatTomans(totalPayout)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">تعداد رزروها</p>
            <p className="text-xl font-bold text-gray-900">{totalRes}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">ورود تایید شده</p>
            <p className="text-xl font-bold text-emerald-600">{checkedIn}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("reservations")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "reservations" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            رزروها ({bookings.length})
          </button>
          <button
            onClick={() => setTab("settlements")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "settlements" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            دسته‌های تسویه ({settlements.length})
          </button>
        </div>

        {tab === "reservations" ? (
          bookings.length === 0 ? (
            <p className="rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm">هنوز رزروی ندارید.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                      {bookingStatusLabels[b.status] || b.status}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{b.offer_name || `رزرو #${b.id}`}</p>
                      <p className="text-sm text-gray-600">{b.venue_name} &middot; {formatDate(b.reserved_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatTomans(b.price)}</p>
                    {b.check_in_code && b.status === "reserved" && (
                      <p className="text-xs text-gray-600">کد: {b.check_in_code}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          settlements.length === 0 ? (
            <p className="rounded-lg bg-white p-8 text-center text-gray-600 shadow-sm">هنوز دسته تسویه‌ای ندارید.</p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">دوره</th>
                    <th className="px-4 py-3 font-medium text-gray-600">تعداد</th>
                    <th className="px-4 py-3 font-medium text-gray-600">مبلغ خالص</th>
                    <th className="px-4 py-3 font-medium text-gray-600">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {formatDate(s.period_start)} — {formatDate(s.period_end)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.total_count}</td>
                      <td className="px-4 py-3 font-medium text-emerald-700">{formatTomans(s.total_net_payout)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[s.status] || ""}`}>
                          {statusLabels[s.status] || s.status}
                        </span>
                        {s.paid_at && <p className="text-xs text-gray-600 mt-1">{formatDate(s.paid_at)}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>
    </div>
  );
}
