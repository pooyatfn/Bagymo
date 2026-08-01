"use client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { VenuesShowcase } from "@/components/landing/VenuesShowcase";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!loading && user && params.get("redirect") === "app") {
      const paths: Record<string, string> = {
        employee: "/employee/dashboard",
        company_admin: "/company/dashboard",
        company_hr: "/company/dashboard",
        venue_staff: "/venue/dashboard",
        admin: "/admin",
      };
      router.replace(paths[user.role] || "/login");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        <VenuesShowcase />
        <TestimonialsSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
