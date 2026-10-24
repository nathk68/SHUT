"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);
  const { t } = useI18n();

  const stats = [
    { target: 99.9, suffix: "%", label: t.statUptime, isText: false },
    { target: 320, suffix: " kbps", label: t.statAudio, isText: false },
    { target: 720, suffix: "p", label: t.statVideo, isText: false },
    { target: 0, suffix: "", label: t.statProtocol, isText: true, display: t.statProtocolValue },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Section title
      gsap.from(".stats-title", {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power4.out",
        scrollTrigger: {
          trigger: ".stats-title",
          start: "top 85%",
        },
      });

      // Cards staggered entrance with scale
      gsap.from(".stat-card", {
        y: 80,
        opacity: 0,
        scale: 0.9,
        stagger: 0.12,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          onEnter: () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;
            startCountUp();
          },
        },
      });

      // Parallax on the background glow
      gsap.to(".stats-glow", {
        y: -60,
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

  function startCountUp() {
    const numbers = sectionRef.current?.querySelectorAll(".stat-number");
    if (!numbers) return;

    numbers.forEach((el, i) => {
      const stat = stats[i];
      if (stat.isText) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: i * 0.2 });
        return;
      }

      const duration = 2000;
      const start = performance.now();
      el.classList.add("counting");

      function update(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutExpo(progress);
        const current = eased * stat.target;
        const formatted =
          stat.target % 1 === 0
            ? Math.floor(current).toString()
            : current.toFixed(1);
        el.textContent = formatted + stat.suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = stat.target + stat.suffix;
          el.classList.remove("counting");
        }
      }

      setTimeout(() => requestAnimationFrame(update), i * 200);
    });
  }

  return (
    <section id="stats" ref={sectionRef} className="relative z-[1] py-32 px-6">
      {/* Parallax bg glow */}
      <div
        className="stats-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(102,36,131,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Section label */}
      <div className="text-center mb-12">
        <p
          className="stats-title font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase mb-2"
          style={{ color: "var(--color-accent-light)", letterSpacing: "3px" }}
        >
          {t.navPerformance}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-[1000px] mx-auto">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="stat-card glassmorphism p-6 md:p-8 rounded-2xl text-center group"
            style={{
              transition: "border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "rgba(102,36,131,0.25)";
              el.style.transform = "translateY(-4px)";
              el.style.boxShadow = "0 12px 40px rgba(102,36,131,0.12)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--color-border)";
              el.style.transform = "translateY(0)";
              el.style.boxShadow = "none";
            }}
          >
            <span
              className="stat-number block font-[family-name:var(--font-syne)] font-bold gradient-text"
              style={{ fontSize: "clamp(1.2rem, 2vw, 1.75rem)" }}
            >
              {stat.isText ? stat.display : "0"}
            </span>
            <span
              className="block text-sm mt-2 font-[family-name:var(--font-jetbrains-mono)]"
              style={{ color: "var(--color-text-secondary)", letterSpacing: "0.5px" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
