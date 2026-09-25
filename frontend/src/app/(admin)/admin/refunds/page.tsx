"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAllOrders, type OrderResponse, type OrderStatus } from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

function QueueBody({ statuses, emptyTitle }: { statuses: OrderStatus[]; emptyTitle: string }) {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const lists = await Promise.all(statuses.map((s) => listAllOrders(s, 1, 30)));
      setOrders(lists.flatMap((r) => r.orders));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this queue.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <ErrorState title="Queue unavailable." description={error} onRetry={load} />;
  }

  if (!orders) return <ListSkeleton rows={4} />;

  if (orders.length === 0) {
    return <EmptyState icon="fa-undo" title={emptyTitle} description="Matching orders will appear here." />;
  }

  return (
    <ul className="space-y-2.5">
      {orders.map((o) => (
        <li key={o.id}>
          <Link
            href={`/admin/orders/${o.id}`}
            className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-stone-900">Order {o.order_number}</span>
              <Badge tone={orderStatusTone(o.status.toUpperCase())}>
                {customerOrderLabel(o.status.toUpperCase())}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-stone-500">{formatDateTime(o.created_at)}</p>
            <p className="mt-1 text-sm font-bold text-stone-900">{formatMoney(o.total)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function RefundsPage() {
  return (
    <div>
      <PageHeader title="Refunds" description="Orders awaiting or given refunds." />
      <RequireAuth>
        <QueueBody statuses={["refund_pending", "refunded"]} emptyTitle="No refunds" />
      </RequireAuth>
    </div>
  );
}
