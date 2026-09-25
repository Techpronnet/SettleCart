"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PendingBackendState } from "@/components/admin/AdminBits";
import { ApiError, getAnyOrder, getOrderPayments } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { vendorOrderLabel } from "@/lib/vendor";

interface Trace {
  orderNumber: string;
  total: string;
  platformFee: string;
  subtotal: string;
  vendorOrders: { id: string; store: string; status: string; subtotal: string }[];
  payments: { reference: string; status: string; amount: string }[];
}

function LedgerBody() {
  const [orderId, setOrderId] = useState("");
  const [trace, setTrace] = useState<Trace | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function inspect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!orderId.trim()) {
      setError("Enter an order ID.");
      return;
    }
    setLoading(true);
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
      setError(err instanceof ApiError ? err.message : "Inspection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Trace an order">
        <form onSubmit={inspect} className="flex gap-2">
          <Input label="Order ID" name="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order UUID" />
          <div className="flex items-end">
            <Button type="submit" loading={loading}>
              Trace
            </Button>
          </div>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
      </Card>

      {loading && <ListSkeleton rows={2} />}

      {trace && !loading && (
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
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">Vendor splits</h3>
          <ul className="mt-1.5 space-y-1.5 text-sm">
            {trace.vendorOrders.map((vo) => (
              <li key={vo.id} className="flex items-center justify-between gap-2">
                <span className="text-stone-600 truncate">
                  {vo.store} · <span className="text-stone-400">{vendorOrderLabel(vo.status)}</span>
                </span>
                <span className="font-semibold text-stone-900 shrink-0">{formatMoney(vo.subtotal)}</span>
              </li>
            ))}
          </ul>
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">Payments</h3>
          {trace.payments.length === 0 ? (
            <p className="mt-1 text-sm text-stone-500">No recorded payments.</p>
          ) : (
            <ul className="mt-1.5 space-y-1.5 text-sm">
              {trace.payments.map((p) => (
                <li key={p.reference} className="flex items-center justify-between gap-2">
                  <span className="text-stone-500 truncate">{p.reference}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <Badge tone={p.status === "success" ? "success" : "warning"}>{p.status}</Badge>
                    <span className="font-semibold text-stone-900">{formatMoney(p.amount)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <PendingBackendState
        title="Platform-wide ledger explorer ships with backend support"
        description="A global, read-only ledger view with compensating-entry corrections arrives with the backend ledger endpoint. Until then, trace any order above for its full settlement calculation."
      />
    </div>
  );
}

export default function LedgerExplorerPage() {
  return (
    <div>
      <PageHeader title="Ledger" description="Authoritative money trail, per order." />
      <RequireAuth>
        <LedgerBody />
      </RequireAuth>
    </div>
  );
}
