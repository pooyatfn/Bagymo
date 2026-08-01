import { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = ({
  title = "خالی است",
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) => {
  const defaultIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13l-4.5-4.5L9 15l-3-3m0 0l3 3m-3-3l3-3" />
    </svg>
  );
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-14 text-center ${className}`.trim()}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
        {icon || defaultIcon}
      </div>
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      {description && <p className="max-w-sm text-sm text-gray-600">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
