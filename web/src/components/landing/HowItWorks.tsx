"use client";
import { howItWorksSteps } from "@/lib/landingData";
import { CheckIcon, MapPinIcon, ClockIcon } from "../icons";

const stepIcons = { check: <CheckIcon className="h-5 w-5" />, map: <MapPinIcon className="h-5 w-5" />, clock: <ClockIcon className="h-5 w-5" /> };

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">چگونه کار می‌کند</h2>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            سه قدم ساده تا از بودجه سلامتی‌تان لذت ببرید.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {howItWorksSteps.map((step, idx) => {
            const isLast = idx === howItWorksSteps.length - 1;
            return (
              <div key={step.step} className="relative flex gap-6">
                {!isLast && (
                  <div className="absolute top-5 right-[15px] bottom-0 w-px bg-dashed bg-gray-200" />
                )}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-white">
                  {stepIcons[step.icon as keyof typeof stepIcons] || (
                    <span className="text-sm font-bold">{step.step}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      گام {step.step}
                    </span>
                    <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
