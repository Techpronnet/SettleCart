import { Check, ArrowRight } from "lucide-react";

export function ForBusinessesSection() {
  const features = [
    "Digital storefront",
    "Products and services",
    "Categories and pricing",
    "Inventory management",
    "Order management",
    "Customer management",
    "Payment collection",
    "Delivery coordination",
    "Business earnings",
    "Withdrawals and settlement",
  ];

  return (
    <section id="for-businesses" className="fluid-section bg-white border-b border-stone-200/80">
      <div className="site-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading, Copy, Features & CTA */}
          <div className="lg:col-span-6">
            <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
              Turn your business into a digital storefront.
            </h2>
            <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-xl">
              Create a professional storefront without having to build an entire commerce system yourself. Add what you sell, manage your catalogue, receive orders, and keep your business moving.
            </p>

            {/* Feature Checklist */}
            <div className="mt-7 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {features.map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded bg-stone-100 border border-stone-300 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-stone-800" />
                  </span>
                  <span className="text-sm font-medium text-stone-800">{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 sm:mt-10">
              <a
                href="#waitlist"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-md text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 transition-colors shadow-sm min-h-[44px]"
              >
                I&apos;m Building a Business
              </a>
            </div>
          </div>

          {/* Right Column: Realistic Merchant Operational Interface */}
          <div className="lg:col-span-6">
            <div className="bg-[#fafaf9] rounded-lg border border-stone-200 p-6 shadow-xs">
              
              {/* Storefront Identity */}
              <div className="flex items-center justify-between pb-5 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-stone-900">Zola Leathercraft</h3>
                    <span className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      Live Storefront
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    settlecart.com/store/zola &bull; Handcrafted footwear &amp; bags
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500">Available Balance</span>
                  <p className="text-base font-semibold text-stone-900">₦184,500</p>
                </div>
              </div>

              {/* Order Queue */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <span>Recent Customer Orders</span>
                  <span className="text-stone-400 font-normal">Updated 2m ago</span>
                </div>

                <div className="p-3 bg-white rounded border border-stone-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">#SC-2810</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Preparing
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1">
                      1 &times; Men&apos;s Oiled Leather Loafer (Size 43)
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Customer: Femi O. &bull; Lekki Phase 1
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-stone-900">₦42,000</span>
                    <span className="block text-[10px] text-teal-700 font-medium mt-1">
                      Dispatch Assigned
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded border border-stone-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">#SC-2808</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Delivered
                      </span>
                    </div>
                    <p className="text-stone-600 mt-1">
                      1 &times; Minimalist Cardholder (Tan)
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      OTP Verified at Handover
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-stone-900">₦14,500</span>
                    <span className="block text-[10px] text-stone-500 mt-1">
                      Settled to Ledger
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <span>Direct payout to your linked bank account</span>
                <span className="font-medium text-stone-900">Access Bank &bull;&bull;&bull;&bull; 4012</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

