"use client";

import { useEffect, useState } from "react";
import { getPublicStores, getStoreProducts } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import type { LandingProduct } from "./data";

export interface LiveStore {
  id: string;
  name: string;
  city: string;
  initial: string;
}

/**
 * Live marketplace content with graceful fallback. Returns null while
 * loading, real stores/products when the backend has published content,
 * and empty arrays when it does not (callers then show prototype content).
 */
export function useLiveMarketplace() {
  const [stores, setStores] = useState<LiveStore[] | null>(null);
  const [products, setProducts] = useState<LandingProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPublicStores({ size: 6 });
        if (cancelled) return;
        if (res.stores.length === 0) {
          setStores([]);
          setProducts([]);
          return;
        }
        setStores(
          res.stores.map((s) => ({
            id: s.id,
            name: s.name,
            city: [s.city, s.state].filter(Boolean).join(", ") || "Online",
            initial: s.name.charAt(0).toUpperCase(),
          }))
        );
        const settled = await Promise.allSettled(
          res.stores
            .slice(0, 4)
            .map(async (s) => ({
              store: s,
              products: (await getStoreProducts(s.id, { page: 1, size: 4 })).products,
            }))
        );
        if (cancelled) return;
        const items: LandingProduct[] = [];
        for (const r of settled) {
          if (r.status !== "fulfilled") continue;
          for (const p of r.value.products) {
            if (!p.is_active) continue;
            items.push({
              id: p.id,
              name: p.name,
              price: formatNaira(Number(p.price) || 0),
              store: r.value.store.name,
              storeInitial: r.value.store.name.charAt(0).toUpperCase(),
              rating: "New",
              icon: "fa-cube",
              tint: "bg-stone-100 text-stone-500",
              verified: true,
            });
          }
        }
        setProducts(items.slice(0, 8));
      } catch {
        if (!cancelled) {
          setStores([]);
          setProducts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    stores,
    products,
    hasLiveStores: !!stores && stores.length > 0,
    hasLiveProducts: !!products && products.length > 0,
  };
}
