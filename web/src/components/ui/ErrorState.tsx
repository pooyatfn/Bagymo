import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState = ({
  title = "خطا در بارگذاری",
  description = "اطلاعات مورد نظر قابل دریافت نبود. لطفاً دوباره تلاش کنید.",
  onRetry,
  retryLabel = "تلاش مجدد",
  className = "",
}: ErrorStateProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`.trim()}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-14 w-14 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9 3.375c0 1.6.65 3.08 1.74 4.17l.06.06a9 9 0 1017-17 9 9 0 00-17 17v-.06l.06-.06a9 9 0 000 1.74z"
        />
      </svg>
      <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="md" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
