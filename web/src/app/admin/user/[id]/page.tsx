"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Avatar, Badge, Card, CardHeader, DetailRow, EmptyRow, ErrorState, LoadingState, StatCard, StatusBadge, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { ArrowLeftIcon, TicketIcon, WalletIcon } from "@/components/icons";
import { formatDateTime, formatNumber, formatTomans, GENDER_LABELS } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { AdminUserDetail } from "@/lib/types";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, loading, error, refetch } = useApi<AdminUserDetail>(user?.role === "admin" && id ? `/auth/admin/users/${id}/` : null);

  const back = (
    <Link href="/admin" className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800">
      <ArrowLeftIcon className="h-4 w-4 rotate-180" /> پنل مدیریت
    </Link>
  );

  const u = data?.user;
  const bookings = data?.bookings ?? [];

  return (
    <PageShell roles={["admin"]} eyebrow={back} title={u ? u.name || u.phone_number : "جزئیات کاربر"} maxWidth="xl">
      {loading ? (
        <LoadingState />
      ) : error || !u ? (
        <Card>
          <ErrorState title="کاربر پیدا نشد" onRetry={refetch} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3" p="lg">
              <div className="mb-4 flex items-center gap-3">
                <Avatar name={u.name || u.phone_number} size="lg" />
                <div>
                  <p className="font-semibold text-ink-900">{u.name || "بدون نام"}</p>
                  <Badge variant="brand" size="sm" className="mt-1">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                </div>
              </div>
              <dl className="divide-y divide-line">
                <DetailRow label="موبایل"><span dir="ltr">{u.phone_number}</span></DetailRow>
                {u.email && <DetailRow label="ایمیل">{u.email}</DetailRow>}
                <DetailRow label="سازمان">{u.company_name || "—"}</DetailRow>
                <DetailRow label="جنسیت">{u.gender ? GENDER_LABELS[u.gender] : "—"}</DetailRow>
                {u.sheba && <DetailRow label="شبا"><span className="font-mono text-xs" dir="ltr">{u.sheba}</span></DetailRow>}
              </dl>
            </Card>
            <div className="grid content-start gap-4 lg:col-span-2">
              <StatCard label="بودجه سالانه" value={formatTomans(u.annual_budget)} icon={<WalletIcon />} />
              <StatCard label="باقی‌مانده" value={formatTomans(u.remaining_budget)} icon={<WalletIcon />} tone="sky" />
              <StatCard label="رزروها" value={formatNumber(bookings.length)} icon={<TicketIcon />} tone="violet" />
            </div>
          </div>

          <Card p="none" className="overflow-hidden">
            <div className="p-5 pb-3">
              <CardHeader className="mb-0" title="رزروهای کاربر" />
            </div>
            <Table>
              <THead>
                <Th>مجموعه</Th>
                <Th>خدمت</Th>
                <Th>زمان ثبت</Th>
                <Th>مبلغ</Th>
                <Th>وضعیت</Th>
              </THead>
              <TBody>
                {bookings.length === 0 ? (
                  <EmptyRow colSpan={5}>رزروی ثبت نشده است.</EmptyRow>
                ) : (
                  bookings.map((b) => (
                    <Tr key={b.id}>
                      <Td className="font-medium text-ink-900">{b.venue_name}</Td>
                      <Td>{b.offer_name}</Td>
                      <Td className="whitespace-nowrap text-xs">{formatDateTime(b.reserved_at)}</Td>
                      <Td className="tabular font-medium text-ink-900">{formatTomans(b.price)}</Td>
                      <Td><StatusBadge status={b.status} /></Td>
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
