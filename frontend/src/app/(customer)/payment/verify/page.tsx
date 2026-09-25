"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ApiError, verifyPayment } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type State =
  | { kind: "working" }
  | { kind: "success"; orderId: string | null; amount: string }
  | { kind: "failed"; message: string };

function VerifyBody() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") ?? searchParams.get("trxref") ?? "";
  const orderParam = searchParams.get("order");
  const [state, setState] = useState<State>({ kind: "working" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!reference) {
        setState({ kind: "failed", message: "No payment reference was returned." });
        return;
      }
      const storedOrder =
        orderParam ?? window.sessionStorage.getItem("settlecart_last_order");
      try {
        const tx = await verifyPayment(reference);
        if (cancelled) return;
        if (tx.status === "success") {
          setState({ kind: "success", orderId: storedOrder ?? tx.order_id, amount: tx.amount });
        } else {
          setState({
            kind: "failed",
            message: `Payment ${tx.status}. No money was taken that we can confirm.`,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "failed",
            message:
              err instanceof ApiError ? err.message : "We couldn't confirm this payment yet.",
          });
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [reference, orderParam]);

  return (
    <div>
      <PageHeader title="Payment" breadcrumbs={[{ label: "Checkout", href: "/checkout" }, { label: "Payment" }]} />
      {state.kind === "working" && <ListSkeleton rows={2} />}
      {state.kind === "success" && (
        <Card title="Payment confirmed">
          <p className="text-sm text-stone-600">
            {formatMoney(state.amount)} received. Vendors have been notified and will start
            preparing your order.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            {state.orderId && (
              <Link
                href={`/orders/${state.orderId}?new=1`}
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
              >
                Track Order
              </Link>
            )}
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
            >
              Continue Shopping
            </Link>
          </div>
        </Card>
      )}
      {state.kind === "failed" && (
        <Card title="Payment failed">
          <p className="text-sm text-stone-600">{state.message}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/cart"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
            >
              Retry from cart
            </Link>
            <Link
              href="/orders"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
            >
              View orders
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <VerifyBody />
    </Suspense>
  );
}
