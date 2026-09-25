"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  getTrackingSummary,
  getVerificationCode,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface CodeRow {
  taskId: string;
  code: string;
  expiresAt: string;
}

function VerificationBody({ orderId }: { orderId: string }) {
  const [codes, setCodes] = useState<CodeRow[] | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const summary = await getTrackingSummary(orderId);
        if (cancelled) return;
        setOrderNumber(summary.order_number);
        const taskIds = summary.delivery_tasks
          .map((t) => {
            const id = t["id"] ?? t["task_id"];
            return typeof id === "string" ? id : "";
          })
          .filter(Boolean);
        if (taskIds.length === 0) {
          setCodes([]);
          return;
        }
        const settled = await Promise.allSettled(taskIds.map((id) => getVerificationCode(id)));
        if (cancelled) return;
        setCodes(
          settled.flatMap((r, i) =>
            r.status === "fulfilled"
              ? [{ taskId: taskIds[i], code: r.value.verification_code, expiresAt: r.value.expires_at }]
              : []
          )
        );
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "Code is unavailable right now.");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <div>
        <PageHeader title="Delivery code" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Code" }]} />
        <ErrorState title="We couldn't load your code." description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (codes === null) {
    return (
      <div>
        <PageHeader title="Delivery code" breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Code" }]} />
        <ListSkeleton rows={2} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Your order is here"
        breadcrumbs={[
          { label: "Orders", href: "/orders" },
          { label: orderNumber || "Order", href: `/orders/${orderId}` },
          { label: "Code" },
        ]}
      />

      {codes.length === 0 ? (
        <Card title="No code yet">
          <p className="text-sm text-stone-600">
            Your verification code appears once a rider picks up your order and heads your way.
          </p>
          <Link
            href={`/tracking/${orderId}`}
            className="mt-4 inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
          >
            Track delivery
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {codes.map((row, i) => (
            <Card key={row.taskId} title={codes.length > 1 ? `Delivery ${i + 1}` : "Delivery verification code"}>
              <p className="text-sm text-stone-600">
                Give this code to your assigned rider. Do not share it before your order arrives.
              </p>
              <p
                aria-label={`Delivery verification code ${row.code}`}
                className="mt-3 rounded-xl bg-stone-950 py-5 text-center text-3xl font-bold tracking-[0.35em] text-white"
              >
                {row.code}
              </p>
              <p className="mt-2 text-xs text-stone-500">
                Expires {formatDateTime(row.expiresAt)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VerificationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  return (
    <RequireAuth>
      <VerificationBody orderId={orderId} />
    </RequireAuth>
  );
}
