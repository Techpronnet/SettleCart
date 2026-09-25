"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "expired" | "success">("idle");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) {
      setStatus("error");
      return;
    }
    setStatus("success");
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Verify your account</h1>
      <p className="mt-1 text-sm text-stone-500">
        Enter the verification code sent to your email or phone.
      </p>
      {status === "error" && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          Invalid code. Check the code and try again.
        </div>
      )}
      {status === "expired" && (
        <div role="alert" className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-3.5 py-2.5 text-xs text-amber-800">
          This code has expired. Request a new one below.
        </div>
      )}
      {status === "success" && (
        <div role="status" className="mt-4 rounded-md bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-800">
          Code accepted. Backend verification endpoint pending. Your account will be activated at launch.
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input label="Verification code" name="code" inputMode="numeric" autoComplete="one-time-code" required placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" size="lg" className="w-full">
          Verify
        </Button>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="w-full text-sm font-medium text-stone-700 hover:text-stone-950 underline min-h-[44px]"
        >
          Resend code
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        <Link href="/login" className="font-medium text-stone-900 underline">Back to login</Link>
      </p>
    </div>
  );
}
