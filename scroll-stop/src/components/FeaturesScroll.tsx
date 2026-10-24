"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

function useFeatures() {
  const { t } = useI18n();
  return [
    {
      num: "01",
      title: t.feature1Title,
      desc: t.feature1Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#662483" strokeWidth="2" strokeLinecap="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      visual: "live",
    },
    {
      num: "02",
      title: t.feature2Title,
      desc: t.feature2Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#662483" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
      visual: "globe",
    },
    {
      num: "03",
      title: t.feature3Title,
      desc: t.feature3Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#662483" strokeWidth="2" strokeLinecap="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      ),
      visual: "djs",
    },
    {
      num: "04",
      title: t.feature4Title,
      desc: t.feature4Desc,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#662483" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      visual: "chat",
    },
  ];
}

function FeatureVisual({ type }: { type: string }) {
  if (type === "live") {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)" }}>
          <span className="w-2 h-2 rounded-full bg-red-500" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span className="text-red-400 text-xs font-bold">LIVE</span>
        </div>
        <div className="flex items-end gap-[3px] h-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                background: "var(--color-accent)",
                animation: `wave 1s ease-in-out ${i * 0.15}s infinite`,
                height: "8px",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (type === "globe") {
    return (
      <div className="relative w-24 h-24">
        {[
          { x: 30, y: 20 }, { x: 60, y: 35 }, { x: 45, y: 55 },
          { x: 70, y: 60 }, { x: 20, y: 70 }, { x: 80, y: 25 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: pos.x,
              top: pos.y,
              background: "var(--color-accent)",
              opacity: [0.5, 0.8, 0.6, 0.9, 0.7, 1.0][i],
              animation: i === 1 ? "pulse-dot 2s ease-in-out infinite" : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  if (type === "djs") {
    return (
      <div className="flex gap-3">
        {["T", "K", "D", "M"].map((letter, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{
              background: "rgba(102, 36, 131, 0.2)",
              border: "2px solid var(--color-accent)",
              boxShadow: "0 0 15px rgba(102, 36, 131, 0.3)",
              animation: `float 3s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            {letter}
          </div>
        ))}
      </div>
    );
  }

  // chat
  return (
    <div className="relative h-20 w-40 overflow-hidden">
      {["Super set!", "Fire!", "Drop it!"].map((msg, i) => (
        <div
          key={i}
          className="absolute text-xs px-3 py-1 rounded-full whitespace-nowrap"
          style={{
            background: "rgba(102, 36, 131, 0.15)",
            border: "1px solid rgba(102, 36, 131, 0.2)",
            color: "var(--color-accent-light)",
            left: i * 30 + 10,
            animation: `chatFloat 3s ease-in-out ${i * 0.8}s infinite`,
          }}
        >
          {msg}
        </div>
      ))}
    </div>
  );
}

export default function FeaturesScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { locale, t } = useI18n();
  const features = useFeatures();

  useEffect(() => {
    if (!sectionRef.current || !titleRef.current) return;

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // Header: split into chars for dramatic reveal
      const split = SplitText.create(titleRef.current!, { type: "chars,words" });
      gsap.from(split.chars, {
        yPercent: 100,
        opacity: 0,
        stagger: 0.02,
        duration: 0.8,
        ease: "power4.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
        },
      });

      // Tag line animation
      gsap.from(".features-tag", {
        opacity: 0,
        y: 15,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".features-tag",
          start: "top 88%",
        },
      });

      gsap.from(".features-line", {
        scaleX: 0,
        duration: 0.8,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: ".features-tag",
          start: "top 85%",
        },
      });

      // Subtitle
      gsap.from(".features-subtitle", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".features-subtitle",
          start: "top 88%",
        },
      });

      const cards = gsap.utils.toArray<HTMLElement>(".feature-card");

      if (!isMobile) {
        // Cards start off-screen with rotation
        gsap.set(cards, { xPercent: 150, autoAlpha: 0, rotateY: -8 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: () => `+=${cards.length * 600}`,
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => {
              const idx = Math.min(
                cards.length - 1,
                Math.floor(self.progress * cards.length)
              );
              setActiveIndex(idx);
            },
          },
        });

        // Each card slides in with rotation correction
        cards.forEach((card) => {
          tl.to(card, {
            xPercent: 0,
            autoAlpha: 1,
            rotateY: 0,
            duration: 1,
            ease: "power3.out",
          });
          tl.to({}, { duration: 0.3 });
        });
      } else {
        // Mobile: stagger reveal with scale
        cards.forEach((card) => {
          gsap.from(card, {
            opacity: 0,
            y: 60,
            scale: 0.95,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            },
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative z-[1] overflow-hidden">
      {/* Section header */}
      <div className="text-center max-w-[600px] mx-auto px-6 pt-20 pb-8 md:pt-24 md:pb-10">
        <p
          className="features-tag font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase mb-3"
          style={{ color: "var(--color-accent-light)", letterSpacing: "3px" }}
        >
          {t.featuresTag}
        </p>
        <div
          className="features-line h-[2px] w-[60px] mx-auto mb-4 rounded-full origin-center"
          style={{ background: "var(--color-accent)" }}
        />
        <h2
          key={locale}
          ref={titleRef}
          className="font-[family-name:var(--font-syne)] font-bold mb-3 overflow-hidden"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", letterSpacing: "-0.5px" }}
        >
          {t.featuresTitle}
        </h2>
        <p className="features-subtitle text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {t.featuresSubtitle}
        </p>
      </div>

      {/* Cards container */}
      <div className="overflow-hidden px-6" style={{ perspective: "1200px" }}>
        <div
          ref={trackRef}
          className="flex flex-wrap gap-4 md:flex-nowrap md:gap-4 max-w-[1200px] mx-auto"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className="feature-card glassmorphism p-5 md:p-6 flex flex-col gap-3 w-full md:flex-1 md:min-w-0"
              style={{
                borderRadius: "20px",
                height: "min(420px, calc(100vh - 260px))",
                transition: "border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(102, 36, 131, 0.3)";
                el.style.boxShadow = "0 8px 40px rgba(102, 36, 131, 0.15)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "var(--color-border)";
                el.style.boxShadow = "none";
              }}
            >
              {/* Card number */}
              <span
                className="font-[family-name:var(--font-syne)] text-4xl md:text-5xl font-bold leading-none"
                style={{ color: "rgba(102, 36, 131, 0.08)" }}
              >
                {feature.num}
              </span>

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(102, 36, 131, 0.1)" }}
              >
                {feature.icon}
              </div>

              {/* Text */}
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {feature.desc}
              </p>

              {/* Visual */}
              <div className="mt-auto pt-2">
                <FeatureVisual type={feature.visual} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators (desktop only) - elongated active dot */}
      <div className="hidden md:flex justify-center gap-2 absolute bottom-8 left-0 right-0 z-10">
        {features.map((_, i) => (
          <div
            key={i}
            className="h-[3px] rounded-full"
            style={{
              width: i === activeIndex ? "24px" : "8px",
              background: i === activeIndex ? "var(--color-accent)" : "var(--color-border)",
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
