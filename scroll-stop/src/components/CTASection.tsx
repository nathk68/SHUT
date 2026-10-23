"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

export default function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Orbe pulse
      gsap.to(".cta-orbe", {
        scale: 1.15,
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

      // Title SplitText
      const split = SplitText.create(titleRef.current!, { type: "words" });
      gsap.from(split.words, {
        yPercent: 100,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: "power4.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
        },
      });

      // Tag + subtitle + button
      gsap.from(".cta-tag", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        scrollTrigger: { trigger: ".cta-tag", start: "top 85%" },
      });
      gsap.from(".cta-sub", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        scrollTrigger: { trigger: ".cta-sub", start: "top 85%" },
      });
      gsap.from(".cta-button", {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.6,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".cta-button", start: "top 90%" },
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          width="600"
          height="600"
          viewBox="0 0 600 600"
          fill="none"
          className="max-w-[90vw]"
          style={{ animation: "spin 20s linear infinite" }}
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

        <h2
          key={locale}
          ref={titleRef}
          className="font-[family-name:var(--font-space-grotesk)] font-bold mb-6 overflow-hidden"
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.5px",
          }}
        >
          {t.ctaTitle}{" "}
          <span className="gradient-text">{t.ctaTitleAccent}</span>
        </h2>

        <p
          className="cta-sub text-lg mb-10 leading-relaxed max-w-[500px] mx-auto"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.ctaSubtitle}
        </p>

        <a
          href="#"
          className="cta-button inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-[family-name:var(--font-space-grotesk)] font-semibold text-lg text-white transition-all duration-300 hover:scale-[1.03] no-underline"
          style={{
            background: "var(--color-accent)",
            boxShadow: "0 0 30px rgba(102, 36, 131, 0.35)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 50px rgba(102, 36, 131, 0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 0 30px rgba(102, 36, 131, 0.35)";
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
