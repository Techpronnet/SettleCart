"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard } from "@/components/vendor/VendorBits";
import { ApiError, getDashboardStats, type DashboardStats } from "@/lib/api";

function DashboardBody() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setStats(await getDashboardStats());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load operations data.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Operations unavailable." description={error} onRetry={load} />;
  }

  if (!stats)
    return (
      <div className="space-y-4">
        <StatsSkeleton count={6} cols="grid-cols-2 lg:grid-cols-3" />
        <ListSkeleton rows={2} />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Customers" value={String(stats.total_users)} icon="fa-users" />
        <StatCard label="Businesses" value={String(stats.total_businesses)} icon="fa-building" />
        <StatCard label="Stores" value={String(stats.total_stores)} icon="fa-home" />
        <StatCard label="Orders" value={String(stats.total_orders)} icon="fa-shopping-bag" />
        <StatCard label="Products" value={String(stats.total_products)} icon="fa-cube" />
        <StatCard label="Pending KYC" value={String(stats.pending_kyc)} icon="fa-id-card" sub="Needs review" />
      </div>

      <Card title="Queues">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Link
            href="/admin/kyc"
            className="flex items-center justify-between rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="text-sm font-medium text-stone-800">KYC reviews</span>
            <span className="text-sm font-bold text-stone-900">{stats.pending_kyc}</span>
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center justify-between rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="text-sm font-medium text-stone-800">All orders</span>
            <span className="text-sm font-bold text-stone-900">{stats.total_orders}</span>
          </Link>
          <Link
            href="/admin/deliveries"
            className="flex items-center justify-between rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="text-sm font-medium text-stone-800">Delivery operations</span>
            <span className="text-sm font-bold text-stone-900">→</span>
          </Link>
          <Link
            href="/admin/disputes"
            className="flex items-center justify-between rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="text-sm font-medium text-stone-800">Disputes & refunds</span>
            <span className="text-sm font-bold text-stone-900">→</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader title="Operations overview" description="Platform health at a glance." />
      <RequireAuth>
        <DashboardBody />
      </RequireAuth>
    </div>
  );
}
