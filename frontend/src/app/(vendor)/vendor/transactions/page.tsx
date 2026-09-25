"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, getMyLedger, type LedgerEntryResponse } from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";

const PAGE_SIZE = 15;

const CATEGORY_LABELS: Record<string, string> = {
  vendor_earnings: "Sale",
  dispatch_earnings: "Dispatch",
  platform_fee: "Fee",
  withdrawal: "Withdrawal",
  refund: "Refund",
  adjustment: "Adjustment",
};

function TransactionsBody() {
  const [entries, setEntries] = useState<LedgerEntryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage: number) {
    setLoading(true);
    setError("");
    try {
      const res = await getMyLedger(nextPage, 60);
      setEntries(res.entries);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1);
  }, []);

  const visible =
    typeFilter === "all" ? entries : entries.filter((e) => e.category === typeFilter);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const paged = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <label className="text-sm text-stone-700">
        Type{" "}
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="ml-1 rounded-md border border-stone-300 bg-white px-2.5 py-2 text-sm min-h-[44px]"
        >
          <option value="all">All types</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3">
        {loading ? (
          <ListSkeleton rows={5} />
        ) : error ? (
          <ErrorState title="Transactions unavailable." description={error} onRetry={() => load(1)} />
        ) : paged.length === 0 ? (
          <EmptyState icon="fa-exchange" title="No transactions yet" description="Sales, fees and payouts will appear here." />
        ) : (
          <>
            <ul className="space-y-2.5">
              {paged.map((e) => (
                <li key={e.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={e.entry_type === "credit" ? "success" : "neutral"}>
                      {CATEGORY_LABELS[e.category] ?? e.category}
                    </Badge>
                    <span className={`text-sm font-bold ${e.entry_type === "credit" ? "text-emerald-800" : "text-stone-900"}`}>
                      {e.entry_type === "credit" ? "+" : "-"}
                      {formatMoney(e.amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500 truncate">{e.description}</p>
                  <p className="text-xs text-stone-400">
                    {formatDateTime(e.created_at)} · {e.balance_type}
                  </p>
                </li>
              ))}
            </ul>
            <Pagination page={page} totalPages={totalPages} onChange={load} />
          </>
        )}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <div>
      <PageHeader title="Transactions" description="Every movement in your wallet." />
      <RequireAuth>
        <TransactionsBody />
      </RequireAuth>
    </div>
  );
}
