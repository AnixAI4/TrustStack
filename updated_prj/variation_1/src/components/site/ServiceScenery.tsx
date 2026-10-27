"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

const FLOOR = 300;

/** Smooth, deterministic rolling-hill silhouette. NO Math.random (SSR-safe);
 *  Math.sin is deterministic so server & client render identical paths. */
function ridgePath(baseY: number, amp: number, seed: number, step = 70): string {
  const pts: [number, number][] = [];
  for (let x = 0; x <= 1440; x += step) {
    const y =
      baseY -
      amp *
        (0.5 + 0.5 * Math.sin((x + seed) / 165)) *
        (0.72 + 0.28 * Math.sin((x + seed) / 43));
    pts.push([x, +y.toFixed(1)]);
  }
  let d = `M0 ${FLOOR} L0 ${pts[0][1]}`;
  for (const [x, y] of pts) d += ` L${x} ${y}`;
  return d + ` L1440 ${FLOOR} Z`;
}

/** Three layered ridgelines - the building-free backdrop (far → near). */
export function HillRange(): ReactNode {
  return (
    <g>
      <path d={ridgePath(150, 34, 0)} fill="rgb(var(--c) / 0.05)" />
      <path d={ridgePath(196, 44, 900)} fill="rgb(var(--c) / 0.08)" />
      <path d={ridgePath(240, 34, 420, 60)} fill="rgb(var(--c) / 0.12)" />
    </g>
  );
}

const STARS: [number, number][] = [
  [70, 60], [150, 42], [250, 72], [92, 96], [980, 54], [1050, 38],
  [1110, 68], [1300, 48], [1360, 76], [1400, 42], [560, 40], [680, 66],
];

/** Sky: a deterministic starfield + soft aurora ribbons (no moon/sun disc here - *  the per-service motif owns any hero light source in its own gutter). */
export function SkyField(): ReactNode {
  return (
    <g>
      {STARS.map(([x, y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={i % 3 === 0 ? 2 : 1.4} fill="rgb(var(--c) / 0.3)" />
      ))}
      <path d="M0 66 C 320 30, 760 96, 1440 48" fill="none" stroke="rgb(var(--c) / 0.08)" strokeWidth="10" strokeLinecap="round" />
      <path d="M0 92 C 420 60, 900 120, 1440 78" fill="none" stroke="rgb(var(--c) / 0.05)" strokeWidth="14" strokeLinecap="round" />
    </g>
  );
}

/** The "river of data" - a soft ribbon across the base with a dotted current.
 *  The unifying motif: personal data flowing through every service. */
export function DataRiver(): ReactNode {
  return (
    <g>
      <path d="M0 274 C 360 260, 1080 288, 1440 268 L1440 300 L0 300 Z" fill="rgb(var(--c) / 0.07)" />
      <path d="M0 274 C 360 260, 1080 288, 1440 268" fill="none" stroke="rgb(var(--c) / 0.18)" strokeWidth="1.5" strokeDasharray="2 11" strokeLinecap="round" />
      <path d="M0 282 C 380 270, 1060 296, 1440 278" fill="none" stroke="rgb(var(--c) / 0.10)" strokeWidth="1" strokeDasharray="2 14" strokeLinecap="round" />
    </g>
  );
}

/** Blade-of-grass reed cluster (organic foreground). */
export function Reed({ x, s = 1 }: { x: number; s?: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${FLOOR}) scale(${s})`} stroke="rgb(var(--c) / 0.16)" strokeWidth="2.5" fill="none" strokeLinecap="round">
      <path d="M0 0 q-6 -20 -2 -34" /><path d="M4 0 q2 -22 10 -32" /><path d="M-4 0 q-2 -18 -10 -26" />
    </g>
  );
}

/** A wayfinding beacon - a slim staff with a glowing guide-light (a journey marker,
 *  NOT a street-lamp on a building). */
export function Beacon({ x }: { x: number }): ReactNode {
  return (
    <g>
      <rect x={x} y={252} width="3" height={FLOOR - 252} fill="rgb(var(--c) / 0.22)" />
      <circle cx={x + 1.5} cy="250" r="5" fill="rgb(var(--c) / 0.4)" />
      <circle cx={x + 1.5} cy="250" r="11" fill="rgb(var(--c) / 0.1)" />
    </g>
  );
}

export function ServiceForeground(): ReactNode {
  return (
    <g>
      <Reed x={44} s={1.1} /><Reed x={300} s={0.9} /><Reed x={1140} s={0.95} /><Reed x={1408} s={1.1} />
      <Beacon x={104} /><Beacon x={1330} />
    </g>
  );
}

/** Themed, BUILDING-FREE scene that rises from the bottom of its (relative,
 *  overflow-hidden) parent. Same mechanics as Industry/Course Scenery; different world. */
export function ServiceScenery({ accent, landmark, sceneKey, show = true }:
  { accent: string; landmark: ReactNode; sceneKey?: string; show?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={sceneKey ?? "svc-scene"}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
          style={{
            ["--c" as string]: accent,
            maskImage: "linear-gradient(to top, #000 82%, transparent)",
            WebkitMaskImage: "linear-gradient(to top, #000 82%, transparent)",
          }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 80 }}
          transition={{ duration: reduce ? 0.35 : 0.8, ease: EASE }}
        >
          <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax meet" className="w-full" role="presentation">
            <SkyField /><HillRange />{landmark}<DataRiver /><ServiceForeground />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
