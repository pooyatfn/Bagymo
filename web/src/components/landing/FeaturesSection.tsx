import { ReactNode } from "react";
import { features } from "@/lib/landingData";
import { ChartBarIcon, ClockIcon, QrIcon, RefreshIcon, StoreIcon, WalletIcon } from "@/components/icons";

const iconMap: Record<string, ReactNode> = {
  wallet: <WalletIcon />,
  building: <StoreIcon />,
  qr: <QrIcon />,
  clock: <ClockIcon />,
  shield: <RefreshIcon />,
  chart: <ChartBarIcon />,
};

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-28 border-y border-line/70 bg-canvas/60 py-20">
      <div className="site-container">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold text-brand-700">ویژگی‌ها</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-900">بدون کارت هدیه، بدون فاکتور کاغذی</h2>
          <p className="mt-3 text-sm leading-7 text-ink-500">همه مراحل از تعریف بودجه تا تسویه با مجموعه، آنلاین و قابل پیگیری است.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 [&>svg]:h-6 [&>svg]:w-6">
                {iconMap[f.icon] ?? iconMap.wallet}
              </span>
              <h3 className="mt-5 font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-ink-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
