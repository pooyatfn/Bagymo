"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [sheba, setSheba] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setSheba((user as any).sheba || "");
    api.get("/auth/profile/").then((r) => {
      setName(r.data.name || "");
      setSheba(r.data.sheba || "");
    }).catch(() => {});
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api.patch("/auth/profile/", { name, sheba });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || "خطا در ذخیره");
    }
    setLoading(false);
  };

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    employee: "کارمند",
    company_admin: "مدیر شرکت",
    venue_staff: "کارمند باشگاه",
    admin: "مدیر پلتفرم",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-lg font-bold text-emerald-700">باجم</Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-gray-500 hover:underline">داشبورد</Link>
            <button onClick={() => { logout(); router.push("/login"); }} className="text-sm text-red-500 hover:underline">خروج</button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">پروفایل</h1>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          {/* Read-only info */}
          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">شماره تلفن</span>
              <span className="font-medium text-gray-900">{user.phone_number}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">نقش</span>
              <span className="font-medium text-gray-900">{roleLabels[user.role] || user.role}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">بودجه باقیمانده</span>
              <span className="font-medium text-emerald-700">
                {new Intl.NumberFormat("fa-IR").format(user.remaining_budget)} تومان
              </span>
            </div>
          </div>

          <hr className="mb-6" />

          {/* Editable fields */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">نام</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">شماره شبا</label>
              <input
                type="text"
                value={sheba}
                onChange={(e) => setSheba(e.target.value)}
                placeholder="IR..."
                maxLength={26}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">برای دریافت وجه در صورت لغو رزرو</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
              {saved && (
                <span className="text-sm text-emerald-600 font-medium">ذخیره شد!</span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
