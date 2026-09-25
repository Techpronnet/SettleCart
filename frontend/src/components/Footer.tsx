import Link from "next/link";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Marketplace",
    links: [
      { label: "Explore Products", href: "/marketplace" },
      { label: "Stores", href: "/#stores" },
      { label: "Categories", href: "/#categories" },
      { label: "Deals", href: "/#deals" },
    ],
  },
  {
    title: "For Vendors",
    links: [
      { label: "Become a Vendor", href: "/register?as=vendor" },
      { label: "Vendor Dashboard", href: "/register?as=vendor" },
      { label: "Sell on SettleCart", href: "/#sell" },
      { label: "Vendor Support", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Contact", href: "/waitlist" },
      { label: "Help Center", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Refund Policy", href: "#" },
    ],
  },
];

const SOCIALS = [
  { icon: "fa-twitter", label: "SettleCart on X", href: "https://x.com" },
  { icon: "fa-instagram", label: "SettleCart on Instagram", href: "https://instagram.com" },
  { icon: "fa-linkedin", label: "SettleCart on LinkedIn", href: "https://linkedin.com" },
  { icon: "fa-facebook", label: "SettleCart on Facebook", href: "https://facebook.com" },
];

export function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="site-container py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 sm:gap-10">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5" aria-label="SettleCart home">
              <span className="w-8 h-8 rounded-lg bg-white text-stone-950 flex items-center justify-center">
                <i className="fa fa-shopping-bag text-sm" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold tracking-tight text-white">SettleCart</span>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed max-w-xs">
              One marketplace where independent stores sell, customers shop, and
              dispatch delivers to the doorstep.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-md bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white flex items-center justify-center min-h-[36px] min-w-[36px] transition-colors"
                >
                  <i className={`fa ${s.icon}`} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <nav aria-label={`Footer: ${col.title}`} className="hidden sm:block">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                  {col.title}
                </h3>
                <ul className="space-y-1 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="inline-block py-1.5 text-stone-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <details className="sm:hidden group border-b border-white/10 py-1">
                <summary className="flex items-center justify-between py-3 text-xs font-semibold uppercase tracking-wider text-white cursor-pointer min-h-[44px] list-none [&::-webkit-details-marker]:hidden">
                  {col.title}
                  <i className="fa fa-chevron-down text-stone-500 text-xs group-open:rotate-180 transition-transform" aria-hidden="true" />
                </summary>
                <ul className="pb-3 space-y-1 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="inline-block py-2 text-stone-400 hover:text-white transition-colors min-h-[40px]"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>&copy; {new Date().getFullYear()} SettleCart. All rights reserved.</p>
          <p>Secure checkout. Verified stores. Reliable delivery.</p>
        </div>
      </div>
    </footer>
  );
}
  