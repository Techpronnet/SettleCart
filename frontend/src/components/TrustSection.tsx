export function TrustSection() {
  const pillars = [
    {
      title: "Identity & Business Verification",
      desc: "Structured business verification ensures that merchants operating on the platform are accountable, creating a trustworthy marketplace for customers.",
    },
    {
      title: "Tenant Isolation & Access Control",
      desc: "Every business operates within its own secure tenant boundary. Private catalogues, customer details, and financial reports are accessible only to authorized team members.",
    },
    {
      title: "Authoritative Financial Ledger",
      desc: "Payments, fees, platform balances, and withdrawals are recorded as immutable, traceable accounting entries rather than easily corrupted balance fields.",
    },
    {
      title: "Delivery Handover Verification",
      desc: "Physical orders require code validation at customer handover, establishing clear confirmation of receipt before funds are cleared for vendor settlement.",
    },
  ];

  return (
    <section id="trust" className="fluid-section bg-white border-b border-stone-200/80">
      <div className="site-container">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
            Commerce needs trust at every step.
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl">
            Payments, customer information, orders, delivery, and business earnings require more than a beautiful storefront. The platform is being designed with verification, access control, transaction tracking, auditability, and secure delivery workflows at its foundation.
          </p>
        </div>

        {/* Restrained Trust Grid */}
        <div className="pt-8 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {pillars.map((item) => (
            <div
              key={item.title}
              className="p-6 rounded-md border border-stone-200 bg-[#fafaf9] flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

