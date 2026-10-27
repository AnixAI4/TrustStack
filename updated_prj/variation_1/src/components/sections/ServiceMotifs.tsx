"use client";
import type { ReactNode } from "react";

/**
 * Per-service NON-architectural motif for the ServiceScenery pop.
 * Rules: hero prop in the LEFT gutter (x ≈ 120-330), a DIFFERENT secondary prop
 * in the RIGHT gutter (x ≈ 1100-1330), plus one sky/foreground accent. No
 * buildings / rooftops / windows. Everything themed via rgb(var(--c) / a).
 * Deterministic only (Math.sin/cos allowed, no Math.random).
 */
export function serviceMotif(name: string): ReactNode {
  switch (name) {
    case "DPDP Ignite™": return igniteMotif();
    case "DPDP Compass™": return compassMotif();
    case "DPDP Build™": return buildMotif();
    case "AI Privacy Shield™": return shieldMotif();
    case "DPDP TrustOps™": return trustOpsMotif();
    case "TrustDeck™": return platformMotif();
    case "CDPP Certification™": return certMotif();
    default: return null;
  }
}

/* ── DPDP Ignite™ (accent orange) - "Daybreak / the spark" ─────────────────── */
function igniteMotif(): ReactNode {
  return (
    <g>
      {/* left: sunrise disc + guide rays */}
      <circle cx="220" cy="252" r="46" fill="rgb(var(--c) / 0.16)" />
      <circle cx="220" cy="252" r="46" fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
      <g stroke="rgb(var(--c) / 0.22)" strokeWidth="2.5" strokeLinecap="round">
        {[-72, -54, -36, -18, 18, 36, 54, 72].map((a) => {
          const r = (a * Math.PI) / 180;
          return <line key={a} x1={220 + Math.sin(r) * 54} y1={252 - Math.cos(r) * 54} x2={220 + Math.sin(r) * 74} y2={252 - Math.cos(r) * 74} />;
        })}
      </g>
      {/* torch on a plinth + flame + embers */}
      <rect x="150" y="252" width="16" height="48" fill="rgb(var(--c) / 0.2)" />
      <rect x="143" y="246" width="30" height="9" rx="2" fill="rgb(var(--c) / 0.24)" />
      <path d="M158 246 q-9 -17 0 -28 q9 11 0 28 Z" fill="rgb(var(--c) / 0.3)" />
      <g fill="rgb(var(--c) / 0.26)"><circle cx="162" cy="200" r="2" /><circle cx="151" cy="180" r="1.6" /><circle cx="169" cy="168" r="1.4" /></g>
      {/* right: workshop crowd facing the light */}
      <g fill="rgb(var(--c) / 0.24)">
        <circle cx="1250" cy="270" r="7" /><rect x="1244" y="278" width="12" height="22" rx="4" />
        <circle cx="1272" cy="272" r="6.5" /><rect x="1266" y="280" width="12" height="20" rx="4" />
        <circle cx="1294" cy="270" r="7" /><rect x="1288" y="278" width="12" height="22" rx="4" />
        <circle cx="1316" cy="273" r="6" /><rect x="1310" y="281" width="11" height="19" rx="4" />
      </g>
      {/* idea bulb over the crowd */}
      <circle cx="1283" cy="150" r="12" fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.26)" strokeWidth="1.5" />
      <rect x="1279" y="162" width="8" height="6" rx="1.5" fill="rgb(var(--c) / 0.24)" />
      <g stroke="rgb(var(--c) / 0.24)" strokeWidth="2" strokeLinecap="round">
        <line x1="1283" y1="126" x2="1283" y2="118" /><line x1="1266" y1="150" x2="1258" y2="150" /><line x1="1300" y1="150" x2="1308" y2="150" />
      </g>
    </g>
  );
}

/* ── DPDP Compass™ (gold) - "Finding your bearings" ────────────────────────── */
function compassMotif(): ReactNode {
  return (
    <g>
      {/* left: compass rose on the ground */}
      <g transform="translate(220 250)">
        <circle r="46" fill="rgb(var(--c) / 0.10)" stroke="rgb(var(--c) / 0.22)" strokeWidth="1.5" />
        <circle r="30" fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="1" />
        {[0, 90, 180, 270].map((a) => { const r = (a * Math.PI) / 180; return <line key={a} x1={Math.sin(r) * 46} y1={-Math.cos(r) * 46} x2={Math.sin(r) * 38} y2={-Math.cos(r) * 38} stroke="rgb(var(--c) / 0.24)" strokeWidth="2" />; })}
        <path d="M0 -34 L8 0 L0 8 L-8 0 Z" fill="rgb(var(--c) / 0.3)" />
        <path d="M0 34 L8 0 L-8 0 Z" fill="rgb(var(--c) / 0.16)" />
        <circle r="3.5" fill="rgb(var(--c) / 0.34)" />
      </g>
      {/* signpost */}
      <rect x="150" y="214" width="4" height="86" fill="rgb(var(--c) / 0.22)" />
      <path d="M150 224 h40 l8 8 l-8 8 h-40 Z" fill="rgb(var(--c) / 0.2)" />
      <path d="M154 244 h34 l8 8 l-8 8 h-34 Z" fill="rgb(var(--c) / 0.16)" />
      {/* right: dotted route climbing to a summit flag */}
      <path d="M1150 292 Q1210 250 1250 258 T1330 196" fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
      <g fill="rgb(var(--c) / 0.26)"><circle cx="1150" cy="292" r="3.5" /><circle cx="1250" cy="258" r="3.5" /></g>
      <path d="M1300 220 L1330 196 L1360 220 Z" fill="rgb(var(--c) / 0.16)" />
      <rect x="1329" y="168" width="2.5" height="30" fill="rgb(var(--c) / 0.24)" />
      <path d="M1331 170 l20 6 l-20 6 Z" fill="rgb(var(--c) / 0.26)" />
      {/* pole-star reticle */}
      <g transform="translate(1150 96)">
        <path d="M0 -12 L2.5 -2.5 L12 0 L2.5 2.5 L0 12 L-2.5 2.5 L-12 0 L-2.5 -2.5 Z" fill="rgb(var(--c) / 0.28)" />
        <circle r="20" fill="none" stroke="rgb(var(--c) / 0.14)" strokeWidth="1" strokeDasharray="2 6" />
      </g>
    </g>
  );
}

