"use client";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Card, DetailRow, EmptyState, ErrorState, LoadingState, StatCard, StatusBadge } from "@/components/ui";
import { BuildingIcon, UserGroupIcon, WalletIcon } from "@/components/icons";
import { formatDate, formatNumber, formatTomans } from "@/lib/format";
import type { CompanyInfo } from "@/lib/types";

export default function CompanyInfoPage() {
  const { user } = useAuth();
  const { data: company, loading, error, refetch } = useApi<CompanyInfo & { status?: string }>(user ? "/catalog/company-info/" : null);

  return (
    <PageShell roles={["user"]} title="شرکت من" subtitle="اطلاعات سازمانی که بودجه رفاهی شما را تأمین می‌کند.">
      {loading ? (
        <LoadingState />
      ) : error || !company ? (
        <Card>
          {error && (error as { message?: string }).message?.includes("404") ? (
            <EmptyState icon={<BuildingIcon />} title="به شرکتی متصل نیستید" description="برای دریافت بودجه، مدیر منابع انسانی باید شما را به شرکت اضافه کند." />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <EmptyState icon={<BuildingIcon />} title="اطلاعات شرکت یافت نشد" />
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card p="lg" className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <BuildingIcon className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold text-ink-900">{company.name}</h2>
              <p className="text-sm text-ink-500">عضو باجیمو از {formatDate(company.created_at)}</p>
            </div>
            <StatusBadge status={company.is_active ? "active" : "inactive"} size="md" />
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="همکاران روی باجیمو" value={`${formatNumber(company.employee_count)} نفر`} icon={<UserGroupIcon />} tone="sky" />
            <StatCard label="بودجه پیش‌فرض سالانه" value={formatTomans(company.default_annual_budget)} icon={<WalletIcon />} />
          </div>
          <Card>
            <dl className="divide-y divide-line">
              <DetailRow label="بودجه سالانه شما">{formatTomans(user?.annual_budget)}</DetailRow>
              <DetailRow label="باقی‌مانده">
                <span className="text-brand-700">{formatTomans(user?.remaining_budget)}</span>
              </DetailRow>
            </dl>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
