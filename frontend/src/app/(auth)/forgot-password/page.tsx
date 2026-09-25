"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Check your email</h1>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          If an account exists for <span className="font-medium text-stone-900">{email}</span>, a
          password reset link is on its way. The link expires after a limited time.
        </p>
        <p className="mt-4 text-sm text-stone-600">
          <Link href="/login" className="font-medium text-stone-900 underline">Back to login</Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Forgot password</h1>
      <p className="mt-1 text-sm text-stone-500">Enter your account email to receive a reset link.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" size="lg" className="w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        <Link href="/login" className="font-medium text-stone-900 underline">Back to login</Link>
      </p>
    </div>
  );
}
