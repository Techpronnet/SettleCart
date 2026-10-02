"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { OrderReviewCard } from "@/components/customer/Reviews";
import { OrderDisputeCard } from "@/components/customer/DisputeCard";
import {
  ApiError,
  getOrder,
  initializePayment,
  type OrderResponse,
} from "@/lib/api";
import { customerOrderLabel, orderStatusTone } from "@/lib/status";
import { formatMoney, formatDateTime } from "@/lib/format";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

const LIFECYCLE = [
  "created",
  "payment_confirmed",
  "processing",
  "ready_for_pickup",
  "dispatch_assigned",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "settled",
];

function OrderBody({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getOrder(id)
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Order not found.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function payAgain() {
    if (!order) return;
    setPayError("");
    setPaying(true);
    try {
      const payment = await initializePayment({
        order_id: order.id,
        callback_url: `${APP_URL}/payment/verify?order=${order.id}`,
      });
      try {
        window.sessionStorage.setItem("settlecart_last_order", order.id);
      } catch {
        // non-fatal
      }
      window.location.assign(payment.authorization_url);
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : "Could not start payment.");
      setPaying(false);
    }
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Order" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Details" }]} />
        <ErrorState title="We couldn't load this order." description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <PageHeader title="Order" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Details" }]} />
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const needsPayment = order.status === "payment_pending" || order.status === "payment_failed";
  const reached = LIFECYCLE.indexOf(order.status);

  return (
    <div>
      <PageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${formatDateTime(order.created_at)}`}
        breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: order.order_number }]}
      />

      {isNew && (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Order placed successfully.</p>
          <p className="mt-0.5 text-sm text-emerald-800">
            Payment confirmed. Vendors are preparing your items.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={orderStatusTone(order.status.toUpperCase())}>
          {customerOrderLabel(order.status.toUpperCase())}
        </Badge>
        <span className="text-sm font-bold text-stone-900">{formatMoney(order.total)}</span>
      </div>

      {needsPayment && (
        <Card title="Payment needed">
          {payError && (
            <p role="alert" className="mb-3 text-xs text-red-700">
              {payError}
            </p>
          )}
          <Button onClick={payAgain} loading={paying}>
            Pay {formatMoney(order.total)} now
          </Button>
        </Card>
      )}

      <div className="mt-4 space-y-4">
        <Card title="Progress">
          <ol className="flex flex-col md:flex-row md:items-start md:gap-0 md:overflow-x-auto md:pb-1">
            {LIFECYCLE.map((step, i) => {
              const done = reached >= 0 && i <= reached;
              const current = reached === i;
              return (
                <li key={step} className="flex md:flex-col md:items-center md:flex-1 md:min-w-[104px] gap-3 md:gap-0">
                  <span className="flex flex-col md:flex-row md:items-center md:w-full" aria-hidden="true">
                    <span
                      className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        done ? "bg-teal-600 border-teal-600" : "bg-white border-stone-300"
                      }`}
                    />
                    {i < LIFECYCLE.length - 1 && (
                      <span
                        className={`w-0.5 h-5 ml-[7px] md:ml-0 md:w-full md:h-0.5 md:mt-0 ${
                          done ? "bg-teal-600" : "bg-stone-200"
                        }`}
                      />
                    )}
                  </span>
                  <span
                    className={`pb-4 md:pb-0 md:pt-1.5 md:text-center md:text-xs text-sm ${
                      current ? "font-semibold text-stone-900" : done ? "text-stone-700" : "text-stone-400"
                    }`}
                  >
                    {customerOrderLabel(step.toUpperCase())}
                    {current && " (current)"}
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>

        {order.vendor_orders.map((vo) => (
          <Card
            key={vo.id}
            title={vo.store_name ?? "Vendor order"}
            action={
              <Badge tone={orderStatusTone(vo.status.toUpperCase())}>
                {customerOrderLabel(vo.status.toUpperCase())}
              </Badge>
            }
          >
            <ul className="space-y-2 text-sm">
              {vo.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="text-stone-600">
                    {item.product_name} <span className="text-stone-400">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-stone-900 shrink-0">{formatMoney(item.subtotal)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card title="Delivery">
          <p className="text-sm text-stone-600">{order.delivery_address}</p>
          <p className="text-sm text-stone-600">
            {order.delivery_city} · {order.delivery_phone}
          </p>
          {order.notes && <p className="mt-1 text-xs text-stone-500">Note: {order.notes}</p>}
          <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
            <Link
              href={`/tracking/${order.id}`}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
            >
              Track delivery
            </Link>
            <Link
              href={`/verification/${order.id}`}
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
            >
              Delivery code
            </Link>
          </div>
        </Card>

        {(order.status === "delivered" || order.status === "settled") &&
          order.vendor_orders.length > 0 &&
          order.vendor_orders[0].items.length > 0 && (
            <OrderReviewCard
              orderId={order.id}
              orderNumber={order.order_number}
              productId={order.vendor_orders[0].items[0].product_id}
              productName={order.vendor_orders[0].items[0].product_name}
              store={order.vendor_orders[0].store_name ?? "Store"}
            />
          )}

        <OrderDisputeCard
          orderId={order.id}
          orderNumber={order.order_number}
          currentStatus={order.status}
          orderNotes={order.notes}
          onDisputed={() => {
            getOrder(id).then(setOrder).catch(() => {});
          }}
        />
      </div>
    </div>
  );
}

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <OrderBody id={id} />
      </Suspense>
    </RequireAuth>
  );
}
