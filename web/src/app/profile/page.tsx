"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { PageShell } from "@/components/PageShell";
import { Avatar, Badge, Button, Card, CardHeader, DetailRow, Input, Select, useToast } from "@/components/ui";
import { apiErrorDetail } from "@/lib/errors";
import { formatDate, formatTomans } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { User } from "@/lib/types";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <PageShell title="پروفایل" subtitle="اطلاعات حساب کاربری و تنظیمات شخصی.">
      {user && <ProfileContent key={user.id} user={user} />}
    </PageShell>
  );
}

function ProfileContent({ user }: { user: User }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name || "");
  const [sheba, setSheba] = useState(user.sheba || "");
  const [gender, setGender] = useState<string>(user.gender || "");
  const [saving, setSaving] = useState(false);
  const [shebaError, setShebaError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = sheba.replace(/\s/g, "").toUpperCase();
    if (s && !/^IR\d{24}$/.test(s)) {
      setShebaError("شماره شبا باید با IR شروع شود و ۲۴ رقم داشته باشد.");
      return;
    }
    setShebaError("");
    setSaving(true);
    try {
      await api.patch("/auth/profile/", { name: name.trim(), sheba: s || null, gender: gender || null });
      await refreshUser();
      toast.success("پروفایل ذخیره شد");
    } catch (err) {
      toast.error("ذخیره انجام نشد", apiErrorDetail(err));
    }
    setSaving(false);
  };

  return (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2" p="lg">
            <div className="flex flex-col items-center text-center">
              <Avatar name={user.name || user.phone_number} size="lg" className="h-16 w-16 text-2xl" />
              <h2 className="mt-3 font-bold text-ink-900">{user.name || "بدون نام"}</h2>
              <Badge variant="brand" className="mt-2">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>
            <dl className="mt-6 divide-y divide-line border-t border-line">
              <DetailRow label="موبایل">
                <span dir="ltr">{user.phone_number}</span>
              </DetailRow>
              {user.email && <DetailRow label="ایمیل">{user.email}</DetailRow>}
              {user.company_name && <DetailRow label="سازمان">{user.company_name}</DetailRow>}
              {user.role === "user" && <DetailRow label="بودجه باقی‌مانده">{formatTomans(user.remaining_budget)}</DetailRow>}
              <DetailRow label="عضویت از">{formatDate(user.created_at)}</DetailRow>
            </dl>
          </Card>

          <Card className="lg:col-span-3" p="lg">
            <CardHeader title="ویرایش اطلاعات" />
            <form onSubmit={save} className="space-y-5">
              <Input label="نام و نام خانوادگی" placeholder="مثلاً: سارا محمدی" value={name} onChange={(e) => setName(e.target.value)} />
              {user.role === "user" && (
                <Select
                  label="جنسیت"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  helper="برای نمایش مجموعه‌ها و سانس‌های مناسب شما استفاده می‌شود."
                >
                  <option value="">ترجیح می‌دهم نگویم</option>
                  <option value="male">آقا</option>
                  <option value="female">خانم</option>
                </Select>
              )}
              <Input
                label="شماره شبا"
                placeholder="IR000000000000000000000000"
                maxLength={26}
                value={sheba}
                onChange={(e) => setSheba(e.target.value.toUpperCase())}
                dir="ltr"
                className="font-mono text-sm"
                error={shebaError || undefined}
                helper={user.role === "venue_staff" ? "برای واریز تسویه‌حساب مجموعه." : "اختیاری؛ برای بازپرداخت‌ها."}
              />
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>
                  ذخیره تغییرات
                </Button>
              </div>
            </form>
          </Card>
        </div>
  );
}
