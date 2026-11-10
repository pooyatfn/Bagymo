"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Button, Card, DetailRow, EmptyState, ErrorState, LoadingState, StatusBadge, Tabs, useConfirm, useToast } from "@/components/ui";
import { CalendarIcon, ChevronDownIcon, ClockIcon, SearchIcon, TicketIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatDateTime, formatNumber, formatTomans, timeLeft } from "@/lib/format";
import { apiErrorDetail } from "@/lib/errors";
import type { Booking } from "@/lib/types";

const canCancel = (b: Booking) => b.status === "reserved" || b.status === "paid";
type Filter = "all" | "active" | "done" | "cancelled";

const matches: Record<Filter, (b: Booking) => boolean> = {
  all: () => true,
  active: canCancel,
  done: (b) => ["checked_in", "checkedin", "completed"].includes(b.status),
  cancelled: (b) => b.status === "cancelled" || b.status === "expired",
};

export default function BookingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, error, refetch } = useApi<Booking[]>(user ? "/bookings/" : null);
  const [busy, setBusy] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const handleCancel = async (b: Booking) => {
    const ok = await confirm({
      title: "لغو رزرو",
      description: (
        <>
          رزرو <b>{b.offer_name}</b> در <b>{b.venue_name}</b> لغو شود؟ مبلغ {formatTomans(b.price)} به بودجه شما برمی‌گردد.
        </>
      ),
      confirmLabel: "بله، لغو شود",
      cancelLabel: "منصرف شدم",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(b.id);
    try {
      await api.post(`/bookings/${b.id}/cancel/`);
      toast.success("رزرو لغو شد", "مبلغ به بودجه شما بازگردانده شد.");
      refreshUser();
      refetch();
    } catch (err) {
      toast.error("لغو انجام نشد", apiErrorDetail(err));
    }
    setBusy(null);
  };

  const list = data || [];
  const shown = list.filter(matches[filter]);

  return (
    <PageShell
      roles={["user"]}
      title="رزروهای من"
      subtitle="رزروهای فعال، تاریخچه بازدیدها و کدهای ورود."
      action={
        <Button asChild>
          <Link href="/user/discover">
            <SearchIcon className="h-4 w-4" /> رزرو جدید
          </Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="در حال بارگذاری رزروها…" />
      ) : error ? (
        <Card>
          <ErrorState onRetry={refetch} />
        </Card>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TicketIcon />}
            title="هنوز رزروی ندارید"
            description="از صفحه کشف مجموعه‌ها، باشگاه یا استخر دلخواهتان را پیدا کنید و با بودجه شرکت رزرو کنید."
            action={
              <Button asChild>
                <Link href="/user/discover">کشف مجموعه‌ها</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { key: "all", label: "همه", count: list.length },
              { key: "active", label: "فعال", count: list.filter(matches.active).length },
              { key: "done", label: "انجام‌شده", count: list.filter(matches.done).length },
              { key: "cancelled", label: "لغو / منقضی", count: list.filter(matches.cancelled).length },
            ]}
          />

          {shown.length === 0 ? (
            <Card>
              <EmptyState title="موردی در این دسته نیست" />
            </Card>
          ) : (
            <div className="grid items-start gap-4 xl:grid-cols-2">
              {shown.map((b) => {
                const expanded = open === b.id;
                return (
                  <Card key={b.id} p="none" className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : b.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-4 p-4 text-start sm:p-5"
                    >
                      <span
                        className={cn(
                          "hidden h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center sm:flex",
                          canCancel(b) ? "bg-brand-50 text-brand-700" : "bg-canvas text-ink-500",
                        )}
                      >
                        <CalendarIcon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-ink-900">{b.offer_name || `رزرو #${b.id}`}</p>
                          <StatusBadge status={b.status} />
                        </div>
                        <p className="mt-0.5 truncate text-sm text-ink-500">{b.venue_name}</p>
                        {b.timeslot_date && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-700">
                            <ClockIcon className="h-3.5 w-3.5" />
                            {formatDate(b.timeslot_date)} · {formatClock(b.timeslot_start)} تا {formatClock(b.timeslot_end)}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="tabular font-bold text-ink-900">{formatTomans(b.price)}</p>
                        <p className="text-xs text-ink-500">{formatNumber(b.duration_minutes || 60)} دقیقه</p>
                      </div>
                      <ChevronDownIcon className={cn("h-5 w-5 shrink-0 text-ink-400 transition", expanded && "rotate-180")} />
                    </button>

                    {expanded && (
                      <div className="border-t border-line bg-canvas/40 px-4 pb-4 sm:px-5">
                        {b.check_in_code && canCancel(b) && (
                          <div className="my-4 flex flex-col items-center gap-1 rounded-2xl border border-dashed border-brand-300 bg-surface p-4 text-center">
                            <span className="text-xs text-ink-500">کد ورود — به پذیرش مجموعه نشان دهید</span>
                            <span dir="ltr" className="font-mono text-2xl font-bold tracking-[0.3em] text-brand-700">
                              {b.check_in_code}
                            </span>
                          </div>
                        )}
                        <dl className="divide-y divide-line">
                          <DetailRow label="شماره رزرو">#{formatNumber(b.id)}</DetailRow>
                          <DetailRow label="زمان ثبت">{formatDateTime(b.reserved_at)}</DetailRow>
                          {b.expires_at && canCancel(b) && (
                            <DetailRow label="مهلت استفاده">
                              <span className="text-amber-700">{timeLeft(b.expires_at)}</span>
                            </DetailRow>
                          )}
                          {b.checked_in_at && <DetailRow label="زمان ورود">{formatDateTime(b.checked_in_at)}</DetailRow>}
                          {b.cancelled_at && (
                            <DetailRow label="زمان لغو">
                              <span className="text-red-600">{formatDateTime(b.cancelled_at)}</span>
                            </DetailRow>
                          )}
                          <DetailRow label="کارمزد خدمات">{formatTomans(b.employee_commission || 0)}</DetailRow>
                        </dl>
                        {canCancel(b) && (
                          <div className="mt-3 flex justify-end">
                            <Button variant="soft-danger" size="sm" loading={busy === b.id} onClick={() => handleCancel(b)}>
                              لغو رزرو و بازگشت مبلغ
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
