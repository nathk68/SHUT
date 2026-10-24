"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Orbe breathing animation
      gsap.to(".cta-orbe", {
        scale: 1.2,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play pause resume pause",
        },
      });

      // Title: split into chars for dramatic cascade
      if (titleRef.current) {
        const split = SplitText.create(titleRef.current, { type: "chars,words" });
        gsap.from(split.chars, {
          yPercent: 120,
          opacity: 0,
          rotateX: -30,
          stagger: 0.03,
          duration: 0.9,
          ease: "power4.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 80%",
          },
        });
      }

      // Accent word: separate dramatic reveal
      if (accentRef.current) {
        const accentSplit = SplitText.create(accentRef.current, { type: "chars" });
        gsap.from(accentSplit.chars, {
          yPercent: 120,
          opacity: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: "power4.out",
          scrollTrigger: {
            trigger: accentRef.current,
            start: "top 85%",
          },
        });
      }

      // Tag
      gsap.from(".cta-tag", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-tag", start: "top 85%" },
      });

      // Subtitle
      gsap.from(".cta-sub", {
        opacity: 0,
        y: 25,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: ".cta-sub", start: "top 85%" },
      });

      // Button with spring
      gsap.from(".cta-button", {
        opacity: 0,
        y: 30,
        scale: 0.9,
        duration: 0.8,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: ".cta-button", start: "top 90%" },
      });

      // Decorative ring parallax
      gsap.to(".cta-ring", {
        rotation: 360,
        duration: 30,
        ease: "none",
        repeat: -1,
      });

      // Parallax on ring on scroll
      gsap.to(".cta-ring", {
        y: -40,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="relative z-[1] py-32 px-6 text-center overflow-hidden"
    >
      {/* Orbe */}
      <div
        className="cta-orbe absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "var(--color-accent)",
          filter: "blur(120px)",
          opacity: 0.15,
        }}
      />

      {/* Rotating ring */}
      <div className="cta-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          className="max-w-[90vw]"
        >
          <circle
            cx="300"
            cy="300"
            r="280"
            stroke="#662483"
            strokeWidth="1"
            opacity="0.12"
            strokeDasharray="8 12"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-[2] max-w-[600px] mx-auto">
        <p
          className="cta-tag font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase mb-6"
          style={{ color: "var(--color-accent-light)", letterSpacing: "3px" }}
        >
          {t.ctaTag}
        </p>

        <div className="overflow-hidden mb-2">
          <h2
            key={`cta-title-${locale}`}
            ref={titleRef}
            className="font-[family-name:var(--font-syne)] font-extrabold"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {t.ctaTitle}
          </h2>
        </div>
        <div className="overflow-hidden mb-6">
          <span
            key={`cta-accent-${locale}`}
            ref={accentRef}
            className="font-[family-name:var(--font-syne)] font-extrabold gradient-text inline-block"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              letterSpacing: "-0.02em",
            }}
          >
            {t.ctaTitleAccent}
          </span>
        </div>

        <p
          className="cta-sub text-lg mb-10 leading-relaxed max-w-[500px] mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.ctaSubtitle}
        </p>

        <a
          href="#"
          className="cta-button inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-[family-name:var(--font-syne)] font-semibold text-lg text-white no-underline"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 0 30px rgba(102, 36, 131, 0.35)",
            transition: "box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = "0 0 60px rgba(102, 36, 131, 0.55)";
            el.style.transform = "translateY(-3px) scale(1.02)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.boxShadow = "0 0 30px rgba(102, 36, 131, 0.35)";
            el.style.transform = "translateY(0) scale(1)";
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {t.ctaButton}
        </a>
      </div>
    </section>
  );
}
