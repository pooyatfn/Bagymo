import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  p?: "none" | "sm" | "md" | "lg";
  /** Kept for backwards compatibility. */
  border?: boolean;
}

const pad = { none: "", sm: "p-4", md: "p-5", lg: "p-6 sm:p-7" };

export function Card({ className, hover, p = "md", border: _border, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]",
        hover && "transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        pad[p],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-ink-900", className)} {...props} />;
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 flex items-center justify-end gap-2", className)} {...props} />;
}

/** Label/value row used in detail cards. */
export function DetailRow({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-3 text-sm", className)}>
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-end font-medium text-ink-900">{children}</dd>
    </div>
  );
}
