import { ArrowRight, ShoppingBag, ShieldCheck, MapPin } from "lucide-react";

export function ForCustomersSection() {
  const steps = [
    { title: "Discover a business", note: "Find local stores or visit directly via store link" },
    { title: "Browse", note: "Explore products, menus, or service bookings" },
    { title: "Add to cart", note: "Combine items across single or multiple vendors" },
    { title: "Checkout", note: "Simple delivery address & contact details" },
    { title: "Pay", note: "Fast bank transfer, card, or USSD payment" },
    { title: "Track", note: "Follow preparation & live rider transit" },
    { title: "Receive", note: "Inspect package & provide your delivery code" },
  ];

  return (
    <section id="for-customers" className="py-20 md:py-28 bg-[#fafaf9] border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-stone-900 leading-tight">
            Discover. Order. Pay. Receive.
          </h2>
          <p className="mt-5 text-lg text-stone-600 leading-relaxed font-normal">
            Customers can discover businesses, browse what they offer, place orders, pay securely, and follow the journey from checkout to delivery.
          </p>
        </div>

        {/* Stepped Customer Flow */}
        <div className="mt-14 pt-8 border-t border-stone-200/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-6">
            The Customer Journey
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.title}
                className="bg-white rounded-md border border-stone-200 p-3.5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <span className="font-mono text-xs text-stone-400">
                    Step {idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-stone-900 mt-1 leading-snug">
                    {step.title}
                  </h3>
                </div>
                <p className="mt-3 text-[11px] text-stone-500 leading-normal border-t border-stone-100 pt-2">
                  {step.note}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Grounded Visual Customer Checkout Snapshot */}
        <div className="mt-12 max-w-xl mx-auto bg-white rounded-lg border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-stone-700" />
              <h4 className="text-sm font-semibold text-stone-900">Your Checkout Summary</h4>
            </div>
            <span className="text-xs text-stone-500">Order #SC-5819</span>
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Indigo Adire Casual Shirt (Size L)</p>
                <p className="text-[11px] text-stone-500">Store: Bari Goods &bull; Victoria Island</p>
              </div>
              <span className="font-medium text-stone-900">₦26,000</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-stone-900">Baobab Glow Oil (100ml)</p>
                <p className="text-[11px] text-stone-500">Store: Bari Goods &bull; Victoria Island</p>
              </div>
              <span className="font-medium text-stone-900">₦8,500</span>
            </div>

            <div className="pt-3 border-t border-stone-100 space-y-1.5 text-stone-500">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₦34,500</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Doorstep Delivery</span>
                <span>₦2,200</span>
              </div>
              <div className="flex justify-between text-stone-900 font-semibold text-sm pt-2 border-t border-stone-200">
                <span>Total Paid</span>
                <span>₦36,700</span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded bg-stone-50 border border-stone-200/80 flex items-start gap-2.5 text-xs text-stone-600">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              Your payment is held safely in escrow. Handover is finalized only when you share your 6-digit delivery code with the rider at your door.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}

