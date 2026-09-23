import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProblemSection } from "@/components/ProblemSection";
import { ConnectedCommerceLifecycle } from "@/components/ConnectedCommerceLifecycle";
import { ForBusinessesSection } from "@/components/ForBusinessesSection";
import { CustomerJourney } from "@/components/CustomerJourney";
import { ConnectedDeliverySection } from "@/components/ConnectedDeliverySection";
import { MultiBusinessSection } from "@/components/MultiBusinessSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { OperationsSection } from "@/components/OperationsSection";
import { TrustSection } from "@/components/TrustSection";
import { WaitlistSection } from "@/components/WaitlistSection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafaf9] text-stone-900 overflow-x-hidden selection:bg-stone-900 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ProblemSection />
        <ConnectedCommerceLifecycle />
        <HowItWorksSection />
        <ForBusinessesSection />
        <CustomerJourney />
        <ConnectedDeliverySection />
        <MultiBusinessSection />
        <OperationsSection />
        <TrustSection />
        <WaitlistSection />
      </main>
      <Footer />
    </div>
  );
}
