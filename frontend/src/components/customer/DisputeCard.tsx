"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { disputesForOrder, fileDispute, DISPUTE_REASONS, type LocalDispute } from "@/lib/disputes";
import { formatDateTime } from "@/lib/format";

export function OrderDisputeCard({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  const [reports, setReports] = useState<LocalDispute[]>([]);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Client-only report lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(disputesForOrder(orderId));
  }, [orderId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.trim()) {
      setError("Describe what went wrong.");
      return;
    }
    setError("");
    setReports(fileDispute({ orderId, orderNumber, reason, details: details.trim() }));
    setDetails("");
    setOpen(false);
  }

  return (
    <Card title="Report a problem">
      {reports.length > 0 && (
        <ul className="mb-3 space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-100 p-3 text-sm">
              <p className="font-medium text-stone-900">{r.reason}</p>
              <p className="text-stone-600">{r.details}</p>
              <p className="mt-1 text-xs text-stone-400">
                Opened {formatDateTime(r.createdAt)} · support will follow up
              </p>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Report a problem with this order
        </Button>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}
          <div role="radiogroup" aria-label="Problem reason" className="grid gap-2">
            {DISPUTE_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={reason === r}
                onClick={() => setReason(r)}
                className={`rounded-lg border px-3.5 py-2.5 text-left text-sm font-medium min-h-[44px] ${
                  reason === r ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor={`dispute-${orderId}`} className="block text-sm font-medium text-stone-800 mb-1.5">
              What happened?
            </label>
            <textarea
              id={`dispute-${orderId}`}
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[88px] focus-visible:outline-2 focus-visible:outline-stone-900"
            />
          </div>
          <div className="flex gap-2.5">
            <Button type="submit">Submit report</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
