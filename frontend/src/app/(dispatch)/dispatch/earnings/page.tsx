"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard } from "@/components/vendor/VendorBits";
import { ApiError, getMyTasks, getMyWallet, type DeliveryTaskResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";

function EarningsBody() {
  const [tasks, setTasks] = useState<DeliveryTaskResponse[] | null>(null);
  const [available, setAvailable] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [myRes, wallet] = await Promise.all([
        getMyTasks({ page: 1, size: 100 }),
        getMyWallet().catch(() => null),
      ]);
      setTasks(myRes.tasks);
      setAvailable(wallet?.available_balance ?? null);
      setPending(wallet?.pending_balance ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load earnings.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Earnings unavailable." description={error} onRetry={load} />;
  }

  if (!tasks) return <ListSkeleton rows={3} />;

  const delivered = tasks.filter((t) => t.status === "delivered");
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = delivered.filter((t) => (t.delivered_at ?? "").slice(0, 10) === today);
  const totalEarned = delivered.reduce((s, t) => s + (Number(t.dispatch_earnings) || 0), 0);
  const todayEarned = todayTasks.reduce((s, t) => s + (Number(t.dispatch_earnings) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Earned today" value={formatMoney(todayEarned)} icon="fa-money" />
        <StatCard label="Deliveries today" value={String(todayTasks.length)} icon="fa-check-circle" />
        <StatCard label="Total earned" value={formatMoney(totalEarned)} icon="fa-line-chart" />
        <StatCard label="Available" value={available !== null ? formatMoney(available) : "Not yet"} icon="fa-credit-card" sub={pending !== null ? `Pending: ${formatMoney(pending)}` : undefined} />
      </div>

      <Card title="Recent deliveries">
        {delivered.length === 0 ? (
          <EmptyState icon="fa-motorcycle" title="No deliveries yet" description="Completed jobs and their fees will appear here." />
        ) : (
          <ul className="space-y-2 text-sm">
            {delivered.slice(0, 10).map((t) => (
              <li key={t.id} className="flex justify-between gap-2 rounded-lg border border-stone-100 p-3">
                <span className="text-stone-600 truncate">
                  {t.dropoff_address}, {t.dropoff_city}
                </span>
                <span className="font-bold text-teal-800 shrink-0">+{formatMoney(t.dispatch_earnings)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function EarningsPage() {
  return (
    <div>
      <PageHeader title="Earnings" description="Delivery fees and wallet balances." />
      <RequireAuth>
        <EarningsBody />
      </RequireAuth>
    </div>
  );
}
