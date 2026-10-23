"use client";

import { useEffect, useRef } from "react";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    // JS-based completion — fires if React hydrates
    const timer = setTimeout(() => onComplete(), 2700);
    return () => {
      hasRun.current = false;
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes preloaderExit {
        0%, 85% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; pointer-events: none; }
      }
    `}} />
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "var(--color-bg)",
        animation: "preloaderExit 3.2s ease-in-out forwards",
      }}
    >
      <div className="flex flex-col items-center">
        {/* Logo SVG */}
        <div
          className="mb-8"
          style={{ animation: "preloaderFadeScale 0.8s ease-out both" }}
        >
          <svg
            viewBox="90 50 310 380"
            width="120"
            height="148"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M378.35,83.22c0.05,0.01,0.08-0.06,0.03-0.08c-25.68-12.48-53.06-20.57-83.54-20.57
                c-107.68,0-194.96,87.29-194.96,194.96c0,64.81,31.9,121.6,80.56,157.05c0,0,0.04,0.04,0,0c-7.15-6.72-65.07-63.51-25.65-104.79
                c0,0,4.82-7.65,19.28-12.19c0,0,8.65-2.8,21.54,2.55c9.78,4.06,22.27,6.99,28.33,8.16c3.72,0.72,7.53,0.92,11.29,0.44
                c6.37-0.82,14.55-3.65,16.23-12.57c0,0,1.49-7.72-1.28-13.25c-2.76-5.53,2.91-7.37,2.91-7.37s6.73-1.77,6.45-7.02
                c-0.28-5.24-7.02-6.87-7.02-6.87s8.86-1.63,9.85-6.52c0,0,1.56-3.47-4.54-8.29c0,0-4.96-4.18,3.19-7.02s11.34-5.88,11.34-5.88
                s6.31-5.88-6.09-14.03c-12.4-8.15-13.18-22.25-13.18-22.25s-0.78-6.45,2.69-15.8s-0.64-20.98-0.64-20.98s-4.82-14.1-19.7-23.95
                s-12.26-22.75-12.26-22.75s1.06-7.09,10.63-14.31s30.12-14.39,30.12-14.39S308.81,67.93,378.35,83.22z"
              fill="var(--color-accent)"
              style={{ animation: "preloaderFadeScale 0.8s ease-out both" }}
            />
            <circle
              cx="320.41"
              cy="260.42"
              r="29.86"
              fill="var(--color-accent)"
              style={{
                animation: "preloaderPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both",
              }}
            />
          </svg>
        </div>

        {/* SHUT text */}
        <div className="flex gap-1 mb-6 overflow-hidden">
          {"SHUT".split("").map((letter, i) => (
            <span
              key={i}
              className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-[4px]"
              style={{
                color: "var(--color-accent)",
                animation: `preloaderSlideUp 0.4s ease-out ${0.7 + i * 0.06}s both`,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div
          className="w-48 h-[2px] rounded-full overflow-hidden"
          style={{ background: "var(--color-border)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
              animation: "preloaderBar 1.2s ease-in-out 0.8s both",
            }}
          />
        </div>
      </div>
    </div>
    </>
  );
}
