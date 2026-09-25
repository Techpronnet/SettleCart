import Link from "next/link";
import { EmptyState } from "@/components/ui/States";

export function VendorSetupPrompt({ message }: { message?: string }) {
  return (
    <EmptyState
      icon="fa-building"
      title="Set up your business first"
      description={
        message ??
        "Create your business, complete KYC and open your store to unlock this section."
      }
      action={
        <Link
          href="/vendor/onboarding"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Start onboarding
        </Link>
      }
    />
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-stone-500">
        <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
          <i className={`fa ${icon}`} aria-hidden="true" />
        </span>
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}
