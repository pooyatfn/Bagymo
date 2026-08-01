"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatTomans } from "@/lib/format";

interface BookingData {
  id: number;
  venue_name: string;
  offer_name: string;
  price: number;
  status: string;
  created_at?: string;
}

type AdminUserData = {
  user?: {
    id: number;
    name?: string;
    phone_number: string;
    role: string;
    gender?: string;
    annual_budget?: number;
    remaining_budget?: number;
    sheba?: string;
    company_name?: string;
  };
  bookings: BookingData[];
};

export default function AdminUserDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const userId = params.id;
  const [data, setData] = useState<AdminUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      if (!user || user.role !== "admin") return;
      setError(false);
      try {
        const r = await api.get(`/auth/admin/users/${userId}/`);
        setData(r.data as AdminUserData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [user, userId]);

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">دسترسی غیرمجاز</p>
      </div>
    );
  }

  const genderLabels: Record<string, string> = {
    male: "آقایان",
    female: "بانوان",
  };

  const roleLabels: Record<string, string> = {
    user: "کاربر",
    company_admin: "مدیر شرکت",
    company_hr: "منابع انسانی",
    venue_staff: "پرسنل باشگاه",
    admin: "مدیر سیستم",
  };

  return (
    <PageShell title="کاربر">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline"
      >
        بازگشت به پنل مدیریت
      </Link>

      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : error ? (
        <ErrorState onRetry={() => window.location.reload()} />
      ) : !data ? (
        <p className="text-center text-red-500 py-10">کاربر یافت نشد.</p>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              اطلاعات کاربر
            </h2>
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-gray-600">نام</p>
                <p className="font-medium text-gray-900">
                  {data.user?.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">تلفن</p>
                <p className="font-medium text-gray-900">
                  {data.user?.phone_number}
                </p>
              </div>
              <div>
                <p className="text-gray-600">جنسیت</p>
                <p className="font-medium text-gray-900">
                  {data?.user?.gender && genderLabels[data.user.gender] || "مختلط"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">نقش</p>
                <p className="font-medium text-gray-900">
                  {data?.user?.role ? roleLabels[data.user.role] || data.user.role : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-600">بودجه سالانه</p>
                <p className="font-medium text-gray-900">
                  {formatTomans(data.user?.annual_budget || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">بودجه باقیمانده</p>
                <p className="font-medium text-emerald-700">
                  {formatTomans(data.user?.remaining_budget || 0)}
                </p>
              </div>
               {data.user?.sheba && (
                <div className="sm:col-span-2">
                  <p className="text-gray-600">شماره شبا</p>
                  <p className="font-medium text-xs text-gray-900 font-mono">
                    {data.user?.sheba}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              رزروهای کاربر ({data.bookings.length})
            </h2>
            {data.bookings.length === 0 ? (
              <p className="text-sm text-gray-600">رزروی وجود ندارد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600">
                        مکان
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-600">
                        آفر
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-600">
                        مبلغ
                      </th>
                      <th className="px-3 py-2 font-medium text-gray-600">
                        وضعیت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.bookings.map((b: BookingData) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">
                          {b.venue_name}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {b.offer_name}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {formatTomans(b.price)}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageShell>
  );
}
