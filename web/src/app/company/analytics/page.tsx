"use client";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/cn";
import { PageShell } from "@/components/PageShell";
import { Avatar, Card, CardHeader, DashboardSkeleton, EmptyState, ErrorState, StatCard, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { BanknotesIcon, ChartBarIcon, ReceiptIcon, StoreIcon, TicketIcon } from "@/components/icons";
import { COMPANY_ROLES } from "@/lib/roles";
import { formatDate, formatNumber, formatTomans, formatTomansShort } from "@/lib/format";
import type { CompanyAnalytics } from "@/lib/types";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi<CompanyAnalytics>(user ? "/billing/company-analytics/" : null);

  const rawTrend = data?.daily_trend ?? [];
  // Show a full 30-day axis so a single active day doesn't stretch into one giant bar.
  const trend = rawTrend.length === 0 ? [] : fillDays(rawTrend, 30);
  const maxDay = Math.max(1, ...trend.map((t) => t.total_spent));
  const venues = data?.venue_breakdown ?? [];
  const maxVenue = Math.max(1, ...venues.map((v) => v.total_spent));

  return (
    <PageShell roles={COMPANY_ROLES} title="گزارش و تحلیل" subtitle="بر اساس بازدیدهای انجام‌شده (ورود ثبت‌شده) کارکنان.">
      {loading ? (
        <DashboardSkeleton stats={3} />
      ) : error || !data ? (
        <Card>
          <ErrorState onRetry={refetch} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="بازدیدهای انجام‌شده" value={formatNumber(data.total_bookings)} icon={<TicketIcon />} tone="sky" />
            <StatCard label="هزینه کل" value={formatTomansShort(data.total_spend)} icon={<BanknotesIcon />} />
            <StatCard
              className="col-span-2 lg:col-span-1"
              label="کارمزد پلتفرم"
              value={formatTomansShort(data.total_commission)}
              icon={<ReceiptIcon />}
              tone="amber"
            />
          </div>

          <Card>
            <CardHeader title="روند هزینه ۳۰ روز اخیر" description="مجموع هزینه بازدیدها در هر روز" />
            {trend.length === 0 ? (
              <EmptyState icon={<ChartBarIcon />} title="هنوز داده‌ای برای نمایش نیست" className="py-8" />
            ) : (
              <div className="flex h-48 items-end gap-1.5" role="img" aria-label="نمودار هزینه روزانه">
                {trend.map((t) => (
                  <div key={t.reserved_at__date} className="group relative flex h-full flex-1 flex-col justify-end">
                    <div
                      className={cn("rounded-t-md transition", t.total_spent > 0 ? "min-h-1 bg-brand-500/80 group-hover:bg-brand-600" : "h-1 bg-line")}
                      style={t.total_spent > 0 ? { height: `${(t.total_spent / maxDay) * 100}%` } : undefined}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
                      {formatDate(t.reserved_at__date, { month: "short", day: "numeric" })} · {formatTomans(t.total_spent)} · {formatNumber(t.bookings)} بازدید
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card p="none">
              <div className="p-5 pb-3">
                <CardHeader className="mb-0" title="فعال‌ترین کارکنان" />
              </div>
              {data.top_employees.length === 0 ? (
                <EmptyState className="py-8" title="داده‌ای موجود نیست" />
              ) : (
                <Table className="[&_table]:min-w-0">
                  <THead>
                    <Th>کارمند</Th>
                    <Th className="text-end">بازدید</Th>
                    <Th className="text-end">هزینه</Th>
                  </THead>
                  <TBody>
                    {data.top_employees.map((e, i) => (
                      <Tr key={i}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={e.employee__name || e.employee__phone_number} size="sm" />
                            <span className="font-medium text-ink-900">{e.employee__name || e.employee__phone_number}</span>
                          </div>
                        </Td>
                        <Td className="tabular text-end">{formatNumber(e.bookings)}</Td>
                        <Td className="tabular text-end font-medium text-ink-900">{formatTomans(e.total_spent)}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>

            <Card>
              <CardHeader title="سهم مجموعه‌ها" />
              {venues.length === 0 ? (
                <EmptyState icon={<StoreIcon />} className="py-8" title="داده‌ای موجود نیست" />
              ) : (
                <ul className="space-y-4">
                  {venues.map((v, i) => (
                    <li key={i}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium text-ink-900">{v.venue__name}</span>
                        <span className="tabular text-ink-500">
                          {formatTomans(v.total_spent)} · {formatNumber(v.bookings)} بازدید
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-brand-500" style={{ width: `${(v.total_spent / maxVenue) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

type TrendDay = { reserved_at__date: string; total_spent: number; bookings: number };

/** Pads the trend with zero-value days so the chart always spans the last `days` days. */
function fillDays(rows: TrendDay[], days: number): TrendDay[] {
  const byDate = new Map(rows.map((r) => [r.reserved_at__date, r]));
  const out: TrendDay[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push(byDate.get(key) ?? { reserved_at__date: key, total_spent: 0, bookings: 0 });
  }
  // Keep any rows the API returned outside the local window (timezone edge cases).
  for (const r of rows) if (!out.some((o) => o.reserved_at__date === r.reserved_at__date)) out.unshift(r);
  return out.sort((a, b) => a.reserved_at__date.localeCompare(b.reserved_at__date));
}
