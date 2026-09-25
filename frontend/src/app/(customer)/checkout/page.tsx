"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { RequireAuth, useAuthUser } from "@/components/auth/RequireAuth";
import { useCart } from "@/components/ui/Dialog";
import { defaultAddress } from "@/lib/addresses";
import { formatMoney } from "@/lib/format";
import { ApiError, createOrder, initializePayment } from "@/lib/api";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";

function CheckoutForm() {
  const user = useAuthUser();
  const { items, subtotalNaira, remove, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);

  // Derived-state prefill once the account resolves (client-only, post-hydration).
  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    const saved = defaultAddress();
    if (saved) {
      setName(saved.recipient);
      setPhone(saved.phone);
      setAddress(saved.address);
      setCity(saved.city);
    } else {
      setName(user.full_name ?? "");
      setPhone(user.phone ?? "");
    }
  }

  const realItems = items.filter((i) => i.backendId);
  const demoItems = items.filter((i) => !i.backendId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (realItems.length === 0) return;
    setPlacing(true);
    try {
      const order = await createOrder({
        items: realItems.map((i) => ({ product_id: i.backendId as string, quantity: i.qty })),
        delivery_address: address.trim(),
        delivery_city: city.trim(),
        delivery_phone: phone.trim(),
        notes: notes.trim() || null,
      });
      const payment = await initializePayment({
        order_id: order.id,
        callback_url: `${APP_URL}/payment/verify?order=${order.id}`,
      });
      try {
        window.sessionStorage.setItem("settlecart_last_order", order.id);
      } catch {
        // non-fatal
      }
      clear();
      window.location.assign(payment.authorization_url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "We couldn't place your order. Prices may have changed; try again."
      );
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon="fa-shopping-cart"
        title="Nothing to check out"
        description="Your cart is empty."
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

  if (realItems.length === 0) {
    return (
      <EmptyState
        icon="fa-cube"
        title="Preview items can't be ordered yet"
        description="Your cart holds marketplace preview items. Browse live stores to place a real order."
        action={
          <Link
            href="/discover"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 min-h-[48px]"
          >
            Browse live stores
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ol aria-label="Checkout steps" className="mb-4 flex items-center gap-1.5 text-xs">
        {["Delivery", "Review", "Payment"].map((label, i) => (
          <li key={label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="w-4 sm:w-8 h-px bg-stone-300" />}
            <span
              aria-current={i === 0 ? "step" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                i === 0 ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-500"
              }`}
            >
              <span>{i + 1}</span> {label}
            </span>
          </li>
        ))}
      </ol>
      <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-800">
            {error}
          </div>
        )}

        <Card title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" name="name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone" name="phone" required type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </Card>

        <Card
          title="Delivery address"
          action={
            <Link href="/addresses" className="text-sm font-medium text-stone-900 underline">
              Saved addresses
            </Link>
          }
        >
          <div className="grid gap-4">
            <Input label="Street address" name="address" required autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" name="city" required autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input label="Notes for rider (optional)" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </Card>

        {demoItems.length > 0 && (
          <Card title="Preview items not included">
            <p className="text-sm text-stone-500">
              These preview items cannot be ordered yet and are excluded from this checkout.
            </p>
            <ul className="mt-3 space-y-2">
              {demoItems.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-stone-600 truncate">
                    {i.name} <span className="text-stone-400">· {i.store}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i.id)}
                    className="text-xs font-medium text-stone-500 hover:text-red-700 underline shrink-0 min-h-[36px]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title="Payment">
          <p className="text-sm text-stone-600">
            You will be redirected to our secure payment partner to complete this order. Payment is
            confirmed via webhook before any vendor starts preparing your items.
          </p>
        </Card>
      </div>

      <div>
        <Card title="Order summary">
          <ul className="space-y-2 text-sm">
            {realItems.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="text-stone-600 truncate">
                  {i.name} <span className="text-stone-400">× {i.qty}</span>
                </span>
                <span className="font-semibold text-stone-900 shrink-0">
                  {formatMoney(i.priceNaira * i.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-stone-100 pt-3 text-base">
            <span className="font-semibold text-stone-900">Total due</span>
            <span className="font-bold text-stone-900">
              {formatMoney(realItems.reduce((s, i) => s + i.priceNaira * i.qty, 0))}
            </span>
          </div>
          <p className="mt-1 text-xs text-stone-500">
            Subtotal {formatMoney(subtotalNaira)}. Delivery and fees are confirmed by the platform
            before payment.
          </p>
          <Button type="submit" loading={placing} size="lg" className="mt-4 w-full">
            Place order and pay
          </Button>
        </Card>
      </div>
      </form>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <div>
      <PageHeader
        title="Checkout"
        description="One checkout across every store in your cart."
        breadcrumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]}
      />
      <RequireAuth>
        <CheckoutForm />
      </RequireAuth>
    </div>
  );
}
