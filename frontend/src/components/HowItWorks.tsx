import { ShoppingBag, Store, Bike, CheckCircle2, ArrowRight, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      num: "01",
      actor: "Customer",
      icon: ShoppingBag,
      title: "Discover & Unified Checkout",
      desc: "Shoppers browse single or multi-store catalogues. Pay easily via Card, USSD, or Bank Transfer via Paystack with zero risk.",
      color: "from-blue-500/20 to-cyan-500/10",
      accent: "text-blue-400",
      border: "border-blue-500/30",
    },
    {
      num: "02",
      actor: "Vendor",
      icon: Store,
      title: "Accept & Prepare Order",
      desc: "Vendors receive instant alerts. Accept within the 20-minute SLA window, prepare package, and mark Ready for Pickup.",
      color: "from-emerald-500/20 to-teal-500/10",
      accent: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    {
      num: "03",
      actor: "Dispatch",
      icon: Bike,
      title: "Pickup & Safe Transit",
      desc: "Nearby independent or fleet riders accept delivery tasks, confirm pickup at vendor store, and navigate directly to customer.",
      color: "from-amber-500/20 to-orange-500/10",
      accent: "text-amber-400",
      border: "border-amber-500/30",
    },
    {
      num: "04",
      actor: "Verification",
      icon: ShieldCheck,
      title: "OTP Handover & Settlement",
      desc: "Customer shares the secure 6-digit verification code. Code validation instantly marks delivery complete and unlocks automated ledger payout.",
      color: "from-teal-500/20 to-emerald-500/10",
      accent: "text-teal-300",
      border: "border-teal-500/30",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            End-to-End Orchestration
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How SettleCart Powers Frictionless Commerce
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            A seamless coordination engine connecting businesses, customers, and delivery operators into one trustworthy operational ecosystem.
          </p>
        </div>

        {/* 4 Swimlane Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all hover:-translate-y-1 shadow-lg group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${step.color} rounded-bl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-slate-700 group-hover:text-slate-500 transition-colors">
                      {step.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl bg-slate-800/80 border ${step.border} flex items-center justify-center ${step.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${step.accent}`}>
                    {step.actor}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

