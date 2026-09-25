"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  assignRider,
  friendlyApiMessage,
  getAnyTask,
  listAllDeliveryTasks,
  type DeliveryTaskDetailResponse,
  type DeliveryTaskResponse,
  type DeliveryTaskStatus,
} from "@/lib/api";
import { taskLabel, taskTone } from "@/lib/dispatch";

const STATUSES: (DeliveryTaskStatus | "all")[] = [
  "all",
  "pending",
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "failed",
  "cancelled",
];

function DeliveriesBody() {
  const [tasks, setTasks] = useState<DeliveryTaskResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<DeliveryTaskStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lookupId, setLookupId] = useState("");
  const [found, setFound] = useState<DeliveryTaskDetailResponse | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [riderId, setRiderId] = useState("");
  const [assignMsg, setAssignMsg] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function load(nextStatus: DeliveryTaskStatus | "all") {
    setLoading(true);
    setError("");
    try {
      const res = await listAllDeliveryTasks(nextStatus === "all" ? null : nextStatus, null, 1, 30);
      setTasks(res.tasks);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load deliveries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load("pending");
  }, []);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError("");
    setFound(null);
    setAssignMsg("");
    if (!lookupId.trim()) return;
    try {
      setFound(await getAnyTask(lookupId.trim()));
    } catch (err) {
      setLookupError(err instanceof ApiError ? err.message : "Task not found.");
    }
  }

  async function assign() {
    if (!found || !riderId.trim()) {
      setAssignMsg("Enter a rider user ID.");
      return;
    }
    setAssignMsg("");
    setAssigning(true);
    try {
      const updated = await assignRider(found.id, riderId.trim());
      setFound(await getAnyTask(updated.id));
      setAssignMsg(`Assigned. Task is now ${updated.status}.`);
      load(status);
    } catch (err) {
      setAssignMsg(err instanceof ApiError ? friendlyApiMessage(err, "Assignment failed.") : "Network error.");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Find a delivery by ID">
        <form onSubmit={lookup} className="flex gap-2">
          <Input label="Delivery task ID" name="taskId" value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="Task UUID" />
          <div className="flex items-end">
            <Button type="submit">Look up</Button>
          </div>
        </form>
        {lookupError && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {lookupError}
          </p>
        )}
        {found && (
          <div className="mt-3 rounded-lg border border-stone-200 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-stone-900">{found.store_name ?? "Delivery"}</span>
              <Badge tone={taskTone(found.status)}>{taskLabel(found.status)}</Badge>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {found.pickup_city} to {found.dropoff_city}
              {found.rider_name ? ` · Rider: ${found.rider_name}` : " · Unassigned"}
            </p>
            <div className="mt-2.5 flex gap-2">
              <Input label="Rider user ID" name="riderId" value={riderId} onChange={(e) => setRiderId(e.target.value)} placeholder="Rider UUID" />
              <div className="flex items-end">
                <Button onClick={assign} loading={assigning}>
                  Assign
                </Button>
              </div>
            </div>
            {assignMsg && (
              <p role="status" className="mt-2 text-xs text-stone-700">
                {assignMsg}
              </p>
            )}
          </div>
        )}
      </Card>

      <div>
        <label className="text-sm text-stone-700">
          Status{" "}
          <select
            value={status}
            onChange={(e) => {
              const next = e.target.value as DeliveryTaskStatus | "all";
              setStatus(next);
              load(next);
            }}
            className="ml-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm min-h-[44px]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : taskLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-3">
          {loading ? (
            <ListSkeleton rows={4} />
          ) : error ? (
            <ErrorState title="Deliveries unavailable." description={error} onRetry={() => load(status)} />
          ) : tasks.length === 0 ? (
            <EmptyState icon="fa-truck" title="No deliveries here" description={`Nothing with status "${status}".`} />
          ) : (
            <>
              <p className="mb-3 text-sm text-stone-500">{total} deliveries</p>
              <ul className="space-y-2.5">
                {tasks.map((t) => (
                  <li key={t.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900">
                        {t.pickup_city} to {t.dropoff_city}
                      </span>
                      <Badge tone={taskTone(t.status)}>{taskLabel(t.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-500 truncate">
                      Pickup: {t.pickup_address} · Drop-off: {t.dropoff_address}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLookupId(t.id);
                        setFound(null);
                      }}
                      className="mt-1.5 text-xs font-medium text-stone-900 underline min-h-[36px]"
                    >
                      Inspect and assign
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeliveriesPage() {
  return (
    <div>
      <PageHeader title="Delivery operations" description="Every delivery task, live." />
      <RequireAuth>
        <DeliveriesBody />
      </RequireAuth>
    </div>
  );
}
