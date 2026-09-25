"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Password updated</h1>
        <p className="mt-2 text-sm text-stone-600">You can now log in with your new password.</p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 min-h-[40px]"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Reset password</h1>
      <p className="mt-1 text-sm text-stone-500">Choose a new password for your account.</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input label="New password" name="password" type="password" required autoComplete="new-password" allowShowPassword hint="Minimum 8 characters." placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" className="w-full">
          Update password
        </Button>
      </form>
      <p className="mt-4 text-xs text-stone-500">
        Expired or invalid links show an error here once the backend recovery endpoint ships.
      </p>
    </div>
  );
}
