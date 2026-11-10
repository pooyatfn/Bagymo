"use client";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem<K extends string> {
  key: K;
  label: ReactNode;
  count?: number;
}

/** Segmented tab control. Controlled: pass `value` and `onChange`. */
export function Tabs<K extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1", className)}>
      <div className="inline-flex gap-1 rounded-xl bg-gray-100/80 p-1">
        {items.map((t) => {
          const active = t.key === value;
          return (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(t.key)}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
                active ? "bg-surface text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-900",
              )}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={cn(
                    "tabular rounded-full px-1.5 text-[11px] leading-5",
                    active ? "bg-brand-50 text-brand-700" : "bg-gray-200/80 text-ink-500",
                  )}
                >
                  {t.count.toLocaleString("fa-IR")}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
