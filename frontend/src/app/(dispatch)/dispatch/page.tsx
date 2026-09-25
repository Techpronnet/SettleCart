"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { TaskCard } from "@/components/dispatch/DispatchBits";
import { StatCard } from "@/components/vendor/VendorBits";
import {
  ApiError,
  getAvailableTasks,
  getMyTasks,
  type DeliveryTaskResponse,
} from "@/lib/api";
import {
  getAvailability,
  isActiveTask,
  nextStepFor,
  setAvailability,
  type RiderAvailability,
} from "@/lib/dispatch";
import { formatMoney } from "@/lib/format";

const AVAILABILITY_OPTIONS: { key: RiderAvailability; label: string }[] = [
  { key: "offline", label: "Offline" },
  { key: "available", label: "Available" },
  { key: "busy", label: "Busy" },
  { key: "paused", label: "Paused" },
];

function DashboardBody() {
  const [availability, setAvailabilityState] = useState<RiderAvailability>("offline");
  const [mine, setMine] = useState<DeliveryTaskResponse[] | null>(null);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [myRes, availRes] = await Promise.all([
        getMyTasks({ page: 1, size: 50 }),
        getAvailableTasks({ page: 1, size: 1 }).catch(() => null),
      ]);
      setMine(myRes.tasks);
      if (availRes) setAvailableCount(availRes.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load dispatch data.");
    }
  }

  useEffect(() => {
    // Client-only availability restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailabilityState(getAvailability());
    // Initial load on mount.
    load();
  }, []);

  function changeAvailability(next: RiderAvailability) {
    setAvailabilityState(next);
    setAvailability(next);
  }

  if (error) {
    return <ErrorState title="Dispatch unavailable." description={error} onRetry={load} />;
  }

  if (!mine)
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4" role="status" aria-label="Loading availability">
          <Skeleton className="h-4 w-1/3" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-full" />
            <Skeleton className="hidden sm:block h-10 flex-1 rounded-full" />
          </div>
          <span className="sr-only">Loading availability…</span>
        </div>
        <StatsSkeleton count={3} cols="grid-cols-2 lg:grid-cols-3" />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );

  const active = mine.filter((t) => isActiveTask(t.status));
  const today = new Date().toISOString().slice(0, 10);
  const deliveredToday = mine.filter(
    (t) => t.status === "delivered" && (t.delivered_at ?? "").slice(0, 10) === today
  );
  const earningsToday = deliveredToday.reduce((s, t) => s + (Number(t.dispatch_earnings) || 0), 0);

  return (
    <div className="space-y-4">
      <Card title="Availability">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Availability">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              aria-pressed={availability === opt.key}
              onClick={() => changeAvailability(opt.key)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium min-h-[44px] ${
                availability === opt.key
                  ? availability === "available"
                    ? "bg-teal-700 text-white"
                    : "bg-stone-900 text-white"
                  : "border border-stone-300 bg-white text-stone-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {availability === "available"
            ? "You are online and can receive jobs."
            : "You are not receiving new jobs right now."}
        </p>
      </Card>

      {active.length > 0 && (
        <Card
          title="Active delivery"
          action={
            <Link href={nextStepFor(active[0].status, active[0].id)} className="text-sm font-medium text-stone-900 underline">
              Continue
            </Link>
          }
        >
          <TaskCard task={active[0]} />
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Available jobs" value={availableCount === null ? "..." : String(availableCount)} icon="fa-briefcase" />
        <StatCard label="Delivered today" value={String(deliveredToday.length)} icon="fa-check-circle" />
        <StatCard label="Earned today" value={formatMoney(earningsToday)} icon="fa-money" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Link
          href="/dispatch/jobs"
          className="inline-flex items-center justify-center rounded-xl bg-stone-900 text-white px-4 py-3.5 text-sm font-semibold hover:bg-stone-800 min-h-[48px]"
        >
          {availability === "available" ? "Find jobs" : "Go online"}
        </Link>
        <Link
          href="/dispatch/earnings"
          className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[48px]"
        >
          Earnings
        </Link>
      </div>
    </div>
  );
}

export default function DispatchDashboardPage() {
  return (
    <div>
      <PageHeader title="Dispatch" description="Deliveries and earnings." />
      <RequireAuth>
        <DashboardBody />
      </RequireAuth>
    </div>
  );
}
