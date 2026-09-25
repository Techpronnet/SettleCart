"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAllOrders, type OrderResponse } from "@/lib/api";
import { customerOrderLabel } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

function RefundsBody() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const lists = await Promise.all([
        listAllOrders("refund_pending", 1, 30),
        listAllOrders("refunded", 1, 30),
      ]);
      setOrders([...lists[0].orders, ...lists[1].orders]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load refunds.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Refunds unavailable." description={error} onRetry={load} />;
  }

  if (!orders) return <ListSkeleton rows={4} />;

  if (orders.length === 0) {
    return <EmptyState icon="fa-undo" title="No refunds" description="Refund activity will appear here." />;
  }

  return (
    <ul className="space-y-2.5">
      {orders.map((o) => (
        <li key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-900">Order {o.order_number}</span>
            <span className="text-sm font-bold text-stone-900">{formatMoney(o.total)}</span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {customerOrderLabel(o.status.toUpperCase())} · {formatDateTime(o.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function FinanceRefundsPage() {
  return (
    <div>
      <PageHeader title="Refunds" description="Money returned to customers." />
      <RequireAuth>
        <RefundsBody />
      </RequireAuth>
    </div>
  );
}