/* ── DPDP Build™ (blue) - assembling the framework, NOT a house ─────────────── */
function buildMotif(): ReactNode {
  return (
    <g>
      {/* left: keystone arch of blocks mid-assembly (a bridge span) */}
      <g fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => { const a = (-90 + i * 30) * Math.PI / 180; const cx = 220 + Math.cos(a) * 70; const cy = 284 + Math.sin(a) * 70; return <rect key={i} x={cx - 10} y={cy - 10} width="20" height="20" rx="2" transform={`rotate(${i * 30 - 90} ${cx} ${cy})`} />; })}
      </g>
      {/* meshing gears */}
      <g fill="none" stroke="rgb(var(--c) / 0.26)" strokeWidth="3">
        <circle cx="150" cy="250" r="16" /><circle cx="150" cy="250" r="5" />
        <circle cx="182" cy="270" r="11" />
      </g>
      {/* right: blueprint scroll + crane hook lowering a keystone */}
      <rect x="1150" y="238" width="120" height="62" rx="3" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
      <g stroke="rgb(var(--c) / 0.2)" strokeWidth="1">{[250, 262, 274, 286].map((y) => <line key={y} x1="1150" y1={y} x2="1270" y2={y} />)}{[1180, 1210, 1240].map((x) => <line key={x} x1={x} y1="238" x2={x} y2="300" />)}</g>
      <line x1="1330" y1="110" x2="1330" y2="180" stroke="rgb(var(--c) / 0.24)" strokeWidth="2" />
      <path d="M1322 182 q8 10 16 0 Z" fill="rgb(var(--c) / 0.22)" />
      <path d="M1318 200 l12 -8 l12 8 v14 q0 12 -12 18 q-12 -6 -12 -18 Z" fill="rgb(var(--c) / 0.2)" />
      {/* sky accent: a plotting spark above the build */}
      <g fill="rgb(var(--c) / 0.26)"><circle cx="300" cy="104" r="2.4" /><circle cx="326" cy="120" r="1.7" /></g>
    </g>
  );
}

