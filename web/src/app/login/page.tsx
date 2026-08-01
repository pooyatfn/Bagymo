"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { SparklesIcon } from "@/components/icons";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const { login, verify, loginWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"phone" | "otp" | "email">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [selectedRole, setSelectedRole] = useState<"user" | "venue_staff" | "company_admin">("user");

  const roleLabels: Record<string, string> = {
    user: "کاربر",
    venue_staff: "مدیر مجتمع",
    company_admin: "مدیر شرکت",
  };

  useEffect(() => {
    if (phase !== "otp") return;
    if (resendCooldown === 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, resendCooldown]);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab === "email" && selectedRole === "user") setPhase("email");
  }, [searchParams, selectedRole]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره تلفن باید ۱۱ رقمی باشد و با ۰۹ شروع شود.");
      return;
    }
    setLoading(true);
    try {
      await login(phone);
      setPhase("otp");
      setResendCooldown(120);
      setError("");
    } catch {
      setError("ارسال کد با مشکل مواجه شد. شماره تلفن را بررسی کنید.");
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length < 4) {
      setError("کد تایید را کامل وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      await verify(phone, code);
      const redirect = searchParams?.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        const role = localStorage.getItem("role") || selectedRole;
        const paths: Record<string, string> = {
          user: "/user/dashboard",
          company_admin: "/company/dashboard",
          company_hr: "/company/dashboard",
          venue_staff: "/venue/dashboard",
          admin: "/admin",
        };
        router.push(paths[role] || "/user/dashboard");
      }
    } catch {
      setError("کد نامعتبر یا منقضی شده است.");
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@") || !password) {
      setError("ایمیل و رمز عبور را وارد کنید.");
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      const redirect = searchParams?.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else {
        const role = localStorage.getItem("role") || selectedRole;
        const paths: Record<string, string> = {
          user: "/user/dashboard",
          company_admin: "/company/dashboard",
          company_hr: "/company/dashboard",
          venue_staff: "/venue/dashboard",
          admin: "/admin",
        };
        router.push(paths[role] || "/user/dashboard");
      }
    } catch {
      setError("ورود با ایمیل و رمز عبور ناموفق بود.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await login(phone);
      setResendCooldown(120);
    } catch {
      setError("ارسال مجدد انجام نشد. دوباره تلاش کنید.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      <div className="w-full max-w-md">
        {/* Top branding bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-emerald-700">
            <SparklesIcon className="h-6 w-6" />
            <span>باجیمو</span>
          </Link>
           <div className="flex items-center gap-3 text-sm">
             {selectedRole === "venue_staff" && (
               <Link
                 href="/login?redirect=/venue/register"
                 className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
               >
                 ثبت باشگاه جدید
               </Link>
             )}
             {selectedRole === "company_admin" && (
               <Link
                 href="/company/register"
                 className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
               >
                 ثبت شرکت جدید
               </Link>
             )}
           </div>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200/50">
           <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">ورود</h1>
           <p className="mb-6 text-center text-sm text-gray-600">
             با شماره موبیل خود وارد حساب کاربری شوید.
           </p>

          {/* Role Selector */}
          <div className="mb-6 flex justify-center gap-1 rounded-lg bg-gray-100 p-1 text-xs font-medium">
            {(["user", "venue_staff", "company_admin"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  selectedRole === role
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {roleLabels[role]}
              </button>
            ))}
          </div>

          {searchParams?.get("registered") === "company" && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              شرکت شما ثبت شد. پس از تایید توسط ادمین، می‌توانید با این شماره وارد شوید.
            </div>
          )}

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-emerald-700 hover:underline">
              بازگشت به صفحه اصلی
            </Link>
          </div>

          {phase === "phone" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <Input
                label="شماره تلفن"
                type="tel"
                placeholder="0912 xxx 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                dir="ltr"
                required
              />
              <div className="mt-2 text-center text-sm">
                <button
                  type="button"
                  onClick={() => setPhase("email")}
                  className="text-emerald-700 hover:underline"
                >
                  ورود با ایمیل و رمز عبور
                </button>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                ارسال کد تایید
              </Button>
            </form>
          ) : phase === "email" ? (
             <form onSubmit={handleEmailLogin} className="space-y-4">
               <Input
                 label="ایمیل"
                 type="email"
                 placeholder="example@email.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email"
                 required
               />
               <Input
                 label="رمز عبور"
                 type="password"
                 placeholder="••••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password"
                 required
               />
               {error && <p className="text-sm text-red-600">{error}</p>}
               <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                 ورود
               </Button>
               <div className="text-center text-sm">
                 <button
                   type="button"
                   onClick={() => { setPhase("phone"); setEmail(""); setPassword(""); setError(""); }}
                   className="text-emerald-700 hover:underline"
                 >
                   بازگشت به ورود با کد تایید
                 </button>
               </div>
             </form>
           ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                کد تایید ارسال شد به <strong dir="ltr" className="text-gray-900">{phone}</strong>
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">کد تایید</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="کد ۶ رقمی"
                  dir="ltr"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-center text-base tracking-[0.3em] text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" variant="primary" size="md" loading={loading} className="w-full">
                تایید و ورود
              </Button>
              <div className="flex items-center justify-between text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setError("");
                    setPhase("phone");
                  }}
                  className="text-emerald-700 hover:underline"
                >
                  تغییر شماره تلفن
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-emerald-700 hover:underline disabled:cursor-wait disabled:opacity-60"
                >
                  {resendCooldown > 0
                    ? `ارسال مجدد (${resendCooldown}s)`
                    : "ارسال مجدد کد"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-600">
            <span>© {new Date().getFullYear()} باجیمو — پلتفرم سلامت سازمانی.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
