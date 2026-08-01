"use client";
import { ReactNode } from "react";
import { features } from "@/lib/landingData";
import {
  WalletIcon,
  BuildingIcon,
  QrIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "../icons";

const iconMap: Record<string, ReactNode> = {
  wallet: <WalletIcon className="h-6 w-6" />,
  building: <BuildingIcon className="h-6 w-6" />,
  qr: <QrIcon className="h-6 w-6" />,
  clock: <ClockIcon className="h-6 w-6" />,
  shield: <ShieldCheckIcon className="h-6 w-6" />,
  chart: <ChartBarIcon className="h-6 w-6" />,
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">همه‌چیز برای سلامت شما</h2>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            ویژگی‌هایی که تجربه مراقبت از سلامت سازمانی را تحت تأثیر قرار می‌دهند.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50 transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
                {iconMap[f.icon] || iconMap["wallet"]}
              </div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-600 flex-1">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
