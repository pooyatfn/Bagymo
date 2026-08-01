"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";
import { Button, Card, LoadingState, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/useApi";
import { formatTomans, formatDate } from "@/lib/format";
import { Booking, Settlement } from "@/lib/types";

export default function VenueSettlementsPage() {
  const { user } = useAuth();
  const { data: settlements, loading } = useApi<Settlement[]>(
    user ? "/billing/venue-settlements/" : null
  );
  const { data: bookings } = useApi<Booking[]>(user ? "/bookings/" : null);

  if (!user) return null;

  const settlementList = settlements || [];
  const bookingList = bookings || [];
  const totalPayout = settlementList.reduce(
    (s, b) => s + (b.total_net_payout || 0),
    0
  );
  const totalRes = bookingList.length;
  const checkedIn = bookingList.filter(
    (b) => b.status === "checked_in" || b.status === "completed"
  ).length;

  return (
    <PageShell title="گزارش تسویه‌حساب">
      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">کل دریافتی</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatTomans(totalPayout)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">تعداد رزروها</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{totalRes}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">ورود تایید شده</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {checkedIn}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">تعداد دسته‌ها</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {settlementList.length}
              </p>
            </Card>
          </div>

          <SettlementTabs
            bookings={bookingList}
            settlements={settlementList}
          />
        </div>
      )}
    </PageShell>
  );
}

function SettlementTabs({
  bookings,
  settlements,
}: {
  bookings: Booking[];
  settlements: Settlement[];
}) {
  const [tab, setTab] = useState<"settlements" | "reservations">("reservations");
  return (
    <>
      <div className="flex gap-2">
        <Button
          variant={tab === "reservations" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("reservations")}
        >
          رزروها ({bookings.length})
        </Button>
        <Button
          variant={tab === "settlements" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setTab("settlements")}
        >
          دسته‌های تسویه ({settlements.length})
        </Button>
      </div>

      {tab === "reservations" ? (
        bookings.length === 0 ? (
          <EmptyState
            title="رزروی دریافت نشده"
            description="وقتی مشتریان وارد باشگاه شما می‌شوند، رزروها اینجا نمایش داده می‌شوند."
          />
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
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
                      {b.venue_name} · {formatDate(b.reserved_at)}
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
        )
      ) : settlements.length === 0 ? (
        <EmptyState
          title="دسته تسویه‌ای نیست"
          description="هنگام تکمیل دوره حسابرسی، دسته‌های تسویه اینجا نمایش داده می‌شوند."
        />
      ) : (
        <Card className="overflow-hidden p-0">
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
              {settlements.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">
                    {formatDate(s.period_start)} — {formatDate(s.period_end)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.total_count}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700">
                    {formatTomans(s.total_net_payout)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                    {s.paid_at && (
                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(s.paid_at)}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
