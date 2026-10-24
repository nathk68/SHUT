"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

const journeySteps = [
  {
    image: "/images/mixing-table.jpeg",
    labelKey: "journeyStep1" as const,
    subtitleKey: "journeyStep1Sub" as const,
  },
  {
    image: "/images/DJ-small-club.jpeg",
    labelKey: "journeyStep2" as const,
    subtitleKey: "journeyStep2Sub" as const,
  },
  {
    image: "/images/DJ-home.jpeg",
    labelKey: "journeyStep3" as const,
    subtitleKey: "journeyStep3Sub" as const,
  },
  {
    image: "/images/DJ-club.jpeg",
    labelKey: "journeyStep4" as const,
    subtitleKey: "journeyStep4Sub" as const,
  },
];

export default function DJJourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!sectionRef.current || !pinnedRef.current) return;

    const ctx = gsap.context(() => {
      const images = gsap.utils.toArray<HTMLElement>(".journey-image");
      const labels = gsap.utils.toArray<HTMLElement>(".journey-label");
      const subtitles = gsap.utils.toArray<HTMLElement>(".journey-subtitle");
      const counters = gsap.utils.toArray<HTMLElement>(".journey-counter");
      const progressBar = document.querySelector(".journey-progress-fill");

      // Section title reveal
      if (titleRef.current) {
        const split = SplitText.create(titleRef.current, { type: "chars" });
        gsap.from(split.chars, {
          yPercent: 100,
          opacity: 0,
          stagger: 0.03,
          duration: 0.8,
          ease: "power4.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 85%",
          },
        });
      }

      // Tag reveal
      gsap.from(".journey-tag", {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".journey-tag",
          start: "top 85%",
        },
      });

      // First image starts visible, rest hidden
      gsap.set(images[0], { clipPath: "inset(0% 0% 0% 0%)", opacity: 1 });
      images.slice(1).forEach((img) => {
        gsap.set(img, { clipPath: "inset(100% 0% 0% 0%)", opacity: 1 });
      });

      // First label/subtitle visible, rest hidden
      gsap.set(labels[0], { opacity: 1, y: 0 });
      gsap.set(subtitles[0], { opacity: 1, y: 0 });
      gsap.set(counters[0], { opacity: 1 });
      labels.slice(1).forEach((l) => gsap.set(l, { opacity: 0, y: 30 }));
      subtitles.slice(1).forEach((s) => gsap.set(s, { opacity: 0, y: 20 }));
      counters.slice(1).forEach((c) => gsap.set(c, { opacity: 0.2 }));

      // Main pinned timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinnedRef.current,
          start: "top top",
          end: () => `+=${images.length * 200}vh`,
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            if (progressBar) {
              gsap.set(progressBar, { scaleX: self.progress });
            }
          },
        },
      });

      // For each transition between images
      for (let i = 0; i < images.length - 1; i++) {
        // Fade out current label/subtitle
        tl.to(labels[i], { opacity: 0, y: -30, duration: 0.3, ease: "power2.in" }, `step${i}`);
        tl.to(subtitles[i], { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }, `step${i}`);
        tl.to(counters[i], { opacity: 0.2, duration: 0.3 }, `step${i}`);

        // Reveal next image with clip-path wipe from bottom
        tl.to(
          images[i + 1],
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1,
            ease: "power3.inOut",
          },
          `step${i}+=0.2`
        );

        // Slight parallax scale on current image
        tl.to(
          images[i],
          {
            scale: 1.1,
            duration: 1,
            ease: "power2.inOut",
          },
          `step${i}+=0.2`
        );

        // Reveal next label/subtitle
        tl.to(
          labels[i + 1],
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          `step${i}+=0.7`
        );
        tl.to(
          subtitles[i + 1],
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          `step${i}+=0.8`
        );
        tl.to(counters[i + 1], { opacity: 1, duration: 0.4 }, `step${i}+=0.7`);

        // Pause between transitions
        tl.to({}, { duration: 0.5 });
      }

      // Marquee animation
      gsap.to(".journey-marquee-track", {
        xPercent: -50,
        duration: 20,
        ease: "none",
        repeat: -1,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="journey" className="relative z-[1]">
      {/* Section header - before pinned area */}
      <div className="text-center px-6 pt-24 pb-16">
        <p
          className="journey-tag font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase mb-4"
          style={{ color: "var(--color-accent-light)", letterSpacing: "3px" }}
        >
          {t.journeyTag}
        </p>
        <h2
          ref={titleRef}
          className="font-[family-name:var(--font-syne)] font-bold overflow-hidden"
          style={{
            fontSize: "clamp(2rem, 5vw, 4rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {t.journeyTitle}{" "}
          <span className="gradient-text">{t.journeyTitleAccent}</span>
        </h2>
      </div>

      {/* Pinned container */}
      <div ref={pinnedRef} className="relative h-screen w-full overflow-hidden">
        {/* Image stack */}
        {journeySteps.map((step, i) => (
          <div
            key={i}
            className="journey-image absolute inset-0"
            style={{ zIndex: i + 1 }}
          >
            <Image
              src={step.image}
              alt={t[step.labelKey]}
              fill
              className="object-cover"
              sizes="100vw"
              priority={i === 0}
            />
            {/* Dark overlay for text readability */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(5,5,8,0.85) 0%, rgba(5,5,8,0.3) 40%, rgba(5,5,8,0.15) 100%)",
              }}
            />
          </div>
        ))}

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 10,
            boxShadow: "inset 0 0 150px rgba(5,5,8,0.6)",
          }}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 z-[11] flex flex-col justify-end pb-20 md:pb-24 px-8 md:px-16 lg:px-24">
          {/* Step counter dots */}
          <div className="flex gap-3 mb-6">
            {journeySteps.map((_, i) => (
              <div
                key={i}
                className="journey-counter w-8 h-[2px] rounded-full"
                style={{ background: "var(--color-accent)" }}
              />
            ))}
          </div>

          {/* Labels stack (positioned absolutely so they overlap) */}
          <div className="relative h-[120px] md:h-[140px]">
            {journeySteps.map((step, i) => (
              <div key={i} className="absolute bottom-0 left-0">
                <h3
                  className="journey-label font-[family-name:var(--font-syne)] font-extrabold leading-none mb-3"
                  style={{
                    fontSize: "clamp(1.8rem, 4vw, 3.5rem)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t[step.labelKey]}
                </h3>
                <p
                  className="journey-subtitle text-base md:text-lg max-w-[500px]"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {t[step.subtitleKey]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] z-[12]"
          style={{ background: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="journey-progress-fill h-full origin-left"
            style={{
              background: "var(--color-accent)",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>

      {/* Marquee text - after pinned area */}
      <div className="overflow-hidden py-12 md:py-16" style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="journey-marquee-track flex whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="font-[family-name:var(--font-syne)] font-extrabold uppercase mx-8 md:mx-12"
              style={{
                fontSize: "clamp(3rem, 8vw, 7rem)",
                letterSpacing: "-0.03em",
                color: i % 2 === 0 ? "var(--color-text-primary)" : "transparent",
                WebkitTextStroke: i % 2 === 0 ? "none" : "1px rgba(255,255,255,0.2)",
              }}
            >
              {t.journeyMarquee}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
