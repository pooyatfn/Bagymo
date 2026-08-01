"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { Button, Card, Input, LoadingState, ErrorState, Modal } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { formatTomans } from "@/lib/format";
import { CompanyDashboard as CompanyDashboardData, EmployeeRow } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

export default function CompanyDashboardPage() {
  const { user } = useAuth();
  const { data: dashboard, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } =
    useApi<CompanyDashboardData>(user ? "/companies/dashboard/" : null);
  const {
    data: employees,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useApi<EmployeeRow[]>(user ? "/companies/employees/" : null);

  const loading = dashboardLoading || employeesLoading;
  const error = dashboardError || employeesError;

  const reload = () => {
    refetchDashboard();
    refetchEmployees();
  };

  const [selectedEmp, setSelectedEmp] = useState<EmployeeRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [saving, setSaving] = useState(false);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !adjustAmount) return;
    setSaving(true);
    try {
      await api.post(`/companies/employees/${selectedEmp.id}/adjust/`, {
        type: adjustType,
        amount: parseInt(adjustAmount) * 10,
        reason: `تعدیل ${adjustType === "credit" ? "افزایش" : "کاهش"} توسط مدیر`,
      });
      setAdjustAmount("");
      setSelectedEmp(null);
      reload();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا در تعدیل بودجه"));
    }
    setSaving(false);
  };

  if (!user) return null;

  const empList = employees || [];

  return (
    <PageShell title="داشبورد شرکت">
      {loading ? (
        <LoadingState message="در حال بارگذاری داشبورد..." />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="space-y-8">
          {dashboard && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="p-5 text-center">
                <p className="text-sm text-gray-600">تعداد کارمندان</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {dashboard.employee_count}
                </p>
              </Card>
              <Card className="p-5 text-center">
                <p className="text-sm text-gray-600">بودجه کل</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">
                  {formatTomans(dashboard.total_annual_budget)}
                </p>
              </Card>
              <Card className="p-5 text-center">
                <p className="text-sm text-gray-600">مصرف شده</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">
                  {formatTomans(dashboard.total_used)}
                </p>
              </Card>
              <Card className="p-5 text-center">
                <p className="text-sm text-gray-600">تعداد رزروها</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {dashboard.total_bookings}
                </p>
              </Card>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">کارمندان</h2>
            {empList.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-gray-600">کارمندی یافت نشد.</p>
              </Card>
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">تلفن</th>
                      <th className="px-4 py-3 font-medium text-gray-600">نام</th>
                      <th className="px-4 py-3 font-medium text-gray-600">بودجه باقیمانده</th>
                      <th className="px-4 py-3 font-medium text-gray-600">مصرف</th>
                      <th className="px-4 py-3 font-medium text-gray-600">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {empList.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {e.phone_number}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{e.name}</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">
                          {formatTomans(e.remaining_budget)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full bg-emerald-500"
                                style={{
                                  width: `${Math.min(e.usage_pct || 0, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {(e.usage_pct || 0).toFixed(1)}٪
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedEmp(e)}
                            className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            تعدیل بودجه
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {selectedEmp && (
            <Modal
              open={!!selectedEmp}
              onClose={() => setSelectedEmp(null)}
              title={`تعدیل بودجه — ${selectedEmp.name || selectedEmp.phone_number}`}
            >
              <form onSubmit={handleAdjust} className="space-y-4">
                <div className="flex gap-2">
                  {(["credit", "debit"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjustType(t)}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                        adjustType === t
                          ? t === "credit"
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t === "credit" ? "افزایش (+)" : "کاهش (-)"}
                    </button>
                  ))}
                </div>
                <Input
                  label="مبلغ (تومان)"
                  type="number"
                  min="1"
                  placeholder="مثلاً ۵۰۰,۰۰۰"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setSelectedEmp(null)}
                    className="flex-1"
                  >
                    انصراف
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    loading={saving}
                    disabled={saving || !adjustAmount}
                    className="flex-1"
                  >
                    {saving ? "در حال ذخیره..." : "تایید"}
                  </Button>
                </div>
              </form>
            </Modal>
          )}
        </div>
      )}
    </PageShell>
  );
}
