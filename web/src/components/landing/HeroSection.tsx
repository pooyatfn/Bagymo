"use client";
import Link from "next/link";
import { Button } from "@/components/ui";
import { SparklesIcon, MapPinIcon, WalletIcon } from "../icons";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="absolute inset-0 -z-10">
        <svg
          className="absolute -top-32 -right-32 h-72 w-72 -rotate-15 opacity-15"
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle cx="50" cy="50" r="40" fill="currentColor" color="#059669" />
          <path d="M50 15a35 35 0 100 70 35 35 0 000-70z" fill="none" stroke="#059669" strokeWidth="2" />
        </svg>
        <svg
          className="absolute -bottom-24 -left-24 h-56 w-56 opacity-10"
          viewBox="0 0 100 100"
          fill="none"
        >
          <rect x="20" y="20" width="60" height="60" rx="12" fill="#059669" />
        </svg>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_theme(colors.emerald.100/40),transparent_60%)]" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:py-20 md:py-24 sm:px-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10">
            <SparklesIcon className="h-4 w-4" />
            <span>پلتفرم سلامت و فیتنس سازمانی</span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl leading-snug">
            بودجه سلامت شرکتی شما،{" "}
            <span className="text-emerald-700">به یک باشگاه، استخر یا سینما تبدیل می‌شود.</span>
          </h1>

          <p className="max-w-lg text-base text-gray-600">
            باجیمو با ارائه بودجه سلامت برای کارمندان، دسترسی آسان به شبکه باشگاه‌های برتر، استخرها و سینماهای شهر را فراهم می‌کند. رزرو آنلاین، ورود QR و تسویه حساب شفاف — همه در یک پلتفرم.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button variant="primary" size="lg" asChild>
              <Link href="/login">ورود و شروع کنید</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/venue/register" className="inline-flex items-center gap-2">
                <MapPinIcon className="h-4 w-4" />
                <span>ثبت باشگاه جدید</span>
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="relative mx-auto h-96 w-full max-w-md">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-6 shadow-xl w-72">
              <p className="text-center text-xs text-gray-600 mb-3">کد ورود ماهانه</p>
              <div className="font-mono text-center text-3xl font-bold text-emerald-700 tracking-[0.3em] py-3">
                8 4 2 1 9 7
              </div>
              <div className="mt-3 flex justify-center">
                <WalletIcon className="h-5 w-5 text-emerald-600" />
                <span className="mr-1 text-xs text-gray-600">بقیه موجودی: ۲٬۴۵۰٬۰۰۰ تومان</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 -z-10">
              <svg viewBox="0 0 400 200" className="h-56 w-full opacity-40">
                <rect x="40" y="40" width="320" height="120" rx="20" fill="none" stroke="#059669" strokeWidth="1.5" />
                <circle cx="120" cy="90" r="6" fill="#059669" />
                <circle cx="200" cy="90" r="6" fill="#059669" />
                <circle cx="280" cy="90" r="6" fill="#059669" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
