"use client";

import { useState } from "react";
import { I18nProvider } from "@/lib/i18n";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesScroll from "@/components/FeaturesScroll";
import PhoneMockup from "@/components/PhoneMockup";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <I18nProvider>
      <SmoothScroll />
      <Preloader onComplete={() => setIsLoading(false)} />
      <Navbar />
      <main>
        <HeroSection isLoading={isLoading} />
        <div className="relative z-10 -mt-[40vh]">
          <FeaturesScroll />
        </div>
        <PhoneMockup />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </I18nProvider>
  );
}
