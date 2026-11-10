import { ButtonHTMLAttributes, ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "soft-danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label (on the right in RTL). */
  icon?: ReactNode;
  /** Render the single child element (e.g. a Next <Link>) with button styles. */
  asChild?: boolean;
  /** Kept for backwards compatibility; ignored. */
  shape?: "rounded" | "pill";
  iconPosition?: "left" | "right";
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary: "bg-brand-50 text-brand-800 hover:bg-brand-100",
  outline: "border border-line bg-surface text-ink-700 shadow-sm hover:bg-canvas hover:text-ink-900",
  ghost: "text-ink-500 hover:bg-canvas hover:text-ink-900",
  destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  "soft-danger": "text-red-600 hover:bg-red-50",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center rounded-xl font-medium whitespace-nowrap transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  asChild,
  shape: _shape,
  iconPosition: _iconPosition,
  type = "button",
  ...props
}: ButtonProps) {
  const cls = buttonClass(variant, size, className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { className: cn(cls, child.props.className) });
  }

  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Spinner /> : icon ? <span className="flex [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
      {children}
    </button>
  );
}
