import { cn } from "@/lib/cn";

/** Horizontal meter. `value` is 0–100. Turns amber/red as it fills. */
export function Progress({
  value,
  className,
  tone = "auto",
  label,
}: {
  value: number;
  className?: string;
  tone?: "auto" | "brand" | "white";
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value || 0));
  const color =
    tone === "white" ? "bg-white" : tone === "brand" ? "bg-brand-500" : v >= 90 ? "bg-red-500" : v >= 75 ? "bg-amber-500" : "bg-brand-500";
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(v)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full", tone === "white" ? "bg-white/25" : "bg-gray-100", className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${v}%` }} />
    </div>
  );
}
