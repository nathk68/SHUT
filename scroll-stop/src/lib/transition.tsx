"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

type Phase = "idle" | "hidden" | "revealing";

interface TransitionContextType {
  isPlaying: boolean;
  /** "idle" = normal | "hidden" = content invisible (behind disc) | "revealing" = fading in */
  phase: Phase;
  play: (midpointCallback?: () => void) => void;
  onComplete: () => void;
}

const TransitionContext = createContext<TransitionContextType>({
  isPlaying: false,
  phase: "idle",
  play: () => {},
  onComplete: () => {},
});

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const midpointFired = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const play = useCallback((midpointCallback?: () => void) => {
    if (isPlaying) return;
    midpointFired.current = false;
    clearTimers();
    setIsPlaying(true);
    setPhase("idle");

    // Midpoint: disc fully covers screen → hide content + run callback
    timers.current.push(setTimeout(() => {
      if (!midpointFired.current) {
        midpointFired.current = true;
        setPhase("hidden"); // opacity 0 instantly (invisible behind disc)
        midpointCallback?.();
      }
    }, 680));

    // Shortly after: start fade-in (disc is leaving, content appears)
    timers.current.push(setTimeout(() => {
      setPhase("revealing");
    }, 780));
  }, [isPlaying]);

  const onComplete = useCallback(() => {
    setIsPlaying(false);
    // Keep "revealing" until transition finishes, then back to idle
    timers.current.push(setTimeout(() => {
      setPhase("idle");
    }, 550));
  }, []);

  return (
    <TransitionContext.Provider value={{ isPlaying, phase, play, onComplete }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransition() {
  return useContext(TransitionContext);
}
