"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, X, Trash2, Minus, Plus } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { isSaved, toggleSaved } from "@/lib/favorites";
import { EmptyState } from "./States";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-stone-950/40"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-stone-200">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm text-stone-600">{description}</p>
          )}
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-stone-700 hover:bg-stone-100 min-h-[40px]"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-md text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 min-h-[40px]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3200);
    return () => clearTimeout(t);
  }, [message]);
  return { message, notify: setMessage };
}

export type ToastTone = "success" | "error" | "info";

const TOAST_STYLES: Record<ToastTone, string> = {
  success: "bg-stone-900 text-white",
  error: "bg-red-800 text-white",
  info: "bg-white text-stone-900 border border-stone-300 shadow-lg",
};

export function ToastRegion({
  message,
  tone = "success",
  onClose,
}: {
  message: string | null;
  tone?: ToastTone;
  onClose?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 md:bottom-6 left-1/2 z-[95] -translate-x-1/2 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-xl max-w-[calc(100vw-2rem)] ${TOAST_STYLES[tone]}`}
    >
      <i
        className={`fa ${tone === "success" ? "fa-check-circle" : tone === "error" ? "fa-exclamation-circle" : "fa-info-circle"} shrink-0`}
        aria-hidden="true"
      />
      <span className="truncate">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="p-1.5 -m-1 rounded-md hover:bg-white/15 min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0"
        >
          <i className="fa fa-times" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cart — localStorage-backed multi-store cart. Checkout ships in      */
/* Phase 2; until then the drawer hands off to login to continue.      */
/* ------------------------------------------------------------------ */

export interface CartProduct {
  id: string;
  name: string;
  priceNaira: number;
  store: string;
  storeInitial: string;
  icon: string;
  tint: string;
  /** Backend product UUID. Absent for preview items that cannot be ordered. */
  backendId?: string | null;
  /** Backend store UUID for grouping real checkouts. */
  storeId?: string | null;
}

export interface CartItem extends CartProduct {
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalNaira: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  add: (product: CartProduct) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "settlecart_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.id === "string" && typeof i.qty === "number" && i.qty > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    // Hydration-safe: localStorage is only available on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadCart());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — cart still works in memory
    }
  }, [items]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotalNaira = items.reduce((sum, i) => sum + i.qty * i.priceNaira, 0);
    return {
      items,
      count,
      subtotalNaira,
      cartOpen,
      setCartOpen,
      add: (product) => {
        setItems((prev) => {
          const existing = prev.find((i) => i.id === product.id);
          if (existing) {
            return prev.map((i) =>
              i.id === product.id ? { ...i, qty: i.qty + 1 } : i
            );
          }
          return [...prev, { ...product, qty: 1 }];
        });
        setNotice(`${product.name} added to cart`);
      },
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      setQty: (id, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.id !== id)
            : prev.map((i) => (i.id === id ? { ...i, qty } : i))
        ),
      clear: () => setItems([]),
    };
  }, [items, cartOpen]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <ToastRegion message={notice} />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function AddToCartButton({ product }: { product: CartProduct }) {
  const { add } = useCart();
  return (
    <button
      type="button"
      onClick={() => add(product)}
      aria-label={`Add ${product.name} to cart`}
      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 text-white text-xs font-medium px-3 py-2 hover:bg-stone-800 active:scale-95 min-h-[36px] transition-all"
    >
      <ShoppingCart className="w-3.5 h-3.5" />
      Add
    </button>
  );
}

export function WishlistButton({ product }: { product: CartProduct }) {
  const [saved, setSaved] = useState<boolean | null>(null);

  useEffect(() => {
    // Client-only saved lookup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(isSaved(product.id));
  }, [product.id]);

  function toggle() {
    const result = toggleSaved({
      id: product.id,
      name: product.name,
      priceNaira: product.priceNaira,
      store: product.store,
      storeInitial: product.storeInitial,
      icon: product.icon,
      tint: product.tint,
      backendId: product.backendId ?? null,
      storeId: product.storeId ?? null,
    });
    setSaved(result.saved);
  }

  const active = saved ?? false;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      onClick={toggle}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 shadow-sm flex items-center justify-center transition-all ${
        active
          ? "opacity-100 text-rose-600"
          : "text-stone-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      <Heart className={`w-4 h-4 ${active ? "fill-rose-600" : ""}`} />
    </button>
  );
}

export function CartCountBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-teal-700 text-white text-[10px] font-semibold flex items-center justify-center">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function CartDrawer() {
  const { items, count, subtotalNaira, cartOpen, setCartOpen, setQty, remove } =
    useCart();

  useEffect(() => {
    if (!cartOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const list = groups.get(item.store) ?? [];
    list.push(item);
    groups.set(item.store, list);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-stone-950/40"
        aria-hidden="true"
        onClick={() => setCartOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Shopping cart${count ? `, ${count} items` : ""}`}
        className="fixed top-0 right-0 bottom-0 z-[95] w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center gap-2.5 border-b border-stone-200 px-5 py-4">
          <ShoppingCart className="w-5 h-5 text-stone-700" />
          <h2 className="text-base font-bold text-stone-900">
            Your Cart{count > 0 ? ` (${count})` : ""}
          </h2>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="ml-auto p-2.5 rounded-md text-stone-600 hover:bg-stone-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-5">
            <EmptyState
              icon="fa-shopping-cart"
              title="Your cart is empty"
              description="Discover products from different stores and add them here."
              action={
                <Link
                  href="/#discover"
                  onClick={() => setCartOpen(false)}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
                >
                  Start Shopping
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {Array.from(groups.entries()).map(([store, lines]) => (
                <section key={store} aria-label={`Items from ${store}`}>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    <span className="w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">
                      {lines[0].storeInitial}
                    </span>
                    {store}
                  </p>
                  <ul className="mt-2 space-y-2.5">
                    {lines.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
                      >
                        <span
                          className={`w-11 h-11 rounded-lg ${item.tint} flex items-center justify-center shrink-0`}
                        >
                          <i className={`fa ${item.icon}`} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-stone-500">
                            {formatNaira(item.priceNaira)} each
                          </p>
                          <div className="mt-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty - 1)}
                              aria-label={`Reduce quantity of ${item.name}`}
                              className="w-8 h-8 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className="w-8 text-center text-sm font-semibold"
                              aria-live="polite"
                              aria-label={`Quantity: ${item.qty}`}
                            >
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQty(item.id, item.qty + 1)}
                              aria-label={`Increase quantity of ${item.name}`}
                              className="w-8 h-8 rounded-md border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-stone-900">
                            {formatNaira(item.priceNaira * item.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="p-2 rounded-md text-stone-400 hover:text-red-700 hover:bg-red-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="border-t border-stone-200 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-lg font-bold text-stone-900">
                  {formatNaira(subtotalNaira)}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Delivery and fees are calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={() => setCartOpen(false)}
                className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
              >
                Proceed to checkout
              </Link>
              <div className="flex items-center justify-between">
                <Link
                  href="/cart"
                  onClick={() => setCartOpen(false)}
                  className="text-sm font-medium text-stone-700 hover:text-stone-950 underline min-h-[44px] inline-flex items-center"
                >
                  View full cart
                </Link>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="text-sm font-medium text-stone-600 hover:text-stone-950 underline min-h-[44px]"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
