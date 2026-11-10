"use client";
import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes, useId } from "react";
import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/icons";

interface FieldProps {
  label?: ReactNode;
  error?: string;
  helper?: ReactNode;
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps & {
  /** Content shown at the end of the field, e.g. a unit like «تومان». */
  suffix?: ReactNode;
};
export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps & { placeholder?: string };

export const fieldClass = (error?: string) =>
  cn(
    "block w-full rounded-xl border bg-surface px-3.5 text-sm text-ink-900 shadow-sm transition",
    "placeholder:text-ink-400 focus:outline-none focus:ring-4",
    "disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-500",
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
      : "border-line hover:border-gray-300 focus:border-brand-500 focus:ring-brand-500/15",
  );

function Field({ id, label, error, helper, children, required }: FieldProps & { id: string; children: ReactNode; required?: boolean }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
          {label}
          {required && <span className="ms-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : helper ? (
        <p id={`${id}-msg`} className="mt-1.5 text-xs text-ink-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, label, error, helper, id, suffix, ...props }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} error={error} helper={helper} required={props.required}>
      <div className="relative">
        <input
          id={fid}
          aria-invalid={!!error || undefined}
          aria-describedby={error || helper ? `${fid}-msg` : undefined}
          className={cn(fieldClass(error), "h-11", suffix ? "pe-16" : undefined, className)}
          {...props}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-xs text-ink-500">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

export function Textarea({ className, label, error, helper, id, ...props }: TextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} error={error} helper={helper} required={props.required}>
      <textarea
        id={fid}
        aria-invalid={!!error || undefined}
        className={cn(fieldClass(error), "min-h-24 resize-y py-2.5", className)}
        {...props}
      />
    </Field>
  );
}

export function Select({ className, label, error, helper, placeholder, id, children, ...props }: SelectProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <Field id={fid} label={label} error={error} helper={helper} required={props.required}>
      <div className="relative">
        <select id={fid} className={cn(fieldClass(error), "h-11 appearance-none pe-10", className)} {...props}>
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      </div>
    </Field>
  );
}
