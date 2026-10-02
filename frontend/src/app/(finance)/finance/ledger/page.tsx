"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  getAnyOrder,
  getOrderPayments,
  listAdminLedger,
  type AdminLedgerEntryResponse,
} from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";
import { vendorOrderLabel } from "@/lib/vendor";

interface Trace {
  orderNumber: string;
  total: string;
  platformFee: string;
  subtotal: string;
  vendorOrders: { id: string; store: string; status: string; subtotal: string }[];
  payments: { reference: string; status: string; amount: string }[];
}

const PAGE_SIZE = 20;

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "order_settlement", label: "Order Settlement" },
  { value: "delivery_fee", label: "Delivery Fee" },
  { value: "platform_fee", label: "Platform Fee" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "refund", label: "Refund" },
  { value: "adjustment", label: "Adjustment" },
];

function formatCategory(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function roleTone(role: string): "neutral" | "info" | "success" | "warning" {
  switch (role?.toLowerCase()) {
    case "vendor":
      return "info";
    case "rider":
      return "warning";
    case "admin":
      return "neutral";
    default:
      return "neutral";
  }
}

function LedgerBody() {
  const [activeTab, setActiveTab] = useState<"journal" | "trace">("journal");

  // Journal state
  const [entries, setEntries] = useState<AdminLedgerEntryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("all");
  const [entryType, setEntryType] = useState<"all" | "credit" | "debit">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Trace state
  const [orderId, setOrderId] = useState("");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [traceError, setTraceError] = useState("");
  const [traceLoading, setTraceLoading] = useState(false);

  async function loadLedger(nextPage: number = page) {
    setLoading(true);
    setError("");
    try {
      const res = await listAdminLedger({
        page: nextPage,
        size: PAGE_SIZE,
        category: category !== "all" ? category : undefined,
        entry_type: entryType !== "all" ? entryType : undefined,
        search: search.trim() || undefined,
      });
      setEntries(res.entries);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load ledger records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, entryType]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadLedger(1);
  }

  async function inspect(e: React.FormEvent) {
    e.preventDefault();
    setTraceError("");
    if (!orderId.trim()) {
      setTraceError("Enter an order ID.");
      return;
    }
    setTraceLoading(true);
    try {
      const [order, payments] = await Promise.all([
        getAnyOrder(orderId.trim()),
        getOrderPayments(orderId.trim()).catch(() => []),
      ]);
      setTrace({
        orderNumber: order.order_number,
        total: order.total,
        platformFee: order.platform_fee,
        subtotal: order.subtotal,
        vendorOrders: order.vendor_orders.map((vo) => ({
          id: vo.id,
          store: vo.store_name ?? "Vendor",
          status: vo.status,
          subtotal: vo.subtotal,
        })),
        payments: payments.map((p) => ({ reference: p.reference, status: p.status, amount: p.amount })),
      });
    } catch (err) {
      setTrace(null);
      setTraceError(err instanceof ApiError ? err.message : "Inspection failed.");
    } finally {
      setTraceLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "journal"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <i className="fa fa-book text-xs" aria-hidden="true" />
          <span>Global Journal ({total})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trace")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "trace"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <i className="fa fa-crosshairs text-xs" aria-hidden="true" />
          <span>Order Settlement Trace</span>
        </button>
      </div>

      {activeTab === "journal" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 mr-1">
                  Type:
                </span>
                {(["all", "credit", "debit"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEntryType(t)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      entryType === t
                        ? "bg-stone-900 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {t === "all" ? "All" : t === "credit" ? "Credits" : "Debits"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="ledger-category" className="text-xs text-stone-500 shrink-0">
                  Category:
                </label>
                <select
                  id="ledger-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-800 focus-visible:outline-2 focus-visible:outline-stone-900"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference, description, account holder, or email..."
                className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus-visible:outline-2 focus-visible:outline-stone-900"
              />
              <Button type="submit" size="sm" variant="secondary">
                <i className="fa fa-search mr-1 text-stone-500" aria-hidden="true" />
                Filter
              </Button>
            </form>
          </div>

          {/* Ledger Table / List */}
          {error ? (
            <ErrorState title="Ledger unavailable." description={error} onRetry={() => loadLedger(1)} />
          ) : loading ? (
            <ListSkeleton rows={5} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon="fa-book"
              title="No ledger entries found"
              description="No financial journal entries matched your current filter criteria."
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Ref</th>
                      <th className="py-3 px-4">Stakeholder</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {entries.map((entry) => {
                      const isCredit = entry.entry_type === "credit";
                      return (
                        <tr key={entry.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 align-top">
                            <span className="font-mono text-stone-500 block truncate max-w-[140px]" title={entry.reference}>
                              {entry.reference}
                            </span>
                            <span className="text-[11px] text-stone-400">
                              {formatDateTime(entry.created_at)}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-stone-900 truncate max-w-[130px]">
                                {entry.user_name || "Account"}
                              </span>
                              <Badge tone={roleTone(entry.user_role)}>
                                {entry.user_role}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-stone-400 block truncate max-w-[180px]">
                              {entry.user_email}
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top">
                            <div className="flex items-center gap-1.5">
                              <Badge tone={isCredit ? "success" : "neutral"}>
                                {isCredit ? "Credit" : "Debit"}
                              </Badge>
                              <span className="text-stone-600 font-medium">
                                {formatCategory(entry.category)}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-0.5 capitalize">
                              {entry.balance_type} balance
                            </span>
                          </td>
                          <td className="py-3 px-4 align-top text-stone-600 max-w-xs">
                            <p className="line-clamp-2">{entry.description}</p>
                          </td>
                          <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                            <span
                              className={`text-sm font-bold ${
                                isCredit ? "text-emerald-700" : "text-stone-900"
                              }`}
                            >
                              {isCredit ? "+" : "-"} {formatMoney(entry.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden space-y-2.5">
                {entries.map((entry) => {
                  const isCredit = entry.entry_type === "credit";
                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Badge tone={isCredit ? "success" : "neutral"}>
                              {isCredit ? "Credit" : "Debit"}
                            </Badge>
                            <span className="text-xs font-semibold text-stone-900">
                              {formatCategory(entry.category)}
                            </span>
                          </div>
                          <span className="mt-1 font-mono text-[11px] text-stone-400 block truncate max-w-[180px]">
                            {entry.reference}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-bold block ${
                              isCredit ? "text-emerald-700" : "text-stone-900"
                            }`}
                          >
                            {isCredit ? "+" : "-"} {formatMoney(entry.amount)}
                          </span>
                          <span className="text-[10px] text-stone-400 capitalize">
                            {entry.balance_type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600">{entry.description}</p>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                        <span>
                          {entry.user_name} ({entry.user_role})
                        </span>
                        <span>{formatDateTime(entry.created_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Pagination page={page} totalPages={totalPages} onChange={(p) => loadLedger(p)} />
            </>
          )}
        </div>
      )}

      {activeTab === "trace" && (
        <div className="space-y-4">
          <Card title="Trace an order">
            <form onSubmit={inspect} className="flex gap-2">
              <Input
                label="Order ID"
                name="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order UUID"
              />
              <div className="flex items-end">
                <Button type="submit" loading={traceLoading}>
                  Trace
                </Button>
              </div>
            </form>
            {traceError && (
              <p role="alert" className="mt-3 text-xs text-red-700">
                {traceError}
              </p>
            )}
          </Card>

          {traceLoading && <ListSkeleton rows={2} />}

          {trace && !traceLoading && (
            <Card title={`Settlement trace · Order ${trace.orderNumber}`}>
              <dl className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-stone-500">Gross</dt>
                  <dd className="font-bold text-stone-900">{formatMoney(trace.total)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Platform fee</dt>
                  <dd className="font-semibold text-stone-900">{formatMoney(trace.platformFee)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">To vendors</dt>
                  <dd className="font-semibold text-stone-900">{formatMoney(trace.subtotal)}</dd>
                </div>
              </dl>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Vendor splits
              </h3>
              <ul className="mt-1.5 space-y-1.5 text-sm">
                {trace.vendorOrders.map((vo) => (
                  <li key={vo.id} className="flex items-center justify-between gap-2">
                    <span className="text-stone-600 truncate">
                      {vo.store} · <span className="text-stone-400">{vendorOrderLabel(vo.status)}</span>
                    </span>
                    <span className="font-semibold text-stone-900 shrink-0">
                      {formatMoney(vo.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
                Payments
              </h3>
              {trace.payments.length === 0 ? (
                <p className="mt-1 text-sm text-stone-500">No recorded payments.</p>
              ) : (
                <ul className="mt-1.5 space-y-1.5 text-sm">
                  {trace.payments.map((p) => (
                    <li key={p.reference} className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 truncate">{p.reference}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <Badge tone={p.status === "success" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                        <span className="font-semibold text-stone-900">{formatMoney(p.amount)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function LedgerExplorerPage() {
  return (
    <div>
      <PageHeader
        title="Ledger Explorer"
        description="Authoritative platform-wide double-entry money trail and order settlement traces."
      />
      <RequireAuth>
        <LedgerBody />
      </RequireAuth>
    </div>
  );
}
