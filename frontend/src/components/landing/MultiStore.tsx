"use client";

import { ArrowDown, ShoppingCart } from "lucide-react";
import { SectionHeading } from "./cards";
import { useLiveMarketplace } from "./useLiveMarketplace";
import { priceStringToNaira, formatNaira } from "@/lib/format";

/**
 * One-cart concept demo, built only from live marketplace data.
 * Hidden entirely until live products exist — no sample stores.
 */
export function MultiStore() {
  const { products } = useLiveMarketplace();

  if (products !== null && products.length === 0) return null;

  const entries = (() => {
    const seen = new Set<string>();
    const out: { store: string; initial: string; product: string; price: string; icon: string; tint: string }[] = [];
    for (const p of products ?? []) {
      if (seen.has(p.store)) continue;
      seen.add(p.store);
      out.push({
        store: p.store,
        initial: p.storeInitial,
        product: p.name,
        price: p.price,
        icon: p.icon,
        tint: p.tint,
      });
      if (out.length === 3) break;
    }
    return out;
  })();

  const subtotal = entries.reduce((sum, e) => sum + priceStringToNaira(e.price), 0);

  return (
    <section aria-labelledby="multistore-heading" className="bg-white fluid-section">
      <div className="site-container">
        <SectionHeading
          eyebrow="One cart"
          title="More Stores. More Choices. One Cart."
          copy="Add products from multiple independent stores and check out once. The platform handles the rest."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center max-w-5xl mx-auto">
          <div className="space-y-3">
            {products === null ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-stone-200 bg-white p-3.5 h-[68px] animate-pulse" aria-hidden="true" />
                ))}
              </>
            ) : (
              entries.map((s, i) => (
                <article
                  key={s.store}
                  data-aos="fade-up"
                  data-aos-delay={i * 100}
                  className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm"
                >
                  <span className={`w-11 h-11 rounded-xl ${s.tint} flex items-center justify-center shrink-0`}>
                    <i className={`fa ${s.icon}`} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-stone-500">{s.store}</p>
                    <p className="text-sm font-semibold text-stone-900 truncate">{s.product}</p>
                  </div>
                  <span className="text-sm font-bold text-stone-900 shrink-0">{s.price}</span>
                </article>
              ))
            )}
          </div>

          <div aria-hidden="true" className="hidden lg:flex flex-col items-center gap-2 text-stone-300">
            <span className="w-px h-10 bg-stone-200" />
            <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
            <span className="w-px h-10 bg-stone-200" />
          </div>

          <article data-aos="fade-up" data-aos-delay="150" className="rounded-2xl border border-forest-900 bg-forest-900 text-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5" />
              <h3 id="multistore-heading" className="text-base font-semibold">Your Cart</h3>
              <span className="ml-auto text-xs text-forest-100">
                {products === null ? "…" : `${entries.length} store${entries.length === 1 ? "" : "s"}`}
              </span>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {products === null ? (
                <>
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="border-b border-white/10 pb-2.5 h-5 rounded bg-white/10 animate-pulse" aria-hidden="true" />
                  ))}
                </>
              ) : (
                entries.map((s) => (
                  <li key={s.store} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                    <span className="text-stone-300 truncate">{s.product} <span className="text-stone-500">· {s.store}</span></span>
                    <span className="font-semibold shrink-0">{s.price}</span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-stone-400">Subtotal</span>
              <span className="text-lg font-bold">{products === null ? "…" : formatNaira(subtotal)}</span>
            </div>
            <p className="mt-3 rounded-lg bg-forest-800 border border-white/10 px-3 py-2.5 text-xs text-forest-100">
              One checkout experience: pay once, track everything.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
