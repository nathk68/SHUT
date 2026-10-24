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
  const accentRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const globeControlRef = useRef<GlobeControl>({ progress: 0 });
  const { locale, t } = useI18n();

  useLayoutEffect(() => {
    if (isLoading || hasAnimated.current) return;
    if (!titleRef.current || !sectionRef.current || !wrapperRef.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      gsap.set(".hero-subtitle", { opacity: 0, y: 30 });
      gsap.set(".hero-cta-btn", { opacity: 0, y: 30, scale: 0.95 });
      gsap.set(".hero-scroll-hint", { opacity: 0, animation: "none" });
      gsap.set(".hero-content", { opacity: 0, animation: "none" });
      gsap.set(".hero-line", { scaleX: 0 });

      // Split title into chars for more dramatic reveal
      const split = SplitText.create(titleRef.current!, { type: "chars,words" });
      gsap.set(split.chars, { yPercent: 120, opacity: 0, rotateX: -45 });

      // Split accent into chars too
      if (accentRef.current) {
        const accentSplit = SplitText.create(accentRef.current, { type: "chars" });
        gsap.set(accentSplit.chars, { yPercent: 120, opacity: 0, rotateX: -45 });
      }

      const tl = gsap.timeline({
        defaults: { ease: "cubic-bezier(0.16, 1, 0.3, 1)" },
      });

      // Reveal the container
      tl.to(".hero-content", { opacity: 1, duration: 0.01 });

      // Title chars cascade in - dramatic, staggered reveal
      tl.to(split.chars, {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        stagger: 0.04,
        duration: 1,
        ease: "power4.out",
      });

      // Accent word follows immediately
      if (accentRef.current) {
        const accentSplit = SplitText.create(accentRef.current, { type: "chars" });
        tl.to(
          accentSplit.chars,
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            stagger: 0.05,
            duration: 0.8,
            ease: "power4.out",
          },
          "-=0.6"
        );
      }

      // Decorative line
      tl.to(
        ".hero-line",
        { scaleX: 1, duration: 0.8, ease: "power3.inOut" },
        "-=0.5"
      );

      // Subtitle slides up
      tl.to(
        ".hero-subtitle",
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      );

      // CTA buttons stagger in with spring
      tl.to(
        ".hero-cta-btn",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.12,
          duration: 0.7,
          ease: "back.out(1.4)",
        },
        "-=0.4"
      );

      // Scroll hint gentle fade
      tl.to(".hero-scroll-hint", { opacity: 1, duration: 1 }, "-=0.3");

      // Scroll-driven globe zoom transition
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;
          globeControlRef.current.progress = p;

          // Fade + parallax hero text
          const textOpacity = Math.max(0, 1 - p / 0.4);
          gsap.set(".hero-content", {
            opacity: textOpacity,
            y: p * -150,
            filter: `blur(${p * 5}px)`,
          });

          const hintOpacity = Math.max(0, 1 - p / 0.15);
          gsap.set(".hero-scroll-hint", { opacity: hintOpacity });
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
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
      <section
        id="hero"
        ref={sectionRef}
        className="sticky top-0 h-screen flex items-center overflow-hidden"
      >
        {/* Globe background */}
        <div className="absolute inset-0 z-0">
          <GlobeCanvas controlRef={globeControlRef} isLoading={isLoading} />
        </div>

        {/* Content - left aligned with dramatic type scale */}
        <div className="hero-content relative z-[2] max-w-[900px] px-6 md:px-12 lg:px-16">
          {/* Title - dramatically large */}
          <div className="overflow-hidden mb-2">
            <h1
              key={`title-${locale}`}
              ref={titleRef}
              className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.95] uppercase"
              style={{
                fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)",
                letterSpacing: "-0.03em",
              }}
            >
              {t.heroTitle}
            </h1>
          </div>
          <div className="overflow-hidden mb-4">
            <span
              key={`accent-${locale}`}
              ref={accentRef}
              className="font-[family-name:var(--font-syne)] font-extrabold leading-[0.95] uppercase gradient-text inline-block"
              style={{
                fontSize: "clamp(2.2rem, 5.5vw, 4.5rem)",
                letterSpacing: "-0.03em",
              }}
            >
              {t.heroTitleAccent}
            </span>
          </div>

          {/* Decorative line */}
          <div
            className="hero-line h-[2px] w-[80px] mb-6 origin-left"
            style={{ background: "var(--color-accent)" }}
          />

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
              className="hero-cta-btn magnetic-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-syne)] font-semibold text-white no-underline"
              style={{
                background: "var(--color-accent)",
                boxShadow: "0 0 30px rgba(102, 36, 131, 0.35)",
                transition:
                  "box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 50px rgba(102, 36, 131, 0.5)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 0 30px rgba(102, 36, 131, 0.35)";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
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
              className="hero-cta-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-[family-name:var(--font-syne)] font-medium text-white no-underline"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                transition:
                  "background 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(255,255,255,0.15)";
              }}
            >
              {t.heroCtaSecondary}
            </a>
          </div>
        </div>

        {/* Scroll hint */}
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
