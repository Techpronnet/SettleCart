"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAllOrders, type OrderResponse, type OrderStatus } from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;
const STATUSES: (OrderStatus | "all")[] = [
  "all",
  "created",
  "payment_pending",
  "payment_confirmed",
  "processing",
  "ready_for_pickup",
  "dispatch_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "settled",
  "payment_failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "disputed",
];

function OrdersBody() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage: number, nextStatus: OrderStatus | "all") {
    setLoading(true);
    setError("");
    try {
      const res = await listAllOrders(nextStatus === "all" ? null : nextStatus, nextPage, PAGE_SIZE);
      setOrders(res.orders);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, "all");
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <label className="text-sm text-stone-700">
        Status{" "}
        <select
          value={status}
          onChange={(e) => {
            const next = e.target.value as OrderStatus | "all";
            setStatus(next);
            load(1, next);
          }}
          className="ml-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm min-h-[44px]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : customerOrderLabel(s.toUpperCase())}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState title="Orders unavailable." description={error} onRetry={() => load(1, status)} />
        ) : orders.length === 0 ? (
          <EmptyState icon="fa-shopping-bag" title="No orders here" description="Orders with this status will appear here." />
        ) : (
          <>
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
                    <p className="mt-1 text-xs text-stone-500">
                      {o.vendor_orders.length} vendor{o.vendor_orders.length === 1 ? "" : "s"} ·{" "}
                      {formatDateTime(o.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-900">{formatMoney(o.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p, status)} />
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" description="Every order on the platform." />
      <RequireAuth>
        <OrdersBody />
      </RequireAuth>
    </div>
  );
}
