"use client";

import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, getAnyUser, type UserResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

function UserDetailsBody({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setUser(await getAnyUser(userId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load this user.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <ErrorState title="User unavailable." description={error} onRetry={load} />;
  }

  if (!user) return <ListSkeleton rows={3} />;

  return (
    <Card
      title={user.full_name}
      action={
        <span className="flex gap-1.5">
          <Badge tone="neutral">{user.role}</Badge>
          {!user.is_active && <Badge tone="danger">Suspended</Badge>}
          {user.is_verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
        </span>
      }
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Email</dt>
          <dd className="text-stone-900">{user.email}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Phone</dt>
          <dd className="text-stone-900">{user.phone ?? "Not provided"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Joined</dt>
          <dd className="text-stone-900">{formatDateTime(user.created_at)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-stone-500">
        Suspend and restore controls arrive with the backend account-moderation endpoints.
      </p>
    </Card>
  );
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <PageHeader title="User details" breadcrumbs={[{ label: "Users", href: "/admin/users" }, { label: "Details" }]} />
      <RequireAuth>
        <UserDetailsBody userId={id} />
      </RequireAuth>
    </div>
  );
}
