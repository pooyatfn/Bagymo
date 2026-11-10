import { Badge, BadgeVariant } from "./Badge";

const map: Record<string, [BadgeVariant, string]> = {
  reserved: ["info", "رزرو شده"],
  paid: ["info", "پرداخت شده"],
  pending: ["warning", "در انتظار"],
  processing: ["info", "در حال پردازش"],
  checked_in: ["success", "ورود ثبت شد"],
  checkedin: ["success", "ورود ثبت شد"],
  completed: ["neutral", "انجام شده"],
  cancelled: ["error", "لغو شده"],
  expired: ["warning", "منقضی شده"],
  active: ["success", "فعال"],
  inactive: ["neutral", "غیرفعال"],
  suspended: ["error", "تعلیق / رد شده"],
  draft: ["neutral", "پیش‌نویس"],
  failed: ["error", "ناموفق"],
};

export interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, label, size = "sm", className }: StatusBadgeProps) {
  const [variant, fallback] = map[status] ?? ["neutral", status];
  return (
    <Badge variant={variant} size={size} dot className={className}>
      {label ?? fallback}
    </Badge>
  );
}
