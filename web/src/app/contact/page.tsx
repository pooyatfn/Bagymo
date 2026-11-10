import type { Metadata } from "next";
import Link from "next/link";
import { SitePage } from "@/components/site/SitePage";
import { ContactForm } from "./ContactForm";
import { ArrowLeftIcon, BuildingIcon, InfoIcon, StoreIcon } from "@/components/icons";

export const metadata: Metadata = { title: "تماس با ما" };

// Optional public contact details; set them in the frontend build environment.
const EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
const PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE;

const SHORTCUTS = [
  { icon: <BuildingIcon />, title: "ثبت سازمان", text: "برای شروع همکاری لازم نیست پیام بدهید؛ فرم ثبت سازمان را پر کنید.", href: "/company/register" },
  { icon: <StoreIcon />, title: "ثبت مجموعه", text: "باشگاه، استخر یا سینمای خود را برای بررسی ثبت کنید.", href: "/venue/register" },
  { icon: <InfoIcon />, title: "سؤالات متداول", text: "شاید پاسخ پرسش شما از قبل آماده باشد.", href: "/faq" },
];

export default function ContactPage() {
  return (
    <SitePage eyebrow="ارتباط" title="تماس با ما" lead="پرسش، پیشنهاد یا درخواست همکاری دارید؟ پیام بگذارید تا با شما تماس بگیریم.">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8 lg:col-span-7">
          <h2 className="text-lg font-bold">ارسال پیام</h2>
          <p className="mt-1 text-sm text-ink-500">شماره موبایل یا ایمیل‌تان را بنویسید تا بتوانیم پاسخ بدهیم.</p>
          <ContactForm />
        </div>
        <div className="space-y-4 lg:col-span-5">
          {(EMAIL || PHONE) && (
            <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
              <h2 className="font-bold">راه‌های ارتباطی</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {PHONE && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-500">تلفن</dt>
                    <dd dir="ltr" className="font-medium">
                      <a href={`tel:${PHONE}`}>{PHONE}</a>
                    </dd>
                  </div>
                )}
                {EMAIL && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-500">ایمیل</dt>
                    <dd dir="ltr" className="font-medium">
                      <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
          {SHORTCUTS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-brand-300"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 [&>svg]:h-5 [&>svg]:w-5">{s.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold group-hover:text-brand-800">{s.title}</span>
                <span className="mt-1 block text-sm leading-6 text-ink-500">{s.text}</span>
              </span>
              <ArrowLeftIcon className="mt-1 h-4 w-4 text-ink-400" />
            </Link>
          ))}
        </div>
      </div>
    </SitePage>
  );
}
