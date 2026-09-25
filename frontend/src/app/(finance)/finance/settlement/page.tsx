"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  friendlyApiMessage,
  settleVendorOrder,
  type LedgerEntryResponse,
} from "@/lib/api";
import { scanPendingSettlements, type SettlementCandidate } from "@/lib/finance";
import { formatMoney, formatDateTime } from "@/lib/format";

function SettlementBody() {
  const [candidates, setCandidates] = useState<SettlementCandidate[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [settling, setSettling] = useState<string | null>(null);
  const [lastEntries, setLastEntries] = useState<{ id: string; entries: LedgerEntryResponse[] } | null>(null);

  async function load() {
    setError("");
    try {
      const res = await scanPendingSettlements(100);
      setCandidates(res.candidates);
      setScanned(res.scanned);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't scan settlements.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function settle(voId: string) {
    setActionError("");
    setLastEntries(null);
    setSettling(voId);
    try {
      const entries = await settleVendorOrder(voId);
      setLastEntries({ id: voId, entries });
      setCandidates((prev) => prev?.filter((c) => c.vendorOrder.id !== voId) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Settlement failed.") : "Network error.");
    } finally {
      setSettling(null);
    }
  }

  if (error) {
    return <ErrorState title="Settlement queue unavailable." description={error} onRetry={load} />;
  }

  if (!candidates) return <ListSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      {lastEntries && (
        <Card title="Settlement posted">
          <p className="text-xs text-stone-500">Vendor order {lastEntries.id.slice(0, 8)}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {lastEntries.entries.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="text-stone-600">
                  {e.category} · {e.balance_type}
                </span>
                <span className="font-semibold text-stone-900 shrink-0">
                  {e.entry_type === "credit" ? "+" : "-"}
                  {formatMoney(e.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {candidates.length === 0 ? (
        <EmptyState
          icon="fa-bank"
          title="Queue is clear"
          description={`Scanned ${scanned} recent orders. Delivered vendor orders awaiting settlement will appear here.`}
        />
      ) : (
        <>
          <p className="text-sm text-stone-500">
            {candidates.length} awaiting settlement (from {scanned} recent orders)
          </p>
          <ul className="space-y-2.5">
            {candidates.map(({ order, vendorOrder }) => (
              <li key={vendorOrder.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-900">
                    Order {order.order_number} · {vendorOrder.store_name ?? "Vendor"}
                  </span>
                  <Badge tone="warning">Delivered</Badge>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Subtotal {formatMoney(vendorOrder.subtotal)} · delivered{" "}
                  {formatDateTime(order.updated_at)}
                </p>
                <Button size="sm" className="mt-2.5" loading={settling === vendorOrder.id} onClick={() => settle(vendorOrder.id)}>
                  Run settlement
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function SettlementQueuePage() {
  return (
    <div>
      <PageHeader title="Settlement queue" description="Delivered orders awaiting payout splits." />
      <RequireAuth>
        <SettlementBody />
      </RequireAuth>
    </div>
  );
}
