"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  friendlyApiMessage,
  getBusiness,
  listMyBusinesses,
  updateBusiness,
  type BusinessResponse,
} from "@/lib/api";
import { getVendorContext, setVendorBusiness } from "@/lib/vendor-context";

function BusinessBody() {
  const [biz, setBiz] = useState<BusinessResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [taxId, setTaxId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState<string | null>(null);

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
      const full = await getBusiness(found.id);
      setBiz(full);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load your business.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (biz && seeded !== biz.id) {
    setSeeded(biz.id);
    setName(biz.name);
    setDescription(biz.description ?? "");
    setBusinessType(biz.business_type);
    setTaxId(biz.tax_id ?? "");
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!biz) return;
    setMessage("");
    setSaving(true);
    try {
      const updated = await updateBusiness(biz.id, {
        name: name.trim() || null,
        description: description.trim() || null,
        business_type: businessType.trim() || null,
        tax_id: taxId.trim() || null,
      });
      setBiz(updated);
      setMessage("Business profile updated.");
    } catch (err) {
      setMessage(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not save.") : "Network error. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (missing) return <VendorSetupPrompt />;

  if (error) {
    return <ErrorState title="Business unavailable." description={error} onRetry={load} />;
  }

  if (!biz) return <ListSkeleton rows={3} />;

  return (
    <Card title="Business profile">
      {message && (
        <p role="status" className="mb-4 rounded-md bg-stone-100 border border-stone-200 px-3.5 py-2.5 text-xs text-stone-800">
          {message}
        </p>
      )}
      <form onSubmit={onSave} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Business name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Business type" name="businessType" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
        </div>
        <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Tax ID (optional)" name="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        <div>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function BusinessPage() {
  return (
    <div>
      <PageHeader title="Business Profile" description="How your business appears to reviewers." />
      <RequireAuth>
        <BusinessBody />
      </RequireAuth>
    </div>
  );
}
