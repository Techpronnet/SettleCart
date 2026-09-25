"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { StatCard } from "@/components/vendor/VendorBits";
import { ApiError, getMyWallet, type WalletBalanceResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";

function WalletBody() {
  const [wallet, setWallet] = useState<WalletBalanceResponse | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setWallet(await getMyWallet());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load your wallet.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Wallet unavailable." description={error} onRetry={load} />;
  }

  if (!wallet) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <Card title="Balances">
        <p className="rounded-md bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-900">
          Pending money is not withdrawable money. Funds become available after verified delivery
          and settlement.
        </p>
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Pending" value={formatMoney(wallet.pending_balance)} icon="fa-clock-o" />
          <StatCard label="Available" value={formatMoney(wallet.available_balance)} icon="fa-credit-card" />
          <StatCard label="Withdrawn" value={formatMoney(wallet.total_withdrawn)} icon="fa-money" />
          <StatCard label="Total earned" value={formatMoney(wallet.total_earned)} icon="fa-line-chart" />
        </div>
      </Card>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Link
          href="/vendor/withdrawals"
          className="inline-flex items-center justify-center rounded-xl bg-stone-900 text-white px-4 py-3 text-sm font-semibold hover:bg-stone-800 min-h-[48px]"
        >
          Withdraw
        </Link>
        <Link
          href="/vendor/transactions"
          className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[48px]"
        >
          Transactions
        </Link>
        <Link
          href="/vendor/orders"
          className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[48px]"
        >
          Orders
        </Link>
      </div>
    </div>
  );
}

export default function WalletPage() {
  return (
    <div>
      <PageHeader title="Wallet" description="Earnings, pending and available." />
      <RequireAuth>
        <WalletBody />
      </RequireAuth>
    </div>
  );
}
