import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  children: ReactNode;
}

export const Modal = ({
  open,
  onClose,
  title,
  closeOnEsc = true,
  closeOnBackdrop = true,
  className = "",
  children,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const onEsc = () => {
      if (closeOnEsc) onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ${className}`.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="mb-4 text-lg font-bold text-gray-900">{title}</h3>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="absolute left-3 top-3 text-sm text-gray-400 hover:text-gray-600"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}
