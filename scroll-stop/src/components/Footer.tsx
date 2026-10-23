"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(footerRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 90%",
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative z-[1] px-8 pt-16 pb-10 text-center"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      {/* Brand */}
      <div className="flex items-center justify-center gap-2.5 mb-6">
        <svg viewBox="0 0 200 200" width="28" height="28" fill="none">
          <circle cx="100" cy="85" r="70" stroke="#974dfb" strokeWidth="4" fill="none" />
          <path
            d="M75 45 C65 45, 50 60, 50 85 C50 110, 60 130, 80 135 C85 136, 88 134, 92 130 C96 126, 100 118, 100 110 C100 95, 90 85, 85 80 C80 75, 78 68, 78 60 C78 52, 75 45, 75 45Z"
            fill="#974dfb"
          />
          <circle cx="115" cy="95" r="25" fill="#1a1025" stroke="#974dfb" strokeWidth="1.5" opacity="0.8" />
          <circle cx="115" cy="95" r="4" fill="rgba(255,255,255,0.3)" />
        </svg>
        <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg tracking-[2px]">
          SHUT
        </span>
      </div>

      {/* Links */}
      <div className="flex justify-center gap-6 mb-6">
        {["Confidentialite", "Conditions", "Contact"].map((link) => (
          <a
            key={link}
            href="#"
            className="text-sm transition-colors no-underline"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
            }}
          >
            {link}
          </a>
        ))}
      </div>

      {/* Copyright */}
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        &copy; 2026 SHUT. Tous droits réservés.
      </p>
    </footer>
  );
}
