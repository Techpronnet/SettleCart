import { ArrowDown, ShoppingCart } from "lucide-react";
import { SectionHeading } from "./cards";

const STORES = [
  { store: "Urban Threads", initial: "U", product: "Ankara Midi Dress", price: "₦24,500", icon: "fa-black-tie", tint: "bg-rose-50 text-rose-600" },
  { store: "Nova Gadgets", initial: "N", product: "Wireless Earbuds Pro", price: "₦32,500", icon: "fa-headphones", tint: "bg-sky-50 text-sky-600" },
  { store: "Glow & Co.", initial: "G", product: "Shea Glow Butter", price: "₦8,750", icon: "fa-magic", tint: "bg-amber-50 text-amber-600" },
];

export function MultiStore() {
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
            {STORES.map((s, i) => (
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
            ))}
          </div>

          <div aria-hidden="true" className="hidden lg:flex flex-col items-center gap-2 text-stone-300">
            <span className="w-px h-10 bg-stone-200" />
            <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
            <span className="w-px h-10 bg-stone-200" />
          </div>

          <article data-aos="fade-up" data-aos-delay="150" className="rounded-2xl border border-stone-900 bg-stone-950 text-white p-5 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5" />
              <h3 id="multistore-heading" className="text-base font-semibold">Your Cart</h3>
              <span className="ml-auto text-xs text-stone-400">3 stores</span>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {STORES.map((s) => (
                <li key={s.store} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5">
                  <span className="text-stone-300 truncate">{s.product} <span className="text-stone-500">· {s.store}</span></span>
                  <span className="font-semibold shrink-0">{s.price}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-stone-400">Subtotal</span>
              <span className="text-lg font-bold">₦65,750</span>
            </div>
            <p className="mt-3 rounded-lg bg-teal-900/60 border border-teal-700/50 px-3 py-2.5 text-xs text-teal-100">
              One checkout experience: pay once, track everything.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
