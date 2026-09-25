"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt, StatCard } from "@/components/vendor/VendorBits";
import { ApiError, listVendorOrders, type VendorOrderResponse } from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";
import { formatMoney } from "@/lib/format";

function CustomersBody({ storeId }: { storeId: string }) {
  const [orders, setOrders] = useState<VendorOrderResponse[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setOrders(await listVendorOrders(storeId, 1, 100));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load customers.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <ErrorState title="Customers unavailable." description={error} onRetry={load} />;
  }

  if (!orders) return <ListSkeleton rows={3} />;

  const fulfilled = orders.filter((o) => o.status === "delivered" || o.status === "settled");
  const revenue = fulfilled.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Total orders" value={String(orders.length)} icon="fa-shopping-bag" />
        <StatCard label="Fulfilled" value={String(fulfilled.length)} icon="fa-check-circle" />
        <StatCard label="Revenue" value={formatMoney(revenue)} icon="fa-money" />
      </div>
      <Card title="About customer data">
        <p className="text-sm text-stone-600 leading-relaxed">
          Per-customer profiles (order counts, last order, total spend) appear here once the
          platform exposes customer summaries to vendors. Only information your store legitimately
          needs for fulfillment is ever shared.
        </p>
      </Card>
    </div>
  );
}

function CustomersGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <CustomersBody storeId={ctx.storeId} />;
}

export default function CustomersPage() {
  return (
    <div>
      <PageHeader title="Customers" description="Who buys from your store." />
      <RequireAuth>
        <CustomersGate />
      </RequireAuth>
    </div>
  );
}
