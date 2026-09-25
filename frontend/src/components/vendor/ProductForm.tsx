"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  ApiError,
  friendlyApiMessage,
  getCategories,
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
  submitLabel,
  onSubmit,
}: {
  storeId: string;
  initial: ProductFormValue;
  submitLabel: string;
  onSubmit: (payload: ProductCreateRequest & ProductUpdateRequest) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: form.price.trim(),
        sku: form.sku.trim() || null,
        category_id: form.categoryId || null,
        track_inventory: form.trackInventory,
        inventory_count: Math.max(0, parseInt(form.inventoryCount, 10) || 0),
        is_published: form.published,
      });
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
          <Button type="submit" loading={saving} size="lg">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
