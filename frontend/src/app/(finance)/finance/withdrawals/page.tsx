"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, friendlyApiMessage, reviewWithdrawal } from "@/lib/api";

function WithdrawalsBody() {
  const [withdrawalId, setWithdrawalId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [working, setWorking] = useState<"approve" | "reject" | null>(null);

  async function review(action: "approve" | "reject") {
    setMessage("");
    setIsError(false);
    if (!withdrawalId.trim()) {
      setIsError(true);
      setMessage("Enter a withdrawal ID.");
      return;
    }
    if (action === "reject" && !reason.trim()) {
      setIsError(true);
      setMessage("A reason is required to reject.");
      return;
    }
    setWorking(action);
    try {
      const res = await reviewWithdrawal(withdrawalId.trim(), action, reason.trim() || null);
      setMessage(`Withdrawal ${res.id.slice(0, 8)} is now ${res.status}.`);
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof ApiError ? friendlyApiMessage(err, "Review failed.") : "Network error.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <Card
      title="Review a withdrawal"
      action={<Badge tone="info">Finance permission</Badge>}
    >
      <p className="text-sm text-stone-600">
        Approving releases the payout; rejecting returns escrow to the wallet via a compensating
        entry. A full withdrawal queue listing ships with backend support.
      </p>
      {message && (
        <p role={isError ? "alert" : "status"} className={`mt-3 text-xs ${isError ? "text-red-700" : "text-teal-800"}`}>
          {message}
        </p>
      )}
      <div className="mt-3 grid gap-4">
        <Input label="Withdrawal ID" name="withdrawalId" value={withdrawalId} onChange={(e) => setWithdrawalId(e.target.value)} placeholder="Withdrawal UUID" />
        <Input label="Reason (required to reject)" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. account name mismatch" />
        <div className="flex gap-2.5">
          <Button loading={working === "approve"} onClick={() => review("approve")}>
            Approve
          </Button>
          <Button variant="danger" loading={working === "reject"} onClick={() => review("reject")}>
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function FinanceWithdrawalsPage() {
  return (
    <div>
      <PageHeader title="Withdrawals" description="Approve or reject payout requests." />
      <RequireAuth>
        <WithdrawalsBody />
      </RequireAuth>
    </div>
  );
}
