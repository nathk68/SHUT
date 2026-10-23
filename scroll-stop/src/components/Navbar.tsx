"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        className="fixed top-3 left-0 right-0 z-[1000] transition-all duration-500"
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-500 ${
            scrolled
              ? "max-w-[820px] px-6 py-2.5 rounded-full border"
              : "max-w-full px-8 md:px-16 lg:px-24 py-3.5"
          }`}
          style={{
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            ...(scrolled
              ? {
                  background: "rgba(5, 5, 8, 0.7)",
                  borderColor: "var(--color-border)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }
              : {}),
          }}
        >
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2.5 no-underline"
            onClick={(e) => handleAnchorClick(e, "#hero")}
          >
            <svg viewBox="90 50 310 380" width="32" height="40" xmlns="http://www.w3.org/2000/svg">
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
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="text-[color:var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors no-underline"
            >
              {t.navFeatures}
            </a>
            <a
              href="#stats"
              onClick={(e) => handleAnchorClick(e, "#stats")}
              className="text-[color:var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors no-underline"
            >
              {t.navPerformance}
            </a>

            {/* Language switcher */}
            <button
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="text-xs font-medium px-2.5 py-1 rounded-full border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {locale === "fr" ? "FR" : "EN"}
            </button>

            <a
              href="#cta"
              onClick={(e) => handleAnchorClick(e, "#cta")}
              className="px-5 py-2 rounded-full text-sm font-medium text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--color-accent)",
                boxShadow: "0 0 20px rgba(102, 36, 131, 0.3)",
              }}
            >
              {t.navCta}
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              className={`w-5 h-0.5 rounded transition-all duration-300 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
              style={{ background: "var(--color-text-primary)" }}
            />
            <span
              className={`w-5 h-0.5 rounded transition-all duration-300 ${
                menuOpen ? "opacity-0" : ""
              }`}
              style={{ background: "var(--color-text-primary)" }}
            />
            <span
              className={`w-5 h-0.5 rounded transition-all duration-300 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
              style={{ background: "var(--color-text-primary)" }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 md:hidden"
          style={{
            background: "rgba(5, 5, 8, 0.95)",
            backdropFilter: "blur(20px)",
          }}
        >
          <a
            href="#features"
            onClick={(e) => handleAnchorClick(e, "#features")}
            className="text-2xl font-[family-name:var(--font-space-grotesk)] font-semibold text-white no-underline"
          >
            {t.navFeatures}
          </a>
          <a
            href="#stats"
            onClick={(e) => handleAnchorClick(e, "#stats")}
            className="text-2xl font-[family-name:var(--font-space-grotesk)] font-semibold text-white no-underline"
          >
            {t.navPerformance}
          </a>

          {/* Language switcher mobile */}
          <button
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="text-lg font-medium px-4 py-2 rounded-full border"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {locale === "fr" ? "Francais" : "English"}
          </button>

          <a
            href="#cta"
            onClick={(e) => handleAnchorClick(e, "#cta")}
            className="px-8 py-3 rounded-full text-lg font-semibold text-white no-underline"
            style={{ background: "var(--color-accent)" }}
          >
            {t.navCta}
          </a>
        </div>
      )}
    </>
  );
}
