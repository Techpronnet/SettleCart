"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { disputesForOrder, fileDispute, DISPUTE_REASONS, type LocalDispute } from "@/lib/disputes";
import { formatDateTime } from "@/lib/format";
import { disputeOrder, ApiError, friendlyApiMessage } from "@/lib/api";

export function OrderDisputeCard({
  orderId,
  orderNumber,
  currentStatus,
  orderNotes,
  onDisputed,
}: {
  orderId: string;
  orderNumber: string;
  currentStatus?: string;
  orderNotes?: string | null;
  onDisputed?: () => void;
}) {
  const [reports, setReports] = useState<LocalDispute[]>([]);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(DISPUTE_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Client-only report lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReports(disputesForOrder(orderId));
  }, [orderId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!details.trim()) {
      setError("Describe what went wrong.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await disputeOrder(orderId, reason, details.trim());
      setReports(fileDispute({ orderId, orderNumber, reason, details: details.trim() }));
      setDetails("");
      setOpen(false);
      onDisputed?.();
    } catch (err) {
      setError(err instanceof ApiError ? friendlyApiMessage(err, "We couldn't submit your report.") : "We couldn't submit your report.");
    } finally {
      setSubmitting(false);
    }
  }

  const isDisputed = currentStatus?.toLowerCase() === "disputed";
  const isRefunded = currentStatus?.toLowerCase() === "refunded";

  return (
    <Card title="Report a problem">
      {isDisputed && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <i className="fa fa-info-circle text-amber-700" aria-hidden="true" />
            <span>Dispute under review</span>
          </div>
          <p className="mt-1 text-xs text-amber-800">
            This order is currently under active mediation by the SettleCart team. We are reviewing communication with the vendor.
          </p>
          {orderNotes && (
            <div className="mt-2 rounded bg-white/70 p-2 text-xs font-mono text-stone-700 whitespace-pre-wrap">
              {orderNotes}
            </div>
          )}
        </div>
      )}

      {isRefunded && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <i className="fa fa-check-circle text-emerald-700" aria-hidden="true" />
            <span>Order refunded</span>
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            This dispute was resolved with a full refund. The funds have been returned to your original payment method.
          </p>
        </div>
      )}

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

      {!isDisputed && !isRefunded && !open ? (
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Report a problem with this order
        </Button>
      ) : open ? (
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
              placeholder="Provide specific details regarding the problem with this order..."
            />
          </div>
          <div className="flex gap-2.5">
            <Button type="submit" loading={submitting}>
              Submit report
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </Card>
  );
}
