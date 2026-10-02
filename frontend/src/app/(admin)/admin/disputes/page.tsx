"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  friendlyApiMessage,
  listAllOrders,
  resolveDispute,
  type OrderResponse,
} from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

type DisputeTab = "disputed" | "refunded";

function DisputesBody() {
  const [tab, setTab] = useState<DisputeTab>("disputed");
  const [orders, setOrders] = useState<OrderResponse[] | null>(null);
  const [error, setError] = useState("");
  const [activeResolvingId, setActiveResolvingId] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"refund" | "dismiss">("refund");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  async function load(status: DisputeTab = tab) {
    setError("");
    setOrders(null);
    try {
      const res = await listAllOrders(status, 1, 30);
      setOrders(res.orders);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load disputes.");
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function handleStartResolve(order: OrderResponse, action: "refund" | "dismiss") {
    setActiveResolvingId(order.id);
    setResolutionAction(action);
    setResolutionNotes("");
    setActionError("");
  }

  async function handleConfirmResolve(orderId: string) {
    setActionError("");
    setSubmitting(true);
    try {
      await resolveDispute(orderId, resolutionAction, resolutionNotes.trim() || null);
      setActiveResolvingId(null);
      setResolutionNotes("");
      await load(tab);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Dispute resolution failed.") : "Network error."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setTab("disputed")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "disputed"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <i className="fa fa-gavel text-xs" aria-hidden="true" />
          <span>Active Disputes</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("refunded")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            tab === "refunded"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <i className="fa fa-undo text-xs" aria-hidden="true" />
          <span>Resolved & Refunded</span>
        </button>
      </div>

      {error ? (
        <ErrorState title="Disputes unavailable." description={error} onRetry={() => load(tab)} />
      ) : !orders ? (
        <ListSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={tab === "disputed" ? "fa-shield" : "fa-check-circle"}
          title={tab === "disputed" ? "No active disputes" : "No refunded orders"}
          description={
            tab === "disputed"
              ? "All customer problem reports and order escalations have been resolved."
              : "Orders resolved with a full refund will appear here for audit history."
          }
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const isResolving = activeResolvingId === o.id;

            return (
              <li key={o.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-base font-semibold text-stone-900 hover:underline"
                      >
                        Order {o.order_number}
                      </Link>
                      <Badge tone={orderStatusTone(o.status.toUpperCase())}>
                        {customerOrderLabel(o.status.toUpperCase())}
                      </Badge>
                    </div>
                    <p className="text-xs text-stone-500">
                      Filed {formatDateTime(o.updated_at || o.created_at)} · {o.delivery_city}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-stone-900">{formatMoney(o.total)}</p>
                    <p className="text-xs text-stone-500">{o.vendor_orders.length} vendor item(s)</p>
                  </div>
                </div>

                {/* Dispute Statement / Audit Log */}
                {o.notes && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-sm text-stone-800">
                    <div className="flex items-center gap-1.5 font-medium text-amber-900 text-xs uppercase tracking-wider mb-1">
                      <i className="fa fa-comment-o text-amber-700" aria-hidden="true" />
                      Dispute Case Statement
                    </div>
                    <p className="text-xs text-stone-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {o.notes}
                    </p>
                  </div>
                )}

                {/* Inline Action Bar / Resolver */}
                {tab === "disputed" && (
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    {!isResolving ? (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
                        >
                          View order details <i className="fa fa-arrow-right text-[10px]" aria-hidden="true" />
                        </Link>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStartResolve(o, "dismiss")}
                          >
                            <i className="fa fa-times mr-1 text-stone-500" aria-hidden="true" />
                            Dismiss Dispute
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStartResolve(o, "refund")}
                          >
                            <i className="fa fa-undo mr-1" aria-hidden="true" />
                            Issue Refund
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                            {resolutionAction === "refund"
                              ? "Approve Customer Refund"
                              : "Dismiss Dispute Claim"}
                          </span>
                          <span className="text-xs text-stone-500">
                            Order {o.order_number}
                          </span>
                        </div>

                        {actionError && (
                          <p role="alert" className="text-xs text-red-700">
                            {actionError}
                          </p>
                        )}

                        <div>
                          <label
                            htmlFor={`notes-${o.id}`}
                            className="block text-xs font-medium text-stone-700 mb-1"
                          >
                            Mediation / Audit Notes (optional)
                          </label>
                          <textarea
                            id={`notes-${o.id}`}
                            rows={2}
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder={
                              resolutionAction === "refund"
                                ? "E.g., Vendor confirmed non-delivery. Full refund processed."
                                : "E.g., Vendor provided delivery proof with recipient signature."
                            }
                            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-stone-900"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveResolvingId(null)}
                            disabled={submitting}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            loading={submitting}
                            onClick={() => handleConfirmResolve(o.id)}
                          >
                            {resolutionAction === "refund" ? "Confirm Full Refund" : "Confirm Dismissal"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tab === "refunded" && (
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      Refund status logged in double-entry ledger.
                    </span>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1"
                    >
                      Audit details <i className="fa fa-arrow-right text-[10px]" aria-hidden="true" />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DisputesPage() {
  return (
    <div>
      <PageHeader
        title="Disputes & Mediation"
        description="Mediate customer order disputes, review vendor context, and execute refunds."
      />
      <RequireAuth>
        <DisputesBody />
      </RequireAuth>
    </div>
  );
}
