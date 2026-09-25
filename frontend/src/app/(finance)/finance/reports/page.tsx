"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAllOrders } from "@/lib/api";
import { downloadCsv, toCsv } from "@/lib/finance";

const REPORTS = [
  { key: "transactions", label: "Transactions", text: "Orders with totals, fees and statuses." },
  { key: "settlements", label: "Settlements", text: "Vendor-order splits and their states." },
  { key: "refunds", label: "Refunds", text: "Orders pending or given refunds." },
] as const;

function ReportsBody() {
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function exportReport(key: (typeof REPORTS)[number]["key"]) {
    setError("");
    setDone("");
    setWorking(key);
    try {
      const res = await listAllOrders(null, 1, 100);
      const today = new Date().toISOString().slice(0, 10);
      if (key === "transactions") {
        downloadCsv(
          `settlecart-transactions-${today}.csv`,
          toCsv(
            res.orders.map((o) => ({
              order_number: o.order_number,
              status: o.status,
              total: o.total,
              platform_fee: o.platform_fee,
              subtotal: o.subtotal,
              delivery_city: o.delivery_city,
              created_at: o.created_at,
            }))
          )
        );
      } else if (key === "settlements") {
        downloadCsv(
          `settlecart-settlements-${today}.csv`,
          toCsv(
            res.orders.flatMap((o) =>
              o.vendor_orders.map((vo) => ({
                order_number: o.order_number,
                store: vo.store_name ?? "",
                status: vo.status,
                subtotal: vo.subtotal,
              }))
            )
          )
        );
      } else {
        downloadCsv(
          `settlecart-refunds-${today}.csv`,
          toCsv(
            res.orders
              .filter((o) => o.status === "refund_pending" || o.status === "refunded")
              .map((o) => ({
                order_number: o.order_number,
                status: o.status,
                total: o.total,
                created_at: o.created_at,
              }))
          )
        );
      }
      setDone("Report downloaded.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Card title="Export reports">
      {error && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="mb-3 text-xs text-teal-800">
          {done}
        </p>
      )}
      <ul className="space-y-3">
        {REPORTS.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 p-3">
            <span>
              <span className="block text-sm font-semibold text-stone-900">{r.label}</span>
              <span className="block text-xs text-stone-500">{r.text}</span>
            </span>
            <Button size="sm" loading={working === r.key} onClick={() => exportReport(r.key)}>
              Export CSV
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500">Exports cover the 100 most recent orders.</p>
    </Card>
  );
}

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Financial reports" description="CSV exports for books and audits." />
      <RequireAuth>
        <ReportsBody />
      </RequireAuth>
    </div>
  );
}
