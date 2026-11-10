import { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangleIcon, InboxIcon } from "@/components/icons";
import { Button } from "./Button";
import { Spinner } from "./Spinner";

export function LoadingState({
  message = "در حال بارگذاری…",
  className,
  fullScreen,
}: {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}) {
  const inner = (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-3 py-16 text-ink-500", className)}>
      <Spinner className="h-7 w-7 text-brand-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
  if (!fullScreen) return inner;
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/80 backdrop-blur">{inner}</div>;
}

export function EmptyState({
  title = "موردی وجود ندارد",
  description,
  icon,
  action,
  actionLabel,
  onAction,
  className,
}: {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas text-ink-400 ring-1 ring-line [&>svg]:h-7 [&>svg]:w-7">
        {icon ?? <InboxIcon />}
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-500">{description}</p>}
      {(action || (actionLabel && onAction)) && (
        <div className="mt-5">{action ?? <Button onClick={onAction}>{actionLabel}</Button>}</div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "خطا در بارگذاری",
  description = "اطلاعات دریافت نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
  onRetry,
  retryLabel = "تلاش مجدد",
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
        <AlertTriangleIcon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-ink-500">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200/70", className)} />;
}

/** Placeholder layout shown while a dashboard loads. */
export function DashboardSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className={cn("grid grid-cols-2 gap-4", stats >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="mt-4 h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="mt-4 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
