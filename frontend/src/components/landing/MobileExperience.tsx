import { Search, ShoppingCart, MapPin } from "lucide-react";
import { SectionHeading } from "./cards";

export function MobileExperience() {
  return (
    <section aria-labelledby="mobile-heading" className="bg-white fluid-section">
      <div className="site-container grid gap-10 lg:grid-cols-2 lg:items-center">
        <div data-aos="fade-up">
          <SectionHeading
            align="left"
            eyebrow="Mobile-first"
            title="Built for shopping on the go."
            copy="Search, compare stores, check out and track delivery, designed for mobile-first commerce."
          />
          <ul className="mt-6 space-y-3 text-sm text-stone-600">
            {["Marketplace search with store filters", "Product cards with ratings and one-tap add", "Live order tracking to your doorstep"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-forest-900 text-white flex items-center justify-center shrink-0"><i className="fa fa-check text-[10px]" aria-hidden="true" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center" data-aos="fade-up" data-aos-delay="120">
          <div className="w-[270px] sm:w-[300px] rounded-[2rem] border border-stone-300 bg-stone-950 p-2.5 shadow-2xl" role="img" aria-label="SettleCart mobile shopping preview">
            <div className="rounded-[1.6rem] bg-white overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <div className="mx-auto w-20 h-1.5 rounded-full bg-stone-200" />
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2.5 text-xs text-stone-500">
                  <Search className="w-3.5 h-3.5" /> Search products, stores…
                </div>
                <div className="mt-2.5 flex gap-1.5 overflow-hidden">
                  {["All", "Fashion", "Phones", "Food"].map((c, i) => (
                    <span key={c} className={`rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${i === 0 ? "bg-forest-900 text-white" : "bg-stone-100 text-stone-600"}`}>{c}</span>
                  ))}
                </div>
              </div>
              <div className="px-4 py-2 grid grid-cols-2 gap-2">
                {[
                  { icon: "fa-black-tie", name: "Ankara Dress", price: "₦24,500", tint: "bg-rose-50 text-rose-500" },
                  { icon: "fa-mobile", name: "Smartphone X12", price: "₦189,000", tint: "bg-sky-50 text-sky-500" },
                  { icon: "fa-magic", name: "Glow Butter", price: "₦8,750", tint: "bg-amber-50 text-amber-500" },
                  { icon: "fa-shopping-basket", name: "Fresh Basket", price: "₦12,300", tint: "bg-emerald-50 text-emerald-500" },
                ].map((p) => (
                  <div key={p.name} className="rounded-xl border border-stone-100 p-1.5">
                    <div className={`h-16 rounded-lg ${p.tint} flex items-center justify-center`}>
                      <i className={`fa ${p.icon}`} aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold text-stone-900 truncate">{p.name}</p>
                    <p className="text-[10px] font-bold text-stone-900">{p.price}</p>
                  </div>
                ))}
              </div>
              <div className="mx-4 mb-2 rounded-xl bg-forest-900 text-white px-3 py-2.5 flex items-center gap-2">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Cart · 3 stores · ₦65,750</span>
              </div>
              <div className="mx-4 mb-4 rounded-xl bg-forest-50 border border-forest-100 px-3 py-2.5 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span className="text-[11px] font-medium text-forest-800">Order on the way, arriving soon</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
