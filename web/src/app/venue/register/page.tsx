"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import LocationPicker from "@/components/LocationPicker";
import { MapPinIcon } from "@/components/icons";
import { apiErrorDetail } from "@/lib/errors";
import type { VenueProfile } from "@/lib/types";

const CATEGORIES = [
  { slug: "gym", label: "باشگاه بدنسازی" },
  { slug: "pool", label: "استخر" },
  { slug: "cinema", label: "سینما" },
  { slug: "yoga", label: "یوگا" },
  { slug: "sport", label: "ورزشگاه" },
];

const DEFAULT_FORM = {
  name: "",
  category_slug: "gym",
  address: "",
  lat: "",
  lng: "",
  district: "",
  city: "Tehran",
  phone: "",
  gender_policy: "mixed",
  description: "",
};

type FormState = typeof DEFAULT_FORM;

export default function RegisterVenuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [existingVenue, setExistingVenue] = useState<VenueProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const userId = user?.id;

  // Allow public access for new venue registration, but require auth for updates
  useEffect(() => {
    if (!authLoading && !user && existingVenue) {
      router.replace("/login?redirect=/venue/register");
    }
  }, [user, authLoading, router, existingVenue]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!userId) return;
    api
      .get("/catalog/venue-profile/")
      .then((r) => {
        const v = r.data as VenueProfile;
        setExistingVenue(v);
        setForm({
          name: v.name,
          category_slug: v.category_slug || String(v.category),
          address: v.address || "",
          lat: v.lat ? String(v.lat) : "",
          lng: v.lng ? String(v.lng) : "",
          district: v.district || "",
          city: v.city || "Tehran",
          phone: v.phone || "",
          gender_policy: v.gender_policy || "mixed",
          description: v.description || "",
        });
        setFetching(false);
      })
      .catch(() => {
        setExistingVenue(null);
        setFetching(false);
      });
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (existingVenue) {
        await api.patch("/catalog/venue-profile/update/", {
          ...form,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null,
        });
        alert("پروفایل باشگاه به‌روزرسانی شد.");
      } else {
        await api.post("/catalog/register-venue/", {
          ...form,
          lat: form.lat ? parseFloat(form.lat) : null,
          lng: form.lng ? parseFloat(form.lng) : null,
        });
        alert("باشگاه شما ثبت شد و در انتظار تأیید ادمین است.");
        router.push("/venue/dashboard");
      }
    } catch (err) {
      setError(apiErrorDetail(err, "خطا در پردازش درخواست"));
    }
    setSubmitting(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("مرورگر شما موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({
          ...form,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        });
        setLocating(false);
      },
      () => {
        alert("دریافت موقعیت ناموفق بود.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <PageShell
      title={existingVenue ? "پروفایل باشگاه" : "ثبت باشگاه جدید"}
      subtitle={
        existingVenue
          ? "اطلاعات باشگاه خود را به‌روز کنید."
          : "اطلاعات باشگاه خود را وارد کنید تا در پلتفرم نمایش داده شود."
      }
    >
      {fetching ? (
        <p className="text-center text-gray-600 py-8 text-sm">
          در حال بارگذاری اطلاعات باشگاه...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="نام باشگاه *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="مثلاً: باشگاه آهنگ زندگی"
                  required
                />
              </div>
              <Select
                label="دسته‌بندی *"
                name="category_slug"
                value={form.category_slug}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </Select>
              <Input
                label="تلفن"
                name="phone"
                placeholder="021-..."
                value={form.phone}
                onChange={handleChange}
              />
              <Input
                label="محله"
                name="district"
                placeholder="مثلاً: ولیعصر"
                value={form.district}
                onChange={handleChange}
              />
              <Input
                label="شهر"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
              <div className="sm:col-span-2">
                <Input
                  label="آدرس"
                  name="address"
                  placeholder="آدرس کامل مکان"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="عرض جغرافیایی (lat)"
                name="lat"
                type="number"
                step="any"
                placeholder="35.6892"
                value={form.lat}
                onChange={handleChange}
              />
              <Input
                label="طول جغرافیایی (lng)"
                name="lng"
                type="number"
                step="any"
                placeholder="51.3890"
                value={form.lng}
                onChange={handleChange}
              />
            </div>

            <div className="rounded-lg border border-dashed border-gray-200 p-4">
              <p className="mb-2 text-xs font-medium text-gray-600">
                انتخاب موقعیت روی نقشه
              </p>
              <LocationPicker
                onPick={(lat, lng) =>
                  setForm({ ...form, lat: String(lat), lng: String(lng) })
                }
                initialCenter={
                  form.lat && form.lng
                    ? [parseFloat(form.lat), parseFloat(form.lng)]
                    : [35.6892, 51.389]
                }
                buttonText="انتخاب موقعیت از نقشه"
              />
              <div className="mt-3 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={useMyLocation}
                  loading={locating}
                  disabled={locating}
                  className="inline-flex items-center gap-1"
                >
                  <MapPinIcon className="h-4 w-4" />
                  {locating ? "در حال یافتن..." : "استفاده از GPS"}
                </Button>
              </div>
            </div>

            <Select
              label="سیاست جنسیتی"
              name="gender_policy"
              value={form.gender_policy}
              onChange={handleChange}
            >
              <option value="mixed">مختلط</option>
              <option value="male">فقط آقایان</option>
              <option value="female">فقط خانم‌ها</option>
            </Select>
            <Textarea
              label="توضیحات"
              name="description"
              placeholder="توضیح کوتاه درباره باشگاه..."
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              {submitting
                ? "در حال ثبت..."
                : existingVenue
                ? "به‌روزرسانی باشگاه"
                : "ثبت باشگاه"}
            </Button>
            {!existingVenue && (
              <Button
                variant="ghost"
                type="button"
                onClick={() => router.push("/venue/dashboard")}
              >
                صرف‌نظر
              </Button>
            )}
          </div>
        </form>
      )}
    </PageShell>
  );
}
