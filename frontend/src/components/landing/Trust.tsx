import { ShieldCheck, BadgeCheck, MapPin, Truck, Headset } from "lucide-react";
import { SectionHeading } from "./cards";

const ITEMS = [
  { icon: ShieldCheck, title: "Secure checkout", text: "Payments confirmed before fulfillment." },
  { icon: BadgeCheck, title: "Verified stores", text: "Businesses verified before they sell." },
  { icon: MapPin, title: "Order tracking", text: "Follow every order to your doorstep." },
  { icon: Truck, title: "Reliable delivery", text: "Verified handoff with delivery codes." },
  { icon: Headset, title: "Customer support", text: "Help for orders, payments and delivery." },
];

export function Trust() {
  return (
    <section aria-labelledby="trust-heading" className="bg-[#fafaf9] fluid-section-compact">
      <div className="site-container">
        <SectionHeading eyebrow="Trust" title="Shop with confidence." />
        <ul className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {ITEMS.map((t, i) => (
            <li
              key={t.title}
              data-aos="fade-up"
              data-aos-delay={(i % 5) * 70}
              className="rounded-2xl border border-stone-200 bg-white p-4 text-center"
            >
              <span className="mx-auto w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <t.icon className="w-5 h-5" />
              </span>
              <p className="mt-2 text-sm font-semibold text-stone-900">{t.title}</p>
              <p className="mt-0.5 text-xs text-stone-500">{t.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
