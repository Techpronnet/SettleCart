"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard, VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  getMyWallet,
  getStoreProducts,
  listMyBusinesses,
  listVendorOrders,
  type VendorOrderResponse,
  type WalletBalanceResponse,
} from "@/lib/api";
import { getVendorContext, setVendorBusiness } from "@/lib/vendor-context";
import { formatMoney } from "@/lib/format";
import { kycLabel, kycTone, vendorOrderLabel } from "@/lib/vendor";

interface DashboardData {
  orders: VendorOrderResponse[];
  wallet: WalletBalanceResponse | null;
  lowStock: number;
  productCount: number;
  kyc: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function DashboardBody() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const ctx = getVendorContext();
      try {
        const businesses = await listMyBusinesses();
        if (cancelled) return;
        if (businesses.length === 0) {
          setHasBusiness(false);
          return;
        }
        setHasBusiness(true);
        const biz = businesses.find((b) => b.id === ctx.businessId) ?? businesses[0];
        setVendorBusiness(biz.id);
        const sid = ctx.storeId;
        setStoreId(sid);
        if (!sid) {
          setData({ orders: [], wallet: null, lowStock: 0, productCount: 0, kyc: biz.kyc_status });
          return;
        }
        const [orders, walletResult, productsResult] = await Promise.all([
          listVendorOrders(sid, 1, 50),
          getMyWallet().catch(() => null),
          getStoreProducts(sid, { page: 1, size: 100 }).catch(() => null),
        ]);
        if (cancelled) return;
        const products = productsResult?.products ?? [];
        setData({
          orders,
          wallet: walletResult,
          lowStock: products.filter((p) => p.track_inventory && p.inventory_count <= 5).length,
          productCount: productsResult?.total ?? products.length,
          kyc: biz.kyc_status,
        });
      } catch {
        if (!cancelled) setError("We couldn't load your dashboard.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <ErrorState title="Dashboard unavailable." description={error} onRetry={() => window.location.reload()} />;
  }

  if (hasBusiness === false) return <VendorSetupPrompt />;

  if (!data)
    return (
      <div className="space-y-4">
        <StatsSkeleton count={4} />
        <ListSkeleton rows={2} />
      </div>
    );

  if (!storeId) {
    return (
      <div className="space-y-4">
        <Card title="Verification">
          <Badge tone={kycTone(data.kyc)}>{kycLabel(data.kyc)}</Badge>
        </Card>
        <VendorSetupPrompt message="Your business exists but no store is linked on this device. Create your store to continue." />
      </div>
    );
  }

  const pending = data.orders.filter((o) => o.status === "pending");
  const ready = data.orders.filter((o) => o.status === "ready_for_pickup");
  const todaySales = data.orders
    .filter((o) => o.created_at.slice(0, 10) === todayISO())
    .filter((o) => o.status !== "cancelled" && o.status !== "rejected")
    .reduce((s, o) => s + (Number(o.subtotal) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's sales" value={formatMoney(todaySales)} icon="fa-money" />
        <StatCard label="Needs action" value={String(pending.length)} sub="New orders awaiting you" icon="fa-bell-o" />
        <StatCard label="Ready for pickup" value={String(ready.length)} icon="fa-cube" />
        <StatCard
          label="Available balance"
          value={data.wallet ? formatMoney(data.wallet.available_balance) : "Not yet"}
          sub={data.wallet ? `Pending: ${formatMoney(data.wallet.pending_balance)}` : undefined}
          icon="fa-credit-card"
        />
      </div>

      {(data.lowStock > 0 || data.kyc !== "verified") && (
        <Card title="Needs attention">
          <ul className="space-y-2 text-sm text-stone-600">
            {data.kyc !== "verified" && (
              <li>
                Verification status: <Badge tone={kycTone(data.kyc)}>{kycLabel(data.kyc)}</Badge>{" "}
                <Link href="/vendor/kyc" className="font-medium text-stone-900 underline">
                  Review KYC
                </Link>
              </li>
            )}
            {data.lowStock > 0 && (
              <li>
                {data.lowStock} product{data.lowStock === 1 ? " is" : "s are"} low on stock.{" "}
                <Link href="/vendor/inventory" className="font-medium text-stone-900 underline">
                  Review inventory
                </Link>
              </li>
            )}
          </ul>
        </Card>
      )}

      <Card
        title="Recent orders"
        action={
          <Link href="/vendor/orders" className="text-sm font-medium text-stone-900 underline">
            View all
          </Link>
        }
      >
        {data.orders.length === 0 ? (
          <p className="text-sm text-stone-500">No orders yet. Share your store link to get selling.</p>
        ) : (
          <ul className="space-y-2.5">
            {data.orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link
                  href={`/vendor/orders/${o.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-stone-100 p-3 hover:border-stone-300"
                >
                  <span className="text-sm text-stone-700">
                    {o.items.reduce((s, i) => s + i.quantity, 0)} items · {vendorOrderLabel(o.status)}
                  </span>
                  <span className="text-sm font-bold text-stone-900 shrink-0">{formatMoney(o.subtotal)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { href: "/vendor/products/new", label: "Add Product" },
          { href: "/vendor/orders", label: "View Orders" },
          { href: "/vendor/store", label: "Manage Store" },
          { href: "/vendor/withdrawals", label: "Withdraw" },
        ].map((a) => (
          <Link
            key={a.href + a.label}
            href={a.href}
            className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[48px]"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Your business at a glance." />
      <RequireAuth>
        <DashboardBody />
      </RequireAuth>
    </div>
  );
}
