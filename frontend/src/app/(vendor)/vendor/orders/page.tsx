"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tabs } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import { ApiError, listVendorOrders, type VendorOrderResponse } from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";
import { formatMoney } from "@/lib/format";
import { vendorOrderLabel } from "@/lib/vendor";

type Tab = "new" | "active" | "ready" | "done";

const TABS: { key: Tab; label: string }[] = [
  { key: "new", label: "New" },
  { key: "active", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "done", label: "Done" },
];

function tabFor(status: string): Tab {
  if (status === "pending") return "new";
  if (status === "accepted" || status === "preparing") return "active";
  if (status === "ready_for_pickup" || status === "picked_up") return "ready";
  return "done";
}

function OrdersBody({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<VendorOrderResponse[] | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("new");

  async function load() {
    setError("");
    try {
      setOrders(await listVendorOrders(storeId, 1, 50));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load orders.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = (orders ?? []).filter((o) => tabFor(o.status) === tab);

  return (
    <div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-4">
        {error ? (
          <ErrorState title="Orders unavailable." description={error} onRetry={load} />
        ) : orders === null ? (
          <ListSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="fa-shopping-bag"
            title={tab === "new" ? "No new orders" : `Nothing ${tab}`}
            description="New customer orders will appear here."
          />
        ) : (
          <ul className="space-y-2.5">
            {visible.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/vendor/orders/${o.id}`}
                  className="block rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-400"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} items
                    </span>
                    <Badge tone={o.status === "pending" ? "warning" : "info"}>
                      {vendorOrderLabel(o.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {o.items.map((i) => `${i.product_name} × ${i.quantity}`).join(", ")}
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-stone-900">{formatMoney(o.subtotal)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrdersGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <OrdersBody storeId={ctx.storeId} />;
}

export default function VendorOrdersPage() {
  return (
    <div>
      <PageHeader title="Orders" description="Fulfill what customers ordered." />
      <RequireAuth>
        <OrdersGate />
      </RequireAuth>
    </div>
  );
}
