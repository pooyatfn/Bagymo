"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!user) return;
    api.get("/companies/dashboard/").then((r) => setDashboard(r.data)).catch(() => {});
    api.get("/companies/employees/").then((r) => setEmployees(r.data.results || r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !adjustAmount) return;
    setLoading(true);
    try {
      await api.post(`/companies/employees/${selectedEmp.id}/adjust/`, {
        type: adjustType,
        amount: parseInt(adjustAmount) * 10,
        reason: `تعدیل ${adjustType === "credit" ? "افزایش" : "کاهش"} توسط مدیر`,
      });
      setAdjustAmount("");
      setSelectedEmp(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در تعدیل بودجه");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">داشبورد شرکت</h1>

        {/* Summary Cards */}
        {dashboard && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow-sm text-center">
              <p className="text-sm text-gray-600">تعداد کارمندان</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard.employee_count}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm text-center">
              <p className="text-sm text-gray-600">بودجه کل</p>
              <p className="text-2xl font-bold text-emerald-700">{formatTomans(dashboard.total_annual_budget)}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm text-center">
              <p className="text-sm text-gray-600">مصرف شده</p>
              <p className="text-2xl font-bold text-amber-600">{formatTomans(dashboard.total_used)}</p>
            </div>
            <div className="rounded-xl bg-white p-5 shadow-sm text-center">
              <p className="text-sm text-gray-600">تعداد رزروها</p>
              <p className="text-2xl font-bold text-gray-900">{dashboard.total_bookings}</p>
            </div>
          </div>
        )}

        {/* Employee Table */}
        <h2 className="mb-3 text-lg font-semibold text-gray-900">کارمندان</h2>
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
              {employees.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.phone_number}</td>
                  <td className="px-4 py-3 text-gray-600">{e.name}</td>
                  <td className="px-4 py-3 font-medium text-emerald-700">{formatTomans(e.remaining_budget)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(e.usage_pct || 0, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{(e.usage_pct || 0).toFixed(1)}٪</span>
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

        {/* Adjust Modal */}
        {selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedEmp(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-lg font-bold text-gray-900">تعدیل بودجه — {selectedEmp.name}</h3>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div className="flex gap-2">
                  {(["credit", "debit"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAdjustType(t)}
                      className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${
                        adjustType === t
                          ? t === "credit" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t === "credit" ? "افزایش (+)" : "کاهش (-)"}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">مبلغ (تومان)</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="مثلاً ۵۰۰,۰۰۰"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    required
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedEmp(null)} className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-200">
                    انصراف
                  </button>
                  <button type="submit" disabled={loading || !adjustAmount} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                    {loading ? "در حال ذخیره..." : "تایید"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
