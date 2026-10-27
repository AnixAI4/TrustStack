"use client";

import { useEffect, useRef } from "react";

/**
 * "Kolam of Consent" - an animated canvas inspired by South Indian kolam art:
 * a lattice of pulli (dots) woven with curved lines and travelling light pulses.
 * Theme-aware (reads --accent / --brand), respects prefers-reduced-motion.
 */
export function Kolam({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const read = (v: string, fallback: string) => {
      const c = getComputedStyle(document.documentElement)
        .getPropertyValue(v)
        .trim();
      return c || fallback;
    };

    let accent = "255,122,24";
    let brand = "108,140,255";
    const refreshColors = () => {
      accent = read("--accent-rgb", "255 122 24").replace(/\s+/g, ",");
      brand = read("--brand-rgb", "108 140 255").replace(/\s+/g, ",");
    };

    type Pt = { x: number; y: number; bx: number; by: number; ph: number };
    let pts: Pt[] = [];
    let cols = 0;
    let rows = 0;
    const gap = 46;

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(4, Math.floor(w / gap));
      rows = Math.max(3, Math.floor(h / gap));
      const ox = (w - (cols - 1) * gap) / 2;
      const oy = (h - (rows - 1) * gap) / 2;
      pts = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * gap;
          const y = oy + r * gap;
          pts.push({ x, y, bx: x, by: y, ph: (c + r) * 0.6 });
        }
      }
      refreshColors();
    };

    const idx = (c: number, r: number) => r * cols + c;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // breathe
      for (const p of pts) {
        const s = reduce ? 0 : Math.sin(t * 0.0012 + p.ph) * 3;
        p.x = p.bx + s;
        p.y = p.by + Math.cos(t * 0.0011 + p.ph) * (reduce ? 0 : 3);
      }

      // woven curves
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${accent},0.18)`;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = pts[idx(c, r)];
          const b = pts[idx(c + 1, r)];
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 + (r % 2 ? 10 : -10);
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const a = pts[idx(c, r)];
          const b = pts[idx(c, r + 1)];
          const mx = (a.x + b.x) / 2 + (c % 2 ? 10 : -10);
          const my = (a.y + b.y) / 2;
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
        }
      }
      ctx.stroke();

      // dots
      for (const p of pts) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${accent},0.5)`;
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // travelling pulses along rows
      if (!reduce) {
        const pulses = Math.min(rows, 6);
        for (let i = 0; i < pulses; i++) {
          const r = Math.floor((i / pulses) * rows);
          const prog = ((t * 0.00018 + i / pulses) % 1) * (cols - 1);
          const c = Math.floor(prog);
          const f = prog - c;
          const a = pts[idx(Math.min(c, cols - 1), r)];
          const b = pts[idx(Math.min(c + 1, cols - 1), r)];
          const x = a.x + (b.x - a.x) * f;
          const y = a.y + (b.y - a.y) * f;
          const grd = ctx.createRadialGradient(x, y, 0, x, y, 9);
          grd.addColorStop(0, `rgba(${i % 2 ? brand : accent},0.9)`);
          grd.addColorStop(1, `rgba(${i % 2 ? brand : accent},0)`);
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    build();
    raf = requestAnimationFrame(draw);

    const onResize = () => build();
    window.addEventListener("resize", onResize);
    const obs = new MutationObserver(refreshColors);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      obs.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
