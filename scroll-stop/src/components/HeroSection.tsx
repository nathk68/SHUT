"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import GlobeCanvas, { type GlobeControl } from "./GlobeCanvas";
import { useI18n } from "@/lib/i18n";

interface HeroSectionProps {
  isLoading: boolean;
}

export default function HeroSection({ isLoading }: HeroSectionProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasAnimated = useRef(false);
  const globeControlRef = useRef<GlobeControl>({ progress: 0 });
  const { locale, t } = useI18n();

  useLayoutEffect(() => {
    if (isLoading || hasAnimated.current) return;
    if (!titleRef.current || !sectionRef.current || !wrapperRef.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.set(".hero-subtitle", { opacity: 0, y: 20 });
      gsap.set(".hero-cta-btn", { opacity: 0, y: 20 });
      gsap.set(".hero-scroll-hint", { opacity: 0, animation: "none" });
      gsap.set(".hero-content", { opacity: 0, animation: "none" });

      const split = SplitText.create(titleRef.current!, { type: "words" });
      gsap.set(split.words, { yPercent: 100, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Reveal the container first
      tl.to(".hero-content", { opacity: 1, duration: 0.01 });

      tl.to(split.words, {
        yPercent: 0,
        opacity: 1,
        stagger: 0.1,
        duration: 0.7,
      })
        .to(".hero-subtitle", { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
        .to(".hero-cta-btn", { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 }, "-=0.2")
        .to(".hero-scroll-hint", { opacity: 1, duration: 0.8 }, "-=0.2");

      // Scroll-driven globe zoom transition
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          // Drive globe transition (rotate to France + zoom)
          globeControlRef.current.progress = p;

          // Fade out hero text in first 40% of scroll
          const textOpacity = Math.max(0, 1 - p / 0.4);
          gsap.set(".hero-content", {
            opacity: textOpacity,
            y: p * -100,
          });

          // Fade out scroll hint immediately
          const hintOpacity = Math.max(0, 1 - p / 0.15);
          gsap.set(".hero-scroll-hint", {
            opacity: hintOpacity,
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
    <div ref={wrapperRef} style={{ height: "calc(100vh + 1500px)" }}>
      {/* CSS fallback: if JS never loads, reveal hero content after preloader fades */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heroReveal {
          to { opacity: 1; }
        }
        .hero-content {
          opacity: 0;
          animation: heroReveal 0.6s ease 3.5s both;
        }
        .hero-scroll-hint {
          opacity: 0;
          animation: heroReveal 0.6s ease 4s both;
        }
      `}} />
      <section
        id="hero"
        ref={sectionRef}
        className="sticky top-0 h-screen flex items-center overflow-hidden"
      >
        {/* Globe - full screen background, shifted right */}
        <div className="absolute inset-0 z-0">
          <GlobeCanvas controlRef={globeControlRef} isLoading={isLoading} />
        </div>

        {/* Content - left aligned */}
        <div
          className="hero-content relative z-[2] max-w-[600px] px-8 md:px-16 lg:px-24"
        >
          {/* Title */}
          <h1
            key={locale}
            ref={titleRef}
            className="font-[family-name:var(--font-space-grotesk)] font-bold leading-[1.08] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", letterSpacing: "-1px" }}
          >
            {t.heroTitle}{" "}
            <span className="gradient-text">{t.heroTitleAccent}</span>
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle text-lg md:text-xl max-w-[480px] mb-10 leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t.heroSubtitle}
          </p>

          {/* CTA buttons */}
          <div className="flex gap-4 flex-wrap">
            <a
              href="#cta"
              className="hero-cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-space-grotesk)] font-semibold text-white transition-[box-shadow] duration-300 hover:-translate-y-0.5 no-underline"
              style={{
                background: "var(--color-accent)",
                boxShadow: "0 0 24px rgba(102, 36, 131, 0.3)",
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
              {t.heroCtaPrimary}
            </a>
            <a
              href="#features"
              className="hero-cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-space-grotesk)] font-medium text-white transition-colors duration-300 hover:bg-white/[0.03] no-underline"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {t.heroCtaSecondary}
            </a>
          </div>
        </div>

        {/* Scroll hint - centered */}
        <div
          className="hero-scroll-hint absolute bottom-10 left-1/2 -translate-x-1/2 z-[2] flex flex-col items-center gap-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span
            className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase"
            style={{ letterSpacing: "3px" }}
          >
            {t.heroScroll}
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
      </section>
    </div>
  );
}
