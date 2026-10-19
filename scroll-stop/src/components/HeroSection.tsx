"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import ParticleCanvas from "./ParticleCanvas";

interface HeroSectionProps {
  isLoading: boolean;
}

export default function HeroSection({ isLoading }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isLoading || hasAnimated.current) return;
    if (!titleRef.current || !sectionRef.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const split = SplitText.create(titleRef.current!, {
        type: "words",
      });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      tl.from(".hero-badge", {
        opacity: 0,
        y: 20,
        duration: 0.6,
      })
        .from(
          ".hero-logo",
          { opacity: 0, scale: 0.8, duration: 0.7, ease: "back.out(1.4)" },
          "-=0.3"
        )
        .from(
          split.words,
          {
            yPercent: 100,
            opacity: 0,
            stagger: 0.1,
            duration: 0.7,
          },
          "-=0.3"
        )
        .from(
          ".hero-subtitle",
          { opacity: 0, y: 20, duration: 0.6 },
          "-=0.3"
        )
        .from(
          ".hero-cta-btn",
          { opacity: 0, y: 20, stagger: 0.1, duration: 0.5 },
          "-=0.2"
        )
        .from(
          ".hero-scroll-hint",
          { opacity: 0, duration: 0.8 },
          "-=0.2"
        );

      // Parallax on scroll
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(".hero-content", {
            y: progress * -150,
            opacity: 1 - progress * 1.5,
          });
        },
      });
    }, sectionRef);

    return () => {
      hasAnimated.current = false;
      ctx.revert();
    };
  }, [isLoading]);

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center text-center overflow-hidden"
      style={{ paddingTop: 120, paddingBottom: 80 }}
    >
      {/* Background */}
      <ParticleCanvas />
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(151,77,251,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="hero-content relative z-[2] max-w-[800px] px-6">
        {/* Badge */}
        <div
          className="hero-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-7 mx-auto"
          style={{
            background: "rgba(151, 77, 251, 0.12)",
            border: "1px solid rgba(151, 77, 251, 0.2)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#ef4444",
              animation: "pulse-dot 2s ease-in-out infinite",
            }}
          />
          <span
            className="font-[family-name:var(--font-jetbrains-mono)] text-xs"
            style={{ color: "var(--color-accent-light)" }}
          >
            Live Streaming
          </span>
        </div>

        {/* Logo */}
        <div className="hero-logo mb-6 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="SHUT"
            width={120}
            height={120}
            className="drop-shadow-[0_0_30px_rgba(151,77,251,0.4)]"
            priority
          />
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="font-[family-name:var(--font-space-grotesk)] font-bold leading-[1.08] tracking-tight mb-6"
          style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-1px" }}
        >
          THE DJs{" "}
          <span className="gradient-text">PLANET</span>
        </h1>

        {/* Subtitle */}
        <p
          className="hero-subtitle text-lg md:text-xl max-w-[560px] mx-auto mb-10 leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          DJs. Cities. Cultures. One place.
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <a
            href="#cta"
            className="hero-cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-space-grotesk)] font-semibold text-white transition-[box-shadow] duration-300 hover:-translate-y-0.5 no-underline"
            style={{
              background: "var(--color-accent)",
              boxShadow: "0 0 24px rgba(151, 77, 251, 0.3)",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Telecharger SHUT
          </a>
          <a
            href="#features"
            className="hero-cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-space-grotesk)] font-medium text-white transition-colors duration-300 hover:bg-white/[0.03] no-underline"
            style={{
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Decouvrir
          </a>
        </div>

        {/* Scroll hint */}
        <div
          className="hero-scroll-hint mt-16 flex flex-col items-center gap-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span
            className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase"
            style={{ letterSpacing: "3px" }}
          >
            Scroll
          </span>
          <div
            className="w-4 h-4 border-r-2 border-b-2"
            style={{
              borderColor: "var(--color-text-muted)",
              transform: "rotate(45deg)",
              animation: "scrollBounce 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

    </section>
  );
}
