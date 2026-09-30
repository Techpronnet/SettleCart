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
import { VendorSetupPrompt, ShareStorefrontButton } from "@/components/vendor/VendorBits";
import {
  ApiError,
  friendlyApiMessage,
  getStore,
  publishStore,
  unpublishStore,
  updateStore,
  uploadStoreBanner,
  uploadStoreLogo,
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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [origin, setOrigin] = useState("");
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
    // Client-only origin restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    // Initial load on mount.
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

  async function onAssetUpload(kind: "logo" | "banner", file: File | undefined) {
    if (!store || !file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose a JPG or PNG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be under 5MB.");
      return;
    }
    setMessage("");
    if (kind === "logo") setUploadingLogo(true);
    else setUploadingBanner(true);
    try {
      const updated =
        kind === "logo" ? await uploadStoreLogo(store.id, file) : await uploadStoreBanner(store.id, file);
      setStore(updated);
      setMessage(kind === "logo" ? "Logo updated." : "Cover image updated.");
    } catch (err) {
      setMessage(err instanceof ApiError ? friendlyApiMessage(err, "Upload failed.") : "Network error.");
    } finally {
      if (kind === "logo") setUploadingLogo(false);
      else setUploadingBanner(false);
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
            href="/vendor/store/preview"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-medium border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[40px]"
          >
            View storefront
          </Link>
          <ShareStorefrontButton storeId={store.id} storeName={store.name} />
        </div>
        {store.is_published && origin && (
          <p className="mt-2.5 text-xs text-stone-500 break-all">
            Public link: {origin}/stores/{store.id}
          </p>
        )}
      </Card>

      <Card title="Store branding">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Cover image</p>
            <p className="mt-0.5 text-xs text-stone-500">Shown at the top of your storefront. JPG or PNG, under 5MB.</p>
            <div className="mt-2.5 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
              {store.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.banner_url} alt={`${store.name} cover`} className="h-32 sm:h-40 w-full object-cover" />
              ) : (
                <div className="flex h-32 sm:h-40 items-center justify-center text-stone-400">
                  <i className="fa fa-image text-2xl" aria-hidden="true" />
                </div>
              )}
            </div>
            <label className="mt-2.5 inline-flex cursor-pointer items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[40px]">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingBanner}
                onChange={(e) => {
                  onAssetUpload("banner", e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {uploadingBanner ? (
                <span className="inline-flex items-center gap-2">
                  <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Uploading…
                </span>
              ) : store.banner_url ? (
                "Change cover"
              ) : (
                "Upload cover"
              )}
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-stone-900">Logo</p>
            <p className="mt-0.5 text-xs text-stone-500">Square JPG or PNG works best. Shown next to your store name.</p>
            <div className="mt-2.5 flex items-center gap-3">
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt={`${store.name} logo`} className="w-16 h-16 rounded-xl object-cover border border-stone-200" />
              ) : (
                <span className="w-16 h-16 rounded-xl bg-stone-900 text-white text-xl font-bold flex items-center justify-center shrink-0">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
              <label className="inline-flex cursor-pointer items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[40px]">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    onAssetUpload("logo", e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {uploadingLogo ? (
                  <span className="inline-flex items-center gap-2">
                    <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Uploading…
                  </span>
                ) : store.logo_url ? (
                  "Change logo"
                ) : (
                  "Upload logo"
                )}
              </label>
            </div>
          </div>
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
