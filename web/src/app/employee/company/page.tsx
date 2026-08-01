"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function CompanyInfoPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get("/catalog/company-info/")
      .then((r) => setCompany(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">شرکت من</h1>

        {loading ? (
          <p className="text-gray-600 text-center py-8">در حال بارگذاری...</p>
        ) : !company ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-600">اطلاعات شرکت یافت نشد.</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">نام شرکت</span>
              <span className="font-medium text-gray-900">{company.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">تعداد کارمندان</span>
              <span className="font-medium text-gray-900">{company.employee_count} نفر</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">بودجه سالانه پیش‌فرض</span>
              <span className="font-medium text-emerald-700">{formatTomans(company.default_annual_budget)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">وضعیت</span>
              <span className={`font-medium ${company.is_active ? "text-emerald-700" : "text-red-600"}`}>
                {company.is_active ? "فعال" : "غیرفعال"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">تاریخ عضویت</span>
              <span className="font-medium text-gray-900">
                {new Date(company.created_at).toLocaleDateString("fa-IR")}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
