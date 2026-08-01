import { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/10",
  warning: "bg-amber-100 text-amber-800 ring-1 ring-amber-600/10",
  error: "bg-red-100 text-red-800 ring-1 ring-red-600/10",
  info: "bg-blue-100 text-blue-800 ring-1 ring-blue-600/10",
  neutral: "bg-gray-100 text-gray-700 ring-1 ring-gray-400/10",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-0.5 text-xs",
};

export const Badge = ({
  className = "",
  variant = "neutral",
  size = "md",
  icon,
  ...props
}: BadgeProps) => {
  const baseCls =
    "inline-flex items-center gap-1 font-medium whitespace-nowrap rounded-full";
  return (
    <span
      className={`${baseCls} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      {...props}
    >
      {icon}
      {props.children}
    </span>
  );
};
