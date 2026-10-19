"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
              : "max-w-full px-8 py-3.5"
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
            <svg
              viewBox="0 0 200 200"
              width="32"
              height="32"
              fill="none"
            >
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
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              onClick={(e) => handleAnchorClick(e, "#features")}
              className="text-[color:var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors no-underline"
            >
              Features
            </a>
            <a
              href="#stats"
              onClick={(e) => handleAnchorClick(e, "#stats")}
              className="text-[color:var(--color-text-secondary)] hover:text-white text-sm font-medium transition-colors no-underline"
            >
              Performance
            </a>
            <a
              href="#cta"
              onClick={(e) => handleAnchorClick(e, "#cta")}
              className="px-5 py-2 rounded-full text-sm font-medium text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "var(--color-accent)",
                boxShadow: "0 0 20px rgba(151, 77, 251, 0.3)",
              }}
            >
              Commencer
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
            Features
          </a>
          <a
            href="#stats"
            onClick={(e) => handleAnchorClick(e, "#stats")}
            className="text-2xl font-[family-name:var(--font-space-grotesk)] font-semibold text-white no-underline"
          >
            Performance
          </a>
          <a
            href="#cta"
            onClick={(e) => handleAnchorClick(e, "#cta")}
            className="px-8 py-3 rounded-full text-lg font-semibold text-white no-underline"
            style={{ background: "var(--color-accent)" }}
          >
            Commencer
          </a>
        </div>
      )}
    </>
  );
}