/* ── AI Privacy Shield™ (brand/indigo) - a shield made of a neural graph ─────── */
function shieldMotif(): ReactNode {
  return (
    <g>
      {/* left: neural shield */}
      <path d="M170 196 l50 -16 l50 16 v34 q0 40 -50 62 q-50 -22 -50 -62 Z" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
      <g fill="rgb(var(--c) / 0.34)">{[[196, 214], [244, 214], [220, 238], [188, 258], [252, 258], [220, 278]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.5" />)}</g>
      <g stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" fill="none"><path d="M196 214 L220 238 L244 214 M188 258 L220 238 L252 258 M220 238 L220 278" /></g>
      <path d="M206 240 l9 9 l18 -20" fill="none" stroke="rgb(var(--c) / 0.4)" strokeWidth="3" strokeLinecap="round" />
      {/* right: orbiting core under a dome */}
      <circle cx="1250" cy="250" r="8" fill="rgb(var(--c) / 0.3)" />
      <g fill="none" stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5"><ellipse cx="1250" cy="250" rx="46" ry="20" /><ellipse cx="1250" cy="250" rx="46" ry="20" transform="rotate(60 1250 250)" /></g>
      <g fill="rgb(var(--c) / 0.34)"><circle cx="1296" cy="250" r="3" /><circle cx="1226" cy="233" r="2.6" /></g>
      <path d="M1198 250 a52 52 0 0 1 104 0" fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="2" strokeDasharray="3 7" />
      {/* sky accent: a guardian star above the dome */}
      <g fill="rgb(var(--c) / 0.26)"><circle cx="1150" cy="102" r="2.4" /><circle cx="1178" cy="90" r="1.7" /></g>
    </g>
  );
}

/* ── DPDP TrustOps™ (green) - always-on watch, a radar mast ─────────────────── */
function trustOpsMotif(): ReactNode {
  return (
    <g>
      {/* left: radar mast + dish + sweep rings */}
      <path d="M206 300 L220 214 L234 300" fill="none" stroke="rgb(var(--c) / 0.22)" strokeWidth="3" />
      <line x1="212" y1="258" x2="228" y2="258" stroke="rgb(var(--c) / 0.2)" strokeWidth="2" />
      <ellipse cx="220" cy="206" rx="18" ry="9" transform="rotate(-24 220 206)" fill="rgb(var(--c) / 0.2)" stroke="rgb(var(--c) / 0.26)" strokeWidth="1.5" />
      <g fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="1.5"><path d="M150 214 a70 70 0 0 1 140 0" /><path d="M170 214 a50 50 0 0 1 100 0" /></g>
      {/* right: monitoring console + heartbeat */}
      <rect x="1150" y="240" width="150" height="46" rx="4" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
      <path d="M1160 264 h26 l6 -14 l8 26 l6 -12 h40 l6 -8 l6 8 h26" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* satellite on an orbit (sky accent) */}
      <g transform="translate(1120 110)"><rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="rgb(var(--c) / 0.28)" /><rect x="-16" y="-3" width="9" height="6" fill="rgb(var(--c) / 0.2)" /><rect x="7" y="-3" width="9" height="6" fill="rgb(var(--c) / 0.2)" /></g>
      <path d="M1070 120 a60 24 0 0 1 120 0" fill="none" stroke="rgb(var(--c) / 0.14)" strokeWidth="1.5" strokeDasharray="3 7" />
    </g>
  );
}

/* ── TrustDeck™ (amber) - the stack ──────────────────────────────── */
function platformMotif(): ReactNode {
  return (
    <g>
      {/* left: layered stack */}
      <g>{[0, 1, 2, 3].map((i) => { const y = 250 - i * 26; return <g key={i}><path d={`M180 ${y} l40 -18 l40 18 l-40 18 Z`} fill={`rgb(var(--c) / ${0.12 + i * 0.04})`} stroke="rgb(var(--c) / 0.22)" strokeWidth="1" /><circle cx="220" cy={y} r="2.6" fill="rgb(var(--c) / 0.34)" /></g>; })}</g>
      <line x1="220" y1="176" x2="220" y2="250" stroke="rgb(var(--c) / 0.16)" strokeWidth="1" strokeDasharray="2 6" />
      {/* right: dashboard panel */}
      <rect x="1150" y="228" width="150" height="66" rx="5" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
      <g fill="rgb(var(--c) / 0.28)"><rect x="1162" y="270" width="14" height="16" /><rect x="1184" y="260" width="14" height="26" /><rect x="1206" y="266" width="14" height="20" /></g>
      <path d="M1232 262 l14 10 l12 -16 l14 8" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* module constellation (sky accent) */}
      <g fill="rgb(var(--c) / 0.28)"><circle cx="1120" cy="112" r="3" /><circle cx="1156" cy="96" r="2.6" /><circle cx="1180" cy="120" r="2.6" /></g>
      <path d="M1120 112 L1156 96 L1180 120" fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="1" />
    </g>
  );
}

/* ── CDPP Certification™ (red) - the award ─────────────────────────────────── */
function certMotif(): ReactNode {
  return (
    <g>
      {/* left: laurel wreath + rosette medal + ribbon tails */}
      <g fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="3" strokeLinecap="round">
        <path d="M184 292 q-26 -30 -14 -70" /><path d="M256 292 q26 -30 14 -70" />
      </g>
      <g fill="rgb(var(--c) / 0.2)">{[218, 236, 250, 238, 222].map((y, i) => <ellipse key={`l${i}`} cx={176 - i * 2} cy={y} rx="7" ry="3.5" transform={`rotate(${-50 + i * 8} ${176} ${y})`} />)}</g>
      <circle cx="220" cy="236" r="22" fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.3)" strokeWidth="1.5" />
      <path d="M220 224 l3.5 7 8 .6 -6 5.4 2 8 -7.5 -4.4 -7.5 4.4 2 -8 -6 -5.4 8 -.6 Z" fill="rgb(var(--c) / 0.4)" />
      <path d="M210 256 l-6 26 l16 -10 l16 10 l-6 -26 Z" fill="rgb(var(--c) / 0.2)" />
      {/* right: summit flag */}
      <path d="M1300 236 L1330 200 L1360 236 Z" fill="rgb(var(--c) / 0.16)" />
      <rect x="1329" y="168" width="2.5" height="34" fill="rgb(var(--c) / 0.24)" />
      <path d="M1331 170 l22 7 l-22 7 Z" fill="rgb(var(--c) / 0.3)" />
      {/* rising achievement stars (sky accent) */}
      <g fill="rgb(var(--c) / 0.28)"><circle cx="1180" cy="120" r="2.4" /><circle cx="1210" cy="98" r="2" /><circle cx="1150" cy="104" r="1.8" /></g>
    </g>
  );
}
