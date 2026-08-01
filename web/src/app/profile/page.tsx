"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { Button, Card, Input, Select } from "@/components/ui";
import { useApi } from "@/lib/useApi";
import { apiErrorDetail } from "@/lib/errors";

interface ProfileData {
  name: string;
  sheba: string | null;
  gender: "male" | "female" | null;
}

const roleLabels: Record<string, string> = {
  user: "کاربر",
  company_admin: "مدیر شرکت",
  company_hr: "منابع انسانی",
  venue_staff: "مدیر مجتمع",
  admin: "مدیر پلتفرم",
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { data: profile, loading: fetching } = useApi<ProfileData>(
    user ? "/auth/profile/" : null
  );
  const [name, setName] = useState("");
  const [sheba, setSheba] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

   if (!user) return null;

   const companyName = (user as { company_name?: string }).company_name;

  if (profile && !name) {
    setName(profile.name || "");
    setSheba(profile.sheba || "");
    setGender(profile.gender || "");
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError("");
    try {
      await api.patch("/auth/profile/", {
        name,
        sheba,
        gender: gender || null,
      });
      setSaved(true);
      refreshUser();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(apiErrorDetail(err, "خطا در ذخیره‌سازی"));
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <PageShell title="پروفایل">
      {fetching ? (
        <p className="text-center text-gray-600 py-8 text-sm">
          در حال بارگذاری پروفایل...
        </p>
      ) : (
        <Card className="p-6">
          <div className="mb-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">شماره تلفن</span>
              <span className="font-medium text-gray-900">{user.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">نقش</span>
              <span className="font-medium text-gray-900">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            {companyName && (
              <div className="flex justify-between">
                <span className="text-gray-600">شرکت</span>
                <span className="font-medium text-gray-900">{companyName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">بودجه باقیمانده</span>
              <span className="font-medium text-emerald-700">
                {new Intl.NumberFormat("fa-IR").format(user.remaining_budget)} تومان
              </span>
            </div>
          </div>

          <hr className="mb-6 border-gray-200" />

          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="نام"
              placeholder="نام خود را وارد کنید"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="شماره شبا"
              placeholder="IR..."
              maxLength={26}
              value={sheba}
              onChange={(e) => setSheba(e.target.value)}
              className="font-mono text-xs"
              dir="ltr"
              helper="برای دریافت وجه در صورت لغو رزرو"
            />
            <Select
              label="جنسیت"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              helper="برای نمایش باشگاه‌های مناسب جنسیت شما"
            >
              <option value="">انتخاب کنید</option>
              <option value="male">آقایان</option>
              <option value="female">بانوان</option>
            </Select>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                disabled={loading}
              >
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
              {saved && (
                <span className="text-sm font-medium text-emerald-600">
                  ذخیره شد!
                </span>
              )}
            </div>
          </form>
        </Card>
      )}
    </PageShell>
  );
}
