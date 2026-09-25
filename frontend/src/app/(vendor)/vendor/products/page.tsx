"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  createProduct,
  deleteProduct,
  friendlyApiMessage,
  getStoreProducts,
  updateProduct,
  type ProductResponse,
} from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";
import { formatMoney } from "@/lib/format";

function ProductsBody() {
  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleting, setDeleting] = useState<ProductResponse | null>(null);

  async function load(sid: string) {
    setError("");
    try {
      const res = await getStoreProducts(sid, { page: 1, size: 100 });
      setProducts(res.products);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load products.");
    }
  }

  useEffect(() => {
    const ctx = getVendorContext();
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStoreId(ctx.storeId);
    if (ctx.storeId) void load(ctx.storeId);
  }, []);

  async function togglePublish(p: ProductResponse) {
    setActionError("");
    try {
      const updated = await updateProduct(p.id, { is_published: !p.is_published });
      setProducts((prev) => prev?.map((x) => (x.id === p.id ? updated : x)) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Could not update.") : "Network error.");
    }
  }

  async function duplicate(p: ProductResponse) {
    setActionError("");
    try {
      await createProduct(p.store_id, {
        name: `${p.name} (copy)`,
        description: p.description,
        price: p.price,
        sku: null,
        category_id: p.category_id,
        track_inventory: p.track_inventory,
        inventory_count: p.inventory_count,
        is_published: false,
      });
      if (storeId) await load(storeId);
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Could not duplicate.") : "Network error.");
    }
  }

  async function confirmDelete() {
    if (!deleting || !storeId) return;
    setActionError("");
    try {
      await deleteProduct(deleting.id);
      setDeleting(null);
      await load(storeId);
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Could not delete.") : "Network error.");
      setDeleting(null);
    }
  }

  if (!storeId) return <VendorSetupPrompt />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-stone-500">
          {products === null ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"}`}
        </p>
        <Link
          href="/vendor/products/new"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 min-h-[40px]"
        >
          Add Product
        </Link>
      </div>

      {actionError && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          {actionError}
        </p>
      )}

      {error ? (
        <ErrorState title="Products unavailable." description={error} onRetry={() => storeId && load(storeId)} />
      ) : products === null ? (
        <ListSkeleton rows={4} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="fa-cube"
          title="No products yet"
          description="Add your first product to start selling."
          action={
            <Link
              href="/vendor/products/new"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
            >
              Add Product
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {products.map((p) => (
            <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900 truncate">{p.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatMoney(p.price)}
                    {p.track_inventory ? ` · ${p.inventory_count} in stock` : " · stock not tracked"}
                  </p>
                </div>
                <Badge tone={p.is_published ? "success" : "neutral"}>
                  {p.is_published ? "Published" : "Hidden"}
                </Badge>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-3">
                <Link href={`/vendor/products/${p.id}/edit`} className="text-xs font-medium text-stone-700 underline min-h-[36px] inline-flex items-center">
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => togglePublish(p)}
                  className="text-xs font-medium text-stone-700 underline min-h-[36px]"
                >
                  {p.is_published ? "Hide" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => duplicate(p)}
                  className="text-xs font-medium text-stone-700 underline min-h-[36px]"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(p)}
                  className="text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[36px]"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete "${deleting?.name}"?`}
        description="This removes the product from your store. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div>
      <PageHeader title="Products" description="Your catalogue." />
      <RequireAuth>
        <ProductsBody />
      </RequireAuth>
    </div>
  );
}
