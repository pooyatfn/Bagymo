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

export default function InvoicesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tab, setTab] = useState<"invoices" | "bookings">("invoices");

  useEffect(() => {
    if (!user) return;
    api.get("/billing/invoices/").then((r) => setInvoices(r.data.results || r.data)).catch(() => {});
    api.get("/billing/company-bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
  }, [user]);

  if (!user) return null;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-500",
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-600",
  };

  const statusLabels: Record<string, string> = {
    draft: "پیش‌نویس",
    pending: "در انتظار",
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

  const totalBilled = invoices.reduce((s, i) => s + (i.total_toman || 0), 0);
  const totalBookings = bookings.length;
  const totalSpent = bookings.reduce((s, b) => s + (b.status !== "cancelled" ? b.price : 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجم — مدیر شرکت</span>
          <div className="flex items-center gap-3">
            <a href="/company/dashboard" className="text-sm text-gray-500 hover:underline hidden sm:inline">داشبورد</a>
            <span className="text-sm text-gray-500 hidden sm:inline">{user.name}</span>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">فاکتورها و رزروها</h1>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">کل صورتحساب</p>
            <p className="text-xl font-bold text-emerald-700">{formatTomans(totalBilled)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">تعداد رزروها</p>
            <p className="text-xl font-bold text-gray-900">{totalBookings}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500">کل هزینه</p>
            <p className="text-xl font-bold text-amber-600">{formatTomans(totalSpent)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("invoices")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "invoices" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            فاکتورها ({invoices.length})
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === "bookings" ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
          >
            رزروها ({bookings.length})
          </button>
        </div>

        {tab === "invoices" ? (
          invoices.length === 0 ? (
            <p className="rounded-lg bg-white p-8 text-center text-gray-400 shadow-sm">هنوز فاکتوری ندارید.</p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">دوره</th>
                    <th className="px-4 py-3 font-medium text-gray-600">مبلغ</th>
                    <th className="px-4 py-3 font-medium text-gray-600">وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">
                        {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatTomans(inv.total_toman)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status] || ""}`}>
                          {statusLabels[inv.status] || inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          bookings.length === 0 ? (
            <p className="rounded-lg bg-white p-8 text-center text-gray-400 shadow-sm">هنوز رزروی ندارید.</p>
          ) : (
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
                        <p className="font-medium text-gray-900">{b.employee_name}</p>
                        <p className="text-xs text-gray-400">{b.employee_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.venue_name}</td>
                      <td className="px-4 py-3 text-gray-600">{b.offer_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatTomans(b.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bookingStatusColors[b.status] || ""}`}>
                          {bookingStatusLabels[b.status] || b.status}
                        </span>
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
