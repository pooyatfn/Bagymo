"use client";
import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

export interface PageShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "5xl" | "6xl" | "7xl";
  padded?: boolean;
}

const maxW: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function PageShell({
  title,
  subtitle,
  children,
  action,
  maxWidth = "2xl",
  padded = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main
        className={`mx-auto px-${padded ? "4 sm:px-6" : "0"} py-6 sm:py-8 ${maxW[maxWidth]}`}
      >
        {(title || subtitle || action) && (
          <div className="mb-6 flex flex-col gap-1 sm:items-start">
            {title && (
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
            )}
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            {action && (
              <div className="-mt-1 self-start sm:self-auto">{action}</div>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
