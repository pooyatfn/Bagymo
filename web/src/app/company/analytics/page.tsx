"use client";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { formatTomans } from "@/lib/format";
import { CompanyAnalytics, TopEmployee, VenueBreakdown } from "@/lib/types";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi<CompanyAnalytics>(
    user ? "/billing/company-analytics/" : null
  );

  if (!user) return null;

  return (
    <PageShell title="گزارش و تحلیل">
      {loading ? (
        <LoadingState message="در حال بارگذاری گزارش..." />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !data ? (
        <ErrorState description="داده‌ای دریافت نشد." onRetry={refetch} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-sm text-gray-600">کل رزروها (انجام شده)</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {data.total_bookings}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-600">کل هزینه</p>
              <p className="mt-1 text-3xl font-bold text-emerald-700">
                {formatTomans(data.total_spend)}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-gray-600">کارمزد پلتفرم</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">
                {formatTomans(data.total_commission)}
              </p>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              پرتکل‌ترین کارمندان
            </h2>
            {data.top_employees.length === 0 ? (
              <p className="text-center text-sm text-gray-600 py-4">
                داده‌ای موجود نیست.
              </p>
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
                    {data.top_employees.map((e: TopEmployee, i: number) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2.5 text-gray-900 font-medium">
                          {e.employee__name}
                        </td>
                        <td className="py-2.5 text-gray-600">
                          {e.employee__phone_number}
                        </td>
                        <td className="py-2.5 text-left text-gray-900">{e.bookings}</td>
                        <td className="py-2.5 text-left font-medium text-emerald-700">
                          {formatTomans(e.total_spent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              بازشگاه‌ها
            </h2>
            {data.venue_breakdown.length === 0 ? (
              <p className="text-center text-sm text-gray-600 py-4">
                داده‌ای موجود نیست.
              </p>
            ) : (
              <div className="space-y-3">
                {data.venue_breakdown.map((v: VenueBreakdown, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{v.venue__name}</p>
                      <p className="text-xs text-gray-600">{v.bookings} رزرو</p>
                    </div>
                    <p className="font-bold text-emerald-700">
                      {formatTomans(v.total_spent)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
