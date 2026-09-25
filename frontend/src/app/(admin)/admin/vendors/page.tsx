"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAdminBusinesses, listAdminUsers, type BusinessResponse, type UserResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { kycLabel, kycTone } from "@/lib/vendor";

const PAGE_SIZE = 20;

function VendorsBody() {
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [pendingAccounts, setPendingAccounts] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage: number) {
    setLoading(true);
    setError("");
    try {
      const [bizRes, userRes] = await Promise.all([
        listAdminBusinesses(nextPage, PAGE_SIZE),
        nextPage === 1 ? listAdminUsers(1, 100) : Promise.resolve(null),
      ]);
      setBusinesses(bizRes.businesses);
      setTotal(bizRes.total);
      setPage(nextPage);
      if (userRes) {
        const ownerIds = new Set(bizRes.businesses.map((b) => b.owner_id));
        // Matched against businesses on this page; fully covers the early
        // platform where everything fits on page one.
        setPendingAccounts(userRes.users.filter((u) => u.role === "vendor" && !ownerIds.has(u.id)));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load vendors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState title="Vendors unavailable." description={error} onRetry={() => load(1)} />
      ) : (
        <>
          {pendingAccounts.length > 0 && (
            <section aria-label="Vendor accounts pending onboarding" className="mb-4">
              <h2 className="text-sm font-semibold text-stone-900">
                Accounts pending onboarding ({pendingAccounts.length})
              </h2>
              <p className="mt-0.5 text-xs text-stone-500">
                Signed up as vendors but have not created a business yet.
              </p>
              <ul className="mt-2.5 space-y-2.5">
                {pendingAccounts.map((u) => (
                  <li key={u.id} className="rounded-xl border border-dashed border-stone-300 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900 truncate">{u.full_name}</span>
                      <Badge tone="warning">No business</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {u.email} · joined {formatDateTime(u.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {businesses.length === 0 ? (
            <EmptyState icon="fa-building" title="No vendor businesses yet" description="Businesses appear here once vendor accounts finish onboarding." />
          ) : (
            <>
              <ul className="space-y-2.5">
                {businesses.map((b) => (
                  <li key={b.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-900 truncate">{b.name}</span>
                      <Badge tone={kycTone(b.kyc_status)}>{kycLabel(b.kyc_status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {b.business_type} · joined {formatDateTime(b.created_at)}
                    </p>
                    <div className="mt-2">
                      <Link href="/admin/kyc" className="text-xs font-medium text-stone-900 underline min-h-[36px] inline-flex items-center">
                        Review KYC queue
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onChange={load} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function VendorsPage() {
  return (
    <div>
      <PageHeader title="Vendors" description="Every registered business." />
      <RequireAuth>
        <VendorsBody />
      </RequireAuth>
    </div>
  );
}
