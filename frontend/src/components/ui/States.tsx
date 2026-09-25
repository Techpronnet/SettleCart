import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({
  icon = "fa-inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="w-11 h-11 rounded-md bg-stone-100 text-stone-500 flex items-center justify-center text-lg">
        <i className={`fa ${icon}`} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-stone-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-12 text-center">
      <span className="w-11 h-11 rounded-md bg-red-50 text-red-600 flex items-center justify-center text-lg">
        <i className="fa fa-exclamation-triangle" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-stone-500">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
