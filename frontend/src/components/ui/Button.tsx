import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary:
    "bg-white text-stone-900 border border-stone-300 hover:bg-stone-50",
  ghost: "text-stone-700 hover:bg-stone-100 hover:text-stone-950",
  danger: "bg-red-700 text-white hover:bg-red-800 shadow-sm",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs min-h-[32px]",
  md: "px-4 py-2.5 text-sm min-h-[40px]",
  lg: "px-5 py-3.5 text-base min-h-[48px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={rest.type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && <i className="fa fa-spinner fa-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
