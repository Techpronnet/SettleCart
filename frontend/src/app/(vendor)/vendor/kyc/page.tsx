"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import { KycDocumentUploader } from "@/components/vendor/KycDocuments";
import {
  ApiError,
  friendlyApiMessage,
  getBusiness,
  listMyBusinesses,
  submitKyc,
  type BusinessResponse,
} from "@/lib/api";
import { getVendorContext, setVendorBusiness } from "@/lib/vendor-context";
import { formatDateTime } from "@/lib/format";
import { kycLabel, kycTone } from "@/lib/vendor";

const STATE_COPY: Record<string, string> = {
  pending: "Your business is registered. Submit it for verification to unlock publishing and withdrawals.",
  under_review: "Submitted. Our team is reviewing your verification. This usually takes a short while.",
  verified: "Verified. Your business is trusted across the marketplace.",
  rejected: "Your submission was not approved. Review your details and resubmit.",
};

function KycBody() {
  const [biz, setBiz] = useState<BusinessResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [working, setWorking] = useState(false);

  async function load() {
    setError("");
    try {
      const ctx = getVendorContext();
      const businesses = await listMyBusinesses();
      const found = businesses.find((b) => b.id === ctx.businessId) ?? businesses[0] ?? null;
      if (!found) {
        setMissing(true);
        return;
      }
      setVendorBusiness(found.id);
      setBiz(await getBusiness(found.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load verification.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function submit() {
    if (!biz) return;
    setActionError("");
    setWorking(true);
    try {
      setBiz(await submitKyc(biz.id));
    } catch (err) {
      setActionError(
        err instanceof ApiError ? friendlyApiMessage(err, "Submission failed.") : "Network error. Try again."
      );
    } finally {
      setWorking(false);
    }
  }

  if (missing) return <VendorSetupPrompt />;

  if (error) {
    return <ErrorState title="Verification unavailable." description={error} onRetry={load} />;
  }

  if (!biz) return <ListSkeleton rows={3} />;

  const submittable = biz.kyc_status === "pending" || biz.kyc_status === "rejected";

  return (
    <div className="space-y-4">
      <Card title="Verification documents">
        <KycDocumentUploader
          businessId={biz.id}
          initial={{
            government_id: Boolean(biz.government_id_url),
            cac_certificate: Boolean(biz.cac_document_url),
          }}
          onChange={() => {}}
        />
      </Card>

      <Card title="Verification status">
        <Badge tone={kycTone(biz.kyc_status)}>{kycLabel(biz.kyc_status)}</Badge>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          {STATE_COPY[biz.kyc_status] ?? "Check back for updates on your verification."}
        </p>
        {actionError && (
          <p role="alert" className="mt-3 text-xs text-red-700">
            {actionError}
          </p>
        )}
        {submittable && (
          <Button onClick={submit} loading={working} className="mt-4">
            {biz.kyc_status === "rejected" ? "Resubmit for verification" : "Submit for verification"}
          </Button>
        )}
      </Card>

      <Card title="Submitted evidence">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">CAC document</dt>
            <dd className="text-stone-800">{biz.cac_document_url ? "Provided" : "Not provided"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Government ID</dt>
            <dd className="text-stone-800">{biz.government_id_url ? "Provided" : "Not provided"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Submitted</dt>
            <dd className="text-stone-800">{biz.kyc_submitted_at ? formatDateTime(biz.kyc_submitted_at) : "Not yet"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Reviewed</dt>
            <dd className="text-stone-800">{biz.kyc_reviewed_at ? formatDateTime(biz.kyc_reviewed_at) : "Pending"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-stone-500">
          Document upload is handled during onboarding review. Every decision is recorded for audit.
        </p>
      </Card>
    </div>
  );
}

export default function KycPage() {
  return (
    <div>
      <PageHeader title="KYC Verification" description="Trust starts with verification." />
      <RequireAuth>
        <KycBody />
      </RequireAuth>
    </div>
  );
}
