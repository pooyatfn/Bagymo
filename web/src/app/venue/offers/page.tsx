"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import {
  Button,
  Card,
  Input,
  Select,
  LoadingState,
  EmptyState,
} from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { formatTomans } from "@/lib/format";
import { Offer, TimeSlot } from "@/lib/types";
import { apiErrorDetail } from "@/lib/errors";

const EMPTY_FORM = {
  name: "",
  price: "",
  duration_minutes: "60",
  description: "",
  gender_restriction: "mixed",
};

type OfferForm = typeof EMPTY_FORM;

export default function VenueOffersPage() {
  const { user } = useAuth();
  const { data: offers, loading: loadingOffers, refetch } = useApi<Offer[]>(
    user ? "/catalog/venue-offers/" : null
  );
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);
  const [slotForm, setSlotForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    capacity: "10",
  });

  const loadSlots = async (offerId: number) => {
    const res = await api.get<TimeSlot[]>(`/catalog/offer-timeslots/${offerId}/`);
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
      setForm(EMPTY_FORM);
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(apiErrorDetail(err, "خطا در ایجاد آفر"));
    }
    setLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    setLoading(true);
    setError("");
    try {
      const price = parseInt(form.price);
      await api.patch(`/catalog/venue-offers/${editingOffer.id}/`, {
        name: form.name,
        price,
        venue_payout: Math.round(price * 0.94),
        duration_minutes: parseInt(form.duration_minutes),
        description: form.description,
        gender_restriction: form.gender_restriction,
      });
      setForm(EMPTY_FORM);
      setEditingOffer(null);
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(apiErrorDetail(err, "خطا در ویرایش آفر"));
    }
    setLoading(false);
  };

  const handleDelete = async (offerId: number) => {
    if (!confirm("آیا از حذف این آفر اطمینان دارید؟")) return;
    try {
      await api.delete(`/catalog/venue-offers/${offerId}/`);
      refetch();
    } catch (err) {
      alert(apiErrorDetail(err, "خطا در حذف آفر"));
    }
  };

  const startEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({
      name: offer.name,
      price: String(offer.price),
      duration_minutes: String(offer.duration_minutes),
      description: offer.description || "",
      gender_restriction: offer.gender_restriction,
    });
    setShowForm(true);
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
      setSlotForm({
        date: "",
        start_time: "",
        end_time: "",
        capacity: "10",
      });
      loadSlots(selectedOffer.id);
    } catch (err) {
      alert(apiErrorDetail(err, "خطا در ایجاد زمان‌بندی"));
    }
  };

  if (!user) return null;

  const list = offers || [];

  return (
    <PageShell
      title="آفرهای باشگاه"
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setEditingOffer(null);
            setForm(EMPTY_FORM);
          }}
        >
          + آفر جدید
        </Button>
      }
    >
      {loadingOffers ? (
        <LoadingState message="در حال بارگذاری آفرها..." />
      ) : (
        <>
          {(showForm || editingOffer) && (
            <form
              onSubmit={editingOffer ? handleEdit : handleCreate}
              className="mb-6 space-y-4"
            >
              <Card className="p-6">
                <h2 className="mb-4 font-semibold text-gray-900">
                  {editingOffer ? "ویرایش آفر" : "آفر جدید"}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="نام آفر *"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="مثلاً: دسترسی ۱ ساعته به باشگاه"
                      required
                    />
                  </div>
                  <Input
                    label="قیمت (تومان) *"
                    type="number"
                    min="1"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                  <Input
                    label="مدت (دقیقه)"
                    type="number"
                    min="15"
                    value={form.duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, duration_minutes: e.target.value })
                    }
                  />
                  <Select
                    label="محدودیت جنسیتی"
                    value={form.gender_restriction}
                    onChange={(e) =>
                      setForm({ ...form, gender_restriction: e.target.value })
                    }
                  >
                    <option value="mixed">مختلط</option>
                    <option value="male">فقط آقایان</option>
                    <option value="female">فقط خانم‌ها</option>
                  </Select>
                  <Input
                    label="توضیحات"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                {form.price && (
                  <p className="pt-2 text-sm text-gray-600">
                    پرداخت به باشگاه:{" "}
                    <span className="font-medium text-emerald-700">
                      {formatTomans(Math.round(parseInt(form.price) * 0.94))}
                    </span>{" "}
                    <span className="text-xs">(۳٪ کارمزد کارمند + ۳٪ کارمزد باشگاه)</span>
                  </p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                    setForm(EMPTY_FORM);
                  }}
                >
                  انصراف
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  {loading
                    ? "در حال ذخیره..."
                    : editingOffer
                    ? "ذخیره تغییرات"
                    : "ایجاد آفر"}
                </Button>
              </div>
            </form>
          )}

          {list.length === 0 ? (
            <EmptyState
              title="آفری وجود ندارد"
              description="آفر جدیدی بسازید تا در داشبورد نمایش داده شود."
              actionLabel="+ آفر جدید"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="space-y-3">
              {list.map((o) => (
                <Card key={o.id} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{o.name}</p>
                      <p className="text-sm text-gray-600">
                        {o.duration_minutes} دقیقه{" "}
                        {o.gender_restriction === "male"
                          ? "آقایان"
                          : o.gender_restriction === "female"
                          ? "بانوان"
                          : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-emerald-700">
                        {formatTomans(o.price)}
                      </p>
                      <p className="text-xs text-gray-600">
                        خالص پرداختی: {formatTomans(o.venue_payout)}
                      </p>
                      <div className="mt-1 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedOffer(
                              selectedOffer?.id === o.id ? null : o
                            );
                            loadSlots(o.id);
                          }}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          {selectedOffer?.id === o.id
                            ? "بستن زمان‌بندی"
                            : "زمان‌بندی"}
                        </button>
                        <button
                          onClick={() => startEdit(o)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedOffer?.id === o.id && (
                    <div className="mt-2 rounded-lg bg-gray-50 p-4 border border-gray-200">
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">
                        زمان‌بندی نوبت‌ها
                      </h3>
                      {timeslots.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {timeslots.map((s) => (
                            <div
                              key={s.id}
                              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                            >
                              <span className="text-gray-600">
                                {s.date} | {s.start_time} - {s.end_time}
                              </span>
                              <span
                                className={`font-medium ${s.is_available ? "text-emerald-600" : "text-red-500"}`}
                              >
                                {s.capacity === 0
                                  ? "نامحدود"
                                  : `${s.remaining} باقیمانده`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <form
                        onSubmit={handleCreateSlot}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <Input
                          label="تاریخ"
                          type="date"
                          value={slotForm.date}
                          onChange={(e) =>
                            setSlotForm({ ...slotForm, date: e.target.value })
                          }
                          required
                          className="max-w-[140px]"
                        />
                        <Input
                          label="شروع"
                          type="time"
                          value={slotForm.start_time}
                          onChange={(e) =>
                            setSlotForm({
                              ...slotForm,
                              start_time: e.target.value,
                            })
                          }
                          required
                          className="max-w-[130px]"
                        />
                        <Input
                          label="پایان"
                          type="time"
                          value={slotForm.end_time}
                          onChange={(e) =>
                            setSlotForm({
                              ...slotForm,
                              end_time: e.target.value,
                            })
                          }
                          required
                          className="max-w-[130px]"
                        />
                        <Input
                          label="ظرفیت"
                          type="number"
                          min="0"
                          value={slotForm.capacity}
                          onChange={(e) =>
                            setSlotForm({ ...slotForm, capacity: e.target.value })
                          }
                          required
                          className="max-w-[100px]"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          type="submit"
                          className="mb-[18px]"
                        >
                          افزودن
                        </Button>
                      </form>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
