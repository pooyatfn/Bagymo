"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Button, Card, CardHeader, DashboardSkeleton, EmptyState, StatCard, StatusBadge, Tabs } from "@/components/ui";
import { AlertTriangleIcon, BanknotesIcon, CheckCircleIcon, ClockIcon, QrIcon, TagIcon, TicketIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { apiErrorDetail } from "@/lib/errors";
import { formatClock, formatDate, formatNumber, formatTomans, formatTomansShort, timeAgo, toEnglishDigits } from "@/lib/format";
import type { Booking, CheckInResult } from "@/lib/types";

const isDone = (b: Booking) => ["checked_in", "checkedin", "completed"].includes(b.status);
const isWaiting = (b: Booking) => b.status === "reserved" || b.status === "paid";

export default function VenueDashboard() {
  const { user } = useAuth();
  const { data, loading, refetch } = useApi<Booking[]>(user ? "/bookings/" : null);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [tab, setTab] = useState<"waiting" | "done" | "all">("waiting");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = toEnglishDigits(code).trim().toUpperCase();
    if (!value) return;
    setChecking(true);
    setResult(null);
    try {
      // The API answers 200 with { ok: false } for unknown/used codes, so check `ok`.
      const res = await api.post<CheckInResult>("/bookings/verify-checkin/", { check_in_code: value });
      setResult({ ok: res.data.ok, msg: res.data.detail || (res.data.ok ? "ورود ثبت شد." : "کد نامعتبر است.") });
      if (res.data.ok) {
        setCode("");
        refetch();
      }
    } catch (err) {
      setResult({ ok: false, msg: apiErrorDetail(err, "خطا در بررسی کد") });
    }
    setChecking(false);
    inputRef.current?.focus();
  };

  const list = data || [];
  const done = list.filter(isDone);
  const waiting = list.filter(isWaiting);
  const earned = done.reduce((s, b) => s + (b.venue_net_payout || 0), 0);
  const today = new Date().toDateString();
  const todayCount = done.filter((b) => b.checked_in_at && new Date(b.checked_in_at).toDateString() === today).length;
  const shown = tab === "waiting" ? waiting : tab === "done" ? done : list;

  return (
    <PageShell
      roles={["venue_staff"]}
      title="پذیرش و داشبورد مجموعه"
      subtitle="کد ورود مهمان را وارد کنید تا مراجعه ثبت و در تسویه‌حساب شما لحاظ شود."
      action={
        <Button asChild variant="outline">
          <Link href="/venue/offers">
            <TagIcon className="h-4 w-4" /> مدیریت خدمات
          </Link>
        </Button>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="min-w-0 space-y-6 xl:col-span-2">
            {/* Check-in */}
            <Card p="lg" className="relative overflow-hidden border-brand-200 bg-gradient-to-l from-brand-50 to-surface">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                <div className="flex items-center gap-4 lg:w-80">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
                    <QrIcon className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-bold text-ink-900">ثبت ورود مهمان</h2>
                    <p className="text-sm text-ink-500">کد ۶ کاراکتری روی گوشی مهمان</p>
                  </div>
                </div>
                <form onSubmit={handleCheckIn} className="flex flex-1 flex-col gap-3 sm:flex-row">
                  <input
                    ref={inputRef}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setResult(null);
                    }}
                    placeholder="A1B2C3"
                    maxLength={12}
                    dir="ltr"
                    autoComplete="off"
                    aria-label="کد ورود"
                    className="h-12 flex-1 rounded-xl border border-line bg-surface px-4 text-center font-mono text-xl tracking-[0.35em] text-ink-900 shadow-sm placeholder:tracking-[0.35em] placeholder:text-ink-400/60 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
                  />
                  <Button type="submit" size="lg" loading={checking} disabled={!code.trim()}>
                    تایید ورود
                  </Button>
                </form>
              </div>
              {result && (
                <div
                  role="status"
                  className={cn(
                    "mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium",
                    result.ok ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700",
                  )}
                >
                  {result.ok ? <CheckCircleIcon className="h-5 w-5" /> : <AlertTriangleIcon className="h-5 w-5" />}
                  {result.msg}
                </div>
              )}
            </Card>

            <Card p="none">
              <div className="flex flex-col gap-3 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardHeader className="mb-0" title="رزروهای مجموعه" />
                <Tabs
                  value={tab}
                  onChange={setTab}
                  items={[
                    { key: "waiting", label: "در انتظار", count: waiting.length },
                    { key: "done", label: "ورود ثبت‌شده", count: done.length },
                    { key: "all", label: "همه", count: list.length },
                  ]}
                />
              </div>
              {shown.length === 0 ? (
                <EmptyState
                  icon={<TicketIcon />}
                  title={tab === "waiting" ? "رزرو در انتظاری ندارید" : "رزروی وجود ندارد"}
                  description="با تعریف خدمات و سانس‌ها، کارکنان شرکت‌های طرف قرارداد می‌توانند رزرو کنند."
                />
              ) : (
                <ul className="divide-y divide-line border-t border-line">
                  {shown.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-900">{b.offer_name || `رزرو #${b.id}`}</p>
                        <p className="truncate text-xs text-ink-500">
                          {b.timeslot_date ? `سانس ${formatDate(b.timeslot_date)} · ${formatClock(b.timeslot_start)}` : `ثبت ${timeAgo(b.reserved_at)}`}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                      <div className="w-32 text-end">
                        <p className="tabular text-sm font-semibold text-ink-900">{formatTomans(b.venue_net_payout ?? b.price)}</p>
                        <p className="text-[11px] text-ink-500">سهم خالص شما</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* side column */}
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="ورود امروز" value={formatNumber(todayCount)} icon={<CheckCircleIcon />} />
              <StatCard label="در انتظار مراجعه" value={formatNumber(waiting.length)} icon={<ClockIcon />} tone="amber" />
              <StatCard label="کل مراجعات" value={formatNumber(done.length)} icon={<TicketIcon />} tone="sky" />
              <StatCard label="درآمد خالص" value={formatTomansShort(earned)} icon={<BanknotesIcon />} tone="violet" />
            </div>

            <Card>
              <CardHeader title="راهنمای پذیرش" />
              <ol className="space-y-4">
                {[
                  ["کد را از مهمان بگیرید", "مهمان کد ۶ کاراکتری رزرو را در گوشی خود نشان می‌دهد."],
                  ["کد را وارد و تأیید کنید", "اگر کد معتبر و متعلق به مجموعه شما باشد، ورود ثبت می‌شود."],
                  ["تسویه خودکار", "سهم خالص شما به دوره تسویه جاری اضافه می‌شود."],
                ].map(([t, d], i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                      {formatNumber(i + 1)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{t}</p>
                      <p className="mt-0.5 text-xs leading-6 text-ink-500">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <Button asChild size="sm" variant="secondary">
                  <Link href="/venue/settlements">تسویه‌حساب</Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/venue/offers">خدمات و سانس‌ها</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
