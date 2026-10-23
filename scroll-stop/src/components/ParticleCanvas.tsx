"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

interface Particle {
  angle: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  size: number;
  opacity: number;
  phase: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let animId: number;
    let particles: Particle[] = [];

    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 80 : 150;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radiusX: 80 + Math.random() * 300,
          radiusY: 60 + Math.random() * 250,
          speed: 0.0003 + Math.random() * 0.001,
          size: 0.5 + Math.random() * 2.5,
          opacity: 0.1 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    // Mouse parallax (desktop only)
    const xTo = gsap.quickTo(offsetRef.current, "x", { duration: 0.8, ease: "power3" });
    const yTo = gsap.quickTo(offsetRef.current, "y", { duration: 0.8, ease: "power3" });

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      xTo((e.clientX - cx) * -0.02);
      yTo((e.clientY - cy) * -0.02);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = (canvas.width / 2) + offsetRef.current.x * dpr;
      const cy = (canvas.height / 2) + offsetRef.current.y * dpr;

      for (const p of particles) {
        p.angle += p.speed;

        const x = cx + Math.cos(p.angle) * p.radiusX * dpr;
        const y = cy + Math.sin(p.angle) * p.radiusY * dpr;

        // Twinkle
        const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + p.phase);
        const alpha = p.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(x, y, p.size * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(151, 77, 251, ${alpha})`;
        ctx.fill();

        // Glow for bigger particles
        if (p.size > 1.5) {
          ctx.beginPath();
          ctx.arc(x, y, p.size * 3 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(151, 77, 251, ${alpha * 0.1})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(animate);
    };

    init();
    animate();

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
