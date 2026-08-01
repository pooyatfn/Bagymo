"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { Button, Card, LoadingState, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/useApi";
import { formatTomans } from "@/lib/format";
import { Booking } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

export default function VenueDashboard() {
  const { user } = useAuth();
  const { data: bookings, loading: dataLoading, refetch } = useApi<Booking[]>(
    user ? "/bookings/" : null
  );
  const [checkInCode, setCheckInCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCheckInResult(null);
    try {
      const res = await api.post<{ venue_name: string; offer_name: string }>(
        "/bookings/verify-checkin/",
        { check_in_code: checkInCode }
      );
      setCheckInResult({
        ok: true,
        msg: `ورود تایید شد: ${res.data.venue_name} — ${res.data.offer_name}`,
      });
      setCheckInCode("");
      refetch();
    } catch (err) {
      setCheckInResult({
        ok: false,
        msg: apiErrorDetail(err, "خطا در تایید ورود"),
      });
    }
    setLoading(false);
  };

  if (!user) return null;

  const list = bookings || [];
  const totalReceived = list
    .filter((b) => b.status === "checked_in" || b.status === "completed")
    .reduce((sum, b) => sum + (b.venue_net_payout || 0), 0);
  const totalCheckedIn = list.filter(
    (b) => b.status === "checked_in" || b.status === "completed"
  ).length;
  const pendingCount = list.filter((b) => b.status === "reserved").length;

  return (
    <PageShell title="داشبورد باشگاه">
      {dataLoading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : (
        <div className="space-y-8">
          <Card className="border-2 border-emerald-200 bg-emerald-50 p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              تایید ورود مهمان
            </h2>
            <form onSubmit={handleCheckIn} className="flex gap-3">
              <input
                type="text"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
                placeholder="کد ۶ کاراکتری ورود"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-mono text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
                dir="ltr"
              />
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading || !checkInCode}
              >
                {loading ? "بررسی..." : "تایید ورود"}
              </Button>
            </form>
            {checkInResult && (
              <p
                className={`mt-2 text-sm font-medium ${checkInResult.ok ? "text-emerald-700" : "text-red-600"}`}
              >
                {checkInResult.msg}
              </p>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-5 text-center">
              <p className="text-sm text-gray-600">تعداد رزروها</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{list.length}</p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-sm text-gray-600">کل دریافتی</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                {formatTomans(totalReceived)}
              </p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-sm text-gray-600">ورود تایید شده</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {totalCheckedIn} از {list.length}
              </p>
            </Card>
            <Card className="p-5 text-center">
              <p className="text-sm text-gray-600">رزرو معلق</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
            </Card>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">رزروها</h2>
            {list.length === 0 ? (
              <EmptyState
                title="رزروی دریافت نشده"
                description="رزروهای این باشگاه هنگامی نمایش داده می‌شوند که مشتریان وارد شوند."
              />
            ) : (
              <div className="space-y-2">
                {list.map((b) => (
                  <Card
                    key={b.id}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {b.offer_name || `رزرو #${b.id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {b.venue_name} ·{" "}
                           {b.reserved_at ? new Date(b.reserved_at).toLocaleDateString("fa-IR") : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatTomans(b.price)}
                      </p>
                      {b.check_in_code && b.status === "reserved" && (
                        <p className="text-xs text-gray-600">کد: {b.check_in_code}</p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
