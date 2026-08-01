"use client";
import { useAuth } from "@/lib/auth";
import { PageShell } from "@/components/PageShell";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import { formatTomans } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import { CompanyInfo } from "@/lib/types";

export default function CompanyInfoPage() {
  const { user } = useAuth();
  const { data: company, loading, error, refetch } = useApi<CompanyInfo>(
    user ? "/catalog/company-info/" : null
  );

  if (!user) return null;

  return (
    <PageShell title="شرکت من">
      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !company ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">اطلاعات شرکت یافت نشد.</p>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">نام شرکت</span>
            <span className="font-medium text-gray-900">{company.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">تعداد کارمندان</span>
            <span className="font-medium text-gray-900">
              {company.employee_count} نفر
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">بودجه سالانه پیش‌فرض</span>
            <span className="font-medium text-emerald-700">
              {formatTomans(company.default_annual_budget)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">وضعیت</span>
            <span
              className={`font-medium ${company.is_active ? "text-emerald-700" : "text-red-600"}`}
            >
              {company.is_active ? "فعال" : "غیرفعال"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">تاریخ عضویت</span>
            <span className="font-medium text-gray-900">
              {new Date(company.created_at).toLocaleDateString("fa-IR")}
            </span>
          </div>
        </Card>
      )}
    </PageShell>
  );
}
