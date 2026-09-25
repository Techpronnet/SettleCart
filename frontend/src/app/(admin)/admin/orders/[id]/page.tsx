"use client";

import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  friendlyApiMessage,
  getAnyOrder,
  getOrderPayments,
  settleVendorOrder,
  type OrderResponse,
  type PaymentTransactionResponse,
} from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";
import { vendorOrderLabel } from "@/lib/vendor";

function OrderDetailsBody({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [payments, setPayments] = useState<PaymentTransactionResponse[] | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [settling, setSettling] = useState<string | null>(null);

  async function load() {
    setError("");
    try {
      const o = await getAnyOrder(orderId);
      setOrder(o);
      try {
        setPayments(await getOrderPayments(orderId));
      } catch {
        setPayments([]);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this order.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function settle(vendorOrderId: string) {
    setActionError("");
    setSettling(vendorOrderId);
    try {
      await settleVendorOrder(vendorOrderId);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Settlement failed.") : "Network error.");
    } finally {
      setSettling(null);
    }
  }

  if (error) {
    return <ErrorState title="Order unavailable." description={error} onRetry={load} />;
  }

  if (!order) return <ListSkeleton rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone={orderStatusTone(order.status.toUpperCase())}>
          {customerOrderLabel(order.status.toUpperCase())}
        </Badge>
        <span className="text-sm font-bold text-stone-900">{formatMoney(order.total)}</span>
        <span className="ml-auto text-xs text-stone-400">{formatDateTime(order.created_at)}</span>
      </div>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      <Card title="Money">
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-stone-500 text-xs">Subtotal</dt>
            <dd className="font-semibold text-stone-900">{formatMoney(order.subtotal)}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs">Delivery fee</dt>
            <dd className="font-semibold text-stone-900">{formatMoney(order.delivery_fee)}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs">Platform fee</dt>
            <dd className="font-semibold text-stone-900">{formatMoney(order.platform_fee)}</dd>
          </div>
          <div>
            <dt className="text-stone-500 text-xs">Total</dt>
            <dd className="font-bold text-stone-900">{formatMoney(order.total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-stone-500">
          {order.delivery_address}, {order.delivery_city} · {order.delivery_phone}
        </p>
      </Card>

      <Card title="Payments">
        {payments === null ? (
          <ListSkeleton rows={1} />
        ) : payments.length === 0 ? (
          <p className="text-sm text-stone-500">No payment transactions recorded for this order.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 rounded-lg border border-stone-100 p-3">
                <span className="text-stone-600">
                  {p.provider} · <span className="text-stone-400">{p.reference}</span>
                </span>
                <Badge tone={p.status === "success" ? "success" : p.status === "failed" ? "danger" : "warning"}>
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {order.vendor_orders.map((vo) => (
        <Card
          key={vo.id}
          title={vo.store_name ?? "Vendor order"}
          action={<Badge tone="info">{vendorOrderLabel(vo.status)}</Badge>}
        >
          <ul className="space-y-1.5 text-sm">
            {vo.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="text-stone-600">
                  {item.product_name} <span className="text-stone-400">× {item.quantity}</span>
                </span>
                <span className="font-semibold text-stone-900 shrink-0">{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          {vo.status === "delivered" && (
            <Button
              size="sm"
              className="mt-3"
              loading={settling === vo.id}
              onClick={() => settle(vo.id)}
            >
              Run settlement
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}

export default function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <PageHeader title="Order details" breadcrumbs={[{ label: "Orders", href: "/admin/orders" }, { label: "Details" }]} />
      <RequireAuth>
        <OrderDetailsBody orderId={id} />
      </RequireAuth>
    </div>
  );
}
