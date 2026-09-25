"use client";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-2 py-4"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-2 rounded-md text-sm border border-stone-300 bg-white disabled:opacity-40 min-h-[40px] min-w-[40px]"
        aria-label="Previous page"
      >
        <i className="fa fa-chevron-left" aria-hidden="true" />
      </button>
      <span className="text-sm text-stone-600" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-2 rounded-md text-sm border border-stone-300 bg-white disabled:opacity-40 min-h-[40px] min-w-[40px]"
        aria-label="Next page"
      >
        <i className="fa fa-chevron-right" aria-hidden="true" />
      </button>
    </nav>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className="flex gap-1 overflow-x-auto border-b border-stone-200"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px min-h-[44px] ${
            active === t.key
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
