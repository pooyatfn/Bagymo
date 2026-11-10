"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Badge, Button, Card, CardHeader, DashboardSkeleton, EmptyState, Progress, StatCard, StatusBadge } from "@/components/ui";
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon, MapPinIcon, StarIconSolid, TicketIcon, WalletIcon } from "@/components/icons";
import { categoryMeta } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { formatClock, formatDate, formatNumber, formatPercent, formatTomans, formatTomansShort, timeAgo } from "@/lib/format";
import type { Booking, Venue } from "@/lib/types";

const isActive = (b: Booking) => b.status === "reserved" || b.status === "paid";
const isDone = (b: Booking) => b.status === "checked_in" || b.status === "checkedin" || b.status === "completed";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: bookingsData, loading: bLoading } = useApi<Booking[]>(user ? "/bookings/" : null);
  const { data: venuesData, loading: vLoading } = useApi<Venue[]>("/catalog/venues/");

  if (!user) return <PageShell>{null}</PageShell>;

  const bookings = bookingsData || [];
  const active = bookings.filter(isActive);
  const done = bookings.filter(isDone);
  const venues = (venuesData || []).slice(0, 3);
  const used = Math.max(0, user.annual_budget - user.remaining_budget);
  const usedPct = user.annual_budget ? (used / user.annual_budget) * 100 : 0;
  const firstName = user.name?.split(" ")[0];

  return (
    <PageShell
      roles={["user"]}
      title={firstName ? `سلام ${firstName}، خوش آمدی 👋` : "خوش آمدید 👋"}
      subtitle="بودجه رفاهی‌ات را این‌جا ببین و برای ورزش و تفریح رزرو کن."
    >
      {bLoading && vLoading ? (
        <DashboardSkeleton stats={3} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          {/* main column */}
          <div className="min-w-0 space-y-6 xl:col-span-2">
            {/* Budget hero */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-[var(--shadow-pop)] sm:p-8">
              <div className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 start-1/3 h-48 w-48 rounded-full bg-brand-300/20 blur-2xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm text-white/80">
                    <WalletIcon className="h-4 w-4" /> بودجه باقی‌مانده امسال
                  </p>
                  <p className="tabular mt-2 text-3xl font-extrabold sm:text-4xl">{formatTomans(user.remaining_budget)}</p>
                  <p className="mt-2 text-sm text-white/75">
                    از {formatTomansShort(user.annual_budget)} بودجه سالانه · {formatTomansShort(used)} مصرف شده
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <div className="mb-2 flex justify-between text-xs text-white/80">
                    <span>میزان مصرف</span>
                    <span className="tabular">{formatPercent(usedPct)}</span>
                  </div>
                  <Progress value={usedPct} tone="white" label="میزان مصرف بودجه" />
                </div>
              </div>
              {user.annual_budget === 0 && (
                <p className="relative mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm">
                  هنوز بودجه‌ای برایتان تعریف نشده است. با مدیر منابع انسانی شرکت هماهنگ کنید.
                </p>
              )}
              {usedPct >= 80 && user.annual_budget > 0 && (
                <p className="relative mt-5 rounded-xl bg-amber-400/20 px-4 py-3 text-sm">بیش از ۸۰٪ بودجه سالانه را مصرف کرده‌اید.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              <StatCard label="رزروهای فعال" value={formatNumber(active.length)} icon={<TicketIcon />} tone="sky" />
              <StatCard label="بازدیدهای انجام‌شده" value={formatNumber(done.length)} icon={<CheckCircleIcon />} tone="brand" />
              <StatCard className="col-span-2 lg:col-span-1" label="مصرف تا امروز" value={formatTomansShort(used)} icon={<WalletIcon />} tone="amber" />
            </div>

            <Card p="none">
              <div className="p-5 pb-0">
                <CardHeader
                  title="فعالیت‌های اخیر"
                  action={
                    <Link href="/user/bookings" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                      همه رزروها <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                  }
                />
              </div>
              {bookings.length === 0 ? (
                <EmptyState
                  icon={<TicketIcon />}
                  title="هنوز رزروی ندارید"
                  description="اولین رزرو را از بین باشگاه‌ها، استخرها و سینماهای طرف قرارداد انجام دهید."
                  action={
                    <Button asChild variant="secondary">
                      <Link href="/user/discover">شروع کنید</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {bookings.slice(0, 6).map((b) => (
                    <li key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{b.offer_name || `رزرو #${b.id}`}</p>
                        <p className="truncate text-xs text-ink-500">
                          {b.venue_name} · {timeAgo(b.reserved_at)}
                        </p>
                      </div>
                      <StatusBadge status={b.status} />
                      <p className="tabular w-28 shrink-0 text-end text-sm font-semibold text-ink-900">{formatTomans(b.price)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* side column */}
          <div className="min-w-0 space-y-6">
            {/* Active reservations with check-in codes */}
            {active.length === 0 ? (
              <Card>
                <CardHeader title="رزروهای پیش رو" />
                <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
                  <p className="text-sm text-ink-500">رزرو فعالی ندارید.</p>
                  <Button asChild variant="secondary" size="sm" className="mt-3">
                    <Link href="/user/discover">رزرو کنید</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader title="رزروهای پیش رو" description="کد ورود را هنگام مراجعه به پذیرش مجموعه نشان دهید." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  {active.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-900">{b.venue_name}</p>
                        <p className="truncate text-sm text-ink-500">{b.offer_name}</p>
                        {b.timeslot_date && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-brand-700">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {formatDate(b.timeslot_date)} · {formatClock(b.timeslot_start)}
                          </p>
                        )}
                      </div>
                      {b.check_in_code && (
                        <div className="text-center">
                          <p className="text-[11px] text-ink-500">کد ورود</p>
                          <p
                            dir="ltr"
                            className="mt-0.5 rounded-xl bg-surface px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-brand-700 shadow-sm"
                          >
                            {b.check_in_code}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <Card>
              <CardHeader
                title="پیشنهاد برای شما"
                action={
                  <Link href="/user/discover" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                    بیشتر <ArrowLeftIcon className="h-4 w-4" />
                  </Link>
                }
              />
              {venues.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-500">فعلاً مجموعه‌ای ثبت نشده است.</p>
              ) : (
                <ul className="space-y-2">
                  {venues.map((v) => {
                    const cat = categoryMeta(v.category_slug, v.category_name);
                    const minPrice = v.offers?.length ? Math.min(...v.offers.map((o) => o.price)) : null;
                    return (
                      <li key={v.id}>
                        <Link href={`/venues/${v.id}`} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-canvas">
                          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5", cat.tint)}>
                            {cat.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink-900">{v.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-ink-500">
                              <MapPinIcon className="h-3 w-3" /> {v.district || v.city}
                              {v.avg_rating != null && (
                                <>
                                  <span className="mx-1 text-ink-400">·</span>
                                  <StarIconSolid className="h-3 w-3 text-amber-400" /> {formatNumber(v.avg_rating)}
                                </>
                              )}
                            </p>
                          </div>
                          {minPrice != null && (
                            <Badge variant="brand" size="sm">
                              از {formatTomansShort(minPrice)}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
