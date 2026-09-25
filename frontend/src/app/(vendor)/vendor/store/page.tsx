"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  friendlyApiMessage,
  getStore,
  publishStore,
  unpublishStore,
  updateStore,
  type StoreResponse,
} from "@/lib/api";
import { getVendorContext, setVendorStore } from "@/lib/vendor-context";
import { storeStatus } from "@/lib/vendor";

function StoreBody() {
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [seeded, setSeeded] = useState<string | null>(null);

  async function load() {
    setError("");
    try {
      const ctx = getVendorContext();
      if (!ctx.storeId) {
        setMissing(true);
        return;
      }
      const s = await getStore(ctx.storeId);
      setStore(s);
      setVendorStore(s.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load your store.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  if (store && seeded !== store.id) {
    setSeeded(store.id);
    setName(store.name);
    setDescription(store.description ?? "");
    setAddress(store.address ?? "");
    setCity(store.city ?? "");
    setState(store.state ?? "");
    setPhone(store.phone ?? "");
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setMessage("");
    setSaving(true);
    try {
      const updated = await updateStore(store.id, {
        name: name.trim() || null,
        description: description.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        phone: phone.trim() || null,
      });
      setStore(updated);
      setMessage("Store updated.");
    } catch (err) {
      setMessage(err instanceof ApiError ? friendlyApiMessage(err, "Could not save.") : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!store) return;
    setMessage("");
    setToggling(true);
    try {
      setStore(store.is_published ? await unpublishStore(store.id) : await publishStore(store.id));
      setMessage(store.is_published ? "Store unpublished." : "Store published.");
    } catch (err) {
      setMessage(err instanceof ApiError ? friendlyApiMessage(err, "Could not change status.") : "Network error.");
    } finally {
      setToggling(false);
    }
  }

  if (missing) return <VendorSetupPrompt />;

  if (error) {
    return <ErrorState title="Store unavailable." description={error} onRetry={load} />;
  }

  if (!store) return <ListSkeleton rows={3} />;

  const status = storeStatus(store.is_published, store.is_active);

  return (
    <div className="space-y-4">
      {message && (
        <p role="status" className="rounded-md bg-stone-100 border border-stone-200 px-3.5 py-2.5 text-xs text-stone-800">
          {message}
        </p>
      )}

      <Card
        title="Publication"
        action={<Badge tone={status.tone}>{status.label}</Badge>}
      >
        <p className="text-sm text-stone-600">
          {store.is_published
            ? "Visible to customers in the marketplace."
            : "Hidden from customers until you publish."}
        </p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
          <Button onClick={togglePublish} loading={toggling} variant={store.is_published ? "secondary" : "primary"}>
            {store.is_published ? "Unpublish store" : "Publish store"}
          </Button>
          <Link
            href={`/stores/${store.id}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-medium border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[40px]"
          >
            View storefront
          </Link>
        </div>
      </Card>

      <Card title="Store details">
        <form onSubmit={onSave} className="grid gap-4">
          <Input label="Store name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input label="Address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
            <Input label="State" name="state" value={state} onChange={(e) => setState(e.target.value)} />
            <Input label="Phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function StorePage() {
  return (
    <div>
      <PageHeader title="Store" description="Your customer-facing storefront." />
      <RequireAuth>
        <StoreBody />
      </RequireAuth>
    </div>
  );
}
