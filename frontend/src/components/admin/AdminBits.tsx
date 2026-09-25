import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export function PendingBackendState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      icon="fa-clock-o"
      title={title}
      description={description}
      action={
        <Link
          href="/admin"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Back to overview
        </Link>
      }
    />
  );
}
