"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  ApiError,
  friendlyApiMessage,
  getKycDocumentUrl,
  listPendingKyc,
  reviewKyc,
  type BusinessResponse,
  type KYCStatus,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;

function KycDocRow({
  businessId,
  docType,
  label,
  provided,
}: {
  businessId: string;
  docType: "government_id" | "cac_certificate";
  label: string;
  provided: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);

  async function view() {
    setError("");
    if (url) {
      setImgBroken(false);
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await getKycDocumentUrl(businessId, docType);
      setUrl(res.signed_url);
      setImgBroken(false);
      setOpen(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not load document.") : "Network error."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-stone-800">
        {provided ? (
          <>
            <button
              type="button"
              onClick={view}
              disabled={loading}
              className="font-medium text-stone-900 underline min-h-[36px] disabled:opacity-50"
            >
              {loading ? "Loading…" : "View document"}
            </button>
            {error && (
              <span role="alert" className="block text-red-700">
                {error}
              </span>
            )}
          </>
        ) : (
          "Missing"
        )}
      </dd>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={label}>
        {url && !imgBroken ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${label} submitted for verification`}
              className="w-full rounded-lg border border-stone-200"
              onError={() => setImgBroken(true)}
            />
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 min-h-[48px]"
            >
              Open full document
            </a>
          </div>
        ) : (
          url && (
            <div>
              <p className="text-sm text-stone-600">
                This file cannot be previewed here (for example a PDF).
              </p>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-white bg-stone-900 min-h-[48px]"
              >
                Open full document
              </a>
            </div>
          )
        )}
      </BottomSheet>
    </div>
  );
}

function KycBody() {
  const [queue, setQueue] = useState<BusinessResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [decided, setDecided] = useState<Record<string, string>>({});

  async function load(nextPage: number) {
    setLoading(true);
    setError("");
    try {
      const res = await listPendingKyc(nextPage, PAGE_SIZE);
      setQueue(res.businesses);
      setTotal(res.total);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load the KYC queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1);
  }, []);

  async function decide(businessId: string, decision: KYCStatus) {
    setActionError("");
    try {
      const res = await reviewKyc(businessId, decision, notes[businessId]?.trim() || null);
      setDecided((d) => ({ ...d, [businessId]: res.kyc_status }));
      setQueue((q) => q.filter((b) => b.id !== businessId));
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Review failed.") : "Network error.");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {actionError && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorState title="KYC queue unavailable." description={error} onRetry={() => load(1)} />
      ) : queue.length === 0 ? (
        <EmptyState icon="fa-id-card" title="Queue is clear" description="No businesses awaiting verification." />
      ) : (
        <>
          <ul className="space-y-3">
            {queue.map((b) => (
              <li key={b.id}>
                <Card
                  title={b.name}
                  action={<Badge tone="warning">{b.kyc_status.replace(/_/g, " ")}</Badge>}
                >
                  <p className="text-xs text-stone-500">
                    {b.business_type} · submitted {b.kyc_submitted_at ? formatDateTime(b.kyc_submitted_at) : "date unknown"}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{b.description || "No description provided."}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <KycDocRow
                      businessId={b.id}
                      docType="cac_certificate"
                      label="CAC document"
                      provided={Boolean(b.cac_document_url)}
                    />
                    <KycDocRow
                      businessId={b.id}
                      docType="government_id"
                      label="Government ID"
                      provided={Boolean(b.government_id_url)}
                    />
                  </dl>
                  <label htmlFor={`notes-${b.id}`} className="mt-3 block text-xs font-medium text-stone-700">
                    Review notes
                  </label>
                  <textarea
                    id={`notes-${b.id}`}
                    rows={2}
                    value={notes[b.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [b.id]: e.target.value }))}
                    placeholder="Reason, especially when rejecting…"
                    className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm min-h-[56px] focus-visible:outline-2 focus-visible:outline-stone-900"
                  />
                  <div className="mt-2.5 flex gap-2.5">
                    <Button size="sm" onClick={() => decide(b.id, "verified")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => decide(b.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                  {decided[b.id] && (
                    <p role="status" className="mt-2 text-xs text-teal-800">
                      Decided: {decided[b.id]}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}

export default function KycQueuePage() {
  return (
    <div>
      <PageHeader title="KYC reviews" description="Verify businesses. Every decision is audited." />
      <RequireAuth>
        <KycBody />
      </RequireAuth>
    </div>
  );
}
