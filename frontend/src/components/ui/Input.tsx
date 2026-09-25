"use client";

import { useState, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Renders a show/hide toggle for password fields. */
  allowShowPassword?: boolean;
}

export function Input({ label, error, hint, id, allowShowPassword, className = "", ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  const [visible, setVisible] = useState(false);
  const canToggle = allowShowPassword && rest.type === "password";
  const type = canToggle && visible ? "text" : rest.type;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-stone-800 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-2 focus-visible:outline-stone-900 min-h-[44px] ${
            error ? "border-red-400" : "border-stone-300"
          } ${canToggle ? "pr-12" : ""} ${className}`}
          {...rest}
          type={type}
        />
        {canToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-pressed={visible}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 flex items-center justify-center"
          >
            <i className={`fa ${visible ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
