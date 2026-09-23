export function ProblemSection() {
  const problems = [
    {
      num: "01",
      title: "Getting online",
      desc: "Your business needs more than a social media page to sell consistently.",
      detail:
        "Selling through direct messages and comment sections leads to missed messages, lost buyers, and an unbranded checkout experience.",
    },
    {
      num: "02",
      title: "Managing orders",
      desc: "Orders coming from different places quickly become difficult to track.",
      detail:
        "Scattered conversations on messaging apps and paper receipts make tracking order status, customer addresses, and fulfillment messy and error-prone.",
    },
    {
      num: "03",
      title: "Getting products delivered",
      desc: "Customers want convenient delivery without businesses building their own logistics operation.",
      detail:
        "Coordinating independent dispatch riders by phone, haggling over fares, and wondering whether packages reached buyers creates constant operational stress.",
    },
    {
      num: "04",
      title: "Getting paid",
      desc: "Businesses need a clear path from completed sales to available earnings.",
      detail:
        "Verifying manual bank transfer screenshots and waiting days to know what is earned versus what has cleared ties up vital working capital.",
    },
  ];

  return (
    <section className="fluid-section bg-white border-b border-stone-200/80">
      <div className="site-container">
        
        {/* Editorial Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-[clamp(1.75rem,3.2vw+0.25rem,2.85rem)] font-semibold tracking-tight text-stone-900 leading-tight">
            Selling shouldn&apos;t mean piecing everything together.
          </h2>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-stone-600 leading-relaxed font-normal max-w-2xl">
            For many businesses, getting online is only the beginning. They still have to figure out storefronts, orders, payments, customers, delivery, and keeping everything organized.
          </p>
        </div>

        {/* Four Problem Statements - Clean Editorial Row/Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 lg:gap-x-14">
          {problems.map((item) => (
            <div
              key={item.num}
              className="border-t border-stone-200 pt-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs font-semibold text-stone-400">
                    {item.num}
                  </span>
                  <h3 className="text-lg font-semibold text-stone-900">
                    {item.title}
                  </h3>
                </div>
                <p className="text-base text-stone-800 font-medium leading-snug">
                  {item.desc}
                </p>
                <p className="mt-3 text-sm text-stone-500 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

