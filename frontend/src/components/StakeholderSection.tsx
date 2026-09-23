import { Store, Bike, ShoppingBag, CheckCircle2 } from "lucide-react";

export function StakeholderSection() {
  return (
    <section id="stakeholders" className="py-20 bg-slate-950 relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Aligned Incentives
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Every Stakeholder
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Whether you are selling fashion in Lekki, delivering meals in Abuja, or buying weekly groceries in Port Harcourt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* For Merchants */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-6">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                For Merchants &amp; Businesses
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">
                Automate Your Sales &amp; Dispatch
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Replace manual WhatsApp order notes and bank transfer screenshot verification with a dedicated, professional storefront.
              </p>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Free registration — only pay a tiny fee on completed sales</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Automated dispatch assignment without hiring riders</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>No customer can claim fake non-delivery thanks to OTP codes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instant withdrawals to any Nigerian commercial bank</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <a
                href="#waitlist"
                className="block text-center w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-sm transition-colors"
              >
                Join as Merchant &rarr;
              </a>
            </div>
          </div>

          {/* For Dispatch Riders */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-teal-500/40 transition-all hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-6">
                <Bike className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase tracking-wider font-bold text-teal-400">
                For Dispatch Riders &amp; Fleets
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">
                Steady Orders &amp; Instant Earnings
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Connect directly with nearby verified vendors ready for pickup. Never wait days to get paid for fuel and time.
              </p>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Instant delivery earnings credited when customer code validates</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Guaranteed proof of delivery protects you from customer false claims</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Flexible broadcast orders — accept jobs on your own terms</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Daily automated payouts to your registered bank account</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <a
                href="#waitlist"
                className="block text-center w-full py-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 font-semibold text-sm transition-colors"
              >
                Join as Rider &rarr;
              </a>
            </div>
          </div>

          {/* For Shoppers */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 flex flex-col justify-between hover:border-blue-500/40 transition-all hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-400">
                For Customers &amp; Shoppers
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4">
                Shop Multiple Stores with Total Escrow Protection
              </h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Enjoy unified checkout across favorite vendors. Your payment is protected until you inspect your item and provide your OTP.
              </p>

              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Single unified cart across food, fashion, and retail stores</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Funds held safely until you give the rider your 6-digit OTP code</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Instant wallet refund if a vendor cancels or fails availability</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Real-time SMS and map tracking for every package</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800">
              <a
                href="#waitlist"
                className="block text-center w-full py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold text-sm transition-colors"
              >
                Join as Shopper &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

