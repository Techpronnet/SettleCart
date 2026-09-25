"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { VendorSetupPrompt } from "@/components/vendor/VendorBits";
import {
  ApiError,
  friendlyApiMessage,
  getStoreProducts,
  updateProduct,
  type ProductResponse,
} from "@/lib/api";
import { getVendorContext } from "@/lib/vendor-context";

const LOW_STOCK_AT = 5;

function InventoryBody({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<ProductResponse[] | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  async function load() {
    setError("");
    try {
      const res = await getStoreProducts(storeId, { page: 1, size: 100 });
      setProducts(res.products);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't load inventory.");
    }
  }

  useEffect(() => {
    // Initial load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function adjust(p: ProductResponse, delta: number) {
    setActionError("");
    const next = Math.max(0, p.inventory_count + delta);
    try {
      const updated = await updateProduct(p.id, { inventory_count: next });
      setProducts((prev) => prev?.map((x) => (x.id === p.id ? updated : x)) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? friendlyApiMessage(err, "Could not adjust stock.") : "Network error.");
    }
  }

  const tracked = (products ?? []).filter((p) => p.track_inventory);

  return (
    <div>
      {actionError && (
        <p role="alert" className="mb-3 text-xs text-red-700">
          {actionError}
        </p>
      )}
      {error ? (
        <ErrorState title="Inventory unavailable." description={error} onRetry={load} />
      ) : products === null ? (
        <ListSkeleton rows={4} />
      ) : tracked.length === 0 ? (
        <EmptyState
          icon="fa-archive"
          title="No tracked stock"
          description="Enable stock tracking on a product to manage it here."
        />
      ) : (
        <ul className="space-y-2.5">
          {tracked.map((p) => {
            const low = p.inventory_count <= LOW_STOCK_AT;
            return (
              <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900 truncate">{p.name}</p>
                  {low ? <Badge tone="warning">Low stock</Badge> : <Badge tone="success">In stock</Badge>}
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjust(p, -1)}
                      aria-label={`Reduce stock of ${p.name}`}
                      className="w-9 h-9 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <i className="fa fa-minus text-xs" aria-hidden="true" />
                    </button>
                    <span className="w-12 text-center text-base font-bold" aria-live="polite">
                      {p.inventory_count}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjust(p, 1)}
                      aria-label={`Add stock to ${p.name}`}
                      className="w-9 h-9 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <i className="fa fa-plus text-xs" aria-hidden="true" />
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">Low at {LOW_STOCK_AT} or fewer</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function InventoryGate() {
  const ctx = getVendorContext();
  if (!ctx.storeId) return <VendorSetupPrompt />;
  return <InventoryBody storeId={ctx.storeId} />;
}

export default function InventoryPage() {
  return (
    <div>
      <PageHeader title="Inventory" description="Stock levels across your catalogue." />
      <RequireAuth>
        <InventoryGate />
      </RequireAuth>
    </div>
  );
}
