"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

const SKY_BOTTOM = 300;

/** Deterministic window grid (some windows lit brighter). NO Math.random - SSR-safe. */
export function windowsFor(x: number, top: number, w: number, tone: number): ReactNode[] {
  const out: ReactNode[] = [];
  const pad = 6, cw = 6, ch = 10, gx = 6, gy = 7;
  const cols = Math.max(1, Math.round((w - pad) / (cw + gx)));
  const stepx = cols > 1 ? (w - pad * 2 - cw) / (cols - 1) : 0;
  let ri = 0;
  for (let y = top + 12; y < SKY_BOTTOM - 10; y += ch + gy) {
    for (let c = 0; c < cols; c++) {
      const on = ((c + 1) * 5 + (ri + 1) * 11 + Math.round(x)) % 7 === 0;
      out.push(
        <rect key={`w${x}-${y}-${c}`} x={x + pad + c * stepx} y={y} width={cw} height={ch} rx="1"
          fill={`rgb(var(--c) / ${on ? tone + 0.26 : tone + 0.07})`} />
      );
    }
    ri++;
  }
  return out;
}

export type RoofKind = "flat" | "antenna" | "tank" | "setback" | "spire" | "pitch";

/** A detailed building silhouette with a varied rooftop and windows. */
export function Building({ x, w, top, tone, roof = "flat" }:
  { x: number; w: number; top: number; tone: number; roof?: RoofKind }) {
  const cx = x + w / 2;
  const acc = tone + 0.05;
  return (
    <g>
      {roof === "pitch" && <path d={`M${x - 5} ${top} L${cx} ${top - 24} L${x + w + 5} ${top} Z`} fill={`rgb(var(--c) / ${acc})`} />}
      {roof === "setback" && <rect x={x + w * 0.22} y={top - 20} width={w * 0.56} height={20} rx="1.5" fill={`rgb(var(--c) / ${acc})`} />}
      {roof === "spire" && <path d={`M${cx - 5} ${top} L${cx} ${top - 40} L${cx + 5} ${top} Z`} fill={`rgb(var(--c) / ${acc})`} />}
      <rect x={x} y={top} width={w} height={SKY_BOTTOM - top} rx="1.5" fill={`rgb(var(--c) / ${tone})`} />
      <rect x={x} y={top} width={w} height="3.5" fill={`rgb(var(--c) / ${acc})`} />
      {roof === "antenna" && (
        <g stroke={`rgb(var(--c) / ${acc + 0.06})`} strokeWidth="2" fill="none" strokeLinecap="round">
          <line x1={cx} y1={top} x2={cx} y2={top - 30} />
          <line x1={cx - 7} y1={top - 22} x2={cx + 7} y2={top - 22} />
          <line x1={cx - 4} y1={top - 30} x2={cx + 4} y2={top - 30} />
        </g>
      )}
      {roof === "tank" && (
        <g fill={`rgb(var(--c) / ${acc})`}>
          <rect x={x + w - 30} y={top - 17} width="22" height="15" rx="2" />
          <rect x={x + w - 27} y={top - 2} width="3" height="6" />
          <rect x={x + w - 12} y={top - 2} width="3" height="6" />
        </g>
      )}
      {tone >= 0.09 && windowsFor(x, top, w, tone)}
    </g>
  );
}

const ROOFS: RoofKind[] = ["antenna", "flat", "tank", "setback", "flat", "spire", "tank", "flat"];

export function BackRow() {
  return (<g>{Array.from({ length: 30 }, (_, i) => {
    const x = i * 50 - 6, w = 34 + ((i * 13) % 26), top = 168 + ((i * 37) % 54);
    return <Building key={`bk${i}`} x={x} w={w} top={top} tone={0.05} roof={i % 4 === 0 ? "antenna" : "flat"} />;
  })}</g>);
}

