"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * "Sector Risk Radar" - an on-theme, animated visual for the industries page.
 * A radar scope that scans the sector's real personal-data categories as
 * pinging blips, with a rotating sweep, a risk-severity arc tinted by the
 * sector's risk level, and the sector icon glowing at the hub. Reads as
 * "scanning this sector's DPDP risk". Pure SVG + framer-motion (no 3D).
 */

const RISK: Record<string, { color: string; sev: number }> = {
  "Highest risk": { color: "var(--red)", sev: 0.94 },
  Critical: { color: "var(--red)", sev: 0.97 },
  High: { color: "var(--amber)", sev: 0.74 },
  Strategic: { color: "var(--blue)", sev: 0.62 },
};

const C = 120;
const R = 104;

export function SectorRadar({ icon: Icon, data, risk }: { icon: LucideIcon; data: string[]; risk: string }) {
  const reduce = useReducedMotion();
  const { color, sev } = RISK[risk] ?? { color: "var(--accent)", sev: 0.7 };
  const n = Math.min(data.length, 6) || 1;
  const blips = data.slice(0, n).map((label, i) => {
    const ang = ((i * 360) / n - 90 + 24) * (Math.PI / 180);
    const rad = 40 + (i % 3) * 24;
    return { x: C + rad * Math.cos(ang), y: C + rad * Math.sin(ang), delay: (i * 0.35) % 2, label };
  });
  const circ = 2 * Math.PI * R;
  const tx = C + R * Math.cos((48 * Math.PI) / 180);
  const ty = C + R * Math.sin((48 * Math.PI) / 180);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[236px]">
      <style>{`
.sr-sweep{transform-box:view-box;transform-origin:120px 120px;animation:sr-rot 4.6s linear infinite}
@keyframes sr-rot{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.sr-sweep{animation:none}}
`}</style>
      <svg viewBox="0 0 240 240" fill="none" className="h-full w-full">
        {/* concentric rings */}
        {[36, 60, 84, R].map((r) => (
          <circle key={r} cx={C} cy={C} r={r} stroke="var(--line)" strokeWidth="1" opacity="0.5" />
        ))}
        {/* crosshair grid */}
        <g stroke="var(--line)" strokeWidth="1" opacity="0.4">
          <line x1={C - R} y1={C} x2={C + R} y2={C} />
          <line x1={C} y1={C - R} x2={C} y2={C + R} />
          <line x1={C - 74} y1={C - 74} x2={C + 74} y2={C + 74} />
          <line x1={C - 74} y1={C + 74} x2={C + 74} y2={C - 74} />
        </g>
        {/* tick marks around the rim */}
        <g stroke="var(--line)" strokeWidth="1.4" opacity="0.5">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            const r1 = R - (i % 2 === 0 ? 6 : 3);
            return (
              <line key={i} x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)} x2={C + R * Math.cos(a)} y2={C + R * Math.sin(a)} />
            );
          })}
        </g>
        {/* risk-severity arc */}
        <motion.circle
          cx={C}
          cy={C}
          r={R}
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={circ}
          transform={`rotate(-90 ${C} ${C})`}
          initial={reduce ? false : { strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - sev) }}
          transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
        />
        {/* rotating sweep */}
        <g className="sr-sweep">
          <defs>
            <linearGradient id="sr-grad" gradientUnits="userSpaceOnUse" x1={C + R} y1={C} x2={tx} y2={ty}>
              <stop offset="0" stopColor={color} stopOpacity="0.45" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M${C} ${C} L${C + R} ${C} A${R} ${R} 0 0 1 ${tx} ${ty} Z`} fill="url(#sr-grad)" />
          <line x1={C} y1={C} x2={C + R} y2={C} stroke={color} strokeWidth="1.8" opacity="0.9" />
        </g>
        {/* scanned data blips */}
        {blips.map((b, i) => (
          <g key={i}>
            {!reduce && (
              <motion.circle
                cx={b.x}
                cy={b.y}
                fill="none"
                stroke={color}
                strokeWidth="1.2"
                initial={{ opacity: 0 }}
                animate={{ r: [4, 14], opacity: [0.55, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: b.delay, ease: "easeOut" }}
              />
            )}
            <motion.circle
              cx={b.x}
              cy={b.y}
              r="3.2"
              fill={color}
              animate={reduce ? {} : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: b.delay }}
            />
          </g>
        ))}
      </svg>
      {/* center hub */}
      <div className={cn("absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg-2/85 text-accent shadow-card")}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
