"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, login, getCurrentUser } from "@/lib/api";
import { homeForRole, normalizeRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      const me = await getCurrentUser();
      router.push(homeForRole(normalizeRole(me.role)));
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError("Invalid credentials. Check your email and password.");
        else if (err.status === 423) setError("Account locked. Try again later or contact support.");
        else if (err.status === 403) setError("Account suspended or verification required.");
        else if (err.status === 429) setError("Too many attempts. Wait a moment and try again.");
        else setError(err.message || "Login failed. Please try again.");
      } else {
        setError("Network error. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-stone-900">Welcome back</h1>
      <p className="mt-1 text-sm text-stone-500">Log in to your SettleCart account.</p>
      {error && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input
          label="Email"
          name="username"
          type="email"
          autoComplete="username"
          required
          placeholder="you@example.com"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          allowShowPassword
          required
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={loading} size="lg" className="w-full">
          Log in
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-medium text-stone-700 hover:text-stone-950 underline">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-stone-900 hover:text-stone-700 underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