export function MidRow() {
  return (<g>{Array.from({ length: 19 }, (_, i) => {
    const x = i * 78 + 4, w = 48 + ((i * 17) % 30), top = 128 + ((i * 47) % 70);
    return <Building key={`md${i}`} x={x} w={w} top={top} tone={0.085} roof={ROOFS[i % ROOFS.length]} />;
  })}</g>);
}

export function Lamp({ x }: { x: number }) {
  const c = "rgb(var(--c) / 0.24)";
  return (
    <g>
      <rect x={x} y={264} width="3" height={SKY_BOTTOM - 264} fill={c} />
      <path d={`M${x + 1.5} 266 q12 -3 13 9`} fill="none" stroke={c} strokeWidth="2.5" />
      <circle cx={x + 14.5} cy="277" r="4.5" fill="rgb(var(--c) / 0.4)" />
      <circle cx={x + 14.5} cy="277" r="9" fill="rgb(var(--c) / 0.1)" />
    </g>
  );
}

export function Tree({ x, s = 1 }: { x: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${SKY_BOTTOM}) scale(${s})`}>
      <rect x="-3" y="-32" width="6" height="32" fill="rgb(var(--c) / 0.16)" />
      <circle cx="0" cy="-42" r="16" fill="rgb(var(--c) / 0.13)" />
      <circle cx="-12" cy="-33" r="12" fill="rgb(var(--c) / 0.13)" />
      <circle cx="12" cy="-33" r="12" fill="rgb(var(--c) / 0.13)" />
      <circle cx="0" cy="-28" r="13" fill="rgb(var(--c) / 0.13)" />
    </g>
  );
}

export function Atmosphere() {
  return (
    <g>
      <circle cx="1214" cy="80" r="24" fill="rgb(var(--c) / 0.12)" />
      <circle cx="1214" cy="80" r="24" fill="none" stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" />
      <circle cx="1206" cy="72" r="5" fill="rgb(var(--c) / 0.05)" />
      <circle cx="1223" cy="87" r="3.5" fill="rgb(var(--c) / 0.05)" />
      {[[70,62],[150,44],[250,74],[980,56],[1050,40],[1110,70],[1300,50],[1360,78],[1400,44]].map(([sx, sy], i) => (
        <circle key={`st${i}`} cx={sx} cy={sy} r={i % 3 === 0 ? 2 : 1.4} fill="rgb(var(--c) / 0.3)" />
      ))}
      {[[250,92,1],[1000,78,0.8]].map(([cx, cy, s], i) => (
        <g key={`cl${i}`} transform={`translate(${cx} ${cy}) scale(${s})`} fill="rgb(var(--c) / 0.06)">
          <ellipse cx="0" cy="0" rx="34" ry="14" /><ellipse cx="28" cy="5" rx="24" ry="12" /><ellipse cx="-26" cy="5" rx="20" ry="11" />
        </g>
      ))}
      {[[360,96],[392,106],[424,90]].map(([bx, by], i) => (
        <path key={`bd${i}`} d={`M${bx} ${by} q7 -7 14 0 q7 -7 14 0`} fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="2" strokeLinecap="round" />
      ))}
    </g>
  );
}

export function Foreground() {
  return (
    <g>
      <Tree x={40} s={1.1} /><Tree x={316} s={0.9} /><Tree x={1126} s={0.95} /><Tree x={1404} s={1.1} />
      <Lamp x={104} /><Lamp x={286} /><Lamp x={1168} /><Lamp x={1356} />
    </g>
  );
}

/** Themed scene that rises from the bottom of its (relative, overflow-hidden) parent. */
export function Scenery({ accent, landmark, sceneKey, show = true }:
  { accent: string; landmark: ReactNode; sceneKey?: string; show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={sceneKey ?? "scene"}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
          style={{
            ["--c" as string]: accent,
            maskImage: "linear-gradient(to top, #000 82%, transparent)",
            WebkitMaskImage: "linear-gradient(to top, #000 82%, transparent)",
          }}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax meet" className="w-full" role="presentation">
            <Atmosphere /><BackRow /><MidRow />{landmark}<Foreground />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
