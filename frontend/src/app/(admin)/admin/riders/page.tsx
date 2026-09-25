"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAdminUsers, type UserResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

function RidersBody() {
  const [riders, setRiders] = useState<UserResponse[] | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const res = await listAdminUsers(1, 100);
      setRiders(res.users.filter((u) => u.role === "dispatch"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load riders.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (error) {
    return <ErrorState title="Riders unavailable." description={error} onRetry={load} />;
  }

  if (!riders) return <ListSkeleton rows={4} />;

  if (riders.length === 0) {
    return (
      <EmptyState
        icon="fa-motorcycle"
        title="No riders yet"
        description="Accounts registered for delivery will appear here."
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {riders.map((r) => (
        <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-stone-900 truncate">{r.full_name}</span>
            <span className="flex gap-1.5 shrink-0">
              {!r.is_active && <Badge tone="danger">Suspended</Badge>}
              {r.is_verified ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            {r.email}
            {r.phone ? ` · ${r.phone}` : ""} · joined {formatDateTime(r.created_at)}
          </p>
          <p className="mt-1 font-mono text-[11px] text-stone-400">Rider ID: {r.id}</p>
        </li>
      ))}
    </ul>
  );
}

export default function RidersPage() {
  return (
    <div>
      <PageHeader title="Dispatch riders" description="Everyone who can deliver. Copy a rider ID to assign jobs." />
      <RequireAuth>
        <RidersBody />
      </RequireAuth>
    </div>
  );
}
