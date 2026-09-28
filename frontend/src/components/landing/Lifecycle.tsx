import { Search, ShoppingBag, CreditCard, PackageCheck } from "lucide-react";

const STAGES = [
  { n: "01", icon: Search, title: "Discover", text: "Find products and stores that match what you need." },
  { n: "02", icon: ShoppingBag, title: "Order", text: "Add products from different stores to your cart and place your order." },
  { n: "03", icon: CreditCard, title: "Pay", text: "Complete checkout securely through the platform." },
  { n: "04", icon: PackageCheck, title: "Receive", text: "Stores prepare the order while dispatch handles delivery to your doorstep." },
];

export function Lifecycle() {
  return (
    <section aria-labelledby="lifecycle-heading" className="bg-forest-950 text-white fluid-section">
      <div className="site-container">
        <div className="max-w-2xl mx-auto text-center" data-aos="fade-up">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
            The journey
          </span>
          <h2 id="lifecycle-heading" className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">
            From Discovery to Doorstep.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-400">One connected commerce experience across stores, payments and delivery.</p>
        </div>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s, i) => (
            <li
              key={s.n}
              data-aos="fade-up"
              data-aos-delay={i * 100}
              className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
            >
              <span className="text-xs font-mono text-brand-500">{s.n}</span>
              <span className="mt-3 w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-stone-400 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
