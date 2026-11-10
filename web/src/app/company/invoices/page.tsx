"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Avatar, Card, DashboardSkeleton, EmptyRow, ErrorState, StatCard, StatusBadge, Table, Tabs, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { BanknotesIcon, ReceiptIcon, TicketIcon } from "@/components/icons";
import { COMPANY_ROLES } from "@/lib/roles";
import { formatDate, formatDateTime, formatNumber, formatTomans, formatTomansShort } from "@/lib/format";
import type { Booking, Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const { user } = useAuth();
  const inv = useApi<Invoice[]>(user ? "/billing/invoices/" : null);
  const bk = useApi<Booking[]>(user ? "/billing/company-bookings/" : null);
  const [tab, setTab] = useState<"invoices" | "bookings">("invoices");

  const invoices = inv.data || [];
  const bookings = bk.data || [];
  const totalBilled = invoices.reduce((s, i) => s + (i.total_toman || 0), 0);
  const totalSpent = bookings.reduce((s, b) => s + (b.status !== "cancelled" ? b.price : 0), 0);

  return (
    <PageShell roles={COMPANY_ROLES} title="فاکتورها و رزروها" subtitle="صورتحساب‌های دوره‌ای و ریز رزروهای کارکنان.">
      {inv.loading || bk.loading ? (
        <DashboardSkeleton stats={3} />
      ) : inv.error ? (
        <Card>
          <ErrorState
            onRetry={() => {
              inv.refetch();
              bk.refetch();
            }}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="جمع صورتحساب‌ها" value={formatTomansShort(totalBilled)} icon={<ReceiptIcon />} />
            <StatCard label="تعداد رزروها" value={formatNumber(bookings.length)} icon={<TicketIcon />} tone="sky" />
            <StatCard className="col-span-2 lg:col-span-1" label="هزینه رزروها" value={formatTomansShort(totalSpent)} icon={<BanknotesIcon />} tone="amber" />
          </div>

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: "invoices", label: "فاکتورها", count: invoices.length },
              { key: "bookings", label: "رزروهای کارکنان", count: bookings.length },
            ]}
          />

          <Card p="none" className="overflow-hidden">
            {tab === "invoices" ? (
              <Table>
                <THead>
                  <Th>شماره</Th>
                  <Th>دوره</Th>
                  <Th>مبلغ</Th>
                  <Th>وضعیت</Th>
                </THead>
                <TBody>
                  {invoices.length === 0 ? (
                    <EmptyRow colSpan={4}>هنوز فاکتوری صادر نشده است. فاکتورها در پایان هر دوره صادر می‌شوند.</EmptyRow>
                  ) : (
                    invoices.map((i) => (
                      <Tr key={i.id}>
                        <Td className="tabular text-ink-500">#{formatNumber(i.id)}</Td>
                        <Td className="text-ink-900">
                          {formatDate(i.period_start)} تا {formatDate(i.period_end)}
                        </Td>
                        <Td className="tabular font-semibold text-ink-900">{formatTomans(i.total_toman)}</Td>
                        <Td>
                          <StatusBadge status={i.status} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            ) : (
              <Table>
                <THead>
                  <Th>کارمند</Th>
                  <Th>مجموعه و خدمت</Th>
                  <Th>زمان</Th>
                  <Th>مبلغ</Th>
                  <Th>وضعیت</Th>
                </THead>
                <TBody>
                  {bookings.length === 0 ? (
                    <EmptyRow colSpan={5}>هنوز رزروی ثبت نشده است.</EmptyRow>
                  ) : (
                    bookings.map((b) => (
                      <Tr key={b.id}>
                        <Td>
                          <div className="flex items-center gap-3">
                            <Avatar name={b.employee_name || b.employee_phone} size="sm" />
                            <div>
                              <p className="font-medium text-ink-900">{b.employee_name || "—"}</p>
                              <p className="text-xs text-ink-500">{b.employee_phone}</p>
                            </div>
                          </div>
                        </Td>
                        <Td>
                          <p className="text-ink-900">{b.venue_name}</p>
                          <p className="text-xs text-ink-500">{b.offer_name}</p>
                        </Td>
                        <Td className="whitespace-nowrap text-xs">{formatDateTime(b.reserved_at)}</Td>
                        <Td className="tabular font-medium text-ink-900">{formatTomans(b.price)}</Td>
                        <Td>
                          <StatusBadge status={b.status} />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
