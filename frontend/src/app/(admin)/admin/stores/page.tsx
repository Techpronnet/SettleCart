"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiError, listAdminStores, type StoreResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { storeStatus } from "@/lib/vendor";

const PAGE_SIZE = 20;

function StoresBody() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage: number) {
    setLoading(true);
    setError("");
    try {
      const res = await listAdminStores(nextPage, PAGE_SIZE);
      setStores(res.stores);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load stores.");
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
        <ErrorState title="Stores unavailable." description={error} onRetry={() => load(1)} />
      ) : stores.length === 0 ? (
        <EmptyState icon="fa-home" title="No stores yet" description="Vendor storefronts will appear here." />
      ) : (
        <>
          <ul className="space-y-2.5">
            {stores.map((s) => {
              const status = storeStatus(s.is_published, s.is_active);
              return (
                <li key={s.id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900 truncate">{s.name}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">
                    {[s.city, s.state].filter(Boolean).join(", ") || "No location"} · opened{" "}
                    {formatDateTime(s.created_at)}
                  </p>
                  <div className="mt-2">
                    <Link
                      href={`/stores/${s.id}`}
                      className="text-xs font-medium text-stone-900 underline min-h-[36px] inline-flex items-center"
                    >
                      View storefront
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}

export default function StoresPage() {
  return (
    <div>
      <PageHeader title="Stores" description="Every vendor storefront." />
      <RequireAuth>
        <StoresBody />
      </RequireAuth>
    </div>
  );
}
