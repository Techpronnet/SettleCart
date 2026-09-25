"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  acceptTask,
  friendlyApiMessage,
  getTask,
  type DeliveryTaskDetailResponse,
} from "@/lib/api";
import { dismissJob, taskLabel, taskTone } from "@/lib/dispatch";
import { formatMoney } from "@/lib/format";

function JobDetailsBody({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<DeliveryTaskDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    try {
      setTask(await getTask(taskId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this job.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept() {
    setActionError("");
    setWorking(true);
    try {
      await acceptTask(taskId);
      await load();
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not accept.") : "Network error."
      );
    } finally {
      setWorking(false);
    }
  }

  function decline() {
    dismissJob(taskId);
    router.push("/dispatch/jobs");
  }

  if (error) {
    return <ErrorState title="Job unavailable." description={error} onRetry={load} />;
  }

  if (!task) return <ListSkeleton rows={3} />;

  const accepted = task.status === "accepted" || task.status === "picked_up" || task.status === "in_transit";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone={taskTone(task.status)}>{taskLabel(task.status)}</Badge>
        <span className="text-sm font-bold text-teal-800">Earn {formatMoney(task.dispatch_earnings)}</span>
      </div>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      <Card title="Pickup">
        <p className="text-sm font-medium text-stone-900">{task.store_name ?? "Vendor store"}</p>
        <p className="mt-0.5 text-sm text-stone-600">{task.pickup_address}</p>
        <p className="text-sm text-stone-600">{task.pickup_city} · {task.pickup_phone}</p>
      </Card>

      <Card title="Drop-off">
        <p className="text-sm text-stone-600">{task.dropoff_address}</p>
        <p className="text-sm text-stone-600">{task.dropoff_city} · {task.dropoff_phone}</p>
      </Card>

      <Card title="Payout">
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Delivery fee</span>
          <span className="font-semibold text-stone-900">{formatMoney(task.delivery_fee)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="text-stone-500">Your earnings</span>
          <span className="font-bold text-teal-800">{formatMoney(task.dispatch_earnings)}</span>
        </div>
      </Card>

      {task.status === "pending" || task.status === "assigned" ? (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button onClick={accept} loading={working} size="lg">
            Accept job
          </Button>
          <Button variant="secondary" size="lg" onClick={decline}>
            Decline
          </Button>
        </div>
      ) : accepted ? (
        <Link
          href={task.status === "accepted" ? `/dispatch/pickup/${task.id}` : `/dispatch/active/${task.id}`}
          className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
        >
          Continue delivery
        </Link>
      ) : null}
    </div>
  );
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <PageHeader title="Job details" breadcrumbs={[{ label: "Jobs", href: "/dispatch/jobs" }, { label: "Details" }]} />
      <RequireAuth>
        <JobDetailsBody taskId={id} />
      </RequireAuth>
    </div>
  );
}
