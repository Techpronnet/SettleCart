import Link from "next/link";
import { ArrowRight, BadgeCheck, Package, TrendingUp } from "lucide-react";
import { SectionHeading } from "./cards";

export function VendorCTA() {
  return (
    <section id="sell" aria-labelledby="sell-heading" className="bg-white fluid-section scroll-mt-20">
      <div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center">
        <div data-aos="fade-up">
          <SectionHeading
            align="left"
            eyebrow="For vendors"
            title="Your Store Belongs Here."
            copy="Turn your products into a digital storefront and reach customers beyond your physical location."
          />
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 min-h-[48px] transition-colors"
            >
              Start Selling <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-stone-300 text-stone-900 hover:bg-stone-100 min-h-[48px] transition-colors"
            >
              Learn More
            </Link>
          </div>
          <ul className="mt-6 space-y-2 text-sm text-stone-600">
            {["Publish products in minutes", "Receive and prepare orders", "Get paid through verified settlement"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-brand-600 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div data-aos="fade-up" data-aos-delay="120" className="rounded-2xl border border-sand-border bg-cream p-4 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.08)]" aria-label="Vendor dashboard preview">
          <div className="flex items-center gap-3 rounded-xl bg-white border border-stone-200 p-3.5">
            <span className="w-10 h-10 rounded-xl bg-forest-900 text-white font-bold flex items-center justify-center">U</span>
            <div>
              <p className="text-sm font-semibold text-stone-900">Urban Threads</p>
              <p className="text-xs text-forest-700 font-medium">Published · Verified</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-stone-500">
              <TrendingUp className="w-4 h-4" /> ₦1.2M sales
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Products", value: "120" },
              { label: "New orders", value: "18" },
              { label: "Ready", value: "6" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white border border-stone-200 p-3 text-center">
                <p className="text-lg font-bold text-stone-900">{s.value}</p>
                <p className="text-[11px] text-stone-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-white border border-stone-200 p-3.5">
            <p className="flex items-center gap-2 text-xs font-semibold text-stone-900">
              <Package className="w-4 h-4 text-stone-500" /> Incoming orders
            </p>
            <ul className="mt-2.5 space-y-2 text-xs">
              {[
                ["#1042 · Ankara Midi Dress ×2", "Preparing"],
                ["#1043 · Aso-Oke Agbada Set ×1", "New"],
                ["#1044 · Weekend Bag ×1", "Ready for pickup"],
              ].map(([o, s]) => (
                <li key={o} className="flex items-center justify-between gap-2">
                  <span className="text-stone-600 truncate">{o}</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 font-medium text-stone-700 shrink-0">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
