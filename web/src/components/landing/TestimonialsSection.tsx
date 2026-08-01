"use client";
import { testimonials } from "@/lib/landingData";

export function TestimonialsSection() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">نظرات کاربران</h2>
          <p className="mt-3 text-sm text-gray-600 max-w-xl mx-auto">
            کاربران و شریکان باجیمو دربارهٔ تجربهٔ سلامت سازمانی‌شان می‌گویند.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl bg-gray-50 p-6 ring-1 ring-gray-200/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                {t.avatar}
              </div>
              <p className="text-sm text-gray-700 flex-1 leading-relaxed">
                «{t.body}»
              </p>
              <div>
                <p className="font-medium text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-600">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
