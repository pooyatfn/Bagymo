"use client";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Card, CardHeader, DashboardSkeleton, EmptyRow, ErrorState, StatCard, StatusBadge, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { BanknotesIcon, CheckCircleIcon, ClockIcon, ReceiptIcon } from "@/components/icons";
import { formatDate, formatNumber, formatTomans, formatTomansShort } from "@/lib/format";
import type { Booking, Settlement } from "@/lib/types";

export default function VenueSettlementsPage() {
  const { user } = useAuth();
  const st = useApi<Settlement[]>(user ? "/billing/venue/settlements/" : null);
  const bk = useApi<Booking[]>(user ? "/bookings/" : null);

  const settlements = st.data || [];
  const bookings = bk.data || [];
  const paid = settlements.filter((s) => s.status === "paid").reduce((a, s) => a + s.total_net_payout, 0);
  const pending = settlements.filter((s) => s.status !== "paid").reduce((a, s) => a + s.total_net_payout, 0);
  const done = bookings.filter((b) => ["checked_in", "checkedin", "completed"].includes(b.status));
  const earned = done.reduce((a, b) => a + (b.venue_net_payout || 0), 0);
  const unsettled = Math.max(0, earned - paid - pending);

  return (
    <PageShell roles={["venue_staff"]} title="تسویه‌حساب" subtitle="مبالغ خالص مراجعات ثبت‌شده به‌صورت دوره‌ای به حساب شما واریز می‌شود.">
      {st.loading || bk.loading ? (
        <DashboardSkeleton />
      ) : st.error ? (
        <Card>
          <ErrorState onRetry={st.refetch} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="واریز شده" value={formatTomansShort(paid)} icon={<CheckCircleIcon />} />
            <StatCard label="در حال تسویه" value={formatTomansShort(pending)} icon={<ClockIcon />} tone="amber" />
            <StatCard label="تسویه‌نشده (دوره جاری)" value={formatTomansShort(unsettled)} icon={<BanknotesIcon />} tone="violet" />
            <StatCard label="مراجعات ثبت‌شده" value={formatNumber(done.length)} icon={<ReceiptIcon />} tone="sky" />
          </div>

          <Card p="none" className="overflow-hidden">
            <div className="p-5 pb-3">
              <CardHeader className="mb-0" title="دوره‌های تسویه" />
            </div>
            <Table>
              <THead>
                <Th>دوره</Th>
                <Th>تعداد مراجعه</Th>
                <Th>مبلغ خالص</Th>
                <Th>وضعیت</Th>
                <Th>تاریخ واریز</Th>
              </THead>
              <TBody>
                {settlements.length === 0 ? (
                  <EmptyRow colSpan={5}>هنوز دوره تسویه‌ای بسته نشده است. پس از پایان هر دوره، صورت‌حساب این‌جا نمایش داده می‌شود.</EmptyRow>
                ) : (
                  settlements.map((s) => (
                    <Tr key={s.id}>
                      <Td className="text-ink-900">
                        {formatDate(s.period_start)} تا {formatDate(s.period_end)}
                      </Td>
                      <Td className="tabular">{formatNumber(s.total_count)}</Td>
                      <Td className="tabular font-semibold text-ink-900">{formatTomans(s.total_net_payout)}</Td>
                      <Td>
                        <StatusBadge status={s.status} />
                      </Td>
                      <Td className="text-ink-500">{s.paid_at ? formatDate(s.paid_at) : "—"}</Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
