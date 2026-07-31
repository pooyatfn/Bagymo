"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

function formatTomans(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n) + " تومان";
}

export default function VenueOffersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration_minutes: "60", description: "", gender_restriction: "mixed" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [timeslots, setTimeslots] = useState<any[]>([]);
  const [slotForm, setSlotForm] = useState({ date: "", start_time: "", end_time: "", capacity: "10" });

  const load = () => {
    if (!user) return;
    api.get("/catalog/venue-offers/").then((r) => setOffers(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [user?.id]);

  const loadSlots = async (offerId: number) => {
    const res = await api.get(`/catalog/offer-timeslots/${offerId}/`);
    setTimeslots(res.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const price = parseInt(form.price);
      await api.post("/catalog/venue-offers/", {
        name: form.name,
        price,
        venue_payout: Math.round(price * 0.94),
        duration_minutes: parseInt(form.duration_minutes),
        description: form.description,
        gender_restriction: form.gender_restriction,
      });
      setForm({ name: "", price: "", duration_minutes: "60", description: "", gender_restriction: "mixed" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "خطا در ایجاد آفر");
    }
    setLoading(false);
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;
    try {
      await api.post(`/catalog/offer-timeslots/${selectedOffer.id}/`, {
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: slotForm.end_time,
        capacity: parseInt(slotForm.capacity),
      });
      setSlotForm({ date: "", start_time: "", end_time: "", capacity: "10" });
      loadSlots(selectedOffer.id);
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در ایجاد زمان‌بندی");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجیمو — مدیریت آفرها</span>
          <div className="flex items-center gap-3">
            <a href="/venue/dashboard" className="text-sm text-gray-600 hover:underline hidden sm:inline">داشبورد</a>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">آفرهای باشگاه</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            + آفر جدید
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-900">آفر جدید</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">نام آفر *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  placeholder="مثلاً: دسترسی ۱ ساعته به باشگاه"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">قیمت (تومان) *</label>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} type="number" required min="1"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">مدت (دقیقه)</label>
                <input value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} type="number" min="15"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">محدودیت جنسیتی</label>
                <select value={form.gender_restriction} onChange={(e) => setForm({ ...form, gender_restriction: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                  <option value="mixed">مختلط</option>
                  <option value="male">فقط آقایان</option>
                  <option value="female">فقط خانم‌ها</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">توضیحات</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
              </div>
            </div>
            {form.price && (
              <p className="text-sm text-gray-600">
                پرداخت به باشگاه: <span className="font-medium text-emerald-700">{formatTomans(Math.round(parseInt(form.price) * 0.94))}</span>
                &nbsp;(۳٪ کارمزد کارمند + ۳٪ کارمزد باشگاه)
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600">انصراف</button>
              <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {loading ? "در حال ایجاد..." : "ایجاد آفر"}
              </button>
            </div>
          </form>
        )}

        {offers.length === 0 ? (
          <p className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm">هنوز آفری ندارید. آفر جدید ایجاد کنید.</p>
        ) : (
          <div className="space-y-3">
            {offers.map((o: any) => (
              <div key={o.id}>
                <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm">
                  <div>
                    <p className="font-medium text-gray-900">{o.name}</p>
                    <p className="text-sm text-gray-600">{o.duration_minutes} دقیقه &middot; {o.gender_restriction === "mixed" ? "مختلط" : o.gender_restriction === "male" ? "آقایان" : "خانم‌ها"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">{formatTomans(o.price)}</p>
                    <p className="text-xs text-gray-600">خالص پرداختی: {formatTomans(o.venue_payout)}</p>
                    <button onClick={() => { setSelectedOffer(selectedOffer?.id === o.id ? null : o); loadSlots(o.id); }}
                      className="mt-1 text-xs text-emerald-600 hover:underline">
                      {selectedOffer?.id === o.id ? "بستن زمان‌بندی" : "زمان‌بندی"}
                    </button>
                  </div>
                </div>

                {/* Timeslots for this offer */}
                {selectedOffer?.id === o.id && (
                  <div className="mt-2 rounded-xl bg-gray-50 p-4 border border-gray-200">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">زمان‌بندی نوبت‌ها</h3>
                    {timeslots.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {timeslots.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                            <span className="text-gray-600">{s.date} | {s.start_time} - {s.end_time}</span>
                            <span className={`font-medium ${s.is_available ? "text-emerald-600" : "text-red-500"}`}>
                              {s.capacity === 0 ? "نامحدود" : `${s.remaining} باقیمانده`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleCreateSlot} className="flex flex-wrap gap-2 items-end">
                      <div>
                        <label className="text-xs text-gray-600">تاریخ</label>
                        <input type="date" value={slotForm.date} onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })} required
                          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">شروع</label>
                        <input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })} required
                          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">پایان</label>
                        <input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })} required
                          className="block w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">ظرفیت</label>
                        <input type="number" value={slotForm.capacity} onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })} min="0"
                          className="block w-20 rounded border border-gray-300 px-2 py-1.5 text-sm" />
                      </div>
                      <button type="submit" className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                        افزودن
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
