import {
  ButtonHTMLAttributes,
  ReactNode,
  cloneElement,
  isValidElement,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "rounded" | "pill";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  asChild?: boolean;
}

const baseStyles = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
  secondary:
    "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
  ghost:
    "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const shapeStyles: Record<ButtonShape, string> = {
  rounded: "rounded-lg",
  pill: "rounded-full",
};

export const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  shape = "rounded",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  asChild,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;
  const baseCls =
    "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55";
  const combinedClassName = `${baseCls} ${baseStyles[variant]} ${sizeStyles[size]} ${shapeStyles[shape]} ${className}`.trim();

  const content = (
    <>
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
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
      ) : icon && iconPosition === "left" ? (
        <span className="flex -ml-0.5">{icon}</span>
      ) : null}
      {children}
      {icon && iconPosition === "right" && !loading && (
        <span className="flex -mr-0.5">{icon}</span>
      )}
    </>
  );

  if (asChild && isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    const childClassName = (child.props.className || "") as string;
    return cloneElement(child, {
      className: `${childClassName} ${combinedClassName}`.trim(),
    });
  }

  return (
    <button
      className={combinedClassName}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </button>
  );
};
