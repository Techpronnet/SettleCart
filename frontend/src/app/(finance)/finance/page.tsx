"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard } from "@/components/vendor/VendorBits";
import { ApiError, listAllOrders, type OrderResponse } from "@/lib/api";
import { scanPendingSettlements, totalsFor } from "@/lib/finance";
import { formatMoney } from "@/lib/format";

function DashboardBody() {
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [res, pending] = await Promise.all([
        listAllOrders(null, 1, 100),
        scanPendingSettlements(100).catch(() => ({ candidates: [], scanned: 0 })),
      ]);
      setOrders(res.orders);
      setPendingCount(pending.candidates.length);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load financial data.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Finance unavailable." description={error} onRetry={load} />;
  }

  if (!orders)
    return (
      <div className="space-y-4">
        <StatsSkeleton count={4} />
        <StatsSkeleton count={3} cols="grid-cols-2 lg:grid-cols-3" />
        <ListSkeleton rows={1} />
      </div>
    );

  const totals = totalsFor(orders);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Gross volume" value={formatMoney(totals.gmv)} icon="fa-money" sub={`${totals.orderCount} orders scanned`} />
        <StatCard label="Platform fees" value={formatMoney(totals.platformFees)} icon="fa-bank" />
        <StatCard label="Vendor volume" value={formatMoney(totals.vendorVolume)} icon="fa-building" />
        <StatCard label="Refunds" value={formatMoney(totals.refundedVolume)} icon="fa-undo" sub={`${totals.refundCount} orders`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Settled orders" value={String(totals.settledCount)} icon="fa-check-circle" />
        <StatCard
          label="Pending settlement"
          value={pendingCount === null ? "..." : String(pendingCount)}
          icon="fa-clock-o"
          sub="Delivered, not yet settled"
        />
        <StatCard label="Net to vendors" value={formatMoney(totals.vendorVolume - totals.platformFees)} icon="fa-exchange" />
      </div>

      <Card title="Queues">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Link href="/finance/settlement" className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-400">
            <span className="block text-sm font-semibold text-stone-900">Settlement queue</span>
            <span className="block text-xs text-stone-500">
              {pendingCount === null ? "Scanning…" : `${pendingCount} awaiting settlement`}
            </span>
          </Link>
          <Link href="/finance/withdrawals" className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-400">
            <span className="block text-sm font-semibold text-stone-900">Withdrawals</span>
            <span className="block text-xs text-stone-500">Review payout requests</span>
          </Link>
          <Link href="/finance/reconciliation" className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-400">
            <span className="block text-sm font-semibold text-stone-900">Reconciliation</span>
            <span className="block text-xs text-stone-500">Match orders to payments</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function FinanceDashboardPage() {
  return (
    <div>
      <PageHeader title="Financial overview" description="Volume, fees, settlement and refunds." />
      <RequireAuth>
        <DashboardBody />
      </RequireAuth>
    </div>
  );
}
