"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const screens = [
  "/images/onglet_explore_fr.jpeg",
  "/images/onglet_live_fr.jpeg",
  "/images/onglet_endirect.jpeg",
  "/images/onglet_favorites_fr.jpeg",
  "/images/onglet_profil_fr.jpeg",
];

const badges = [
  { label: "Audio 320kbps", icon: "music", pos: "top-[10%] -right-4 md:right-[-60px]", delay: "0s" },
  { label: "720p Video", icon: "video", pos: "top-[25%] -left-4 md:left-[-50px]", delay: "0.5s" },
  { label: "RTMP natif", icon: "zap", pos: "bottom-[25%] -right-4 md:right-[-55px]", delay: "1s" },
  { label: "Reconnexion auto", icon: "refresh", pos: "bottom-[10%] -left-4 md:left-[-60px]", delay: "1.5s" },
];

function BadgeIcon({ type }: { type: string }) {
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "#974dfb", strokeWidth: 2, strokeLinecap: "round" as const };
  switch (type) {
    case "music":
      return <svg {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>;
    case "video":
      return <svg {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
    case "zap":
      return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
    case "refresh":
      return <svg {...props}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>;
    default:
      return null;
  }
}

export default function PhoneMockup() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const [currentScreen, setCurrentScreen] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Phone entrance
      gsap.fromTo(
        phoneRef.current,
        { scale: 0.8, rotateY: -15, opacity: 0.5 },
        {
          scale: 1,
          rotateY: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            end: "top 20%",
            scrub: 1,
          },
        }
      );

      // Badges stagger
      gsap.from(".phone-badge", {
        opacity: 0,
        scale: 0.8,
        stagger: 0.15,
        duration: 0.6,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 40%",
        },
      });

      // Below-phone content
      gsap.from(".phone-below", {
        opacity: 0,
        y: 30,
        duration: 0.6,
        scrollTrigger: {
          trigger: ".phone-below",
          start: "top 85%",
        },
      });
    }, sectionRef);

    // Screenshot carousel
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);

    return () => {
      ctx.revert();
      clearInterval(interval);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative z-[1] py-32 px-6 overflow-hidden">
      {/* Radial halo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(151,77,251,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        {/* Phone + badges wrapper */}
        <div className="relative" style={{ perspective: "1200px" }}>
          {/* Phone frame */}
          <div
            ref={phoneRef}
            className="relative w-[260px] h-[540px] md:w-[300px] md:h-[620px] rounded-[40px] p-[6px] overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
              boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(151,77,251,0.15)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Inner screen */}
            <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-black">
              {/* Notch */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] rounded-b-2xl z-10"
                style={{ background: "#000" }}
              />

              {/* Screenshot carousel */}
              {screens.map((src, i) => (
                <div
                  key={i}
                  className="absolute inset-0 transition-opacity duration-700"
                  style={{ opacity: currentScreen === i ? 1 : 0 }}
                >
                  <Image
                    src={src}
                    alt={`SHUT app screen ${i + 1}`}
                    fill
                    className="object-cover object-top"
                    sizes="300px"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          {badges.map((badge, i) => (
            <div
              key={i}
              className={`phone-badge absolute ${badge.pos} glassmorphism flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap z-10`}
              style={{
                animation: `float 3s ease-in-out ${badge.delay} infinite`,
              }}
            >
              <BadgeIcon type={badge.icon} />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {badge.label}
              </span>
            </div>
          ))}
        </div>

        {/* Below phone */}
        <div className="phone-below text-center mt-16">
          <p
            className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold mb-6"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Disponible bientot sur iOS & Android
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {/* App Store button (disabled) */}
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-xl opacity-50 cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor">
                <path d="M15.77 12.45c-.02-2.37 1.93-3.52 2.02-3.57-1.1-1.61-2.81-1.83-3.42-1.85-1.45-.15-2.85.86-3.59.86-.74 0-1.88-.85-3.1-.82-1.59.02-3.07.93-3.89 2.37-1.67 2.9-.43 7.18 1.19 9.53.8 1.15 1.74 2.44 2.98 2.4 1.2-.05 1.65-.77 3.1-.77 1.44 0 1.85.77 3.1.74 1.29-.02 2.1-1.17 2.88-2.32.92-1.33 1.29-2.63 1.31-2.7-.03-.01-2.51-.96-2.53-3.83z" />
              </svg>
              <span className="text-sm font-medium">App Store</span>
            </div>
            {/* Google Play button (disabled) */}
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-xl opacity-50 cursor-not-allowed"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor">
                <path d="M1.21 0L11.05 10 1.21 20c-.38-.39-.21-1.26-.21-1.79V1.79C1 1.26.83.39 1.21 0zm.71-.41L13.06 5.5 3.5 10 1.92-.41zM13.06 14.5L1.92 20.41 3.5 10l9.56 4.5zm1.24-.73L19 11c.66.36.66 1.64 0 2l-4.7 2.77L10.5 12l3.8-3.23z" />
              </svg>
              <span className="text-sm font-medium">Google Play</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
