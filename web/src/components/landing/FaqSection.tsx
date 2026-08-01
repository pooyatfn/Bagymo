"use client";
import { faqs } from "@/lib/landingData";
import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-gray-50 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">سؤالات متداول</h2>
          <p className="mt-3 text-sm text-gray-600">
            پاسخ‌هایی برای سؤال‌های رایج دربارهٔ باجیمو.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200/50"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-right text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                  {f.q}
                </button>
                <div
                  className={`overflow-hidden px-5 transition-all ${isOpen ? "pb-3.5 pt-0 max-h-96" : "max-h-0"}`}
                >
                  <p className="text-sm text-gray-600">{f.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
