import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "How It Works | SettleCart",
  description: "How customers, businesses and riders use SettleCart.",
};

const FLOWS = [
  {
    title: "For customers",
    icon: "fa-shopping-cart",
    steps: ["Discover stores and products", "Check out once, even across vendors", "Pay securely", "Track delivery live", "Share your verification code with the rider"],
    cta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    title: "For businesses",
    icon: "fa-building",
    steps: ["Register and complete KYC", "Create your store and catalogue", "Accept and prepare orders", "Mark orders ready for pickup", "Receive settlements and withdraw"],
    cta: { label: "Join the waitlist", href: "/waitlist" },
  },
  {
    title: "For riders",
    icon: "fa-motorcycle",
    steps: ["Complete verification", "Go online and accept jobs", "Confirm pickup at the vendor", "Navigate to the customer", "Enter the customer code to complete delivery"],
    cta: { label: "Join the waitlist", href: "/waitlist" },
  },
];

export default function HowItWorksPage() {
  return (
    <div className="site-container py-8 sm:py-12">
      <PageHeader
        title="How it works"
        description="Three experiences, one connected transaction."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "How it works" }]}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {FLOWS.map((f) => (
          <Card
            key={f.title}
            title={f.title}
            action={
              <Link href={f.cta.href} className="text-sm font-medium text-stone-900 underline">
                {f.cta.label}
              </Link>
            }
          >
            <ol className="space-y-2.5">
              {f.steps.map((s, i) => (
                <li key={s} className="flex items-start gap-2.5 text-sm text-stone-600">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-stone-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>
    </div>
  );
}
