"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login, verify } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(phone);
      setPhase("otp");
    } catch {
      setError("شماره تلفن نامعتبر است");
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { created } = await verify(phone, code);
      const role = localStorage.getItem("role");
      const paths: Record<string, string> = {
        employee: "/employee/dashboard",
        company_admin: "/company/dashboard",
        company_hr: "/company/dashboard",
        venue_staff: "/venue/dashboard",
        admin: "/admin",
      };
      router.push(paths[role || "employee"] || "/employee/dashboard");
    } catch {
      setError("کد نامعتبر است — کد توسعه را در ترمینال بررسی کنید");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="text-lg font-bold text-emerald-700">باجیمو</span>
          <div className="flex items-center gap-4">
            <Link href="/venue/register" className="text-sm text-emerald-600 hover:underline">ثبت باشگاه</Link>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-600">ورود</span>
          </div>
        </div>
      </nav>
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg mt-12">
        <h1 className="mb-1 text-center text-2xl font-bold text-emerald-700">باجیمو</h1>
        <p className="mb-6 text-center text-sm text-gray-600">پلتفرم سلامت سازمانی</p>

        {phase === "phone" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">شماره تلفن</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912xxx0000"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              کد به <strong>{phone}</strong> ارسال شد
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">کد تایید</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="کد ۶ رقمی"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "در حال تایید..." : "تایید و ورود"}
            </button>
            <button
              type="button"
              onClick={() => { setPhase("phone"); setCode(""); setError(""); }}
              className="w-full text-center text-sm text-emerald-600 hover:underline"
            >
              تغییر شماره تلفن
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-gray-600">
          حالت توسعه: کد OTP در خروجی سرور Django نمایش داده می‌شود
        </p>
      </div>
    </div>
  );
}
