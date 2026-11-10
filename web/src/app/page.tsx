import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { PanelsShowcase } from "@/components/landing/PanelsShowcase";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { VenuesShowcase } from "@/components/landing/VenuesShowcase";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="page-backdrop min-h-screen text-ink-900">
      <LandingHeader />
      <main>
        <HeroSection />
        <CategoriesSection />
        <AudienceSection />
        <PanelsShowcase />
        <FeaturesSection />
        <VenuesShowcase />
      </main>
      <LandingFooter />
    </div>
  );
}
