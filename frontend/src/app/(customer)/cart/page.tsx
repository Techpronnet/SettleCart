"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/States";
import { useCart } from "@/components/ui/Dialog";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { items, count, subtotalNaira, setQty, remove, clear } = useCart();
  const [confirmClear, setConfirmClear] = useState(false);

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const list = groups.get(item.store) ?? [];
    list.push(item);
    groups.set(item.store, list);
  }

  return (
    <div>
      <PageHeader
        title="Your Cart"
        description={count > 0 ? `${count} item${count === 1 ? "" : "s"} from ${groups.size} store${groups.size === 1 ? "" : "s"}` : undefined}
        breadcrumbs={[{ label: "Home", href: "/home" }, { label: "Cart" }]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="fa-shopping-cart"
          title="Your cart is empty"
          description="Discover products from different stores and add them here."
          action={
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
            >
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {Array.from(groups.entries()).map(([store, lines]) => (
              <Card key={store} title={store}>
                <ul className="space-y-3">
                  {lines.map((item) => (
                    <li key={item.id} className="flex items-center gap-3">
                      <span className={`w-12 h-12 rounded-xl ${item.tint} flex items-center justify-center shrink-0`}>
                        <i className={`fa ${item.icon}`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-900 truncate">{item.name}</p>
                        <p className="text-xs text-stone-500">{formatMoney(item.priceNaira)} each</p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.qty - 1)}
                            aria-label={`Reduce quantity of ${item.name}`}
                            className="w-9 h-9 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                          >
                            <i className="fa fa-minus text-xs" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(item.id, item.qty + 1)}
                            aria-label={`Increase quantity of ${item.name}`}
                            className="w-9 h-9 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                          >
                            <i className="fa fa-plus text-xs" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-bold text-stone-900">
                          {formatMoney(item.priceNaira * item.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="text-xs font-medium text-stone-500 hover:text-red-700 underline min-h-[36px]"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="text-sm font-medium text-stone-500 hover:text-red-700 underline min-h-[44px]"
            >
              Clear cart
            </button>
          </div>

          <div>
            <Card title="Summary">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Subtotal</dt>
                  <dd className="font-semibold text-stone-900">{formatMoney(subtotalNaira)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Delivery</dt>
                  <dd className="text-stone-500">At checkout</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Fees</dt>
                  <dd className="text-stone-500">At checkout</dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-2 text-base">
                  <dt className="font-semibold text-stone-900">Total</dt>
                  <dd className="font-bold text-stone-900">{formatMoney(subtotalNaira)}</dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-4 w-full inline-flex items-center justify-center px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
              >
                Proceed to checkout
              </Link>
              <Link
                href="/discover"
                className="mt-2 w-full inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px]"
              >
                Continue shopping
              </Link>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear your cart?"
        description="All items from every store will be removed."
        confirmLabel="Clear cart"
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}
