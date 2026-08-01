"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import {
  Button,
  Card,
  LoadingState,
  EmptyState,
  Modal,
} from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApi } from "@/lib/useApi";
import { formatTomans } from "@/lib/format";
import { Venue, Booking, AdminCompany } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = !!user && user.role === "admin";

  const pendingUrl = isAdmin ? "/catalog/pending-venues/" : null;
  const venuesUrl = isAdmin ? "/catalog/venues/" : null;
  const bookingsUrl = isAdmin ? "/billing/company-bookings/" : null;
  const companiesUrl = isAdmin ? "/catalog/admin-companies/" : null;
  const pendingCompaniesUrl = isAdmin ? "/catalog/pending-companies/" : null;

  const { data: pendingVenues, loading: pvLoading, refetch: pvRefetch } = useApi<Venue[]>(pendingUrl);
  const { data: venues, loading: vLoading, refetch: vRefetch } = useApi<Venue[]>(venuesUrl);
  const { data: bookings, loading: bLoading, refetch: bRefetch } = useApi<Booking[]>(bookingsUrl);
  const { data: companies, loading: cLoading, refetch: cRefetch } = useApi<AdminCompany[]>(companiesUrl);
  const { data: pendingCompanies, loading: pcLoading, refetch: pcRefetch } = useApi<any[]>(pendingCompaniesUrl);

  const refetchAll = () => {
    pvRefetch();
    vRefetch();
    bRefetch();
    cRefetch();
    pcRefetch();
  };

  const loading = pvLoading || vLoading || bLoading || cLoading || pcLoading;

  const [tab, setTab] = useState<"pending" | "venues" | "companies" | "bookings">("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [venueSearch, setVenueSearch] = useState("");
  const [venueStatusFilter, setVenueStatusFilter] = useState("all");
  const [venueCategoryFilter, setVenueCategoryFilter] = useState("all");
  const [showCompanyDetails, setShowCompanyDetails] = useState<any | null>(null);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/catalog/venues/${id}/approve/`);
      refetchAll();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا"));
    }
  };

  const handleApproveCompany = async (id: number) => {
    try {
      await api.post(`/catalog/companies/${id}/approve/`);
      refetchAll();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا"));
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await api.post(`/catalog/venues/${rejectId}/reject/`, {
        reason: rejectReason,
      });
      setRejectId(null);
      setRejectReason("");
      refetchAll();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا"));
    }
  };

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-500">دسترسی غیرمجاز</p>
      </div>
    );
  }

  const pendingList = pendingVenues || [];
  const pendingCompanyList = pendingCompanies || [];
  const venueList = venues || [];
  const bookingList = bookings || [];
  const companyList = companies || [];

  const totalRevenue = bookingList.reduce(
    (s, b) => s + (b.status !== "cancelled" ? b.price : 0),
    0
  );
  const platformMargin = Math.round(totalRevenue * 0.06);

  const categories = [
    ...new Set(
      venueList
        .map((v) => v.category_name || String(v.category))
        .filter(Boolean)
    ),
  ];

  const filteredVenues = venueList.filter((v) => {
    const matchesSearch =
      !venueSearch ||
      v.name?.includes(venueSearch) ||
      v.district?.includes(venueSearch);
    const matchesStatus =
      venueStatusFilter === "all" || v.status === venueStatusFilter;
    const matchesCategory =
      venueCategoryFilter === "all" ||
      (v.category_name || String(v.category)) === venueCategoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <PageShell title="پنل مدیریت">
      {loading ? (
        <LoadingState message="در حال بارگذاری..." />
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">در انتظار تایید</p>
              <p className="mt-1 text-xl font-bold text-amber-600">
                {pendingList.length}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">تعداد مکان‌ها</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {venueList.length}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">تعداد رزروها</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {bookingList.length}
              </p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-600">درآمد پلتفرم (۶٪)</p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {formatTomans(platformMargin)}
              </p>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "pending", label: `در انتظار تایید (${pendingList.length + pendingCompanyList.length})` },
              { key: "venues", label: `مکان‌ها (${venueList.length})` },
              { key: "companies", label: `شرکت‌ها (${companyList.length})` },
              { key: "bookings", label: "رزروها" },
            ].map((t) => (
              <Button
                key={t.key}
                variant={tab === t.key ? "primary" : "secondary"}
                size="sm"
                onClick={() => setTab(t.key as typeof tab)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {/* Pending Tab */}
          {tab === "pending" && (
            <Card className="p-0">
              {(pendingList.length === 0 && pendingCompanyList.length === 0) ? (
                <EmptyState
                  title="موردی در انتظار تایید نیست"
                  description="همه درخواست‌ها بررسی شده‌اند."
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {pendingList.length > 0 && (
                    <>
                      <div className="px-5 py-3 bg-amber-50 border-b border-gray-100 font-semibold text-amber-700">
                        مکان‌های در انتظار تایید ({pendingList.length})
                      </div>
                      <div className="divide-y divide-gray-100">
                        {pendingList.map((v) => (
                          <div
                            key={v.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5"
                          >
                            <div>
                              <h3 className="font-semibold text-gray-900">{v.name}</h3>
                              <p className="text-sm text-gray-600">
                                {v.category_name} · {v.district} · {v.city}
                              </p>
                              {v.address && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {v.address}
                                </p>
                              )}
                              {v.phone && (
                                <p className="text-xs text-gray-600">تلفن: {v.phone}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApprove(v.id)}
                              >
                                تایید
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRejectId(v.id)}
                              >
                                رد
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {pendingCompanyList.length > 0 && (
                    <>
                      <div className="px-5 py-3 bg-amber-50 border-b border-gray-100 font-semibold text-amber-700">
                        شرکت‌های در انتظار تایید ({pendingCompanyList.length})
                      </div>
                      <div className="divide-y divide-gray-100">
                        {pendingCompanyList.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5"
                          >
                            <div>
                              <h3 className="font-semibold text-gray-900">{c.name}</h3>
                              <p className="text-sm text-gray-600">
                                {c.domain || "بدون دامنه"}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                مدیر: {c.admin_name || "تعیین نشده"} · {c.admin_phone || "بدون تلفن"}
                              </p>
                              <p className="text-xs text-gray-600">
                                بودجه سالانه: {formatTomans(c.default_annual_budget)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApproveCompany(c.id)}
                              >
                                تایید
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setRejectId(c.id)}
                              >
                                رد
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Venues Tab */}
          {tab === "venues" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={venueSearch}
                  onChange={(e) => setVenueSearch(e.target.value)}
                  placeholder="جستجو بر اساس نام یا منطقه..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <select
                  value={venueStatusFilter}
                  onChange={(e) => setVenueStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="active">فعال</option>
                  <option value="pending">در انتظار</option>
                  <option value="suspended">غیرفعال</option>
                </select>
                <select
                  value={venueCategoryFilter}
                  onChange={(e) => setVenueCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="all">همه دسته‌ها</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Card className="overflow-hidden p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        نام
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        دسته
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        منطقه
                      </th>
                      <th className="px-4 py-3 font-medium text-gray-600">
                        وضعیت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredVenues.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {v.name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={v.category_name || String(v.category)} />
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {v.district} · {v.city}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={v.status} />
                        </td>
                      </tr>
                    ))}
                    {filteredVenues.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-600"
                        >
                          مکانی یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {/* Companies Tab */}
          {tab === "companies" && (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      نام شرکت
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      کارمندان
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      بودجه سالانه
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      تعداد رزرو
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      کل هزینه
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companyList.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setShowCompanyDetails(c)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-emerald-700 hover:underline">{c.name}</p>
                        {c.domain && (
                          <p className="text-xs text-gray-600">{c.domain}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {c.employee_count}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {formatTomans(c.default_annual_budget)}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {c.total_bookings}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatTomans(c.total_spent)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            c.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {c.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!c.is_active && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleApproveCompany(c.id); }}
                          >
                            فعال‌سازی
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {companyList.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-600"
                      >
                        شرکتی یافت نشد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}

          {/* Bookings Tab */}
          {tab === "bookings" && (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      کارمند
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      مکان
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      آفر
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      مبلغ
                    </th>
                    <th className="px-4 py-3 font-medium text-gray-600">
                      وضعیت
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookingList.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/user/${b.employee_id}`}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {b.employee_name || b.employee_phone}
                        </Link>
                        <p className="text-xs text-gray-600">
                          {b.employee_phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-emerald-700">
                          {b.venue_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {b.offer_name}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatTomans(b.price)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Reject Modal */}
          {rejectId && (
            <Modal
              open={!!rejectId}
              onClose={() => setRejectId(null)}
              title="رد مکان"
            >
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="دلیل رد (اختیاری)"
                className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setRejectId(null)}
                >
                  انصراف
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={handleReject}
                >
                  رد
                </Button>
              </div>
            </Modal>
          )}

          {/* Company Details Modal */}
          {showCompanyDetails && (
            <Modal
              open={!!showCompanyDetails}
              onClose={() => setShowCompanyDetails(null)}
              title={`جزئیات شرکت: ${showCompanyDetails.name}`}
            >
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-gray-600">نام شرکت</p>
                  <p className="font-medium text-gray-900">{showCompanyDetails.name}</p>
                </div>
                {showCompanyDetails.domain && (
                  <div>
                    <p className="text-xs text-gray-600">دامنه</p>
                    <p className="font-medium text-gray-900">{showCompanyDetails.domain}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">کارمندان</p>
                    <p className="font-medium text-gray-900">{showCompanyDetails.employee_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">تعداد رزرو</p>
                    <p className="font-medium text-gray-900">{showCompanyDetails.total_bookings}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">بودجه سالانه</p>
                    <p className="font-medium text-gray-900">{formatTomans(showCompanyDetails.default_annual_budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">کل هزینه</p>
                    <p className="font-medium text-gray-900">{formatTomans(showCompanyDetails.total_spent)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">وضعیت</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      showCompanyDetails.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {showCompanyDetails.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600">تاریخ ثبت</p>
                  <p className="font-medium text-gray-900">
                    {new Date(showCompanyDetails.created_at).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCompanyDetails(null)}
                >
                  بستن
                </Button>
              </div>
            </Modal>
          )}
        </div>
      )}
    </PageShell>
  );
}
