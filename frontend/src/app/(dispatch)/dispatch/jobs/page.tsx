"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TaskCard } from "@/components/dispatch/DispatchBits";
import {
  ApiError,
  getAvailableTasks,
  type DeliveryTaskResponse,
} from "@/lib/api";
import { dismissJob, getAvailability, getDismissedJobs } from "@/lib/dispatch";
import { formatMoney } from "@/lib/format";

function JobsBody() {
  const [tasks, setTasks] = useState<DeliveryTaskResponse[] | null>(null);
  const [total, setTotal] = useState(0);
  const [city, setCity] = useState("");
  const [appliedCity, setAppliedCity] = useState("");
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(forCity: string) {
    setLoading(true);
    setError("");
    try {
      const res = await getAvailableTasks({ city: forCity.trim() || undefined, page: 1, size: 30 });
      setTasks(res.tasks);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Client-only dismissed restore + initial load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(getDismissedJobs());
    setOnline(getAvailability() !== "offline");
    load("");
  }, []);

  const visible = (tasks ?? []).filter((t) => !dismissed.includes(t.id));

  function decline(id: string) {
    dismissJob(id);
    setDismissed(getDismissedJobs());
  }

  return (
    <div>
      {!online && (
        <Card title="You are offline">
          <p className="text-sm text-stone-600">
            Jobs are listed below, but go online to receive new offers as they arrive.
          </p>
        </Card>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedCity(city);
          load(city);
        }}
        className="mt-4 flex gap-2"
      >
        <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lagos" />
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-md bg-stone-900 text-white px-5 text-sm font-medium min-h-[44px] hover:bg-stone-800"
          >
            Filter
          </button>
        </div>
      </form>

      <div className="mt-4">
        {loading ? (
          <ListSkeleton rows={4} />
        ) : error ? (
          <ErrorState title="Jobs unavailable." description={error} onRetry={() => load(appliedCity)} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="fa-briefcase"
            title="No jobs right now"
            description="New deliveries will appear here when vendors mark orders ready."
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-stone-500">{total} open {total === 1 ? "job" : "jobs"}</p>
            <ul className="space-y-2.5">
              {visible.map((t) => (
                <li key={t.id} className="space-y-1.5">
                  <TaskCard task={t} />
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-stone-500">Earn {formatMoney(t.dispatch_earnings)}</span>
                    <button
                      type="button"
                      onClick={() => decline(t.id)}
                      className="text-xs font-medium text-stone-500 hover:text-stone-900 underline min-h-[36px]"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <div>
      <PageHeader title="Delivery jobs" description="Open deliveries near you." />
      <RequireAuth>
        <JobsBody />
      </RequireAuth>
    </div>
  );
}
