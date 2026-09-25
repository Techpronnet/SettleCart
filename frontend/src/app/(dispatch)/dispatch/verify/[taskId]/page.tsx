"use client";

import Link from "next/link";
import { use, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, friendlyApiMessage, verifyDeliveryOtp } from "@/lib/api";

function VerifyBody({ taskId }: { taskId: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [working, setWorking] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim().length < 4) {
      setError("Enter the code the customer gives you.");
      return;
    }
    setWorking(true);
    try {
      await verifyDeliveryOtp(taskId, code.trim());
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? friendlyApiMessage(err, "Invalid code. Confirm it with the customer and retry.")
          : "Network error. Try again."
      );
    } finally {
      setWorking(false);
    }
  }

  if (done) {
    return (
      <Card title="Delivery confirmed">
        <p className="text-sm text-stone-600">
          Code validated. Delivery is complete and settlement is now eligible.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <Link
            href="/dispatch/jobs"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
          >
            Find next job
          </Link>
          <Link
            href="/dispatch/earnings"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
          >
            View earnings
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Confirm delivery">
      <p className="text-sm text-stone-600">
        Ask the customer for their delivery verification code. Delivery completes only with a
        valid, unused code for this job.
      </p>
      {error && (
        <div role="alert" className="mt-3 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <Input
          label="Customer verification code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Button type="submit" loading={working} size="lg" className="w-full">
          Verify delivery
        </Button>
      </form>
    </Card>
  );
}

export default function VerifyDeliveryPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = use(params);
  return (
    <div>
      <PageHeader title="Delivery verification" breadcrumbs={[{ label: "Jobs", href: "/dispatch/jobs" }, { label: "Verify" }]} />
      <RequireAuth>
        <VerifyBody taskId={taskId} />
      </RequireAuth>
    </div>
  );
}
