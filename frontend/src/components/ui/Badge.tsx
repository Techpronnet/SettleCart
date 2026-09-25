import type { Tone } from "@/lib/status";

const tones: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-700",
  info: "bg-sky-100 text-sky-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function IconBadge({
  icon,
  label,
  className = "",
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-medium text-stone-600 ${className}`}
    >
      <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
        <i className={`fa ${icon}`} aria-hidden="true" />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
