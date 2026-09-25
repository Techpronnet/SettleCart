"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, getAnyOrder, getOrderPayments } from "@/lib/api";
import { formatMoney } from "@/lib/format";

interface ReconResult {
  orderNumber: string;
  total: string;
  paid: string;
  matched: boolean;
  paymentCount: number;
}

function ReconciliationBody() {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<ReconResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function reconcile(e: React.FormEvent) {
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
      const paid = payments
        .filter((p) => p.status === "success")
        .reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const total = Number(order.total) || 0;
      setResult({
        orderNumber: order.order_number,
        total: order.total,
        paid: String(paid),
        matched: paid >= total && total > 0,
        paymentCount: payments.length,
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Reconciliation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Internal reconciliation">
        <p className="text-sm text-stone-600">
          Compare an order total against its successful payment transactions: matched, missing, or
          amount mismatch.
        </p>
        <form onSubmit={reconcile} className="mt-3 flex gap-2">
          <Input label="Order ID" name="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order UUID" />
          <div className="flex items-end">
            <Button type="submit" loading={loading}>
              Reconcile
            </Button>
          </div>
        </form>
        {error && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {error}
          </p>
        )}
      </Card>

      {loading && <ListSkeleton rows={1} />}

      {result && !loading && (
        <Card title={`Result · Order ${result.orderNumber}`}>
          <div className="flex items-center gap-2">
            <Badge tone={result.matched ? "success" : "danger"}>
              {result.matched ? "Matched" : result.paymentCount === 0 ? "Missing" : "Amount mismatch"}
            </Badge>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-stone-500">Order total</dt>
              <dd className="font-bold text-stone-900">{formatMoney(result.total)}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">Paid (success)</dt>
              <dd className="font-bold text-stone-900">{formatMoney(result.paid)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-stone-500">{result.paymentCount} recorded transactions.</p>
        </Card>
      )}

      <Card title="Provider reconciliation">
        <p className="text-sm text-stone-600">
          Automated provider-versus-ledger comparison (matched, unmatched, duplicate, amount
          mismatch) ships with the backend reconciliation feed. Export transactions below and
          compare against provider statements in the meantime.
        </p>
      </Card>
    </div>
  );
}

export default function ReconciliationPage() {
  return (
    <div>
      <PageHeader title="Reconciliation" description="Orders versus recorded payments." />
      <RequireAuth>
        <ReconciliationBody />
      </RequireAuth>
    </div>
  );
}
