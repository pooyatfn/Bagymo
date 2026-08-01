"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";
import { Button, Card, LoadingState, EmptyState, ErrorState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/useApi";
import { formatTomans, formatDate } from "@/lib/format";
import { Invoice, Booking } from "@/lib/types";

export default function InvoicesPage() {
  const { user } = useAuth();
  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useApi<Invoice[]>(user ? "/billing/invoices/" : null);
  const { data: bookings, loading: bookingsLoading } = useApi<Booking[]>(
    user ? "/billing/company-bookings/" : null
  );

  const [tab, setTab] = useState<"invoices" | "bookings">("invoices");

  if (!user) return null;

  const invList = invoices || [];
  const bookingList = bookings || [];

  const totalBilled = invList.reduce((s, i) => s + (i.total_toman || 0), 0);
  const totalBookingsCount = bookingList.length;
  const totalSpent = bookingList.reduce(
    (s, b) => s + (b.status !== "cancelled" ? b.price : 0),
    0
  );

  const loading = invoicesLoading || bookingsLoading;

  return (
    <PageShell title="فاکتورها و رزروها">
      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : invoicesError ? (
        <ErrorState onRetry={() => window.location.reload()} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">کل صورتحساب</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatTomans(totalBilled)}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">تعداد رزروها</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {totalBookingsCount}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">کل هزینه</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                {formatTomans(totalSpent)}
              </p>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button
              variant={tab === "invoices" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTab("invoices")}
            >
              فاکتورها ({invList.length})
            </Button>
            <Button
              variant={tab === "bookings" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setTab("bookings")}
            >
              رزروها ({bookingList.length})
            </Button>
          </div>

          {tab === "invoices" ? (
            invList.length === 0 ? (
              <EmptyState
                title="فاکتوری وجود ندارد"
                description="صورتحساب دوره‌ای بعدی نمایش داده می‌شود."
              />
            ) : (
              <Card className="overflow-hidden p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        دوره
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        مبلغ
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        وضعیت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {formatDate(inv.period_start)} —{" "}
                          {formatDate(inv.period_end)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {formatTomans(inv.total_toman)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={inv.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )
          ) : bookingList.length === 0 ? (
            <EmptyState
              title="رزروی وجود ندارد"
              description="رزروهای کارکنان هرگاه ثبت شوند اینجا نشان داده می‌شوند."
            />
          ) : (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      کارمند
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      باشگاه
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      آفر
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      مبلغ
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      وضعیت
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookingList.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {b.employee_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {b.employee_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.venue_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.offer_name}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatTomans(b.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
