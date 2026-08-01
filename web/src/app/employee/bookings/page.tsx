"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Button, LoadingState, ErrorState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/useApi";
import { formatTomans, formatDateTime, timeLeft } from "@/lib/format";
import { Booking } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

const canCancel = (b: Booking) => b.status === "reserved" || b.status === "paid";

export default function BookingsPage() {
  const { user, refreshUser } = useAuth();
  const { data: bookings, loading, error, refetch } = useApi<Booking[]>(
    user ? "/bookings/" : null
  );
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const handleCancel = async (id: number) => {
    if (!confirm("آیا از لغو این رزرو اطمینان دارید؟ بودجه بازگردانده می‌شود.")) return;
    setActionLoading(id);
    try {
      await api.post(`/bookings/${id}/cancel/`);
      alert("رزرو لغو شد و بودجه بازگردانده شد.");
      refreshUser();
      refetch();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا در لغو رزرو"));
    }
    setActionLoading(null);
  };

  if (!user) return null;

  const list = bookings || [];

  return (
    <PageShell
      title="رزروهای من"
      action={
        <Link href="/employee/discover">
          <Button variant="primary" size="sm">
            کشف باشگاه‌ها
          </Button>
        </Link>
      }
    >
      {loading ? (
        <LoadingState message="در حال بارگذاری رزروها..." />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : list.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="mb-4 text-gray-600">هنوز رزروی ندارید.</p>
          <Link href="/employee/discover">
            <Button variant="primary">کشف باشگاه‌ها</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div
              key={b.id}
              className="rounded-xl bg-white p-4 sm:p-5 shadow-sm"
            >
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer"
                onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-gray-600">#{b.id}</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {b.offer_name || `رزرو #${b.id}`}
                  </p>
                  <p className="text-sm text-gray-600">{b.venue_name}</p>
                  {b.timeslot_date && (
                    <p className="text-xs text-emerald-600 font-medium">
                      {b.timeslot_date} ·{" "}
                      {b.timeslot_start?.slice(0, 5)} -{" "}
                      {b.timeslot_end?.slice(0, 5)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="font-bold text-gray-900">{formatTomans(b.price)}</p>
                    <p className="text-xs text-gray-600">{b.duration_minutes || 60} دقیقه</p>
                  </div>
                  {canCancel(b) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(b.id);
                      }}
                      disabled={actionLoading === b.id}
                      loading={actionLoading === b.id}
                    >
                      لغو
                    </Button>
                  )}
                </div>
              </div>

              {expanded === b.id && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-sm">
                  {b.timeslot_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">زمان رزرو</span>
                      <span className="text-gray-900">
                        {b.timeslot_date} · {b.timeslot_start?.slice(0, 5)} -{" "}
                        {b.timeslot_end?.slice(0, 5)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">تاریخ ثبت</span>
                    <span className="text-gray-900">{formatDateTime(b.reserved_at)}</span>
                  </div>
                  {b.expires_at && canCancel(b) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">انقضا</span>
                      <span className="text-amber-600">{timeLeft(b.expires_at)}</span>
                    </div>
                  )}
                  {b.checked_in_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">زمان ورود</span>
                      <span className="text-gray-900">{formatDateTime(b.checked_in_at)}</span>
                    </div>
                  )}
                  {b.cancelled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">زمان لغو</span>
                      <span className="text-red-600">{formatDateTime(b.cancelled_at)}</span>
                    </div>
                  )}
                  {b.check_in_code && canCancel(b) && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">کد ورود</span>
                      <span className="font-mono text-lg font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg tracking-wider">
                        {b.check_in_code}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">کارمزد</span>
                    <span className="text-gray-900">
                      {formatTomans(b.employee_commission || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
