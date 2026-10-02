"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ApiError,
  friendlyApiMessage,
  listAdminWithdrawals,
  reviewWithdrawal,
  type AdminWithdrawalResponse,
} from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";

type FilterTab = "all" | "pending" | "approved" | "rejected";

function statusTone(status: string): "warning" | "success" | "danger" | "neutral" {
  switch (status.toLowerCase()) {
    case "pending":
    case "processing":
      return "warning";
    case "approved":
    case "completed":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

function WithdrawalsBody() {
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawalResponse[] | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Active rejection modal / inline form state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);

  // Manual lookup fallback
  const [manualId, setManualId] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [manualWorking, setManualWorking] = useState<"approve" | "reject" | null>(null);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await listAdminWithdrawals(filter === "all" ? undefined : filter, 1, 50);
      setWithdrawals(res.withdrawals);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load withdrawal requests.");
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleReview(id: string, action: "approve" | "reject", reason?: string) {
    setFeedback(null);
    setWorkingId(id);
    try {
      const res = await reviewWithdrawal(id, action, reason || null);
      setFeedback({
        text: `Withdrawal ${res.reference || res.id.slice(0, 8)} ${action === "approve" ? "approved" : "rejected"} successfully.`,
        isError: false,
      });
      setRejectingId(null);
      setRejectReason("");
      await loadData();
    } catch (err) {
      setFeedback({
        text: err instanceof ApiError ? friendlyApiMessage(err, "Review failed.") : "Network error.",
        isError: true,
      });
    } finally {
      setWorkingId(null);
    }
  }

  async function handleManualReview(action: "approve" | "reject") {
    setFeedback(null);
    if (!manualId.trim()) {
      setFeedback({ text: "Enter a withdrawal UUID.", isError: true });
      return;
    }
    if (action === "reject" && !manualReason.trim()) {
      setFeedback({ text: "A rejection reason is required.", isError: true });
      return;
    }
    setManualWorking(action);
    try {
      const res = await reviewWithdrawal(manualId.trim(), action, manualReason.trim() || null);
      setFeedback({
        text: `Withdrawal ${res.reference || res.id.slice(0, 8)} ${action === "approve" ? "approved" : "rejected"} successfully.`,
        isError: false,
      });
      setManualId("");
      setManualReason("");
      await loadData();
    } catch (err) {
      setFeedback({
        text: err instanceof ApiError ? friendlyApiMessage(err, "Manual review failed.") : "Network error.",
        isError: true,
      });
    } finally {
      setManualWorking(null);
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role={feedback.isError ? "alert" : "status"}
          className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
            feedback.isError
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-teal-50 border-teal-200 text-teal-900"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
        {(["pending", "all", "approved", "rejected"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors capitalize ${
              filter === tab
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto text-xs text-stone-500">
          Total: <strong className="text-stone-900">{total}</strong>
        </span>
      </div>

      {/* Live Queue Table */}
      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState title="Failed to load queue" description={error} onRetry={loadData} />
      ) : !withdrawals || withdrawals.length === 0 ? (
        <EmptyState
          icon="fa-money"
          title={`No ${filter !== "all" ? filter : ""} withdrawal requests`}
          description={
            filter === "pending"
              ? "There are currently no payout requests awaiting review."
              : "No requests found for this filter."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Requester</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Bank Details</th>
                <th className="px-4 py-3">Reference / Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {withdrawals.map((w) => (
                <tr key={w.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-900">{w.user_name || "Merchant"}</p>
                    <p className="text-xs text-stone-500 truncate max-w-[200px]">{w.user_email}</p>
                    <span className="inline-block mt-0.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {w.user_role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900 whitespace-nowrap">
                    {formatMoney(w.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{w.account_name}</p>
                    <p className="text-xs text-stone-500 font-mono">
                      {w.account_number} · <span className="font-sans font-medium text-stone-700">{w.bank_name}</span>
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-xs text-stone-600">{w.reference}</p>
                    <p className="text-xs text-stone-400">{formatDateTime(w.created_at)}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={statusTone(w.status)}>
                      {w.status}
                    </Badge>
                    {w.rejection_reason && (
                      <p className="mt-1 text-[11px] text-red-600 max-w-[160px] truncate" title={w.rejection_reason}>
                        {w.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {w.status.toLowerCase() === "pending" ? (
                      rejectingId === w.id ? (
                        <div className="flex flex-col gap-1.5 items-end">
                          <input
                            type="text"
                            placeholder="Rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="text-xs px-2.5 py-1.5 rounded border border-stone-300 w-44 focus:outline-none focus:border-stone-900"
                          />
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="danger"
                              loading={workingId === w.id}
                              disabled={!rejectReason.trim()}
                              onClick={() => handleReview(w.id, "reject", rejectReason.trim())}
                            >
                              Confirm Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setRejectingId(null);
                                setRejectReason("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            loading={workingId === w.id}
                            onClick={() => handleReview(w.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              setRejectingId(w.id);
                              setRejectReason("");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-stone-400">
                        {w.reviewed_at ? `Reviewed ${formatDateTime(w.reviewed_at)}` : "Processed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Review by ID Card */}
      <Card
        title="Direct Review by ID"
        action={<Badge tone="neutral">Advanced</Badge>}
      >
        <p className="text-xs text-stone-500 mb-3">
          If a payout reference or specific withdrawal UUID was escalated directly, you can review it here.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Withdrawal UUID"
            name="manualId"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
          />
          <Input
            label="Reason (required only for rejection)"
            name="manualReason"
            value={manualReason}
            onChange={(e) => setManualReason(e.target.value)}
            placeholder="e.g. Bank account mismatch"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            loading={manualWorking === "approve"}
            onClick={() => handleManualReview("approve")}
          >
            Approve by ID
          </Button>
          <Button
            size="sm"
            variant="danger"
            loading={manualWorking === "reject"}
            onClick={() => handleManualReview("reject")}
          >
            Reject by ID
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function WithdrawalsReviewPage() {
  return (
    <div>
      <PageHeader
        title="Withdrawal Queue"
        description="Inspect, verify bank account details, and approve merchant and rider payout requests."
      />
      <RequireAuth>
        <WithdrawalsBody />
      </RequireAuth>
    </div>
  );
}
