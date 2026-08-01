"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function VenueDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [checkInCode, setCheckInCode] = useState("");
  const [checkInResult, setCheckInResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBookings = () => {
    if (!user) return;
    api.get("/bookings/").then((r) => setBookings(r.data.results || r.data)).catch(() => {});
  };

  useEffect(() => { loadBookings(); }, [user?.id]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckInResult(null);
    try {
      const res = await api.post("/bookings/verify-checkin/", { check_in_code: checkInCode });
      setCheckInResult({ ok: true, msg: `ورود تایید شد: ${res.data.venue_name} — ${res.data.offer_name}` });
      setCheckInCode("");
      loadBookings();
    } catch (err: any) {
      setCheckInResult({ ok: false, msg: err.response?.data?.detail || "خطا در تایید ورود" });
    }
    setLoading(false);
  };

  if (!user) return null;

  const totalReceived = bookings
    .filter((b: any) => ["checked_in", "completed"].includes(b.status))
    .reduce((sum: number, b: any) => sum + (b.venue_net_payout || 0), 0);
  const totalCheckedIn = bookings.filter((b: any) => ["checked_in", "completed"].includes(b.status)).length;
  const pendingCount = bookings.filter((b: any) => b.status === "reserved").length;

  const statusColors: Record<string, string> = {
    reserved: "bg-blue-100 text-blue-700",
    checked_in: "bg-emerald-100 text-emerald-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
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
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">داشبورد باشگاه</h1>

        {/* Check-in Box */}
        <div className="mb-8 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">تایید ورود مهمان</h2>
          <form onSubmit={handleCheckIn} className="flex gap-3">
            <input
              type="text"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
              placeholder="کد ۶ کاراکتری ورود را وارد کنید"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading || !checkInCode}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "در حال بررسی..." : "تایید ورود"}
            </button>
          </form>
          {checkInResult && (
            <p className={`mt-2 text-sm font-medium ${checkInResult.ok ? "text-emerald-700" : "text-red-600"}`}>
              {checkInResult.msg}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-sm text-gray-600">تعداد رزروها</p>
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-sm text-gray-600">کل دریافتی</p>
            <p className="text-2xl font-bold text-emerald-700">{formatTomans(totalReceived)}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-sm text-gray-600">ورود تایید شده</p>
            <p className="text-2xl font-bold text-gray-900">{totalCheckedIn} از {bookings.length}</p>
          </div>
        </div>

        {/* Reservation List */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">رزروها</h2>
        {bookings.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">هنوز رزروی ندارید.</p>
        ) : (
          <div className="space-y-2">
            {bookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[b.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[b.status] || b.status}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{b.offer_name || `رزرو #${b.id}`}</p>
                    <p className="text-sm text-gray-600">{b.venue_name} &middot; {new Date(b.reserved_at).toLocaleDateString("fa-IR")}</p>
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
        )}
      </main>
    </div>
  );
}
