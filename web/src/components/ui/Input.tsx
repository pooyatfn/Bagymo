import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  placeholder?: string;
}

const sharedInput =
  "w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

function cx(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export const Input = ({
  className = "",
  label,
  error,
  helper,
  id,
  ...props
}: InputProps) => {
  const inputId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && inputId && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cx(
          sharedInput,
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-600">{helper}</p>}
    </div>
  );
};

export const Textarea = ({
  className = "",
  label,
  error,
  helper,
  id,
  ...props
}: TextareaProps) => {
  const inputId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && inputId && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cx(
          sharedInput,
          "min-h-[80px] resize-y",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-600">{helper}</p>}
    </div>
  );
};

export const Select = ({
  className = "",
  label,
  error,
  helper,
  placeholder,
  id,
  ...props
}: SelectProps) => {
  const inputId = id || (label ? label.replace(/\s+/g, "-").toLowerCase() : undefined);
  return (
    <div className="w-full">
      {label && inputId && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cx(
          sharedInput,
          "appearance-none",
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {props.children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-gray-600">{helper}</p>}
    </div>
  );
};
