"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon, BuildingIcon, CheckIcon, StoreIcon, UserIcon } from "@/components/icons";

/** Real screenshots of the three panels (web/public/screens, regenerate with the app running). */
const PANELS = [
  {
    key: "employee",
    tab: "کارمند",
    icon: <UserIcon />,
    title: "پنل کارمند",
    text: "بودجه باقی‌مانده، رزرو سانس و کد ورود؛ همه در یک صفحه.",
    points: ["جستجوی مجموعه‌ها در فهرست یا روی نقشه", "رزرو سانس و دریافت کد ورود", "لغو رزرو و بازگشت مبلغ به بودجه"],
    image: "/screens/employee.png",
    cta: { label: "ورود کارکنان", href: "/login" },
  },
  {
    key: "company",
    tab: "سازمان",
    icon: <BuildingIcon />,
    title: "پنل سازمان و منابع انسانی",
    text: "کارکنان را اضافه کنید، بودجه بدهید و مصرف را زیر نظر بگیرید.",
    points: ["افزودن کارمند با شماره موبایل", "افزایش، کاهش یا تعیین بودجه هر نفر", "گزارش مصرف، فاکتورها و ریز رزروها"],
    image: "/screens/company.png",
    cta: { label: "ثبت سازمان", href: "/company/register" },
  },
  {
    key: "venue",
    tab: "مجموعه",
    icon: <StoreIcon />,
    title: "پنل مجموعه ورزشی",
    text: "با وارد کردن کد مهمان، ورود ثبت و در تسویه لحاظ می‌شود.",
    points: ["ثبت ورود با کد ۶ کاراکتری", "تعریف خدمات، سانس‌ها و ظرفیت", "مشاهده درآمد و دوره‌های تسویه"],
    image: "/screens/venue.png",
    cta: { label: "ثبت مجموعه", href: "/venue/register" },
  },
] as const;

export function PanelsShowcase() {
  const [active, setActive] = useState<(typeof PANELS)[number]["key"]>("employee");
  const panel = PANELS.find((p) => p.key === active)!;

  return (
    <section id="panels" className="scroll-mt-28 overflow-hidden bg-brand-950 py-20 text-white">
      <div className="site-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-300">پنل‌های اختصاصی</p>
            <h2 className="mt-2 text-3xl font-bold">هر نقش، پنل مخصوص خودش</h2>
          </div>
          <div role="tablist" className="inline-flex self-start rounded-2xl bg-white/5 p-1.5 ring-1 ring-inset ring-white/10">
            {PANELS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={p.key === active}
                onClick={() => setActive(p.key)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition [&>svg]:h-4 [&>svg]:w-4",
                  p.key === active ? "bg-white text-brand-900 shadow" : "text-white/70 hover:text-white",
                )}
              >
                {p.icon}
                {p.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold">{panel.title}</h3>
            <p className="mt-3 text-sm leading-8 text-white/70">{panel.text}</p>
            <ul className="mt-6 space-y-3">
              {panel.points.map((pt) => (
                <li key={pt} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
            <Link href={panel.cta.href} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
              {panel.cta.label} <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="lg:col-span-8">
            {/* browser frame */}
            <div className="overflow-hidden rounded-2xl bg-white/5 shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3" dir="ltr">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ms-3 rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/50">bagymo.ir</span>
              </div>
              <Image
                key={panel.key}
                src={panel.image}
                alt={`نمایی از ${panel.title}`}
                width={1440}
                height={900}
                className="h-auto w-full animate-fade-in"
                sizes="(min-width: 1024px) 900px, 100vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
