import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { formatMoney } from "@/lib/format";
import { nextStepFor, taskLabel, taskTone } from "@/lib/dispatch";
import type { DeliveryTaskResponse } from "@/lib/api";

export function RiderSetupPrompt() {
  return (
    <EmptyState
      icon="fa-motorcycle"
      title="Complete rider onboarding"
      description="Verify your identity and add your vehicle to start receiving delivery jobs."
      action={
        <Link
          href="/dispatch/onboarding"
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Start onboarding
        </Link>
      }
    />
  );
}

export function TaskCard({ task }: { task: DeliveryTaskResponse }) {
  return (
    <Link
      href={nextStepFor(task.status, task.id)}
      className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400"
      aria-label={`Delivery job ${task.id.slice(0, 8)}, ${taskLabel(task.status)}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-stone-900">
          Job {task.id.slice(0, 8)}
        </span>
        <Badge tone={taskTone(task.status)}>{taskLabel(task.status)}</Badge>
      </div>
      <div className="mt-2 space-y-1 text-xs text-stone-500">
        <p className="truncate">
          <i className="fa fa-arrow-up mr-1.5 text-stone-400" aria-hidden="true" />
          {task.pickup_address}, {task.pickup_city}
        </p>
        <p className="truncate">
          <i className="fa fa-arrow-down mr-1.5 text-stone-400" aria-hidden="true" />
          {task.dropoff_address}, {task.dropoff_city}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold text-teal-800">
        Earn {formatMoney(task.dispatch_earnings)}
      </p>
    </Link>
  );
}
