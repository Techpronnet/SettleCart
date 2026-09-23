export function Footer() {
  return (
    <footer className="bg-[#fafaf9] border-t border-stone-200 py-12 sm:py-16 text-stone-600 text-sm">
      <div className="site-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 sm:gap-10 pb-10 sm:pb-12 border-b border-stone-200/80">
          
          {/* Logo and Statement */}
          <div className="sm:col-span-2 md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-stone-900 text-stone-50 flex items-center justify-center font-semibold text-xs tracking-tight">
                S
              </span>
              <span className="text-lg font-bold tracking-tight text-stone-900 font-sans">
                SettleCart
              </span>
            </div>
            <p className="text-stone-500 text-xs sm:text-sm max-w-sm leading-relaxed">
              Connected digital storefronts, order orchestration, delivery network, and financial settlement for businesses across Africa.
            </p>
            <p className="text-xs text-stone-400 font-medium pt-2">
              Built for the next generation of African commerce.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-1 sm:space-y-2 text-xs text-stone-600">
              <li>
                <a href="#" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#for-businesses" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  For Businesses
                </a>
              </li>
              <li>
                <a href="#for-customers" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  For Customers
                </a>
              </li>
              <li>
                <a href="#delivery" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  Delivery Network
                </a>
              </li>
            </ul>
          </div>

          {/* Resources & Contact */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-1 sm:space-y-2 text-xs text-stone-600">
              <li>
                <a href="#waitlist" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#trust" className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors">
                  Trust &amp; Security
                </a>
              </li>
              <li>
                <span className="inline-block py-1 sm:py-0.5 text-stone-400">Privacy</span>
              </li>
              <li>
                <span className="inline-block py-1 sm:py-0.5 text-stone-400">Terms</span>
              </li>
            </ul>
          </div>

          {/* Social Placeholders */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-3">
              Follow
            </h4>
            <ul className="space-y-1 sm:space-y-2 text-xs text-stone-600">
              <li>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block py-1 sm:py-0.5 hover:text-stone-950 transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3 text-center sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} SettleCart Technologies. All rights reserved.
          </p>
          <p>
            Designed for everyday African commerce.
          </p>
        </div>
      </div>
    </footer>
  );
}
