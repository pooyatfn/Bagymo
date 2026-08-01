import { Badge, BadgeProps } from "./Badge";

export type BookingStatusVariant =
  | "reserved" | "paid" | "checked_in" | "completed" | "cancelled" | "expired"
  | "pending" | "processing" | BadgeProps["variant"];

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

const variantMap: Record<string, BadgeProps["variant"]> = {
  reserved: "info",
  paid: "info",
  pending: "warning",
  processing: "info",
  checked_in: "success",
  checkedin: "success",
  completed: "neutral",
  cancelled: "error",
  expired: "warning",
  active: "success",
  suspended: "error",
  draft: "neutral",
  failed: "error",
};

const labelMap: Record<string, string> = {
  reserved: "رزرو شده",
  paid: "پرداخت شده",
  pending: "در انتظار",
  processing: "در حال پردازش",
  checked_in: "ورود تایید شده",
  checkedin: "ورود تایید شده",
  completed: "تکمیل شده",
  cancelled: "لغو شده",
  expired: "منقضی شده",
  active: "فعال",
  suspended: "غیرفعال",
  draft: "پیش‌نویس",
  failed: "ناموفق",
};

export const StatusBadge = ({ status, label, size = "sm" }: StatusBadgeProps) => {
  const variant = variantMap[status] || "neutral";
  const resolvedLabel = label ?? labelMap[status] ?? status;
  return (
    <Badge variant={variant} size={size}>
      {resolvedLabel}
    </Badge>
  );
};
