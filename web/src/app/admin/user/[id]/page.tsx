"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function AdminUserDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    api.get(`/auth/admin/users/${userId}/`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, userId]);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">دسترسی غیرمجاز</p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    reserved: "رزرو شده",
    paid: "پرداخت شده",
    checkedin: "ورود تایید شده",
    completed: "تکمیل شده",
    cancelled: "لغو شده",
    expired: "منقضی شده",
  };

  const genderLabels: Record<string, string> = {
    male: "آقایان",
    female: "بانوان",
  };

  const roleLabels: Record<string, string> = {
    employee: "کارمند",
    company_admin: "مدیر شرکت",
    venue_staff: "پرسنل باشگاه",
    admin: "مدیر سیستم",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
          بازگشت به پنل مدیریت
        </Link>

        {loading ? (
          <div className="text-center text-gray-600 py-12">در حال بارگذاری...</div>
        ) : !data ? (
          <div className="text-center text-red-500 py-12">کاربر یافت نشد.</div>
        ) : (
          <>
            {/* User Info */}
            <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
              <h2 className="mb-4 text-lg font-bold text-gray-900">اطلاعات کاربر</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">نام</p>
                  <p className="font-medium text-gray-900">{data.user.name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-600">تلفن</p>
                  <p className="font-medium text-gray-900">{data.user.phone_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">جنسیت</p>
                  <p className="font-medium text-gray-900">{genderLabels[data.user.gender] || "مختلط"}</p>
                </div>
                <div>
                  <p className="text-gray-600">نقش</p>
                  <p className="font-medium text-gray-900">{roleLabels[data.user.role] || data.user.role}</p>
                </div>
                <div>
                  <p className="text-gray-600">بودجه سالانه</p>
                  <p className="font-medium text-gray-900">{formatTomans(data.user.annual_budget || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">بودجه باقیمانده</p>
                  <p className="font-medium text-emerald-700">{formatTomans(data.user.remaining_budget || 0)}</p>
                </div>
                {data.user.sheba && (
                  <div className="col-span-2">
                    <p className="text-gray-600">شماره شبا</p>
                    <p className="font-medium text-gray-900 font-mono text-xs">{data.user.sheba}</p>
                  </div>
                )}
              </div>
            </div>

            {/* User Bookings */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">رزروهای کاربر ({data.bookings.length})</h2>
              {data.bookings.length === 0 ? (
                <p className="text-gray-600 text-sm">رزروی وجود ندارد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 font-medium text-gray-600">مکان</th>
                        <th className="px-3 py-2 font-medium text-gray-600">آفر</th>
                        <th className="px-3 py-2 font-medium text-gray-600">مبلغ</th>
                        <th className="px-3 py-2 font-medium text-gray-600">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.bookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900">{b.venue_name}</td>
                          <td className="px-3 py-2 text-gray-600">{b.offer_name}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{formatTomans(b.price)}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              b.status === "completed" || b.status === "checkedin" ? "bg-emerald-100 text-emerald-700" :
                              b.status === "cancelled" ? "bg-red-100 text-red-600" :
                              b.status === "expired" ? "bg-gray-100 text-gray-600" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
