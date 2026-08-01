"use client";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/lib/useApi";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Button, Card, LoadingState } from "@/components/ui";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Booking, Venue } from "@/lib/types";
import { formatTomans } from "@/lib/format";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: bookingsData, loading: bookingsLoading } = useApi<Booking[]>("/bookings/");
  const { data: venuesData, loading: venuesLoading } = useApi<Venue[]>("/catalog/venues/");

  if (!user) return null;

  const bookings = bookingsData || [];
  const venues = (venuesData || []).slice(0, 3);
  const loading = bookingsLoading && venuesLoading;

  const consumedPct = user.annual_budget
    ? ((user.annual_budget - user.remaining_budget) / user.annual_budget) * 100
    : 0;

  return (
    <PageShell
      title="داشبورد کارمند"
      action={
        <Button variant="secondary" size="sm" asChild>
          <Link href="/employee/discover">کشف باشگاه‌ها</Link>
        </Button>
      }
    >
      {loading ? (
        <LoadingState message="در حال بارگذاری داشبورد..." />
      ) : (
        <div className="space-y-8">
          <Card className="p-6 sm:p-8">
            <h2 className="text-sm font-medium text-gray-600">بودجه باقیمانده</h2>
            <p className="mt-1 text-3xl font-bold text-emerald-700">
              {formatTomans(user.remaining_budget)}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              از {formatTomans(user.annual_budget)} سالانه — مصرف شده:{" "}
              {formatTomans(user.annual_budget - user.remaining_budget)}
            </p>
            <div className="mt-4 h-2.5 w-full rounded-full bg-gray-200">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(consumedPct, 100)}%` }}
              />
            </div>
            {consumedPct > 80 && (
              <p className="mt-2 text-sm text-amber-600">
                بیش از ۸۰٪ بودجه سالانه خود را مصرف کرده‌اید.
              </p>
            )}
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                رزروهای اخیر
              </h2>
              <Link
                href="/employee/bookings"
                className="text-sm text-emerald-600 hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            {bookings.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-gray-600">
                  هنوز رزروی ندارید. باشگاه‌ها را کشف کنید.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 5).map((b) => (
                  <Link
                    key={b.id}
                    href="/employee/bookings"
                    className="block rounded-lg bg-white p-4 shadow-sm transition hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {b.offer_name || `رزرو #${b.id}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {b.venue_name || ""} ·{" "}
                          <StatusBadge status={b.status} />
                        </p>
                        {b.reserved_at && (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {new Date(b.reserved_at).toLocaleDateString("fa-IR")} ساعت{" "}
                            {new Date(b.reserved_at).toLocaleTimeString("fa-IR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatTomans(b.price)}
                        </p>
                        {b.check_in_code &&
                          (b.status === "paid" || b.status === "reserved") && (
                            <p className="mt-0.5 font-mono text-xs text-emerald-600">
                              {b.check_in_code}
                            </p>
                          )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                باشگاه‌های نزدیک
              </h2>
              <Link
                href="/employee/discover"
                className="text-sm text-emerald-600 hover:underline"
              >
                مشاهده همه
              </Link>
            </div>
            {venues.length === 0 ? (
              <p className="text-sm text-gray-600">باشگاهی یافت نشد.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {venues.map((v) => (
                  <Card key={v.id} className="p-4">
                    <p className="font-medium text-gray-900">{v.name}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {v.category_name} · {v.district}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
