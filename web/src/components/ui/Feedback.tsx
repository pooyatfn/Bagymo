"use client";
/**
 * App-wide toasts and confirm dialogs, replacing window.alert / window.confirm.
 *
 *   const toast = useToast();      toast.success("ذخیره شد");
 *   const confirm = useConfirm();  if (await confirm({ title: "حذف شود؟", tone: "danger" })) …
 */
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, XMarkIcon } from "@/components/icons";
import { Button } from "./Button";
import { Modal } from "./Modal";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

interface FeedbackCtx {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const Ctx = createContext<FeedbackCtx | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast must be used inside <FeedbackProvider>");
  return c.toast;
}

export function useConfirm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useConfirm must be used inside <FeedbackProvider>");
  return c.confirm;
}

const icons: Record<ToastKind, ReactNode> = {
  success: <CheckCircleIcon className="h-5 w-5 text-emerald-600" />,
  error: <AlertTriangleIcon className="h-5 w-5 text-red-600" />,
  info: <InfoIcon className="h-5 w-5 text-sky-600" />,
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = ++seq.current;
      setToasts((t) => [...t.slice(-3), { id, kind, title, description }]);
      setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000);
    },
    [dismiss],
  );

  const [toast] = useState(() => ({
    success: (t: string, d?: string) => push("success", t, d),
    error: (t: string, d?: string) => push("error", t, d),
    info: (t: string, d?: string) => push("info", t, d),
  }));

  const confirm = useCallback((opts: ConfirmOptions) => {
    setPending(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setPending(null);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:end-6 sm:start-auto sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border bg-surface p-4 shadow-[var(--shadow-pop)]",
              t.kind === "error" ? "border-red-100" : "border-line",
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-md p-0.5 text-ink-400 hover:text-ink-700" aria-label="بستن">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal
        open={!!pending}
        onClose={() => settle(false)}
        size="sm"
        title={pending?.title}
        footer={
          <>
            <Button variant="outline" onClick={() => settle(false)}>
              {pending?.cancelLabel ?? "انصراف"}
            </Button>
            <Button variant={pending?.tone === "danger" ? "destructive" : "primary"} onClick={() => settle(true)} autoFocus>
              {pending?.confirmLabel ?? "تایید"}
            </Button>
          </>
        }
      >
        {pending?.description ? (
          <div className="text-sm leading-7 text-ink-700">{pending.description}</div>
        ) : (
          <p className="text-sm text-ink-500">این عملیات قابل بازگشت نیست.</p>
        )}
      </Modal>
    </Ctx.Provider>
  );
}
