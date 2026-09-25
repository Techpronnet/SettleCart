export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-stone-200/80 ${className}`}
    />
  );
}

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-3 h-9 w-full" />
        </div>
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

export function StatsSkeleton({
  count = 4,
  cols = "grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-3`} role="status" aria-label="Loading statistics">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-2 h-6 w-2/3" />
        </div>
      ))}
      <span className="sr-only">Loading statistics…</span>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4" role="status" aria-label="Loading form">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-40" />
      <span className="sr-only">Loading form…</span>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-stone-200 bg-white p-3">
          <Skeleton className="h-36 sm:h-40 w-full rounded-xl" />
          <Skeleton className="mt-3 h-3 w-2/3" />
          <Skeleton className="mt-1.5 h-4 w-1/2" />
          <div className="mt-2 flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}

export function StoreGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading stores">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3.5">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-1.5 h-3 w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading stores…</span>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading order">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-3 h-24 w-full" />
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="mt-3 h-16 w-full" />
      </div>
      <span className="sr-only">Loading order…</span>
    </div>
  );
}
