import type { UserRole } from "@/lib/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "کارمند",
  company_admin: "مدیر شرکت",
  company_hr: "منابع انسانی",
  venue_staff: "مدیر مجموعه",
  admin: "مدیر پلتفرم",
};

/** Each role's landing page after login. */
export const ROLE_HOME: Record<UserRole, string> = {
  user: "/user/dashboard",
  company_admin: "/company/dashboard",
  company_hr: "/company/dashboard",
  venue_staff: "/venue/dashboard",
  admin: "/admin",
};

export const COMPANY_ROLES: UserRole[] = ["company_admin", "company_hr"];

export function homePathFor(role?: string | null): string {
  return (role && ROLE_HOME[role as UserRole]) || "/user/dashboard";
}

/** Only allow same-site relative redirects (prevents open-redirects via ?redirect=). */
export function safeRedirect(target: string | null | undefined): string | null {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return null;
  return target;
}
