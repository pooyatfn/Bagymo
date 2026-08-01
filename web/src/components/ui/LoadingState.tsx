export interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingState = ({
  message = "در حال بارگذاری...",
  className = "",
  fullScreen = false,
}: LoadingStateProps) => {
  const inner = (
    <div className={`flex flex-col items-center justify-center gap-3 text-gray-600 ${className}`.trim()}>
      <svg
        className="animate-spin h-8 w-8 text-emerald-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-1.647z"
        />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur">
        {inner}
      </div>
    );
  }
  return inner;
};
