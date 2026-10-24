"use client";

import { useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import { TransitionProvider, useTransition } from "@/lib/transition";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesScroll from "@/components/FeaturesScroll";
import PhoneMockup from "@/components/PhoneMockup";
import StatsSection from "@/components/StatsSection";
import DJJourneySection from "@/components/DJJourneySection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import VinylTransition from "@/components/VinylTransition";

function PageContent({ isLoading }: { isLoading: boolean }) {
  const { phase } = useTransition();

  return (
    <div
      style={{
        opacity: phase === "hidden" ? 0 : 1,
        transition: phase === "hidden" ? "none" : "opacity 0.5s ease",
      }}
    >
      <main>
        <HeroSection isLoading={isLoading} />
        <div className="relative z-10 -mt-[40vh]">
          <FeaturesScroll />
        </div>
        <DJJourneySection />
        <PhoneMockup />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <I18nProvider>
      <TransitionProvider>
        <SmoothScroll />
        <Preloader onComplete={() => setIsLoading(false)} />
        <VinylTransition />
        <Navbar />
        <PageContent isLoading={isLoading} />
      </TransitionProvider>
    </I18nProvider>
  );
}
