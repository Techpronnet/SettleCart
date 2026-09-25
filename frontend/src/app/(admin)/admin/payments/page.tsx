"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, getOrderPayments, type PaymentTransactionResponse } from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";

function PaymentsBody() {
  const [orderId, setOrderId] = useState("");
  const [payments, setPayments] = useState<PaymentTransactionResponse[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    if (!orderId.trim()) {
      setError("Enter an order ID.");
      return;
    }
    setLoading(true);
    try {
      setPayments(await getOrderPayments(orderId.trim()));
    } catch (err) {
      setPayments(null);
      setError(err instanceof ApiError ? err.message : "Lookup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card title="Find payments by order">
        <form onSubmit={lookup} className="flex gap-2">
          <Input label="Order ID" name="orderId" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order UUID" />
          <div className="flex items-end">
            <Button type="submit" loading={loading}>
              Look up
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

      {payments !== null && !loading && (
        <Card title={`Transactions (${payments.length})`}>
          {payments.length === 0 ? (
            <p className="text-sm text-stone-500">No payment transactions for this order.</p>
          ) : (
            <ul className="space-y-2.5">
              {payments.map((p) => (
                <li key={p.id} className="rounded-lg border border-stone-100 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-stone-900">{formatMoney(p.amount)} {p.currency}</span>
                    <Badge tone={p.status === "success" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">Ref: {p.reference}</p>
                  <p className="text-xs text-stone-500">
                    {p.provider}
                    {p.channel ? ` · ${p.channel}` : ""} · {formatDateTime(p.created_at)}
                  </p>
                  {p.paid_at && <p className="text-xs text-stone-500">Paid {formatDateTime(p.paid_at)}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <div>
      <PageHeader title="Payments" description="Transaction lookup per order." />
      <RequireAuth>
        <PaymentsBody />
      </RequireAuth>
    </div>
  );
}
