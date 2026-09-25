import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";
import { AddToCartButton, WishlistButton } from "@/components/ui/Dialog";
import { formatMoney } from "@/lib/format";
import type { ProductResponse } from "@/lib/api";

/**
 * Product card for live backend catalogue data. Adds the real product
 * UUID to the cart so checkout can submit it to the orders API.
 */
export function BackendProductCard({
  product,
  storeName,
}: {
  product: ProductResponse;
  storeName?: string;
}) {
  const priceNaira = Number(product.price) || 0;
  const inStock = product.is_active && (!product.track_inventory || product.inventory_count > 0);

  return (
    <article className="group rounded-2xl border border-stone-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.10)] hover:-translate-y-1 transition-all duration-300 motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative">
        <Link
          href={`/products/${product.id}`}
          aria-label={`View ${product.name}`}
          className="block rounded-xl bg-stone-100 h-36 sm:h-40 overflow-hidden"
        >
          {product.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="h-full w-full flex items-center justify-center text-stone-300">
              <i className="fa fa-cube text-4xl" aria-hidden="true" />
            </span>
          )}
        </Link>
        <WishlistButton
          product={{
            id: product.id,
            name: product.name,
            priceNaira,
            store: storeName ?? "Store",
            storeInitial: (storeName ?? "S").charAt(0).toUpperCase(),
            icon: "fa-cube",
            tint: "bg-stone-100 text-stone-500",
            backendId: product.id,
            storeId: product.store_id,
          }}
        />
      </div>
      <div className="px-1 pt-3 pb-1">
        {storeName && (
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <span className="truncate font-medium">{storeName}</span>
            <BadgeCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-label="Verified store" />
          </p>
        )}
        <h3 className="mt-1 text-sm font-semibold text-stone-900 leading-snug line-clamp-1">
          <Link href={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">
          {inStock ? "In stock" : "Out of stock"}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-stone-900">{formatMoney(product.price)}</span>
          {inStock ? (
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                priceNaira,
                store: storeName ?? "Store",
                storeInitial: (storeName ?? "S").charAt(0).toUpperCase(),
                icon: "fa-cube",
                tint: "bg-stone-100 text-stone-500",
                backendId: product.id,
                storeId: product.store_id,
              }}
            />
          ) : (
            <span className="text-xs font-medium text-stone-400 px-3 py-2">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function BackendProductStars({ rating = "New" }: { rating?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-stone-500">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="font-medium text-stone-700">{rating}</span>
    </span>
  );
}
