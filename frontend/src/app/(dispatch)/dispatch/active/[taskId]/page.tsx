"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  friendlyApiMessage,
  getTask,
  startDelivery,
  type DeliveryTaskDetailResponse,
} from "@/lib/api";

function ActiveBody({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<DeliveryTaskDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    try {
      setTask(await getTask(taskId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this delivery.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setActionError("");
    setWorking(true);
    try {
      const updated = await startDelivery(taskId);
      setTask(await getTask(updated.id));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not start transit.") : "Network error."
      );
    } finally {
      setWorking(false);
    }
  }

  if (error) {
    return <ErrorState title="Delivery unavailable." description={error} onRetry={load} />;
  }

  if (!task) return <ListSkeleton rows={3} />;

  const inTransit = task.status === "in_transit";

  return (
    <div className="space-y-4">
      <Card title="Route">
        <ol className="space-y-3 text-sm">
          <li className="flex gap-2.5">
            <span className="mt-1 w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" aria-hidden="true" />
            <span>
              <span className="block font-medium text-stone-900">Picked up</span>
              <span className="block text-stone-500 text-xs">{task.pickup_address}, {task.pickup_city}</span>
            </span>
          </li>
          <li className="flex gap-2.5">
            <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${inTransit ? "bg-stone-900" : "bg-stone-300"}`} aria-hidden="true" />
            <span>
              <span className="block font-medium text-stone-900">Deliver to customer</span>
              <span className="block text-stone-500 text-xs">{task.dropoff_address}, {task.dropoff_city}</span>
              <span className="block text-stone-500 text-xs">{task.dropoff_phone}</span>
            </span>
          </li>
        </ol>
      </Card>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      {!inTransit ? (
        <Button size="lg" className="w-full" onClick={start} loading={working}>
          Start delivery
        </Button>
      ) : (
        <Link
          href={`/dispatch/verify/${taskId}`}
          className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Arrived. Enter customer code
        </Link>
      )}

      <Link
        href={`/dispatch/failed/${taskId}`}
        className="block text-center text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[44px] py-2"
      >
        Report a delivery problem
      </Link>
    </div>
  );
}

export default function ActiveDeliveryPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  return (
    <div>
      <PageHeader title="Active delivery" breadcrumbs={[{ label: "Jobs", href: "/dispatch/jobs" }, { label: "Active" }]} />
      <RequireAuth>
        <ActiveBody taskId={taskId} />
      </RequireAuth>
    </div>
  );
}
