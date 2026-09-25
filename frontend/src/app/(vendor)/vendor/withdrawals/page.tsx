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
  getMyWallet,
  listMyWithdrawals,
  requestWithdrawal,
  type WalletBalanceResponse,
  type WithdrawalResponse,
} from "@/lib/api";
import { formatMoney, formatDateTime } from "@/lib/format";

function WithdrawalsBody() {
  const [wallet, setWallet] = useState<WalletBalanceResponse | null>(null);
  const [history, setHistory] = useState<WithdrawalResponse[] | null>(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setError("");
    try {
      const [w, h] = await Promise.all([getMyWallet(), listMyWithdrawals()]);
      setWallet(w);
      setHistory(h);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load withdrawals.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormOk("");
    if (amount.trim() === "" || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    if (accountNumber.trim().length !== 10) {
      setFormError("Account number must be 10 digits.");
      return;
    }
    if (!bankName.trim() || !accountName.trim()) {
      setFormError("Fill in bank name and account name.");
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdrawal({
        amount: amount.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });
      setAmount("");
      setFormOk("Withdrawal requested. Track its status below.");
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? friendlyApiMessage(err, "Request failed.") : "Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return <ErrorState title="Withdrawals unavailable." description={error} onRetry={load} />;
  }

  if (!wallet || history === null) return <ListSkeleton rows={3} />;

  return (
    <div className="space-y-4">
      <Card title="Request withdrawal">
        <p className="text-sm text-stone-600">
          Available: <span className="font-bold text-stone-900">{formatMoney(wallet.available_balance)}</span>
        </p>
        {formError && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {formError}
          </p>
        )}
        {formOk && (
          <p role="status" className="mt-3 text-xs text-teal-800">
            {formOk}
          </p>
        )}
        <form onSubmit={onSubmit} className="mt-3 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Amount (NGN)" name="amount" required inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
            <Input label="Bank name" name="bankName" required value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. GTBank" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Account number" name="accountNumber" required inputMode="numeric" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="10-digit NUBAN" />
            <Input label="Account name" name="accountName" required value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>
          <div>
            <Button type="submit" loading={submitting} size="lg">
              Request withdrawal
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="text-base font-semibold text-stone-900">History</h2>
        {history.length === 0 ? (
          <div className="mt-3">
            <EmptyState icon="fa-money" title="No withdrawals yet" description="Requests and their status will appear here." />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {history.map((w) => (
              <li key={w.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-stone-900">{formatMoney(w.amount)}</span>
                  <Badge tone={w.status === "completed" ? "success" : w.status === "rejected" ? "danger" : "warning"}>
                    {w.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {w.bank_name} · {w.account_number} · {w.account_name}
                </p>
                <p className="text-xs text-stone-400">{formatDateTime(w.created_at)}</p>
                {w.rejection_reason && (
                  <p className="mt-1 text-xs text-red-700">Reason: {w.rejection_reason}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function WithdrawalsPage() {
  return (
    <div>
      <PageHeader title="Withdrawals" description="Move available earnings to your bank." />
      <RequireAuth>
        <WithdrawalsBody />
      </RequireAuth>
    </div>
  );
}
