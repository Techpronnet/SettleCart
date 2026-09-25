import { Search, ShoppingBag, CreditCard, MapPin } from "lucide-react";
import { SectionHeading } from "./cards";

const STEPS = [
  { icon: Search, title: "Discover", text: "Explore products and stores." },
  { icon: ShoppingBag, title: "Order", text: "Add what you need to your cart and confirm your order." },
  { icon: CreditCard, title: "Pay", text: "Complete checkout securely." },
  { icon: MapPin, title: "Receive", text: "Track your order until it reaches your doorstep." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="hiw-heading" className="bg-[#fafaf9] fluid-section scroll-mt-20">
      <div className="site-container">
        <SectionHeading
          eyebrow="Simple"
          title="Discover. Order. Pay. Receive."
        />
        <ol className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              data-aos="fade-up"
              data-aos-delay={i * 90}
              className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 text-center"
            >
              <span className="mx-auto w-11 h-11 rounded-full bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
