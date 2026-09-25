import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "About | SettleCart",
  description: "What SettleCart is and how commerce moves through the platform.",
};

const STEPS = [
  { icon: "fa-search", title: "Discovery", text: "Customers discover businesses, products and services in one marketplace." },
  { icon: "fa-shopping-bag", title: "Order", text: "One checkout across vendors. The platform splits orders per business internally." },
  { icon: "fa-credit-card", title: "Payment", text: "Payments are confirmed through trusted provider webhooks before fulfillment." },
  { icon: "fa-cube", title: "Fulfillment", text: "Vendors accept, prepare and mark orders ready for pickup." },
  { icon: "fa-motorcycle", title: "Dispatch", text: "Riders pick up and deliver. Delivery completes only with the customer verification code." },
  { icon: "fa-bank", title: "Settlement", text: "Vendor and rider earnings settle into traceable wallets after verified delivery." },
];

export default function AboutPage() {
  return (
    <div className="site-container py-8 sm:py-12">
      <PageHeader
        title="About SettleCart"
        description="Multi-tenant commerce, marketplace, dispatch and settlement infrastructure."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s) => (
          <Card key={s.title} title={s.title}>
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-md bg-stone-100 text-stone-600 flex items-center justify-center shrink-0">
                <i className={`fa ${s.icon}`} aria-hidden="true" />
              </span>
              <p className="text-sm text-stone-600 leading-relaxed">{s.text}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
