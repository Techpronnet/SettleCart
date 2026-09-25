import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/landing/Hero";
import { Discovery } from "@/components/landing/Discovery";
import { MultiStore } from "@/components/landing/MultiStore";
import { Lifecycle } from "@/components/landing/Lifecycle";
import { WhySettleCart } from "@/components/landing/WhySettleCart";
import { FeaturedStores } from "@/components/landing/FeaturedStores";
import { PopularProducts } from "@/components/landing/PopularProducts";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { VendorCTA } from "@/components/landing/VendorCTA";
import { Trust } from "@/components/landing/Trust";
import { MobileExperience } from "@/components/landing/MobileExperience";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-stone-900 overflow-x-hidden selection:bg-stone-900 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Discovery />
        <MultiStore />
        <Lifecycle />
        <WhySettleCart />
        <FeaturedStores />
        <PopularProducts />
        <HowItWorks />
        <VendorCTA />
        <Trust />
        <MobileExperience />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
