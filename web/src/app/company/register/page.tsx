"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, Input } from "@/components/ui";
import { apiErrorDetail } from "@/lib/errors";
import { formatNumber, toEnglishDigits } from "@/lib/format";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone_number: "", password: "", budget: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const budget = Number(toEnglishDigits(form.budget).replace(/\D/g, "")) || 0;
  const phone = toEnglishDigits(form.phone_number).replace(/\D/g, "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^09\d{9}$/.test(phone)) return setError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
    if (form.password.length < 8) return setError("رمز عبور باید حداقل ۸ کاراکتر باشد.");
    setLoading(true);
    try {
      await api.post("/companies/register/", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone_number: phone,
        password: form.password,
        default_annual_budget: budget,
      });
      router.push("/login?registered=company&tab=email");
    } catch (err) {
      setError(apiErrorDetail(err, "ثبت سازمان انجام نشد."));
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-ink-900">ثبت سازمان</h1>
      <p className="mt-2 text-sm leading-6 text-ink-500">
        پس از ثبت، کارشناسان باجیمو اطلاعات را بررسی و حساب شما را فعال می‌کنند. سپس می‌توانید کارکنان را اضافه و بودجه تعیین کنید.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Input label="نام سازمان" placeholder="مثلاً: شرکت فناوری نوین" value={form.name} onChange={set("name")} required />
        <Input label="ایمیل سازمانی" type="email" placeholder="hr@company.com" value={form.email} onChange={set("email")} autoComplete="email" required helper="برای ورود به پنل مدیریت سازمان استفاده می‌شود." />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="موبایل مدیر" type="tel" inputMode="numeric" placeholder="09123456789" value={form.phone_number} onChange={set("phone_number")} autoComplete="tel" required />
          <Input label="رمز عبور" type="password" placeholder="حداقل ۸ کاراکتر" value={form.password} onChange={set("password")} autoComplete="new-password" required />
        </div>
        <Input
          label="بودجه سالانه پیش‌فرض هر کارمند"
          inputMode="numeric"
          suffix="تومان"
          placeholder="مثلاً ۸٬۰۰۰٬۰۰۰"
          value={budget ? formatNumber(budget) : form.budget}
          onChange={set("budget")}
          helper="بعداً برای هر نفر قابل تغییر است."
        />
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          ثبت سازمان
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        قبلاً ثبت کرده‌اید؟{" "}
        <Link href="/login?tab=email" className="font-medium text-brand-700 hover:text-brand-800">
          ورود
        </Link>
      </p>
    </AuthLayout>
  );
}
