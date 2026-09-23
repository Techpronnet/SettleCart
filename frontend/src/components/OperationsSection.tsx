export function OperationsSection() {
  const operations = [
    {
      title: "Orders",
      summary: "Know what was ordered, by whom, and what needs to happen next.",
      detail:
        "Clear status tracking across creation, acceptance, preparation, pickup, and delivery ensures nothing falls through the cracks.",
    },
    {
      title: "Payments",
      summary: "Track payment status and financial activity throughout the order lifecycle.",
      detail:
        "Every transaction is verified before fulfillment begins, giving businesses confidence that funds are held securely until delivery.",
    },
    {
      title: "Dispatch",
      summary: "Connect ready orders with delivery operations.",
      detail:
        "Automated coordination routes available dispatch riders to your pickup point as soon as an order is marked ready.",
    },
    {
      title: "Settlement",
      summary: "Move from completed transactions to vendor earnings through a controlled settlement process.",
      detail:
        "Earnings are recorded into an auditable ledger and made available for transfer directly into your commercial bank account.",
    },
    {
      title: "Business data",
      summary: "Give businesses visibility into sales, customers, products, and operational performance.",
      detail:
        "Understand your top-selling products, fulfillment speed, customer return rates, and revenue patterns to make informed decisions.",
    },
  ];

  return (
    <section id="operations" className="fluid-section bg-[#fafaf9] border-b border-stone-200/80">
      <div className="site-container">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
            Not just a storefront. A system for running commerce.
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl">
            The platform is being designed around the operational side of selling, not only product listings. From order intake to bank settlement, every step has dedicated infrastructure.
          </p>
        </div>

        {/* 5 Operational Highlights */}
        <div className="pt-8 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {operations.map((op) => (
            <div
              key={op.title}
              className="bg-white rounded-md border border-stone-200 p-6 flex flex-col justify-between shadow-xs"
            >
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  {op.title}
                </h3>
                <p className="mt-2 text-sm text-stone-800 font-medium leading-snug">
                  {op.summary}
                </p>
                <p className="mt-3 text-xs text-stone-500 leading-relaxed">
                  {op.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

