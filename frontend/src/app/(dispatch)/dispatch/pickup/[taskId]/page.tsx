"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  pickupTask,
  type DeliveryTaskDetailResponse,
} from "@/lib/api";

function PickupBody({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [task, setTask] = useState<DeliveryTaskDetailResponse | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [arrived, setArrived] = useState(false);
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    try {
      setTask(await getTask(taskId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this pickup.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm() {
    setActionError("");
    setWorking(true);
    try {
      await pickupTask(taskId);
      router.push(`/dispatch/active/${taskId}`);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not confirm pickup.") : "Network error."
      );
      setWorking(false);
    }
  }

  if (error) {
    return <ErrorState title="Pickup unavailable." description={error} onRetry={load} />;
  }

  if (!task) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <Card title="Pickup location">
        <p className="text-sm font-medium text-stone-900">{task.store_name ?? "Vendor store"}</p>
        <p className="mt-0.5 text-sm text-stone-600">{task.pickup_address}</p>
        <p className="text-sm text-stone-600">{task.pickup_city} · {task.pickup_phone}</p>
        {task.notes && <p className="mt-2 text-xs text-stone-500">Note: {task.notes}</p>}
      </Card>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      <div className="grid gap-2.5">
        <Button
          variant={arrived ? "primary" : "secondary"}
          size="lg"
          onClick={() => setArrived(true)}
          disabled={arrived}
        >
          {arrived ? "Arrived at vendor" : "I have arrived at vendor"}
        </Button>
        <Button size="lg" onClick={confirm} loading={working} disabled={!arrived}>
          Confirm pickup
        </Button>
        {!arrived && (
          <p className="text-xs text-stone-500">Mark arrival first, then confirm once the package is in hand.</p>
        )}
      </div>

      <Link
        href={`/dispatch/failed/${taskId}`}
        className="block text-center text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[44px] py-2"
      >
        Report a pickup problem
      </Link>
    </div>
  );
}

export default function PickupPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  return (
    <div>
      <PageHeader title="Confirm pickup" breadcrumbs={[{ label: "Jobs", href: "/dispatch/jobs" }, { label: "Pickup" }]} />
      <RequireAuth>
        <PickupBody taskId={taskId} />
      </RequireAuth>
    </div>
  );
}
