"use client";
/**
 * Two modes:
 *  - signed out      → public registration of a new venue (creates the venue + manager account)
 *  - venue_staff     → edit the venue profile
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { AuthLayout } from "@/components/AuthLayout";
import { PageShell } from "@/components/PageShell";
import LocationPicker from "@/components/LocationPicker";
import { Button, Card, CardHeader, Input, LoadingState, Select, Textarea, useToast } from "@/components/ui";
import { CheckCircleIcon, MapPinIcon } from "@/components/icons";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { apiErrorDetail } from "@/lib/errors";
import { persianNumbers, toEnglishDigits } from "@/lib/format";
import type { Category, VenueProfile } from "@/lib/types";

const EMPTY = {
  name: "",
  category_slug: "gym",
  owner_name: "",
  manager_phone: "",
  phone: "",
  city: "تهران",
  district: "",
  address: "",
  lat: "",
  lng: "",
  gender_policy: "mixed",
  description: "",
};
type Form = typeof EMPTY;

export default function VenueRegisterPage() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingState fullScreen />;
  if (!user) return <PublicRegistration />;
  return <VenueProfileEditor />;
}

function useCategories() {
  const { data } = useApi<Category[]>("/catalog/categories/");
  return data?.length ? data.map((c) => ({ slug: c.slug, label: c.name_fa || c.name_en })) : CATEGORY_OPTIONS;
}

function PublicRegistration() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const mobile = toEnglishDigits(form.manager_phone).replace(/\D/g, "");
    if (!/^09\d{9}$/.test(mobile)) return setError("موبایل مدیر مجموعه باید ۱۱ رقم و با ۰۹ شروع شود.");
    setBusy(true);
    try {
      await api.post("/catalog/register-venue-public/", payload(form, { manager_phone: mobile }));
      router.push("/login?registered=venue");
    } catch (err) {
      setError(apiErrorDetail(err, "ثبت مجموعه انجام نشد."));
      setBusy(false);
    }
  };

  return (
    <AuthLayout wide>
      <h1 className="text-2xl font-bold text-ink-900">ثبت مجموعه ورزشی و تفریحی</h1>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        اطلاعات مجموعه را وارد کنید. پس از تأیید، با موبایل مدیر وارد پنل شوید، خدمات و سانس‌ها را تعریف کنید و مهمان سازمانی بپذیرید.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-6">
        <VenueFields form={form} setForm={setForm} isNew />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          ارسال برای بررسی
        </Button>
        <p className="text-center text-sm text-ink-500">
          قبلاً ثبت کرده‌اید؟{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
            ورود
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

function VenueProfileEditor() {
  const { data, loading, error } = useApi<VenueProfile & { status?: string; owner_name?: string | null }>("/catalog/venue-profile/");
  return (
    <PageShell roles={["venue_staff"]} title="پروفایل مجموعه" subtitle="این اطلاعات در صفحه مجموعه برای کارکنان سازمان‌ها نمایش داده می‌شود." maxWidth="lg">
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <Card>
          <p className="py-8 text-center text-sm text-ink-500">اطلاعات مجموعه دریافت نشد.</p>
        </Card>
      ) : (
        <ProfileForm
          pending={data.status === "pending"}
          initial={{
            ...EMPTY,
            name: data.name,
            category_slug: data.category_slug || "gym",
            owner_name: data.owner_name || "",
            phone: data.phone || "",
            city: data.city === "Tehran" ? "تهران" : data.city || "",
            district: data.district || "",
            address: data.address || "",
            lat: data.lat != null ? String(data.lat) : "",
            lng: data.lng != null ? String(data.lng) : "",
            gender_policy: data.gender_policy || "mixed",
            description: data.description || "",
          }}
        />
      )}
    </PageShell>
  );
}

function ProfileForm({ initial, pending }: { initial: Form; pending: boolean }) {
  const toast = useToast();
  const [form, setForm] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch("/catalog/venue-profile/update/", payload(form));
      toast.success("پروفایل مجموعه ذخیره شد");
    } catch (err) {
      toast.error("ذخیره انجام نشد", apiErrorDetail(err));
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {pending && <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">مجموعه شما در انتظار تأیید کارشناسان باجیمو است.</div>}
      <Card p="lg">
        <VenueFields form={form} setForm={setForm} />
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={busy} icon={<CheckCircleIcon />}>
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}

function payload(form: Form, extra: Record<string, unknown> = {}) {
  const { manager_phone: _mp, ...rest } = form;
  return {
    ...rest,
    phone: toEnglishDigits(form.phone),
    lat: form.lat ? parseFloat(form.lat) : null,
    lng: form.lng ? parseFloat(form.lng) : null,
    ...extra,
  };
}

function VenueFields({ form, setForm, isNew }: { form: Form; setForm: (f: Form) => void; isNew?: boolean }) {
  const categories = useCategories();
  const [locating, setLocating] = useState(false);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const gps = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setForm({ ...form, lat: String(p.coords.latitude), lng: String(p.coords.longitude) });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-8">
      <section>
        <CardHeader title="اطلاعات مجموعه" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="نام مجموعه" placeholder="مثلاً: باشگاه آرمان" value={form.name} onChange={set("name")} required />
          </div>
          <Select label="نوع مجموعه" value={form.category_slug} onChange={set("category_slug")} required>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </Select>
          <Select label="پذیرش" value={form.gender_policy} onChange={set("gender_policy")}>
            <option value="mixed">مختلط / سانس‌بندی</option>
            <option value="male">فقط آقایان</option>
            <option value="female">فقط بانوان</option>
          </Select>
          <div className="sm:col-span-2">
            <Textarea label="معرفی کوتاه" placeholder="امکانات، تجهیزات، ساعات کاری…" value={form.description} onChange={set("description")} rows={3} />
          </div>
        </div>
      </section>

      <section>
        <CardHeader title="مدیر و تماس" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="نام مدیر" value={form.owner_name} onChange={set("owner_name")} required={isNew} />
          {isNew && (
            <Input
              label="موبایل مدیر"
              type="tel"
              inputMode="numeric"
              placeholder="09123456789"
              value={form.manager_phone}
              onChange={set("manager_phone")}
              helper="ورود به پنل مجموعه با کد پیامکی به این شماره است."
              required
            />
          )}
          <Input label="تلفن مجموعه" type="tel" placeholder="021…" value={form.phone} onChange={set("phone")} />
        </div>
      </section>

      <section>
        <CardHeader title="نشانی" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="شهر" value={form.city} onChange={set("city")} />
          <Input label="محله / منطقه" placeholder="مثلاً: سعادت‌آباد" value={form.district} onChange={set("district")} />
          <div className="sm:col-span-2">
            <Input label="نشانی کامل" value={form.address} onChange={set("address")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <LocationPicker
              onPick={(lat, lng) => setForm({ ...form, lat: String(lat), lng: String(lng) })}
              initialCenter={form.lat && form.lng ? [parseFloat(form.lat), parseFloat(form.lng)] : undefined}
              buttonText={form.lat ? "تغییر موقعیت روی نقشه" : "انتخاب موقعیت روی نقشه"}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-ink-500">
                {form.lat && form.lng ? (
                  <span className="inline-flex items-center gap-1 text-brand-700">
                    <CheckCircleIcon className="h-4 w-4" /> موقعیت ثبت شد ({persianNumbers(`${parseFloat(form.lat).toFixed(4)}، ${parseFloat(form.lng).toFixed(4)}`)})
                  </span>
                ) : (
                  "ثبت موقعیت باعث نمایش مجموعه روی نقشه کارکنان می‌شود."
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={gps} loading={locating} icon={<MapPinIcon />}>
                موقعیت فعلی من
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
