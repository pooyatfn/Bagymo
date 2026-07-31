"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fa-IR", { year: "numeric", month: "short", day: "numeric" });
}

export default function BookingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    setLoading(true);
    api.get("/bookings/").then((r) => { setBookings(r.data.results || r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [user]);

  const handleCancel = async (id: number) => {
    if (!confirm("آیا از لغو این رزرو اطمینان دارید؟ بودجه بازگردانده می‌شود.")) return;
    try {
      await api.post(`/bookings/${id}/cancel/`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در لغو رزرو");
    }
  };

  if (!user) return null;

  const statusColors: Record<string, string> = {
    reserved: "bg-blue-100 text-blue-700",
    checked_in: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-600",
    expired: "bg-amber-100 text-amber-700",
  };

  const statusLabels: Record<string, string> = {
    reserved: "رزرو شده",
    checked_in: "ورود تایید شده",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
    expired: "منقضی شده",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/employee/dashboard" className="text-lg font-bold text-emerald-700">باجم</Link>
          <div className="flex items-center gap-3">
            <Link href="/employee/dashboard" className="text-sm text-gray-500 hover:underline">داشبورد</Link>
            <Link href="/employee/discover" className="text-sm text-emerald-600 hover:underline font-medium">کشف باشگاه‌ها</Link>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">رزروهای من</h1>
        {loading ? (
          <p className="text-gray-400 text-center py-8">در حال بارگذاری...</p>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <p className="text-gray-400 mb-4">هنوز رزروی ندارید.</p>
            <Link href="/employee/discover" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              کشف باشگاه‌ها
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b: any) => (
              <div key={b.id} className="rounded-xl bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[b.status] || "bg-gray-100 text-gray-500"}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                      <span className="text-xs text-gray-400">#{b.id}</span>
                    </div>
                    <p className="font-medium text-gray-900">{b.offer_name || `رزرو #${b.id}`}</p>
                    <p className="text-sm text-gray-500">{b.venue_name}</p>
                    <p className="text-xs text-gray-400 mt-1">رزرو شده: {formatDate(b.reserved_at)}</p>
                    {b.check_in_code && b.status === "reserved" && (
                      <p className="text-xs text-emerald-600 mt-1 font-mono">کد ورود: {b.check_in_code}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 sm:text-right">
                    <div>
                      <p className="font-bold text-gray-900">{formatTomans(b.price)}</p>
                    </div>
                    {b.status === "reserved" && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        لغو
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
