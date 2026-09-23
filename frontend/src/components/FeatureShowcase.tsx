import { Store, Layers, Coins, Bike, CheckCircle, ArrowUpRight } from "lucide-react";

export function FeatureShowcase() {
  const features = [
    {
      title: "Branded Digital Storefronts",
      badge: "Multi-Tenancy",
      desc: "Turn your Instagram/WhatsApp followers into high-paying orders. Get a fast, branded mobile storefront with custom links, product catalogues, and automated inventory sync.",
      icon: Store,
      points: [
        "Instant vanity links (settlecart.com/store/your-brand)",
        "Zero monthly subscription fees",
        "WhatsApp shareable product cards & direct ordering",
      ],
      gradient: "from-emerald-500/20 to-teal-500/5",
      accent: "text-emerald-400",
    },
    {
      title: "Multi-Store Unified Checkout",
      badge: "Parent/Child Decomposition",
      desc: "Customers order food from Store A and groceries from Store B in a single payment. SettleCart splits the checkout into independent vendor orders and dedicated dispatch tasks.",
      icon: Layers,
      points: [
        "Single Paystack payment intent for customer",
        "Independent vendor fulfillment & cancellation isolation",
        "Independent delivery tasks with separate tracking",
      ],
      gradient: "from-blue-500/20 to-indigo-500/5",
      accent: "text-blue-400",
    },
    {
      title: "Double-Entry Financial Ledger",
      badge: "Audit & Payout",
      desc: "Never lose a kobo. Every payment, fee, delivery payout, and refund is recorded into an immutable append-only ledger with automated bank payouts via Paystack Transfers API.",
      icon: Coins,
      points: [
        "Separation of pending vs available balances",
        "Instant customer wallet refunds for cancelled items",
        "Reconciled transaction histories ready for tax & accounting",
      ],
      gradient: "from-amber-500/20 to-yellow-500/5",
      accent: "text-amber-400",
    },
    {
      title: "Decoupled Platform Dispatch Pool",
      badge: "Logistics Automation",
      desc: "Deliver packages across town without managing your own fleet. Broadcast tasks to verified nearby riders with live GPS tracking and proof-of-delivery OTP codes.",
      icon: Bike,
      points: [
        "Dynamic radius matching & broadcast to nearby riders",
        "Admin manual assignment override when needed",
        "Instant rider delivery earnings credited on OTP validation",
      ],
      gradient: "from-teal-500/20 to-cyan-500/5",
      accent: "text-teal-400",
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-900/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Engineered For Scale
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built To Eliminate African Commerce Friction
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300">
            Engineered from ground up based on the comprehensive SettleCart requirements baseline: reliable, secure, and auditable.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-slate-950/70 rounded-2xl border border-slate-800 p-8 hover:border-slate-700 transition-all hover:shadow-2xl hover:shadow-slate-900/50 group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${feat.gradient} rounded-bl-full pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${feat.accent}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {feat.desc}
                  </p>

                  <ul className="space-y-2.5 border-t border-slate-800/80 pt-4">
                    {feat.points.map((pt, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                        <CheckCircle className={`w-4 h-4 ${feat.accent} shrink-0`} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

