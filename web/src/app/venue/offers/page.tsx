"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Badge, Button, Card, EmptyState, Input, LoadingState, Modal, Select, Skeleton, Textarea, useConfirm, useToast } from "@/components/ui";
import { CalendarIcon, ClockIcon, PencilIcon, PlusIcon, TagIcon, TrashIcon } from "@/components/icons";
import { apiErrorDetail } from "@/lib/errors";
import { formatClock, formatDate, formatNumber, formatTomans, GENDER_LABELS, toEnglishDigits } from "@/lib/format";
import type { Offer, TimeSlot } from "@/lib/types";

/** Venue keeps 94% of the price; the rest is the platform margin. */
const VENUE_SHARE = 0.94;

const EMPTY_FORM = { name: "", price: "", duration_minutes: "60", description: "", gender_restriction: "mixed" };
type OfferForm = typeof EMPTY_FORM;

const toInt = (v: string) => Number(toEnglishDigits(v).replace(/[^\d]/g, "")) || 0;

export default function VenueOffersPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, loading, refetch } = useApi<Offer[]>(user ? "/catalog/venue-offers/" : null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState<OfferForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [slotsFor, setSlotsFor] = useState<Offer | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (o: Offer) => {
    setEditing(o);
    setForm({
      name: o.name,
      price: String(o.price),
      duration_minutes: String(o.duration_minutes),
      description: o.description || "",
      gender_restriction: o.gender_restriction,
    });
    setFormError("");
    setFormOpen(true);
  };

  const price = toInt(form.price);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || price <= 0) {
      setFormError("نام و قیمت خدمت را وارد کنید.");
      return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      name: form.name.trim(),
      price,
      venue_payout: Math.round(price * VENUE_SHARE),
      duration_minutes: toInt(form.duration_minutes) || 60,
      description: form.description,
      gender_restriction: form.gender_restriction,
    };
    try {
      if (editing) await api.patch(`/catalog/venue-offers/${editing.id}/`, payload);
      else await api.post("/catalog/venue-offers/", payload);
      toast.success(editing ? "خدمت ویرایش شد" : "خدمت جدید اضافه شد");
      setFormOpen(false);
      refetch();
    } catch (err) {
      setFormError(apiErrorDetail(err, "ذخیره انجام نشد"));
    }
    setSaving(false);
  };

  const remove = async (o: Offer) => {
    const ok = await confirm({
      title: "حذف خدمت",
      description: `«${o.name}» حذف شود؟ خدماتی که رزرو فعال دارند قابل حذف نیستند.`,
      confirmLabel: "حذف",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api.delete(`/catalog/venue-offers/${o.id}/`);
      toast.success("خدمت حذف شد");
      refetch();
    } catch (err) {
      toast.error("حذف ممکن نشد", apiErrorDetail(err));
    }
  };

  const list = data || [];

  return (
    <PageShell
      roles={["venue_staff"]}
      title="خدمات و سانس‌ها"
      subtitle="خدماتی که کارکنان شرکت‌ها می‌توانند رزرو کنند؛ برای هر خدمت سانس و ظرفیت تعریف کنید."
      action={
        <Button icon={<PlusIcon />} onClick={openCreate}>
          خدمت جدید
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TagIcon />}
            title="هنوز خدمتی تعریف نکرده‌اید"
            description="مثلاً «یک جلسه بدنسازی ۹۰ دقیقه‌ای» یا «بلیت سینما». پس از تعریف، در فهرست کارکنان شرکت‌ها نمایش داده می‌شود."
            action={
              <Button icon={<PlusIcon />} onClick={openCreate}>
                تعریف اولین خدمت
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((o) => (
            <Card key={o.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-ink-900">{o.name}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" /> {formatNumber(o.duration_minutes)} دقیقه
                    </span>
                    {o.gender_restriction !== "mixed" && <Badge size="sm">ویژه {GENDER_LABELS[o.gender_restriction]}</Badge>}
                    {o.is_active === false && <Badge size="sm" variant="warning">غیرفعال</Badge>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(o)} aria-label="ویرایش">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="soft-danger" size="icon" onClick={() => remove(o)} aria-label="حذف">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {o.description && <p className="mt-3 line-clamp-2 text-sm text-ink-500">{o.description}</p>}
              <div className="min-h-4 flex-1" />
              <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
                <div>
                  <p className="tabular text-lg font-bold text-ink-900">{formatTomans(o.price)}</p>
                  <p className="text-xs text-ink-500">سهم خالص شما: {formatTomans(o.venue_payout)}</p>
                </div>
                <Button variant="secondary" size="sm" icon={<CalendarIcon />} onClick={() => setSlotsFor(o)}>
                  سانس‌ها
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "ویرایش خدمت" : "خدمت جدید"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              انصراف
            </Button>
            <Button type="submit" form="offer-form" loading={saving}>
              {editing ? "ذخیره تغییرات" : "افزودن خدمت"}
            </Button>
          </>
        }
      >
        <form id="offer-form" onSubmit={save} className="space-y-4">
          <Input label="نام خدمت" placeholder="مثلاً: یک جلسه بدنسازی" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="قیمت برای کارمند"
              inputMode="numeric"
              suffix="تومان"
              value={price ? formatNumber(price) : form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              helper={price > 0 ? `سهم خالص شما: ${formatTomans(Math.round(price * VENUE_SHARE))}` : "۹۴٪ مبلغ سهم مجموعه است."}
              required
            />
            <Input
              label="مدت"
              inputMode="numeric"
              suffix="دقیقه"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
          </div>
          <Select label="مخصوص" value={form.gender_restriction} onChange={(e) => setForm({ ...form, gender_restriction: e.target.value })}>
            <option value="mixed">همه (مختلط)</option>
            <option value="male">آقایان</option>
            <option value="female">بانوان</option>
          </Select>
          <Textarea label="توضیحات" placeholder="امکانات، شرایط استفاده و…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          {formError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
        </form>
      </Modal>

      {slotsFor && <SlotsModal offer={slotsFor} onClose={() => setSlotsFor(null)} />}
    </PageShell>
  );
}

function SlotsModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const toast = useToast();
  const { data, loading, refetch } = useApi<TimeSlot[]>(`/catalog/offer-timeslots/${offer.id}/`);
  const [slot, setSlot] = useState({ date: "", start_time: "", end_time: "", capacity: "10" });
  const [saving, setSaving] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (slot.end_time && slot.start_time && slot.end_time <= slot.start_time) {
      toast.error("ساعت پایان باید بعد از ساعت شروع باشد");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/catalog/offer-timeslots/${offer.id}/`, { ...slot, capacity: toInt(slot.capacity) });
      toast.success("سانس اضافه شد");
      setSlot({ ...slot, start_time: "", end_time: "" });
      refetch();
    } catch (err) {
      toast.error("افزودن سانس ممکن نشد", apiErrorDetail(err));
    }
    setSaving(false);
  };

  const slots = data || [];

  return (
    <Modal open onClose={onClose} size="lg" title={`سانس‌های «${offer.name}»`} description="ظرفیت ۰ یعنی بدون محدودیت.">
      <form onSubmit={add} className="grid grid-cols-2 gap-3 rounded-2xl bg-canvas p-4 sm:grid-cols-5 sm:items-end">
        <div className="col-span-2">
          <Input label="تاریخ" type="date" value={slot.date} onChange={(e) => setSlot({ ...slot, date: e.target.value })} required />
        </div>
        <Input label="از ساعت" type="time" value={slot.start_time} onChange={(e) => setSlot({ ...slot, start_time: e.target.value })} required />
        <Input label="تا ساعت" type="time" value={slot.end_time} onChange={(e) => setSlot({ ...slot, end_time: e.target.value })} required />
        <Input label="ظرفیت" inputMode="numeric" value={slot.capacity} onChange={(e) => setSlot({ ...slot, capacity: e.target.value })} />
        <Button type="submit" loading={saving} icon={<PlusIcon />} className="col-span-2 sm:col-span-5 sm:justify-self-end">
          افزودن سانس
        </Button>
      </form>

      <div className="mt-5">
        {loading ? (
          <LoadingState className="py-8" />
        ) : slots.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-500">هنوز سانسی تعریف نشده است.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {slots.map((s) => {
              const full = s.capacity > 0 && s.booked_count >= s.capacity;
              return (
                <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-ink-900">
                    <CalendarIcon className="h-4 w-4 text-ink-400" />
                    {formatDate(s.date, { weekday: "short", month: "short", day: "numeric" })}
                    <span className="tabular text-ink-500">
                      {formatClock(s.start_time)}–{formatClock(s.end_time)}
                    </span>
                  </span>
                  <Badge size="sm" variant={full ? "error" : "brand"}>
                    {s.capacity === 0 ? `${formatNumber(s.booked_count)} رزرو · نامحدود` : `${formatNumber(s.booked_count)} از ${formatNumber(s.capacity)}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
