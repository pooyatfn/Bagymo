"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "pending" | "venues" | "bookings">("pending");
  const [pendingVenues, setPendingVenues] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);

  const load = () => {
    if (!user || user.role !== "admin") return;
    api.get("/catalog/pending-venues/").then((r) => setPendingVenues(r.data)).catch(() => {});
    api.get("/catalog/venues/").then((r) => setVenues(r.data.results || r.data)).catch(() => {});
    api.get("/billing/company-bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/catalog/venues/${id}/approve/`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا");
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await api.post(`/catalog/venues/${rejectId}/reject/`, { reason: rejectReason });
      setRejectId(null);
      setRejectReason("");
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا");
    }
  };

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

  const statusLabels: Record<string, string> = {
    pending: "در انتظار",
    active: "فعال",
    suspended: "غیرفعال",
    reserved: "رزرو شده",
    checked_in: "ورود تایید شده",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
    expired: "منقضی شده",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجیمو — پنل مدیریت</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.phone_number}</span>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">پنل مدیریت</h1>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">در انتظار تایید</p>
            <p className="text-xl font-bold text-amber-600">{pendingVenues.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">تعداد باشگاه‌ها</p>
            <p className="text-xl font-bold text-gray-900">{venues.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">تعداد رزروها</p>
            <p className="text-xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm text-center">
            <p className="text-xs text-gray-600">درآمد پلتفرم (۶٪)</p>
            <p className="text-xl font-bold text-emerald-700">{formatTomans(platformMargin)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { key: "pending", label: `در انتظار تایید (${pendingVenues.length})` },
            { key: "venues", label: "باشگاه‌ها" },
            { key: "bookings", label: "رزروها" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${tab === t.key ? "bg-emerald-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending Venues Tab */}
        {tab === "pending" && (
          pendingVenues.length === 0 ? (
            <p className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">باشگاهی در انتظار تایید نیست.</p>
          ) : (
            <div className="space-y-3">
              {pendingVenues.map((v: any) => (
                <div key={v.id} className="rounded-xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{v.name}</h3>
                      <p className="text-sm text-gray-600">{v.category_name || v.category} &middot; {v.district} &middot; {v.city}</p>
                      {v.address && <p className="text-xs text-gray-600 mt-1">{v.address}</p>}
                      {v.phone && <p className="text-xs text-gray-600">تلفن: {v.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleApprove(v.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                        تایید
                      </button>
                      <button onClick={() => setRejectId(v.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        رد
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

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
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        v.status === "active" ? "bg-emerald-100 text-emerald-700" :
                        v.status === "pending" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {statusLabels[v.status] || v.status}
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
                        {statusLabels[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reject Modal */}
        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setRejectId(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-lg font-bold text-gray-900">رد باشگاه</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="دلیل رد (اختیاری)"
                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => setRejectId(null)} className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600">انصراف</button>
                <button onClick={handleReject} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">رد</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
