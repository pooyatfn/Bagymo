"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "gym", label: "باشگاه بدنسازی" },
  { slug: "pool", label: "استخر" },
  { slug: "cinema", label: "سینما" },
  { slug: "yoga", label: "یوگا" },
  { slug: "sport", label: "ورزشگاه" },
];

export default function RegisterVenuePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", category_slug: "gym", address: "", lat: "", lng: "",
    district: "", city: "Tehran", phone: "", gender_policy: "mixed", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      };
      await api.post("/catalog/register-venue/", payload);
      router.push("/venue/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || "خطا در ثبت باشگاه");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجیمو</span>
          <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">ثبت باشگاه</h1>
        <p className="mb-6 text-sm text-gray-600">اطلاعات باشگاه خود را وارد کنید تا در پلتفرم نمایش داده شود.</p>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">نام باشگاه *</label>
              <input name="name" value={form.name} onChange={handleChange} required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">دسته‌بندی *</label>
              <select name="category_slug" value={form.category_slug} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">تلفن</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="021-..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">محله</label>
              <input name="district" value={form.district} onChange={handleChange} placeholder="مثلاً: ولیعصر"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">شهر</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">آدرس</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">عرض جغرافیایی (lat)</label>
              <input name="lat" value={form.lat} onChange={handleChange} type="number" step="any" placeholder="35.6892"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">طول جغرافیایی (lng)</label>
              <input name="lng" value={form.lng} onChange={handleChange} type="number" step="any" placeholder="51.3890"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">سیاست جنسیتی</label>
              <select name="gender_policy" value={form.gender_policy} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none">
                <option value="mixed">مختلط</option>
                <option value="male">فقط آقایان</option>
                <option value="female">فقط خانم‌ها</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">توضیحات</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none" />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "در حال ثبت..." : "ثبت باشگاه"}
          </button>
        </form>
      </main>
    </div>
  );
}
