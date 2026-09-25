"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  getTrackingSummary,
  subscribeOrderLiveTracking,
  type RealtimeOrderEvent,
  type TrackingSummaryResponse,
} from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";

function taskIdOf(task: Record<string, unknown>): string {
  const id = task["id"] ?? task["task_id"];
  return typeof id === "string" ? id : "";
}

function taskStatusOf(task: Record<string, unknown>): string {
  const s = task["status"];
  return typeof s === "string" ? s : "unknown";
}

function TrackingBody({ orderId }: { orderId: string }) {
  const [summary, setSummary] = useState<TrackingSummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTrackingSummary(orderId)
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Tracking is unavailable.");
      });
    const unsubscribe = subscribeOrderLiveTracking(orderId, {
      onEvent: (event) => {
        const e = event as RealtimeOrderEvent;
        if (!e || typeof e !== "object" || !("event_type" in e)) return;
        if (
          e.event_type === "ORDER_STATUS_CHANGED" ||
          e.event_type === "DISPATCH_TASK_UPDATED" ||
          e.event_type === "DELIVERY_COMPLETED"
        ) {
          setLive(true);
          getTrackingSummary(orderId)
            .then((s) => {
              if (!cancelled) setSummary(s);
            })
            .catch(() => {
              // keep last snapshot
            });
        }
      },
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [orderId]);

  if (error) {
    return (
      <div>
        <PageHeader title="Delivery tracking" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Tracking" }]} />
        <ErrorState title="We couldn't load tracking." description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!summary) {
    return (
      <div>
        <PageHeader title="Delivery tracking" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Tracking" }]} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Tracking ${summary.order_number}`}
        description={live ? "Live updates connected." : undefined}
        breadcrumbs={[
          { label: "Orders", href: "/orders" },
          { label: summary.order_number, href: `/orders/${summary.order_id}` },
          { label: "Tracking" },
        ]}
      />

      <div className="flex items-center gap-2">
        <Badge tone={orderStatusTone(summary.status.toUpperCase())}>
          {customerOrderLabel(summary.status.toUpperCase())}
        </Badge>
      </div>

      <div className="mt-4 space-y-4">
        <Card title="Route">
          <p className="text-sm text-stone-600">{summary.delivery_address}</p>
          <p className="text-sm text-stone-600">
            {summary.delivery_city} · {summary.delivery_phone}
          </p>
          <Link
            href={`/verification/${summary.order_id}`}
            className="mt-3 inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
          >
            Show my delivery code
          </Link>
        </Card>

        <Card title="Deliveries">
          {summary.delivery_tasks.length === 0 ? (
            <p className="text-sm text-stone-500">
              No rider assigned yet. Vendors are still preparing your items.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {summary.delivery_tasks.map((task, i) => (
                <li
                  key={taskIdOf(task) || i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 p-3 text-sm"
                >
                  <span className="text-stone-600">Delivery {i + 1}</span>
                  <Badge tone={orderStatusTone(taskStatusOf(task).toUpperCase())}>
                    {customerOrderLabel(taskStatusOf(task).toUpperCase())}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Support">
          <p className="text-sm text-stone-600">
            Something wrong with this delivery? Contact support with order number{" "}
            <span className="font-semibold text-stone-900">{summary.order_number}</span>.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function TrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  return (
    <RequireAuth>
      <TrackingBody orderId={orderId} />
    </RequireAuth>
  );
}
