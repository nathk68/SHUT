"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { t } = useI18n();

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

  const links = [t.footerPrivacy, t.footerTerms, t.footerContact];

  return (
    <footer
      ref={footerRef}
      className="relative z-[1] px-8 pt-16 pb-10 text-center"
      style={{ borderTop: "1px solid var(--color-border)" }}
    >
      {/* Brand */}
      <div className="flex items-center justify-center gap-2.5 mb-6">
        <svg viewBox="90 50 310 380" width="28" height="34" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M378.35,83.22c0.05,0.01,0.08-0.06,0.03-0.08c-25.68-12.48-53.06-20.57-83.54-20.57
              c-107.68,0-194.96,87.29-194.96,194.96c0,64.81,31.9,121.6,80.56,157.05c0,0,0.04,0.04,0,0c-7.15-6.72-65.07-63.51-25.65-104.79
              c0,0,4.82-7.65,19.28-12.19c0,0,8.65-2.8,21.54,2.55c9.78,4.06,22.27,6.99,28.33,8.16c3.72,0.72,7.53,0.92,11.29,0.44
              c6.37-0.82,14.55-3.65,16.23-12.57c0,0,1.49-7.72-1.28-13.25c-2.76-5.53,2.91-7.37,2.91-7.37s6.73-1.77,6.45-7.02
              c-0.28-5.24-7.02-6.87-7.02-6.87s8.86-1.63,9.85-6.52c0,0,1.56-3.47-4.54-8.29c0,0-4.96-4.18,3.19-7.02s11.34-5.88,11.34-5.88
              s6.31-5.88-6.09-14.03c-12.4-8.15-13.18-22.25-13.18-22.25s-0.78-6.45,2.69-15.8s-0.64-20.98-0.64-20.98s-4.82-14.1-19.7-23.95
              s-12.26-22.75-12.26-22.75s1.06-7.09,10.63-14.31s30.12-14.39,30.12-14.39S308.81,67.93,378.35,83.22z"
            fill="var(--color-accent)"
          />
          <circle cx="320.41" cy="260.42" r="29.86" fill="var(--color-accent)" />
        </svg>
        <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg tracking-[2px]">
          SHUT
        </span>
      </div>

      {/* Links */}
      <div className="flex justify-center gap-6 mb-6">
        {links.map((link) => (
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
        &copy; {t.footerCopyright}
      </p>
    </footer>
  );
}
