"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useCart } from "@/components/ui/Dialog";
import { ProductReviews } from "@/components/customer/Reviews";
import { ApiError, getProduct, getStore, type ProductResponse, type StoreResponse } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        getStore(p.store_id)
          .then((s) => {
            if (!cancelled) setStore(s);
          })
          .catch(() => {
            // store name is optional
          });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Product not found.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div>
        <PageHeader title="Product" breadcrumbs={[{ label: "Home", href: "/home" }, { label: "Product" }]} />
        <ErrorState title="We couldn't load this product." description={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <PageHeader title="Product" breadcrumbs={[{ label: "Home", href: "/home" }, { label: "Product" }]} />
        <ListSkeleton rows={3} />
      </div>
    );
  }

  const inStock =
    product.is_active && (!product.track_inventory || product.inventory_count > 0);

  return (
    <div>
      <PageHeader
        title={product.name}
        breadcrumbs={[
          { label: "Home", href: "/home" },
          ...(store ? [{ label: store.name, href: `/stores/${store.id}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-stone-100 overflow-hidden min-h-[280px]">
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="h-full min-h-[280px] w-full flex items-center justify-center text-stone-300">
              <i className="fa fa-cube text-6xl" aria-hidden="true" />
            </span>
          )}
        </div>

        <div>
          <Card title="Details">
            {store && (
              <p className="text-sm text-stone-600">
                Sold by{" "}
                <Link href={`/stores/${store.id}`} className="font-semibold text-stone-900 underline">
                  {store.name}
                </Link>
              </p>
            )}
            <p className="mt-2 text-2xl font-bold text-stone-900">{formatMoney(product.price)}</p>
            <p className="mt-1 text-sm text-stone-500">
              {inStock ? "In stock and ready to order." : "Currently out of stock."}
              {product.track_inventory && product.inventory_count > 0 && ` Only ${product.inventory_count} left.`}
            </p>
            {product.description && (
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">{product.description}</p>
            )}
            {product.sku && <p className="mt-2 text-xs text-stone-500">SKU: {product.sku}</p>}

            {inStock && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1" aria-label="Quantity">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Reduce quantity"
                    className="w-10 h-10 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                  >
                    <i className="fa fa-minus text-xs" aria-hidden="true" />
                  </button>
                  <span className="w-10 text-center text-base font-semibold" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    aria-label="Increase quantity"
                    className="w-10 h-10 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                  >
                    <i className="fa fa-plus text-xs" aria-hidden="true" />
                  </button>
                </div>
                <MultiAddButton
                  productId={product.id}
                  name={product.name}
                  priceNaira={Number(product.price) || 0}
                  storeName={store?.name ?? "Store"}
                  storeId={product.store_id}
                  qty={qty}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}

function MultiAddButton({
  productId,
  name,
  priceNaira,
  storeName,
  storeId,
  qty,
}: {
  productId: string;
  name: string;
  priceNaira: number;
  storeName: string;
  storeId: string;
  qty: number;
}) {
  const { add } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        for (let i = 0; i < qty; i++) {
          add({
            id: productId,
            name,
            priceNaira,
            store: storeName,
            storeInitial: storeName.charAt(0).toUpperCase(),
            icon: "fa-cube",
            tint: "bg-stone-100 text-stone-500",
            backendId: productId,
            storeId,
          });
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-stone-900 text-white text-sm font-semibold px-5 py-3 hover:bg-stone-800 active:scale-95 min-h-[48px]"
    >
      <i className="fa fa-shopping-cart" aria-hidden="true" />
      Add to cart
    </button>
  );
}
