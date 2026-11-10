import { cn } from "@/lib/cn";

const palette = ["bg-brand-100 text-brand-800", "bg-sky-100 text-sky-800", "bg-violet-100 text-violet-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800"];

/** Initial-letter avatar with a stable color per name. */
export function Avatar({ name, size = "md", className }: { name?: string | null; size?: "sm" | "md" | "lg"; className?: string }) {
  const text = (name || "؟").trim();
  const initial = text.charAt(0);
  const hash = Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0);
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-lg" : "h-10 w-10 text-sm";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", sz, palette[hash % palette.length], className)}>
      {initial}
    </span>
  );
}
