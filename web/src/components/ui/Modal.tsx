"use client";
import { ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { XMarkIcon } from "@/components/icons";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  children?: ReactNode;
}

const widths = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl" };

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = "md",
  closeOnEsc = true,
  closeOnBackdrop = true,
  className,
  children,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc) onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeOnEsc, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-900/40 backdrop-blur-[2px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-3xl bg-surface shadow-[var(--shadow-pop)] sm:rounded-2xl",
          widths[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="text-base font-semibold text-ink-900">{title}</h2>}
              {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-me-1.5 rounded-lg p-1.5 text-ink-400 transition hover:bg-canvas hover:text-ink-700"
              aria-label="بستن"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="scroll-thin overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** @deprecated Modal renders its own close button when it has a title. */
export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" onClick={onClose} aria-label="بستن" className="absolute end-3 top-3 rounded-lg p-1.5 text-ink-400 hover:bg-canvas">
      <XMarkIcon className="h-5 w-5" />
    </button>
  );
}
