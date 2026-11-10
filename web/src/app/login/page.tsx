"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, Input, Tabs } from "@/components/ui";
import { ArrowLeftIcon, BuildingIcon, CheckCircleIcon, StoreIcon } from "@/components/icons";
import { apiErrorDetail } from "@/lib/errors";
import { formatNumber, toEnglishDigits } from "@/lib/format";
import { homePathFor, safeRedirect } from "@/lib/roles";
import type { User } from "@/lib/types";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

type Method = "phone" | "email";

function LoginInner() {
  const { user, loading: authLoading, login, verify, loginWithEmail } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const registered = params.get("registered");

  const [method, setMethod] = useState<Method>(params.get("tab") === "email" ? "email" : "phone");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // already signed in → go to the panel
  useEffect(() => {
    if (!authLoading && user) router.replace(redirect || homePathFor(user.role));
  }, [authLoading, user, redirect, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const go = (u: User) => router.replace(redirect || homePathFor(u.role));
  const normalizedPhone = toEnglishDigits(phone).replace(/\D/g, "");

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError("شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.");
      return;
    }
    setBusy(true);
    try {
      await login(normalizedPhone);
      setStep("otp");
      setCode("");
      setCooldown(120);
    } catch (err) {
      setError(apiErrorDetail(err, "ارسال کد ممکن نشد. دوباره تلاش کنید."));
    }
    setBusy(false);
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = toEnglishDigits(code).replace(/\D/g, "");
    if (c.length !== 6) {
      setError("کد تایید ۶ رقمی است.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { user: u } = await verify(normalizedPhone, c);
      go(u);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 403 ? "حساب سازمان شما هنوز توسط باجیمو تأیید نشده است." : "کد وارد شده نادرست یا منقضی است.");
      setBusy(false);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      go(await loginWithEmail(email.trim(), password));
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(
        status === 403 ? "حساب سازمان شما هنوز در انتظار تأیید است." : status === 401 ? "ایمیل یا رمز عبور نادرست است." : apiErrorDetail(err),
      );
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-ink-900">ورود به باجیمو</h1>
      <p className="mt-2 text-sm text-ink-500">کارکنان، مدیران سازمان و مجموعه‌ها از این‌جا وارد پنل خود می‌شوند.</p>

      {registered && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900">
          <CheckCircleIcon className="h-5 w-5 shrink-0 text-brand-600" />
          <p>
            {registered === "company"
              ? "ثبت سازمان انجام شد. پس از تأیید کارشناسان باجیمو، با ایمیل و رمز عبور وارد شوید."
              : "ثبت مجموعه انجام شد. پس از تأیید، با شماره موبایل مدیر مجموعه وارد شوید."}
          </p>
        </div>
      )}

      <Tabs
        className="mt-8"
        value={method}
        onChange={(m) => {
          setMethod(m);
          setError("");
        }}
        items={[
          { key: "phone", label: "شماره موبایل" },
          { key: "email", label: "ایمیل سازمانی" },
        ]}
      />

      <div className="mt-6">
        {method === "phone" && step === "phone" && (
          <form onSubmit={requestCode} className="space-y-5">
            <Input
              label="شماره موبایل"
              type="tel"
              inputMode="numeric"
              placeholder="09123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              autoFocus
              error={error || undefined}
            />
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              دریافت کد تایید
            </Button>
          </form>
        )}

        {method === "phone" && step === "otp" && (
          <form onSubmit={submitCode} className="space-y-5">
            <div className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3 text-sm">
              <span className="text-ink-500">
                کد به <b dir="ltr" className="text-ink-900">{phone}</b> پیامک شد
              </span>
              <button type="button" onClick={() => setStep("phone")} className="font-medium text-brand-700 hover:text-brand-800">
                ویرایش
              </button>
            </div>
            <div>
              <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-ink-700">
                کد تایید
              </label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(toEnglishDigits(e.target.value).replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="------"
                dir="ltr"
                autoFocus
                className="h-14 w-full rounded-xl border border-line bg-surface text-center font-mono text-2xl tracking-[0.6em] text-ink-900 shadow-sm placeholder:text-ink-400/50 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
              />
              {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full" loading={busy} disabled={code.length !== 6}>
              ورود
            </Button>
            <p className="text-center text-sm text-ink-500">
              {cooldown > 0 ? (
                <>ارسال مجدد کد تا {formatNumber(cooldown)} ثانیه دیگر</>
              ) : (
                <button type="button" onClick={() => requestCode()} className="font-medium text-brand-700 hover:text-brand-800">
                  ارسال مجدد کد
                </button>
              )}
            </p>
          </form>
        )}

        {method === "email" && (
          <form onSubmit={submitEmail} className="space-y-5">
            <Input label="ایمیل" type="email" placeholder="hr@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
            <Input
              label="رمز عبور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              error={error || undefined}
            />
            <Button type="submit" size="lg" className="w-full" loading={busy}>
              ورود
            </Button>
          </form>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <p className="mb-3 text-xs font-medium text-ink-500">حساب ندارید؟</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/company/register" className="group flex items-center gap-3 rounded-2xl border border-line p-3.5 transition hover:border-brand-300 hover:bg-brand-50/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <BuildingIcon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-medium text-ink-900">ثبت سازمان</span>
            <ArrowLeftIcon className="h-4 w-4 text-ink-400 transition group-hover:-translate-x-0.5" />
          </Link>
          <Link href="/venue/register" className="group flex items-center gap-3 rounded-2xl border border-line p-3.5 transition hover:border-brand-300 hover:bg-brand-50/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <StoreIcon className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-medium text-ink-900">ثبت مجموعه</span>
            <ArrowLeftIcon className="h-4 w-4 text-ink-400 transition group-hover:-translate-x-0.5" />
          </Link>
        </div>
        <p className="mt-4 text-xs leading-6 text-ink-500">کارکنان نیازی به ثبت‌نام ندارند؛ با شماره موبایلی که سازمان ثبت کرده وارد شوید.</p>
      </div>
    </AuthLayout>
  );
}
