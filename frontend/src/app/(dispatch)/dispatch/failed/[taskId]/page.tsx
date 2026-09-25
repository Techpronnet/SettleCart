"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, failTask, friendlyApiMessage } from "@/lib/api";
import { FAILURE_REASONS } from "@/lib/dispatch";

function FailedBody({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState(FAILURE_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setWorking(true);
    try {
      await failTask(taskId, reason, notes.trim() || null);
      router.push("/dispatch/jobs");
    } catch (err) {
      setError(err instanceof ApiError ? friendlyApiMessage(err, "Could not report.") : "Network error.");
      setWorking(false);
    }
  }

  return (
    <Card title="Report delivery failure">
      <p className="text-sm text-stone-600">Every failure needs a reason. Operations reviews all reports.</p>
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <div role="radiogroup" aria-label="Failure reason" className="grid gap-2">
          {FAILURE_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={reason === r}
              onClick={() => setReason(r)}
              className={`rounded-lg border px-3.5 py-3 text-left text-sm font-medium min-h-[48px] ${
                reason === r ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="fail-notes" className="block text-sm font-medium text-stone-800 mb-1.5">
            Notes (optional)
          </label>
          <textarea
            id="fail-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened?"
            className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[88px] focus-visible:outline-2 focus-visible:outline-stone-900"
          />
        </div>
        <Button type="submit" loading={working} size="lg">
          Submit report
        </Button>
      </form>
    </Card>
  );
}

export default function DeliveryFailedPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  return (
    <div>
      <PageHeader title="Report failure" breadcrumbs={[{ label: "Jobs", href: "/dispatch/jobs" }, { label: "Report" }]} />
      <RequireAuth>
        <FailedBody taskId={taskId} />
      </RequireAuth>
    </div>
  );
}
