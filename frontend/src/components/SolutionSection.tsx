import { ArrowRight } from "lucide-react";

export function SolutionSection() {
  const nodes = [
    { label: "Business", role: "Merchant", note: "Identity & onboarding" },
    { label: "Store", role: "Front", note: "Products & catalogue" },
    { label: "Customer", role: "Buyer", note: "Discovery & cart" },
    { label: "Order", role: "Engine", note: "Fulfillment SLA" },
    { label: "Payment", role: "Escrow", note: "Verified checkout" },
    { label: "Dispatch", role: "Logistics", note: "Task broadcast" },
    { label: "Delivery", role: "Handover", note: "OTP verification" },
    { label: "Settlement", role: "Payout", note: "Ledger credit" },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#fafaf9] border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 leading-tight">
            One platform connecting the pieces.
          </h2>
          <p className="mt-5 text-lg text-stone-600 leading-relaxed font-normal">
            We are building a connected commerce platform where businesses can sell, customers can shop, and dispatch can move orders from store to doorstep.
          </p>
        </div>

        {/* Core Ecosystem Flow */}
        <div className="mt-14 pt-8 border-t border-stone-200/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-6">
            The Connected Commerce Lifecycle
          </div>

          {/* Stepped sequence representation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {nodes.map((node, index) => (
              <div
                key={node.label}
                className="bg-white rounded-md border border-stone-200 p-3.5 flex flex-col justify-between hover:border-stone-400 transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1.5">
                    <span>0{index + 1}</span>
                    {index < nodes.length - 1 && (
                      <span className="hidden lg:inline text-stone-300">&rarr;</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 leading-tight">
                    {node.label}
                  </h3>
                </div>
                <div className="mt-3 pt-2 border-t border-stone-100">
                  <p className="text-[11px] font-medium text-teal-800">
                    {node.role}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                    {node.note}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Practical Operational Commentary */}
          <div className="mt-10 p-6 rounded-md bg-stone-100/70 border border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-stone-600">
            <div>
              <h4 className="font-semibold text-stone-900 text-sm mb-1">
                For the Business
              </h4>
              <p className="text-xs leading-relaxed text-stone-600">
                You publish products, receive confirmed orders, and pack packages. You don&apos;t worry about hiring delivery riders or building custom websites.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 text-sm mb-1">
                For the Customer
              </h4>
              <p className="text-xs leading-relaxed text-stone-600">
                A simple, familiar shopping experience. Browse your favorite local businesses, pay safely, and track package transit right to your gate.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 text-sm mb-1">
                For Dispatch &amp; Finance
              </h4>
              <p className="text-xs leading-relaxed text-stone-600">
                Riders receive clear pickup tasks and hand over with a 6-digit verification code. Once validated, earnings and settlement post automatically.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

