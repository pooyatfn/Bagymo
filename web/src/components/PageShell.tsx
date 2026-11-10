"use client";
/**
 * Page wrapper used by every panel page.
 * - signed in  → renders inside the sidebar <AppShell>
 * - signed out → redirects to /login (or shows a light public header when `access="public"`)
 * - `roles`    → shows a friendly "no access" screen for other roles
 */
import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { homePathFor } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { LandingHeader as SiteHeader } from "@/components/landing/LandingHeader";
import { LandingFooter as SiteFooter } from "@/components/landing/LandingFooter";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import { ShieldCheckIcon } from "@/components/icons";

export interface PageShellProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Buttons shown next to the title. */
  action?: ReactNode;
  /** Small link above the title, e.g. a back link. */
  eyebrow?: ReactNode;
  children: ReactNode;
  /**
   * Content width. Default "full" uses the whole panel (up to 1600px).
   * Narrower values are for forms / reading pages; they stay aligned to the
   * start edge (next to the sidebar) instead of floating in the middle.
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "5xl" | "6xl" | "7xl" | "full";
  /** Kept for compatibility. */
  padded?: boolean;
  /** Who may see the page. Default: any signed-in user. */
  roles?: UserRole[];
  access?: "auth" | "public";
}

const maxW: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  "2xl": "max-w-6xl",
  "5xl": "max-w-6xl",
  "6xl": "",
  "7xl": "",
  full: "",
};

function PageHeader({ title, subtitle, action, eyebrow }: Pick<PageShellProps, "title" | "subtitle" | "action" | "eyebrow">) {
  if (!title && !subtitle && !action) return null;
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2 text-sm">{eyebrow}</div>}
        {title && <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">{title}</h1>}
        {subtitle && <p className="mt-1.5 text-sm leading-6 text-ink-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function PageShell({ title, subtitle, action, eyebrow, children, maxWidth = "full", roles, access = "auth" }: PageShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && access === "auth") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, access, router, pathname]);

  const body = (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className={cn(maxW[maxWidth])}>
        <PageHeader title={title} subtitle={subtitle} action={action} eyebrow={eyebrow} />
        {children}
      </div>
    </main>
  );

  if (loading) return <LoadingState fullScreen message="در حال آماده‌سازی پنل…" />;

  if (!user) {
    if (access !== "public") return <LoadingState fullScreen message="در حال انتقال به صفحه ورود…" />;
    return (
      <div className="page-backdrop flex min-h-screen flex-col">
        <SiteHeader solid />
        <div className="flex-1">{body}</div>
        <SiteFooter cta={false} />
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <AppShell user={user}>
        <main className="mx-auto max-w-xl px-4 py-16">
          <EmptyState
            icon={<ShieldCheckIcon />}
            title="به این بخش دسترسی ندارید"
            description="این صفحه مخصوص نقش دیگری است. از منوی کناری به بخش‌های پنل خودتان بروید."
            action={
              <Button asChild>
                <Link href={homePathFor(user.role)}>رفتن به داشبورد من</Link>
              </Button>
            }
          />
        </main>
      </AppShell>
    );
  }

  return <AppShell user={user}>{body}</AppShell>;
}
