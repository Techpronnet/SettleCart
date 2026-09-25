"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AddToCartButton } from "@/components/ui/Dialog";
import { loadWishlist, removeSaved, type SavedItem } from "@/lib/favorites";
import { formatMoney } from "@/lib/format";

function SavedBody() {
  const [items, setItems] = useState<SavedItem[] | null>(null);

  useEffect(() => {
    // Client-only wishlist restore.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadWishlist());
  }, []);

  if (!items) return null;

  if (items.length === 0) {
    return (
      <EmptyState
        icon="fa-heart-o"
        title="Nothing saved yet"
        description="Tap the heart on any product to keep it here."
        action={
          <Link
            href="/discover"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
          >
            Discover products
          </Link>
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-stone-200 bg-white p-3">
          <div className={`relative h-36 sm:h-40 rounded-xl ${item.tint} flex items-center justify-center overflow-hidden`}>
            <i className={`fa ${item.icon} text-4xl opacity-80`} aria-hidden="true" />
            <button
              type="button"
              onClick={() => setItems(removeSaved(item.id))}
              aria-label={`Remove ${item.name} from wishlist`}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-sm text-rose-600 flex items-center justify-center"
            >
              <i className="fa fa-heart" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500 truncate">{item.store}</p>
          <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-stone-900">{formatMoney(item.priceNaira)}</span>
            <AddToCartButton
              product={{
                id: item.id,
                name: item.name,
                priceNaira: item.priceNaira,
                store: item.store,
                storeInitial: item.storeInitial,
                icon: item.icon,
                tint: item.tint,
                backendId: item.backendId ?? null,
                storeId: item.storeId ?? null,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function SavedPage() {
  return (
    <div>
      <PageHeader title="Saved items" description="Your wishlist, ready when you are." />
      <RequireAuth>
        <SavedBody />
      </RequireAuth>
    </div>
  );
}
