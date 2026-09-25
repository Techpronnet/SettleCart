"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Navigation";
import { Badge } from "@/components/ui/Badge";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listMyOrders, type OrderResponse } from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

type Tab = "active" | "completed" | "cancelled" | "refunded";

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

const COMPLETED = new Set(["delivered", "settled"]);
const CANCELLED = new Set(["cancelled", "payment_failed"]);
const REFUNDED = new Set(["refund_pending", "refunded"]);

function tabFor(status: string): Tab {
  if (COMPLETED.has(status)) return "completed";
  if (CANCELLED.has(status)) return "cancelled";
  if (REFUNDED.has(status)) return "refunded";
  return "active";
}

function OrdersBody() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("active");

  useEffect(() => {
    let cancelled = false;
    listMyOrders(1, 50)
      .then((res) => {
        if (!cancelled) setOrders(res.orders);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "We couldn't load your orders.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = (orders ?? []).filter((o) => tabFor(o.status) === tab);

  return (
    <div>
      <PageHeader title="Orders" description="Every order, from placement to delivery." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-4">
        {error ? (
          <ErrorState title="We couldn't load your orders." description={error} onRetry={() => window.location.reload()} />
        ) : orders === null ? (
          <ListSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="fa-shopping-bag"
            title={tab === "active" ? "No active orders" : `No ${tab} orders`}
            description="When you place an order it will appear here."
            action={
              <Link
                href="/discover"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
              >
                Discover products
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
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
                  <p className="mt-1.5 text-sm font-bold text-stone-900">{formatMoney(o.total)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersBody />
    </RequireAuth>
  );
}
