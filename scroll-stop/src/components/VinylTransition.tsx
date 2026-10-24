"use client";

import { useEffect, useRef, useState } from "react";
import { useTransition } from "@/lib/transition";

export default function VinylTransition() {
  const { isPlaying, onComplete } = useTransition();
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPlaying) return;
    setVisible(true);

    const panel = panelRef.current;
    const disc = discRef.current;
    if (!panel || !disc) return;

    // Reset & trigger
    panel.style.animation = "none";
    disc.style.animation = "none";
    panel.offsetHeight; // reflow
    panel.style.animation = "vinylWipe 1.2s linear forwards";
    disc.style.animation = "vinylSpin 1.2s linear forwards";

    const cleanup = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1250);

    return () => clearTimeout(cleanup);
  }, [isPlaying, onComplete]);

  if (!visible && !isPlaying) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vinylWipe {
          0%   { transform: translateX(calc(-100vw - 130vh)); }
          100% { transform: translateX(100vw); }
        }
        @keyframes vinylSpin {
          0%   { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(1440deg); }
        }
      `}} />

      {/* Sliding panel: dark curtain + disc move together at constant speed */}
      <div
        ref={panelRef}
        className="absolute"
        style={{
          top: "-15vh",
          height: "130vh",
          width: "calc(100vw + 65vh)",
          background: "#050508",
          transform: "translateX(calc(-100vw - 130vh))",
        }}
      >
        {/* Vinyl disc at the leading (right) edge */}
        <div
          ref={discRef}
          className="absolute"
          style={{
            width: "130vh",
            height: "130vh",
            right: "-65vh",
            top: "50%",
            transform: "translateY(-50%) rotate(0deg)",
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Outer disc — same color as curtain for seamless blend */}
            <circle cx="200" cy="200" r="200" fill="#050508" />
            <circle cx="200" cy="200" r="197" fill="#0a0a0c" stroke="#151518" strokeWidth="0.8" />

            {/* Grooves */}
            {Array.from({ length: 50 }, (_, i) => {
              const r = 40 + i * 3.1;
              const alpha = 0.02 + (i % 4 === 0 ? 0.025 : 0);
              return (
                <circle
                  key={i}
                  cx="200"
                  cy="200"
                  r={r}
                  fill="none"
                  stroke={`rgba(255,255,255,${alpha})`}
                  strokeWidth="0.35"
                />
              );
            })}

            {/* Sheen reflection */}
            <defs>
              <linearGradient id="v-sheen" x1="0.3" y1="0" x2="0.7" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="35%" stopColor="rgba(255,255,255,0.01)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="65%" stopColor="rgba(255,255,255,0.01)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <radialGradient id="v-label" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#9B3FC0" />
                <stop offset="100%" stopColor="#5A1D70" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="195" fill="url(#v-sheen)" />

            {/* Label */}
            <circle cx="200" cy="200" r="38" fill="url(#v-label)" />
            <circle cx="200" cy="200" r="37.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <text
              x="200" y="196"
              textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize="13" fontWeight="bold" letterSpacing="3"
            >
              SHUT
            </text>
            <text
              x="200" y="210"
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)" fontSize="5" letterSpacing="1.5"
            >
              DIFFUSION
            </text>

            {/* Center hole */}
            <circle cx="200" cy="200" r="4.5" fill="#050508" />
            <circle cx="200" cy="200" r="5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
          </svg>
        </div>
      </div>
    </div>
  );
}
