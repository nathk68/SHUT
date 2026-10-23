"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // Safety timeout — force complete if animation gets interrupted (e.g. hydration recovery)
    const safetyTimeout = setTimeout(() => {
      if (containerRef.current && containerRef.current.style.display !== "none") {
        containerRef.current.style.display = "none";
        onComplete();
      }
    }, 5000);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          clearTimeout(safetyTimeout);
          gsap.to(containerRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.inOut",
            onComplete: () => {
              if (containerRef.current) {
                containerRef.current.style.display = "none";
              }
              onComplete();
            },
          });
        },
      });

      // Draw circle outline
      const circle = containerRef.current?.querySelector(".preloader-circle");
      if (circle) {
        const length = (circle as SVGCircleElement).getTotalLength?.() || 283;
        gsap.set(circle, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(circle, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power2.inOut",
        });
      }

      // Fade in face and vinyl
      tl.from(
        ".preloader-face",
        { opacity: 0, duration: 0.5, ease: "power2.out" },
        "-=0.4"
      );
      tl.from(
        ".preloader-vinyl",
        { opacity: 0, scale: 0.8, duration: 0.4, ease: "back.out(1.7)" },
        "-=0.2"
      );

      // Text reveal
      tl.from(".preloader-letter", {
        yPercent: 100,
        opacity: 0,
        stagger: 0.06,
        duration: 0.4,
        ease: "power4.out",
      }, "-=0.1");

      // Progress bar
      tl.to(
        ".preloader-bar-fill",
        { width: "100%", duration: 0.6, ease: "power2.inOut" },
        "-=0.5"
      );

      // Hold for a beat
      tl.to({}, { duration: 0.3 });

      // Scale up logo before exit
      tl.to(".preloader-logo", {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.in",
      });
    }, containerRef);

    return () => {
      clearTimeout(safetyTimeout);
      hasRun.current = false;
      ctx.revert();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="flex flex-col items-center">
        {/* Logo SVG */}
        <div className="preloader-logo mb-8">
          <svg
            viewBox="0 0 200 200"
            width="120"
            height="120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Circle outline */}
            <circle
              className="preloader-circle"
              cx="100"
              cy="85"
              r="70"
              stroke="#974dfb"
              strokeWidth="3"
              fill="none"
            />
            {/* Face silhouette */}
            <path
              className="preloader-face"
              d="M75 45 C65 45, 50 60, 50 85 C50 110, 60 130, 80 135 C85 136, 88 134, 92 130 C96 126, 100 118, 100 110 C100 95, 90 85, 85 80 C80 75, 78 68, 78 60 C78 52, 75 45, 75 45Z"
              fill="#974dfb"
            />
            {/* Vinyl record */}
            <circle
              className="preloader-vinyl"
              cx="115"
              cy="95"
              r="25"
              fill="#1a1025"
              stroke="#974dfb"
              strokeWidth="1"
              opacity="0.8"
            />
            <circle
              className="preloader-vinyl"
              cx="115"
              cy="95"
              r="4"
              fill="rgba(255,255,255,0.3)"
            />
          </svg>
        </div>

        {/* SHUT text */}
        <div className="flex gap-1 mb-6 overflow-hidden">
          {"SHUT".split("").map((letter, i) => (
            <span
              key={i}
              className="preloader-letter font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-[4px]"
              style={{ color: "var(--color-accent)" }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-[2px] rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
          <div
            className="preloader-bar-fill h-full w-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
