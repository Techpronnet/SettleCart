import Link from "next/link";

export function FinalCTA() {
  return (
    <section aria-labelledby="final-cta-heading" className="bg-stone-950 text-white">
      <div className="site-container py-14 sm:py-20 text-center max-w-2xl mx-auto" data-aos="fade-up">
        <h2 id="final-cta-heading" className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance">
          Your Next Purchase Starts Here.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-stone-400">
          Discover stores, find products, and get what you need delivered without the usual complexity.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="#discover"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-950 bg-white hover:bg-stone-100 min-h-[48px] transition-colors"
          >
            Start Shopping
          </Link>
          <Link
            href="#sell"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold border border-white/20 text-white hover:bg-white/10 min-h-[48px] transition-colors"
          >
            Open a Store
          </Link>
        </div>
      </div>
    </section>
  );
}
