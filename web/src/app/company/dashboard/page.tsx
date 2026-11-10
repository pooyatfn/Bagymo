"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  DashboardSkeleton,
  EmptyRow,
  ErrorState,
  fieldClass,
  Input,
  Modal,
  Progress,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useConfirm,
  useToast,
} from "@/components/ui";
import { ChartBarIcon, PlusIcon, SearchIcon, TicketIcon, TrashIcon, TrendingUpIcon, UserGroupIcon, WalletIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { COMPANY_ROLES } from "@/lib/roles";
import { apiErrorDetail } from "@/lib/errors";
import { formatNumber, formatPercent, formatTomans, formatTomansShort, toEnglishDigits } from "@/lib/format";
import type { CompanyDashboard, EmployeeRow } from "@/lib/types";

type AdjustMode = "credit" | "debit" | "set";

const MODES: { key: AdjustMode; label: string; hint: string }[] = [
  { key: "credit", label: "افزایش", hint: "مبلغ به بودجه سالانه و باقی‌مانده اضافه می‌شود." },
  { key: "debit", label: "کاهش", hint: "مبلغ از بودجه باقی‌مانده کم می‌شود." },
  { key: "set", label: "تعیین بودجه سالانه", hint: "بودجه سالانه و باقی‌مانده هر دو روی این مبلغ تنظیم می‌شوند." },
];

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const dash = useApi<CompanyDashboard>(user ? "/companies/dashboard/" : null);
  const emps = useApi<EmployeeRow[]>(user ? "/companies/employees/" : null);

  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<EmployeeRow | null>(null);
  const [mode, setMode] = useState<AdjustMode>("credit");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ phone: "", name: "", budget: "" });
  const [adding, setAdding] = useState(false);

  const reload = () => {
    dash.refetch();
    emps.refetch();
  };

  const openAdjust = (e: EmployeeRow) => {
    setTarget(e);
    setMode("credit");
    setAmount("");
  };

  const numericAmount = Number(toEnglishDigits(amount).replace(/[^\d]/g, "")) || 0;

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!target || numericAmount <= 0) return;
    setSaving(true);
    try {
      if (mode === "set") {
        await api.patch(`/companies/employees/${target.id}/`, { annual_budget: numericAmount });
      } else {
        await api.post(`/companies/employees/${target.id}/adjust/`, {
          type: mode,
          amount: numericAmount,
          description: `${mode === "credit" ? "افزایش" : "کاهش"} بودجه توسط ${user?.name || "مدیر شرکت"}`,
        });
      }
      toast.success("بودجه به‌روزرسانی شد", `${target.name || target.phone_number}`);
      setTarget(null);
      reload();
    } catch (err) {
      toast.error("تغییر بودجه انجام نشد", apiErrorDetail(err));
    }
    setSaving(false);
  };

  const newBudget = Number(toEnglishDigits(newEmp.budget).replace(/[^\d]/g, "")) || 0;

  const openAdd = () => {
    setNewEmp({ phone: "", name: "", budget: "" });
    setAddOpen(true);
  };

  const addEmployee = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAdding(true);
    try {
      await api.post("/companies/employees/", {
        phone_number: toEnglishDigits(newEmp.phone),
        name: newEmp.name.trim(),
        ...(newEmp.budget ? { annual_budget: newBudget } : {}),
      });
      toast.success("کارمند اضافه شد", "پیامک دعوت برای او ارسال شد.");
      setAddOpen(false);
      reload();
    } catch (err) {
      toast.error("افزودن انجام نشد", apiErrorDetail(err));
    }
    setAdding(false);
  };

  const removeEmployee = async (e: EmployeeRow) => {
    const ok = await confirm({
      title: "حذف از سازمان",
      description: `${e.name || e.phone_number} از سازمان حذف شود؟ بودجه باقی‌مانده او (${formatTomans(e.remaining_budget)}) صفر می‌شود.`,
      confirmLabel: "حذف",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/companies/employees/${e.id}/`);
      toast.success("کارمند از سازمان حذف شد");
      reload();
    } catch (err) {
      toast.error("حذف انجام نشد", apiErrorDetail(err));
    }
  };

  const d = dash.data;
  const list = emps.data || [];
  const q = query.trim();
  const shown = q ? list.filter((e) => e.name?.includes(q) || e.phone_number.includes(toEnglishDigits(q))) : list;
  const usedPct = d && d.total_annual_budget ? (d.total_used / d.total_annual_budget) * 100 : 0;
  const attention = list.filter((e) => (e.usage_pct ?? 0) >= 80).sort((a, b) => (b.usage_pct ?? 0) - (a.usage_pct ?? 0));

  return (
    <PageShell
      roles={COMPANY_ROLES}
      title={d?.company_name ? `داشبورد ${d.company_name}` : "داشبورد شرکت"}
      subtitle="بودجه رفاهی کارکنان را تعریف کنید و مصرف آن را زیر نظر داشته باشید."
      action={
        <>
          <Button asChild variant="outline">
            <Link href="/company/analytics">
              <ChartBarIcon className="h-4 w-4" /> گزارش کامل
            </Link>
          </Button>
          <Button icon={<PlusIcon />} onClick={openAdd}>
            افزودن کارمند
          </Button>
        </>
      }
    >
      {dash.loading || emps.loading ? (
        <DashboardSkeleton />
      ) : dash.error || emps.error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="کارکنان" value={formatNumber(d?.user_count ?? list.length)} icon={<UserGroupIcon />} tone="sky" />
            <StatCard label="بودجه تخصیص‌یافته" value={formatTomansShort(d?.total_annual_budget)} icon={<WalletIcon />} />
            <StatCard
              label="مصرف‌شده"
              value={formatTomansShort(d?.total_used)}
              hint={`${formatPercent(usedPct)} از کل بودجه`}
              icon={<TrendingUpIcon />}
              tone="amber"
            />
            <StatCard label="رزروها" value={formatNumber(d?.total_bookings)} icon={<TicketIcon />} tone="violet" />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-4">
            <Card p="none" className="xl:col-span-3">
              <div className="p-5 pb-4">
                <CardHeader
                  className="mb-0"
                  title="بودجه کارکنان"
                  description="برای افزایش، کاهش یا تعیین بودجه سالانه روی «مدیریت بودجه» بزنید."
                  action={
                    <div className="relative w-full sm:w-64">
                      <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="جستجوی نام یا شماره…"
                        className={cn(fieldClass(), "h-10 ps-9")}
                        aria-label="جستجوی کارمند"
                      />
                    </div>
                  }
                />
              </div>
              <Table>
                <THead>
                  <Th>کارمند</Th>
                  <Th>بودجه سالانه</Th>
                  <Th>باقی‌مانده</Th>
                  <Th className="w-48">مصرف</Th>
                  <Th className="text-end">
                    <span className="sr-only">عملیات</span>
                  </Th>
                </THead>
                <TBody>
                  {shown.length === 0 ? (
                    <EmptyRow colSpan={5}>
                      {q ? (
                        "کارمندی با این مشخصات پیدا نشد."
                      ) : (
                        <span className="flex flex-col items-center gap-3">
                          هنوز کارمندی اضافه نشده است.
                          <Button size="sm" icon={<PlusIcon />} onClick={openAdd}>
                            افزودن اولین کارمند
                          </Button>
                        </span>
                      )}
                    </EmptyRow>
                  ) : (
                    shown.map((e) => {
                      const pct = e.usage_pct ?? 0;
                      return (
                        <Tr key={e.id}>
                          <Td>
                            <div className="flex items-center gap-3">
                              <Avatar name={e.name || e.phone_number} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink-900">{e.name || "بدون نام"}</p>
                                <p className="tabular text-xs text-ink-500" dir="ltr" style={{ textAlign: "right" }}>
                                  {e.phone_number}
                                </p>
                              </div>
                            </div>
                          </Td>
                          <Td className="tabular">{formatTomans(e.annual_budget)}</Td>
                          <Td className="tabular font-medium text-ink-900">{formatTomans(e.remaining_budget)}</Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-1.5 flex-1" label="مصرف" />
                              <span className="tabular w-10 text-xs text-ink-500">{formatPercent(pct)}</span>
                            </div>
                          </Td>
                          <Td className="text-end">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="secondary" size="sm" onClick={() => openAdjust(e)}>
                                مدیریت بودجه
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-red-600"
                                onClick={() => removeEmployee(e)}
                                aria-label="حذف از سازمان"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </Td>
                        </Tr>
                      );
                    })
                  )}
                </TBody>
              </Table>
            </Card>

            {/* side column */}
            <div className="min-w-0 space-y-6">
              <Card>
                <CardHeader title="مصرف بودجه سازمان" />
                <div className="flex items-end justify-between">
                  <p className="tabular text-3xl font-extrabold text-ink-900">{formatPercent(usedPct)}</p>
                  <p className="text-xs text-ink-500">از کل بودجه مصرف شده</p>
                </div>
                <Progress value={usedPct} className="mt-3 h-2.5" label="مصرف بودجه سازمان" />
                <dl className="mt-4 divide-y divide-line text-sm">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-ink-500">تخصیص‌یافته</dt>
                    <dd className="tabular font-medium text-ink-900">{formatTomans(d?.total_annual_budget)}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-ink-500">مصرف‌شده</dt>
                    <dd className="tabular font-medium text-ink-900">{formatTomans(d?.total_used)}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-ink-500">باقی‌مانده</dt>
                    <dd className="tabular font-medium text-brand-700">{formatTomans(d?.total_remaining)}</dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <CardHeader title="نیاز به توجه" description="کارکنانی که بیش از ۸۰٪ بودجه را مصرف کرده‌اند" />
                {attention.length === 0 ? (
                  <p className="rounded-xl bg-canvas px-4 py-6 text-center text-sm text-ink-500">فعلاً موردی نیست.</p>
                ) : (
                  <ul className="space-y-1">
                    {attention.slice(0, 5).map((e) => (
                      <li key={e.id}>
                        <button onClick={() => openAdjust(e)} className="flex w-full items-center gap-3 rounded-xl p-2 text-start transition hover:bg-canvas">
                          <Avatar name={e.name || e.phone_number} size="sm" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{e.name || e.phone_number}</span>
                          <span className="tabular rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{formatPercent(e.usage_pct)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="bg-gradient-to-br from-brand-50 to-surface">
                <p className="text-sm font-semibold text-ink-900">گزارش دوره‌ای</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">روند هزینه، فعال‌ترین کارکنان و سهم هر مجموعه را ببینید.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/company/analytics">گزارش و تحلیل</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href="/company/invoices">فاکتورها</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="افزودن کارمند"
        description="کارمند با همین شماره موبایل وارد باجیمو می‌شود."
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" form="add-emp-form" loading={adding} disabled={!newEmp.phone}>
              افزودن
            </Button>
          </>
        }
      >
        <form id="add-emp-form" onSubmit={addEmployee} className="space-y-4">
          <Input
            label="شماره موبایل"
            type="tel"
            inputMode="numeric"
            placeholder="09123456789"
            value={newEmp.phone}
            onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
            required
            autoFocus
          />
          <Input label="نام و نام خانوادگی" value={newEmp.name} onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })} />
          <Input
            label="بودجه سالانه"
            inputMode="numeric"
            suffix="تومان"
            placeholder="پیش‌فرض سازمان"
            value={newBudget ? formatNumber(newBudget) : newEmp.budget}
            onChange={(e) => setNewEmp({ ...newEmp, budget: e.target.value })}
            helper="خالی بگذارید تا بودجه پیش‌فرض سازمان اعمال شود."
          />
        </form>
      </Modal>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        title="مدیریت بودجه"
        description={target ? `${target.name || target.phone_number} · باقی‌مانده فعلی ${formatTomans(target.remaining_budget)}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setTarget(null)}>
              انصراف
            </Button>
            <Button type="submit" form="adjust-form" variant={mode === "debit" ? "destructive" : "primary"} loading={saving} disabled={numericAmount <= 0}>
              ثبت تغییر
            </Button>
          </>
        }
      >
        <form id="adjust-form" onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100/80 p-1">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                aria-pressed={mode === m.key}
                className={cn(
                  "rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm",
                  mode === m.key ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Input
            label="مبلغ"
            inputMode="numeric"
            placeholder="مثلاً ۵۰۰٬۰۰۰"
            value={numericAmount ? formatNumber(numericAmount) : amount}
            onChange={(e) => setAmount(e.target.value)}
            suffix="تومان"
            helper={MODES.find((m) => m.key === mode)?.hint}
            autoFocus
          />
          {target && numericAmount > 0 && (
            <div className="rounded-xl bg-canvas px-4 py-3 text-sm text-ink-700">
              باقی‌مانده پس از تغییر:{" "}
              <b className="tabular">
                {formatTomans(
                  mode === "credit"
                    ? target.remaining_budget + numericAmount
                    : mode === "debit"
                      ? Math.max(0, target.remaining_budget - numericAmount)
                      : numericAmount,
                )}
              </b>
            </div>
          )}
        </form>
      </Modal>
    </PageShell>
  );
}
