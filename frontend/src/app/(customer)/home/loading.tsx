import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <PageHeader title="Good to see you" description="Discover stores, order, and track delivery." />
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="mt-4 flex gap-2 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-28 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-6">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3">
          <ListSkeleton rows={2} />
        </div>
      </div>
      <div className="mt-6">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-[76px] w-full rounded-xl" />
          <Skeleton className="h-[76px] w-full rounded-xl" />
        </div>
      </div>
      <span className="sr-only" role="status">
        Loading home…
      </span>
    </div>
  );
}
