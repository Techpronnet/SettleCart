"use client";

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
  "payment_confirmed",
  "processing",
  "delivered",
  "settled",
  "payment_failed",
  "cancelled",
  "refund_pending",
  "refunded",
  "disputed",
];

function TransactionsBody() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [query, setQuery] = useState("");
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
      setError(err instanceof ApiError ? err.message : "We couldn't load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, "all");
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(needle) || o.id.toLowerCase().includes(needle)
      )
    : orders;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <label htmlFor="txn-search" className="sr-only">
          Search by order number or ID
        </label>
        <input
          id="txn-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order number or ID…"
          className="flex-1 min-w-[200px] rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px] focus-visible:outline-2 focus-visible:outline-stone-900"
        />
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
      </div>

      <div className="mt-3">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState title="Transactions unavailable." description={error} onRetry={() => load(1, status)} />
        ) : visible.length === 0 ? (
          <EmptyState icon="fa-exchange" title="No transactions" description="Matching financial activity will appear here." />
        ) : (
          <>
            <ul className="space-y-2.5">
              {visible.map((o) => (
                <li key={o.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900">Order {o.order_number}</span>
                    <Badge tone={orderStatusTone(o.status.toUpperCase())}>
                      {customerOrderLabel(o.status.toUpperCase())}
                    </Badge>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                    <span className="text-stone-500">
                      Total <span className="block font-bold text-stone-900 text-sm">{formatMoney(o.total)}</span>
                    </span>
                    <span className="text-stone-500">
                      Platform fee <span className="block font-semibold text-stone-900 text-sm">{formatMoney(o.platform_fee)}</span>
                    </span>
                    <span className="text-stone-500">
                      Vendors <span className="block font-semibold text-stone-900 text-sm">{formatMoney(o.subtotal)}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{formatDateTime(o.created_at)}</p>
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

export default function TransactionsExplorerPage() {
  return (
    <div>
      <PageHeader title="Transactions" description="Every financial movement, traceable per order." />
      <RequireAuth>
        <TransactionsBody />
      </RequireAuth>
    </div>
  );
}
