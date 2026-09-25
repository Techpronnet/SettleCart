import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "FAQ | SettleCart",
  description: "Frequently asked questions about SettleCart.",
};

const FAQS = [
  { q: "What is SettleCart?", a: "A multi-tenant commerce, marketplace, dispatch and settlement platform. Customers shop, businesses sell and fulfill, riders deliver, and earnings settle through one traceable system." },
  { q: "How do I sell on SettleCart?", a: "Register as a business, complete KYC verification, create your store and catalogue, then publish. You will receive orders, mark them ready for pickup, and withdraw settled earnings." },
  { q: "How does delivery verification work?", a: "When the rider arrives, the customer shares a 6-digit verification code verbally. The rider enters it to complete delivery. Delivery cannot complete with an invalid, expired or already-used code." },
  { q: "When do vendors get paid?", a: "Order funds settle to the vendor wallet after verified delivery, subject to platform fees and settlement rules. Pending balances are not withdrawable until settled." },
  { q: "How do riders earn?", a: "Riders accept delivery jobs, confirm pickup, deliver with customer verification, and earn delivery fees that settle into their wallet for withdrawal." },
  { q: "Is SettleCart live?", a: "The platform is opening to early businesses and customers first. Join the waitlist to be notified when your city goes live." },
];

export default function FaqPage() {
  return (
    <div className="site-container py-8 sm:py-12 max-w-3xl">
      <PageHeader
        title="Frequently asked questions"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />
      <div className="space-y-3">
        {FAQS.map((f) => (
          <Card key={f.q} title={f.q}>
            <p className="text-sm text-stone-600 leading-relaxed">{f.a}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
