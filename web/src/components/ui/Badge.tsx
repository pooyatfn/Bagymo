import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "brand";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  icon?: ReactNode;
  dot?: boolean;
}

const styles: Record<BadgeVariant, { box: string; dot: string }> = {
  success: { box: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  warning: { box: "bg-amber-50 text-amber-800 ring-amber-600/20", dot: "bg-amber-500" },
  error: { box: "bg-red-50 text-red-700 ring-red-600/15", dot: "bg-red-500" },
  info: { box: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
  neutral: { box: "bg-gray-100 text-ink-700 ring-gray-500/10", dot: "bg-ink-400" },
  brand: { box: "bg-brand-50 text-brand-800 ring-brand-600/15", dot: "bg-brand-500" },
};

export function Badge({ className, variant = "neutral", size = "md", icon, dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        styles[variant].box,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", styles[variant].dot)} />}
      {icon}
      {children}
    </span>
  );
}
