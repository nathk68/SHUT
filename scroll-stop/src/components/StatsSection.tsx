"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const stats = [
  { target: 99.9, suffix: "%", label: "Uptime garanti", isText: false },
  { target: 320, suffix: " kbps", label: "Audio stream", isText: false },
  { target: 720, suffix: "p", label: "Qualite video", isText: false },
  { target: 0, suffix: "", label: "Protocole", isText: true, display: "RTMP natif" },
];

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards entrance
      gsap.from(".stat-card", {
        y: 60,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          onEnter: () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;
            startCountUp();
          },
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
        // Just fade in the text
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
      {/* Subtle bg gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(151,77,251,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-[1000px] mx-auto">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="stat-card glassmorphism p-6 md:p-8 rounded-2xl text-center transition-[border-color] duration-300 hover:border-[rgba(151,77,251,0.2)]"
          >
            <span
              className="stat-number block font-[family-name:var(--font-space-grotesk)] font-bold gradient-text"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              {stat.isText ? stat.display : "0"}
            </span>
            <span
              className="block text-sm mt-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>

    </section>
  );
}
