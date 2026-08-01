"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Button, Input, Card } from "@/components/ui";
import { SparklesIcon } from "@/components/icons";
import { apiErrorDetail } from "@/lib/errors";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    default_annual_budget: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/companies/register/", form);
      router.push("/login?registered=company");
    } catch (err: unknown) {
      setError(apiErrorDetail(err) || "خطا در ثبت شرکت.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
            <SparklesIcon className="h-6 w-6" />
            <span>باجیمو</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ورود
          </Link>
        </div>

        <Card className="p-8 shadow-xl ring-1 ring-gray-200/50">
          <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">ثبت شرکت جدید</h1>
          <p className="mb-6 text-center text-sm text-gray-600">
            شرکت خود را ثبت کنید و به بودجه سلامتی کارمندان خود دسترسی داشته باشید.
            <br />
            <span className="text-xs text-gray-500">پس از تایید توسط ادمین، می‌توانید وارد شوید.</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="نام شرکت"
              placeholder="مثال: شرکت فناوری نوین"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="ایمیل"
              type="email"
              placeholder="example@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="شماره تلفن (مدیر شرکت)"
              type="tel"
              placeholder="0912 xxx 0000"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              autoComplete="tel"
              dir="ltr"
              required
            />
            <Input
              label="رمز عبور"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
            />
            <Input
              label="بودجه سالانه پیش‌فرض (تومان)"
              type="number"
              placeholder="مثال: 8000000"
              value={form.default_annual_budget}
              onChange={(e) => setForm({ ...form, default_annual_budget: parseInt(e.target.value) || 0 })}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
              ثبت شرکت
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-600">
            <span>© {new Date().getFullYear()} باجیمو — پلتفرم سلامت سازمانی.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
