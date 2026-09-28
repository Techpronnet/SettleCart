"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  ApiError,
  friendlyApiMessage,
  getCategories,
  uploadProductImage,
  type CategoryResponse,
  type ProductCreateRequest,
  type ProductResponse,
  type ProductUpdateRequest,
} from "@/lib/api";

export interface ProductFormValue {
  name: string;
  description: string;
  price: string;
  sku: string;
  categoryId: string;
  trackInventory: boolean;
  inventoryCount: string;
  published: boolean;
}

export function emptyProductForm(): ProductFormValue {
  return {
    name: "",
    description: "",
    price: "",
    sku: "",
    categoryId: "",
    trackInventory: true,
    inventoryCount: "0",
    published: true,
  };
}

export function productFormFromResponse(p: ProductResponse): ProductFormValue {
  return {
    name: p.name,
    description: p.description ?? "",
    price: p.price,
    sku: p.sku ?? "",
    categoryId: p.category_id ?? "",
    trackInventory: p.track_inventory,
    inventoryCount: String(p.inventory_count),
    published: p.is_published,
  };
}

export function ProductForm({
  storeId,
  initial,
  initialImages,
  productId,
  submitLabel,
  onSubmit,
  onDone,
}: {
  storeId: string;
  initial: ProductFormValue;
  initialImages: string[];
  productId: string | null;
  submitLabel: string;
  onSubmit: (payload: ProductCreateRequest & ProductUpdateRequest) => Promise<ProductResponse>;
  onDone: (productId: string) => void;
}) {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [gallery, setGallery] = useState<string[]>(initialImages);
  const [pending, setPending] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);

  const MAX_PHOTOS = 6;
  const MAX_BYTES = 5 * 1024 * 1024;
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  useEffect(() => {
    let cancelled = false;
    getCategories(storeId)
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  function set<K extends keyof ProductFormValue>(key: K, value: ProductFormValue[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function pickPhotos(files: FileList | null) {
    setPhotoError("");
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - gallery.length - pending.length;
    if (room <= 0) {
      setPhotoError(`Up to ${MAX_PHOTOS} photos per product. Remove one to add another.`);
      return;
    }
    const additions: { file: File; preview: string }[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      if (!ACCEPTED.includes(file.type)) {
        setPhotoError("Only JPG, PNG, WEBP or GIF photos are supported.");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setPhotoError(`"${file.name}" is larger than 5MB and was skipped.`);
        continue;
      }
      additions.push({ file, preview: URL.createObjectURL(file) });
    }
    if (additions.length > 0) setPending((p) => [...p, ...additions]);
  }

  function removeGalleryImage(url: string) {
    setGallery((g) => g.filter((x) => x !== url));
  }

  function removePending(preview: string) {
    setPending((p) => {
      const target = p.find((x) => x.preview === preview);
      if (target) URL.revokeObjectURL(target.preview);
      return p.filter((x) => x.preview !== preview);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPhotoError("");
    if (!form.name.trim()) {
      setError("Give your product a name.");
      return;
    }
    if (form.price.trim() === "" || Number.isNaN(Number(form.price))) {
      setError("Enter a valid price.");
      return;
    }
    setSaving(true);
    try {
      const saved = await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.price.trim(),
        sku: form.sku.trim() || null,
        category_id: form.categoryId || null,
        track_inventory: form.trackInventory,
        inventory_count: Math.max(0, parseInt(form.inventoryCount, 10) || 0),
        is_published: form.published,
        images: productId ? gallery : null,
      });
      const targetId = saved.id;
      if (pending.length > 0) {
        let failed = 0;
        for (let i = 0; i < pending.length; i++) {
          setUploadStatus(`Uploading photo ${i + 1} of ${pending.length}…`);
          try {
            await uploadProductImage(targetId, pending[i].file);
          } catch {
            failed += 1;
          }
        }
        setUploadStatus("");
        pending.forEach((p) => URL.revokeObjectURL(p.preview));
        setPending([]);
        if (failed > 0) {
          setError(
            `Product saved, but ${failed} photo${failed === 1 ? "" : "s"} failed to upload. You can retry from Edit product.`
          );
          setSaving(false);
          return;
        }
      }
      onDone(targetId);
    } catch (err) {
      setError(
        err instanceof ApiError ? friendlyApiMessage(err, "Could not save product.") : "Network error."
      );
      setSaving(false);
    }
  }

  return (
    <Card title="Product details">
      {error && (
        <div role="alert" className="mb-4 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <Input label="Product name" name="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Ankara Midi Dress" />
        <div>
          <label htmlFor="product-desc" className="block text-sm font-medium text-stone-800 mb-1.5">
            Description
          </label>
          <textarea
            id="product-desc"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Fabric, sizing, ingredients, what's included…"
            className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[88px] focus-visible:outline-2 focus-visible:outline-stone-900"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Price (NGN)" name="price" required inputMode="decimal" placeholder="24500" value={form.price} onChange={(e) => set("price", e.target.value)} />
          <Input label="SKU (optional)" name="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
          <div>
            <label htmlFor="product-cat" className="block text-sm font-medium text-stone-800 mb-1.5">
              Category
            </label>
            <select
              id="product-cat"
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={form.trackInventory}
              onChange={(e) => set("trackInventory", e.target.checked)}
              className="w-4 h-4 accent-stone-900"
            />
            Track inventory
          </label>
          <Input
            label="Stock quantity"
            name="inventoryCount"
            inputMode="numeric"
            disabled={!form.trackInventory}
            value={form.inventoryCount}
            onChange={(e) => set("inventoryCount", e.target.value)}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-stone-700 min-h-[44px]">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="w-4 h-4 accent-stone-900"
          />
          Visible to customers
        </label>
        <div>
          <span className="block text-sm font-medium text-stone-800 mb-1.5">
            Photos <span className="font-normal text-stone-500">(up to {MAX_PHOTOS})</span>
          </span>
          {(gallery.length > 0 || pending.length > 0) && (
            <ul className="mb-2.5 grid grid-cols-3 gap-2" aria-label="Product photos">
              {gallery.map((url) => (
                <li key={url} className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-100 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    aria-label="Remove this photo"
                    className="absolute top-1 right-1 w-8 h-8 rounded-full bg-stone-950/70 text-white flex items-center justify-center"
                  >
                    <i className="fa fa-times text-xs" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {pending.map((p) => (
                <li key={p.preview} className="relative rounded-lg overflow-hidden border border-dashed border-stone-300 bg-stone-50 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-stone-950/70 text-white text-[10px] font-medium px-1.5 py-0.5">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => removePending(p.preview)}
                    aria-label="Remove this photo"
                    className="absolute top-1 right-1 w-8 h-8 rounded-full bg-stone-950/70 text-white flex items-center justify-center"
                  >
                    <i className="fa fa-times text-xs" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {photoError && (
            <p role="alert" className="mb-2 text-xs text-red-700">
              {photoError}
            </p>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            aria-label="Add product photos"
            onChange={(e) => {
              pickPhotos(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-900 hover:bg-stone-100 min-h-[44px]"
          >
            <i className="fa fa-camera" aria-hidden="true" />
            Add photos
          </button>
          {uploadStatus && (
            <p role="status" className="mt-2 text-xs text-stone-600">
              <i className="fa fa-spinner fa-spin mr-1.5" aria-hidden="true" />
              {uploadStatus}
            </p>
          )}
        </div>
        <div>
          <Button type="submit" loading={saving} size="lg">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
