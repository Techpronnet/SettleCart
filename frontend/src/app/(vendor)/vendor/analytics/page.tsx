"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard, VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  getStoreProducts,
  listVendorOrders,
  type ProductResponse,
  type VendorOrderResponse,
} from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";
import { formatMoney } from "@/lib/format";

interface Analytics {
  orders: VendorOrderResponse[];
  products: ProductResponse[];
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function AnalyticsBody({ storeId }: { storeId: string }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [orders, productsRes] = await Promise.all([
        listVendorOrders(storeId, 1, 100),
        getStoreProducts(storeId, { page: 1, size: 100 }),
      ]);
      setData({ orders, products: productsRes.products });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load analytics.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <ErrorState title="Analytics unavailable." description={error} onRetry={load} />;
  }

  if (!data) return <ListSkeleton rows={4} />;

  const valid = data.orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected");
  const revenue = valid.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);
  const aov = valid.length > 0 ? revenue / valid.length : 0;
  const fulfilled = data.orders.filter((o) =>
    ["delivered", "settled", "picked_up", "ready_for_pickup"].includes(o.status)
  ).length;
  const fulfillmentRate = data.orders.length > 0 ? Math.round((fulfilled / data.orders.length) * 100) : 0;

  const byDay = new Map<string, number>();
  for (const o of valid) {
    const key = dayKey(o.created_at);
    byDay.set(key, (byDay.get(key) ?? 0) + (Number(o.subtotal) || 0));
  }
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const maxDay = Math.max(1, ...last7.map((d) => byDay.get(d) ?? 0));

  const productSales = new Map<string, { name: string; qty: number }>();
  for (const o of valid) {
    for (const item of o.items) {
      const entry = productSales.get(item.product_id) ?? { name: item.product_name, qty: 0 };
      entry.qty += item.quantity;
      productSales.set(item.product_id, entry);
    }
  }
  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Revenue" value={formatMoney(revenue)} icon="fa-money" />
        <StatCard label="Orders" value={String(valid.length)} icon="fa-shopping-bag" />
        <StatCard label="Avg. order value" value={formatMoney(aov)} icon="fa-bar-chart" />
        <StatCard label="Fulfillment rate" value={`${fulfillmentRate}%`} icon="fa-check-circle" />
      </div>

      <Card title="Sales, last 7 days">
        {valid.length === 0 ? (
          <p className="text-sm text-stone-500">No sales yet.</p>
        ) : (
          <div className="flex items-end gap-2 h-32" role="img" aria-label="Daily sales bar chart">
            {last7.map((day) => {
              const value = byDay.get(day) ?? 0;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-stone-900"
                    style={{ height: `${Math.max(4, (value / maxDay) * 96)}px` }}
                    title={`${day}: ${formatMoney(value)}`}
                  />
                  <span className="text-[10px] text-stone-400">{day.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Top products">
        {topProducts.length === 0 ? (
          <EmptyState icon="fa-cube" title="No sales yet" description="Your best sellers will rank here." />
        ) : (
          <ul className="space-y-2 text-sm">
            {topProducts.map((p) => (
              <li key={p.name} className="flex justify-between gap-2">
                <span className="text-stone-700 truncate">{p.name}</span>
                <span className="font-semibold text-stone-900 shrink-0">{p.qty} sold</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AnalyticsGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <AnalyticsBody storeId={ctx.storeId} />;
}

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" description="Sales, orders and fulfillment." />
      <RequireAuth>
        <AnalyticsGate />
      </RequireAuth>
    </div>
  );
}
