"use client";

import { useEffect, useRef } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

const ACCENT_RGB = [102, 36, 131];

function latLonToSphere(lat: number, lon: number): Point3D {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return {
    x: -Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
}

const cities = [
  { lat: 48.86, lon: 2.35 },
  { lat: 40.71, lon: -74.01 },
  { lat: 35.68, lon: 139.69 },
  { lat: -23.55, lon: -46.63 },
  { lat: 51.51, lon: -0.13 },
  { lat: 55.76, lon: 37.62 },
  { lat: 1.35, lon: 103.82 },
  { lat: -33.87, lon: 151.21 },
  { lat: 25.2, lon: 55.27 },
  { lat: 19.43, lon: -99.13 },
  { lat: 37.57, lon: 126.98 },
  { lat: -1.29, lon: 36.82 },
  { lat: 30.04, lon: 31.24 },
  { lat: 13.76, lon: 100.5 },
  { lat: 52.52, lon: 13.41 },
  { lat: 34.05, lon: -118.24 },
];

export default function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    countryPolygons: [] as Point3D[][],
    rotY: 0,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
    time: 0,
    cityPoints: cities.map((c) => ({
      ...latLonToSphere(c.lat, c.lon),
      pulse: Math.random() * Math.PI * 2,
    })),
    arcs: cities.map((_, i) => ({
      from: i,
      to: (i + 1 + Math.floor(Math.random() * 3)) % cities.length,
      progress: Math.random(),
      speed: 0.003 + Math.random() * 0.004,
    })),
    sparkles: Array.from({ length: 50 }, () => ({
      angle: Math.random() * Math.PI * 2,
      elevation: (Math.random() - 0.5) * Math.PI * 0.8,
      dist: 1.08 + Math.random() * 0.35,
      speed: 0.0005 + Math.random() * 0.002,
      size: 1 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2,
    })),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const dpr = window.devicePixelRatio || 1;
    let animId: number;
    let W = 0,
      H = 0,
      centerX = 0,
      centerY = 0,
      radius = 0;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      centerX = W * 0.58;
      centerY = H * 0.5;
      radius = Math.min(W, H) * 0.4;
    };
    resize();
    window.addEventListener("resize", resize);

    // Load world data
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((world: Topology) => {
        const countriesGeo = feature(world, world.objects.countries);
        const polys: Point3D[][] = [];
        for (const feat of (countriesGeo as GeoJSON.FeatureCollection).features) {
          const geom = feat.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
          const coordSets = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
          for (const polygon of coordSets) {
            for (const ring of polygon) {
              const points: Point3D[] = [];
              for (const [lon, lat] of ring) {
                points.push(latLonToSphere(lat, lon));
              }
              if (points.length > 2) polys.push(points);
            }
          }
        }
        stateRef.current.countryPolygons = polys;
      })
      .catch(() => {});

    const handleMouseMove = (e: MouseEvent) => {
      const s = stateRef.current;
      s.targetMouseX = ((e.clientX / window.innerWidth) - 0.5) * 0.3;
      s.targetMouseY = ((e.clientY / window.innerHeight) - 0.5) * 0.15;
    };
    window.addEventListener("mousemove", handleMouseMove);

    function rotatePoint(p: Point3D) {
      const s = stateRef.current;
      const ry = s.rotY + s.mouseX;
      const rx = s.mouseY;
      const x = p.x * Math.cos(ry) + p.z * Math.sin(ry);
      const z = -p.x * Math.sin(ry) + p.z * Math.cos(ry);
      const y2 = p.y * Math.cos(rx) - z * Math.sin(rx);
      const z2 = p.y * Math.sin(rx) + z * Math.cos(rx);
      return { x, y: y2, z: z2 };
    }

    function project(p: Point3D) {
      const r = rotatePoint(p);
      return { x: centerX + r.x * radius, y: centerY - r.y * radius, z: r.z };
    }

    function slerp(a: Point3D, b: Point3D, t: number) {
      const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
      const omega = Math.acos(dot);
      if (omega < 0.001) return { x: a.x, y: a.y, z: a.z };
      const sinO = Math.sin(omega);
      const fa = Math.sin((1 - t) * omega) / sinO;
      const fb = Math.sin(t * omega) / sinO;
      return { x: a.x * fa + b.x * fb, y: a.y * fa + b.y * fb, z: a.z * fa + b.z * fb };
    }

    function draw() {
      const s = stateRef.current;
      s.time += 16;
      s.rotY += 0.002;
      s.mouseX += (s.targetMouseX - s.mouseX) * 0.05;
      s.mouseY += (s.targetMouseY - s.mouseY) * 0.05;

      ctx.clearRect(0, 0, W, H);

      // Glow
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      glow.addColorStop(0, "rgba(102, 36, 131, 0.06)");
      glow.addColorStop(0.5, "rgba(102, 36, 131, 0.02)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Country fills
      for (const poly of s.countryPolygons) {
        let visCount = 0;
        for (let i = 0; i < poly.length; i += 3) {
          if (rotatePoint(poly[i]).z > -0.05) visCount++;
        }
        if (visCount < poly.length / 6) continue;
        ctx.beginPath();
        let started = false;
        for (const pt of poly) {
          const p = project(pt);
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, 0.06)`;
        ctx.fill();
      }

      // Country outlines
      ctx.lineWidth = 0.6;
      for (const poly of s.countryPolygons) {
        ctx.beginPath();
        let drawing = false;
        for (const pt of poly) {
          const p = project(pt);
          if (p.z < -0.05) { drawing = false; continue; }
          const alpha = 0.04 + Math.max(0, p.z) * 0.18;
          if (!drawing) {
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha})`;
            ctx.moveTo(p.x, p.y);
            drawing = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        if (drawing) ctx.stroke();
      }

      // Arcs
      for (const arc of s.arcs) {
        arc.progress += arc.speed;
        if (arc.progress > 1) arc.progress = 0;
        const a = s.cityPoints[arc.from];
        const b = s.cityPoints[arc.to];
        const steps = 40;
        const points = [];
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const p = slerp(a, b, t);
          const lift = 1 + 0.15 * Math.sin(t * Math.PI);
          points.push(project({ x: p.x * lift, y: p.y * lift, z: p.z * lift }));
        }
        ctx.beginPath();
        let anyVis = false;
        for (const p of points) {
          if (p.z < -0.3) { anyVis = false; continue; }
          if (!anyVis) { ctx.moveTo(p.x, p.y); anyVis = true; }
          else ctx.lineTo(p.x, p.y);
        }
        if (anyVis) {
          ctx.strokeStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, 0.2)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        const pi = Math.floor(arc.progress * steps);
        if (pi < points.length && points[pi].z > -0.1) {
          const pp = points[pi];
          const pa = 0.4 + pp.z * 0.5;
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${pa})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${pa * 0.2})`;
          ctx.fill();
        }
      }

      // City hotspots
      for (const city of s.cityPoints) {
        const p = project(city);
        if (p.z < 0) continue;
        city.pulse += 0.03;
        const pulseScale = 1 + 0.3 * Math.sin(city.pulse);
        const alpha = 0.5 + p.z * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5 * pulseScale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 120, 220, ${alpha * 0.8})`;
        ctx.fill();
      }

      // Sparkles
      for (const sp of s.sparkles) {
        sp.angle += sp.speed;
        sp.elevation += Math.sin(s.time * 0.001 + sp.phase) * 0.001;
        const x = Math.cos(sp.angle) * Math.cos(sp.elevation) * sp.dist;
        const y = Math.sin(sp.elevation) * sp.dist;
        const z = Math.sin(sp.angle) * Math.cos(sp.elevation) * sp.dist;
        const p = project({ x, y, z });
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(s.time * 0.002 + sp.phase));
        const alpha = twinkle * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha})`;
        ctx.fill();
        if (sp.size > 1.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, sp.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha * 0.1})`;
          ctx.fill();
        }
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.02, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, 0.06)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: "none" }}
    />
  );
}
