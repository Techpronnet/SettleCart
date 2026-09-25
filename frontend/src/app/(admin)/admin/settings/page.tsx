"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { authStorage } from "@/lib/api";

function SettingsBody() {
  const user = useAuthUser();
  const router = useRouter();

  function logout() {
    authStorage.clearTokens();
    router.push("/login");
  }

  return (
    <div className="space-y-4">
      <Card title="Administrator">
        <p className="text-sm font-semibold text-stone-900">{user?.full_name}</p>
        <p className="text-sm text-stone-500">{user?.email}</p>
        <Button variant="secondary" className="mt-3" onClick={logout}>
          Log out
        </Button>
      </Card>

      <Card title="Workspaces">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Link
            href="/finance"
            className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="block text-sm font-semibold text-stone-900">Finance workspace</span>
            <span className="block text-xs text-stone-500">Settlement, ledger, reconciliation.</span>
          </Link>
          <Link
            href="/marketplace"
            className="rounded-xl border border-stone-200 p-3.5 hover:border-stone-400"
          >
            <span className="block text-sm font-semibold text-stone-900">Public marketplace</span>
            <span className="block text-xs text-stone-500">See what customers see.</span>
          </Link>
        </div>
      </Card>

      <Card title="Least privilege">
        <p className="text-sm text-stone-600 leading-relaxed">
          Support operators work under least privilege: user lookup and order inspection are
          available, while financial actions stay restricted. Platform configuration endpoints
          ship with backend support.
        </p>
      </Card>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Admin account and workspaces." />
      <RequireAuth>
        <SettingsBody />
      </RequireAuth>
    </div>
  );
}
