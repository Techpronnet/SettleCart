"use client";

import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  friendlyApiMessage,
  listVendorOrders,
  updateVendorOrderStatus,
  type VendorOrderResponse,
} from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";
import { formatMoney, formatDateTime } from "@/lib/format";
import {
  VENDOR_ACTION_STATUS,
  vendorOrderActions,
  vendorOrderLabel,
  type VendorOrderAction,
} from "@/lib/vendor";

const ACTION_COPY: Record<VendorOrderAction, { label: string; confirm: string }> = {
  accept: { label: "Accept order", confirm: "Start preparing" },
  reject: { label: "Decline order", confirm: "Decline" },
  prepare: { label: "Start preparing", confirm: "Start preparing" },
  ready: { label: "Mark ready for pickup", confirm: "Mark ready" },
};

function OrderBody({ storeId, orderId }: { storeId: string; orderId: string }) {
  const [order, setOrder] = useState<VendorOrderResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<VendorOrderAction | null>(null);
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    try {
      const orders = await listVendorOrders(storeId, 1, 100);
      const found = orders.find((o) => o.id === orderId) ?? null;
      if (!found) {
        setMissing(true);
        return;
      }
      setOrder(found);
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

  async function confirmAction() {
    if (!pendingAction) return;
    setActionError("");
    setWorking(true);
    try {
      const updated = await updateVendorOrderStatus(orderId, VENDOR_ACTION_STATUS[pendingAction]);
      setOrder(updated);
      setPendingAction(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Action failed.") : "Network error."
      );
      setPendingAction(null);
    } finally {
      setWorking(false);
    }
  }

  if (missing) {
    return <ErrorState title="Order not found." description="It may belong to another store." />;
  }

  if (error) {
    return <ErrorState title="Order unavailable." description={error} onRetry={load} />;
  }

  if (!order) return <ListSkeleton rows={3} />;

  const actions = vendorOrderActions(order.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge tone={order.status === "pending" ? "warning" : "info"}>
          {vendorOrderLabel(order.status)}
        </Badge>
        <span className="text-sm font-bold text-stone-900">{formatMoney(order.subtotal)}</span>
        <span className="ml-auto text-xs text-stone-400">{formatDateTime(order.created_at)}</span>
      </div>

      {actionError && (
        <p role="alert" className="text-xs text-red-700">
          {actionError}
        </p>
      )}

      {actions.length > 0 && (
        <Card title="Fulfillment">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {actions.map((action, i) => (
              <Button
                key={action}
                variant={i === 0 ? "primary" : "secondary"}
                onClick={() => setPendingAction(action)}
              >
                {ACTION_COPY[action].label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Once marked ready, the platform creates the delivery task for dispatch.
          </p>
        </Card>
      )}

      {order.status === "ready_for_pickup" && (
        <Card title="Ready for pickup">
          <p className="text-sm text-stone-600">
            Package is waiting. Dispatch will collect it from your store address.
          </p>
        </Card>
      )}

      <Card title={`Items (${order.items.reduce((s, i) => s + i.quantity, 0)})`}>
        <ul className="space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span className="text-stone-600">
                {item.product_name} <span className="text-stone-400">× {item.quantity}</span>
              </span>
              <span className="font-semibold text-stone-900 shrink-0">{formatMoney(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-stone-100 pt-3 text-sm">
          <span className="font-semibold text-stone-900">Subtotal</span>
          <span className="font-bold text-stone-900">{formatMoney(order.subtotal)}</span>
        </div>
      </Card>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? ACTION_COPY[pendingAction].label : ""}
        description={
          pendingAction === "reject"
            ? "The customer will be notified that you declined this order."
            : "Confirm this fulfillment step."
        }
        confirmLabel={pendingAction ? ACTION_COPY[pendingAction].confirm : "Confirm"}
        onConfirm={confirmAction}
        onCancel={() => setPendingAction(null)}
      />
      {working && <span className="sr-only" role="status">Working…</span>}
    </div>
  );
}

function OrderGate({ orderId }: { orderId: string }) {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <OrderBody storeId={ctx.storeId} orderId={orderId} />;
}

export default function VendorOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <PageHeader title="Order details" breadcrumbs={[{ label: "Orders", href: "/vendor/orders" }, { label: "Details" }]} />
      <RequireAuth>
        <OrderGate orderId={id} />
      </RequireAuth>
    </div>
  );
}
