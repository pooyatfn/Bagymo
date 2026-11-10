import { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "sky" | "amber" | "violet" | "rose" | "gray";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-700",
  gray: "bg-gray-100 text-ink-700",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-ink-500 sm:text-sm">{label}</p>
        {icon && (
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl [&>svg]:h-[18px] [&>svg]:w-[18px]", tones[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p className="tabular mt-2 text-lg leading-snug font-bold text-ink-900 sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
