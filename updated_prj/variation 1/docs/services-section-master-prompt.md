# Master Prompt - Turn the vague `/solutions` Services grid into a guided, illustrated Service Explorer (with a NON‑building scenery pop)

> Paste everything from **§0** onward to a coding agent working in this repo. It is
> self‑contained: it embeds the full (verified) scenery mechanics, a brand‑new
> **non‑building** scenery engine you can paste verbatim, two complete worked scenes,
> motif snippets for the rest, the `SERVICE_DETAIL` content model + one fully worked
> entry, the interactive `ServiceExplorer` spec, the mount steps, easy‑read + a11y
> obligations, the hard rules, and a verification checklist.
>
> **Why we're doing this:** the Industry Advisor on `/industries`
> (`src/components/sections/IndustryAdvisor.tsx`) is loved - you pick a sector, a
> themed illustrated **scene rises from the bottom**, and a rich in‑panel **briefing**
> explains *why it matters for you*. The `/solutions` Services section is the opposite:
> a flat grid of seven cards (`src/components/sections/ServicesSection.tsx`) that reads
> as vague marketing. Nobody understands what each service *actually is*, who it's for,
> or what changes after. We fix that by (A) adding a deep **"extra information"** layer
> per service and (B) giving each service its own **scene**, exactly like the industry
> pop - but the artwork must **NOT be buildings** (see §2).

---

## 0) Mission & definition of done

Ship **two** things on `/solutions`:

**(A) A Service Explorer with an "extra information" briefing.** A select‑then‑reveal
experience (same feel as the Industry Advisor): the visitor taps one of the seven
services and gets a concrete, plain‑English briefing - *what it is, who it's for, the
problem it removes, what you get, a real day‑in‑the‑life scenario, the outcome,* and
*what it pairs with*. This is the "extra information section" that kills the vagueness.

**(B) A per‑service illustrated scene that rises from the bottom** of that section - the
industry "background pop", re‑skinned per service and **re‑themed** by flipping one CSS
variable. **The artwork is explicitly NOT a cityscape** - no `Building`, no rooftops, no
skyline. It is an organic *dawn‑horizon journey landscape* (hills, a "river of data",
sky, guiding beacons) with a distinct **non‑architectural motif** per service (§2, §4).

**DONE only when:**

1. On `/solutions`, tapping each of the 7 services reveals its briefing **and** raises a
   distinct, themed, layered scene from the bottom - hills, sky, a data‑river, foreground,
   and a per‑service motif - re‑themed to that service's accent.
2. **No scene contains a building/skyline** - if it looks like the industries city, it's wrong.
3. Easy‑read still works on the page (new strings mapped - §8), reduced‑motion respected.
4. `npx tsc --noEmit` passes; the Industry Advisor and its `Scenery` are **untouched**.
5. No new horizontal page overflow; scenery never intercepts input.

**Anti‑goal:** copy/pasting the `Scenery` cityscape and just recolouring it. The whole
point is a *different, building‑free* visual world for services.

---

## 1) The seven services (exact data - do not invent)

Names, tags and subtitles come from `SERVICES` in `src/content/dpdp.ts` - use them
**verbatim** (including the ™). Accent vars already exist in `src/app/globals.css`
(`--accent-rgb --amber-rgb --brand-rgb --green-rgb --blue-rgb --red-rgb --gold-rgb`).
The scene metaphor for each is the ideation you must build (§2/§4).

| # | `SERVICES[].name` | tag | subtitle | accent var | scene metaphor (NON‑building) |
| --- | --- | --- | --- | --- | --- |
| 1 | `DPDP Ignite™` | Entry point | Executive Awareness Workshop | `var(--accent-rgb)` | **Daybreak / the spark** - sunrise cresting a hill, a lit torch, a workshop crowd looking to the light, an idea‑bulb |
| 2 | `DPDP Compass™` | Most popular | Readiness Assessment | `var(--gold-rgb)` | **Finding your bearings** - a ground compass rose, a signpost, a dotted route climbing to a summit flag, the pole star |
| 3 | `DPDP Build™` | Full stack | Implementation Accelerator | `var(--blue-rgb)` | **Assembling the framework** - a glowing keystone **arch** of blocks mid‑assembly, meshing gears, a blueprint scroll, a crane‑hook of light (NOT a house) |
| 4 | `AI Privacy Shield™` | AI‑powered | GenAI & AI Governance | `var(--brand-rgb)` | **Guarded intelligence** - a **shield drawn from a neural node‑graph**, orbiting particles under a dashed protective dome |
| 5 | `DPDP TrustOps™` | Ongoing | Managed Compliance Office | `var(--green-rgb)` | **Always‑on watch** - a **radar/observation mast** with a rotating dish + concentric sweep rings, a monitoring console with an uptime heartbeat, an orbiting satellite |
| 6 | `TrustStack Platform™` | SaaS platform | Privacy Operations SaaS | `var(--amber-rgb)` | **The stack** - a floating tower of translucent **layered tiles** with node links, a floating dashboard panel, orbiting module chips |
| 7 | `CDPP Certification™` | India first | Certified DPDP Professional | `var(--red-rgb)` | **The award** - a **laurel wreath** around a rosette medal with ribbon tails, a summit flag, rising achievement stars |

> The seven services map 1:1 onto the seven accent vars - an elegant, non‑repeating
> palette. Only **one** scene is ever visible at a time (select→reveal), so warm‑adjacent
> hues (accent/amber/gold) never clash on screen.

---

## 2) The concept & why NOT buildings (the ideation - read this before drawing)

The industry scenes are **cities** because sectors are *places of work*. **Services are a
journey**, not a place: you go from *not knowing* → *knowing where you stand* → *building*
→ *governing AI* → *running it* → *a platform* → *a credential*. So the services world is a
**landscape you travel through at dawn**, not a skyline you look at.

**The shared, building‑free backdrop (same for every service, re‑themed by `--c`):**

- **Rolling hills** - three layered ridgelines (far/mid/near) replace the building rows.
- **Sky** - a deterministic starfield, soft aurora ribbons, and a low guide‑glow.
- **A "river of data"** - a gentle ribbon along the base with a *dotted current*. This is
  the through‑line: personal data flows through every service. It also visually unifies the
  set so it reads as one family, the way the city skyline unified the sectors.
- **Organic foreground** - reed/grass tufts and slim **wayfinding beacons** (a glowing
  buoy‑light on a staff - a marker on the journey, explicitly *not* a street‑lamp on a building).

**On top of that backdrop, each service gets ONE hero motif (left gutter) + ONE different
secondary prop (right gutter) + one sky/foreground accent** - all **non‑architectural**
(compass rose, torch, gears, neural shield, radar dish, layered stack, laurel wreath…). The
per‑service metaphors are in the §1 table and detailed in §4.

**Hard "no‑buildings" rule:** do **not** import or use `Building`, `BackRow`, `MidRow`,
`windowsFor`, rooftops, or anything that reads as architecture. If a motif needs a vertical
element (mast, signpost, beacon, flagpole) keep it a *thin pole with a device on top*, never
a windowed block.

---

## 3) Step 1 - Create the NON‑building scenery engine (paste verbatim)

Create `src/components/site/ServiceScenery.tsx` with `"use client"`. This reuses the exact
*mechanics* of the proven `Scenery` (bottom‑anchored `motion.div`, rise‑up transition, top
mask, `viewBox 0 0 1440 300`, `rgb(var(--c) / a)` theming, deterministic - **no
`Math.random`**; `Math.sin/cos` are fine, they're identical on server & client), but every
layer is organic. Paste this whole file:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
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
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax meet" className="w-full" role="presentation">
            <SkyField /><HillRange />{landmark}<DataRiver /><ServiceForeground />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 4) Step 2 - Per‑service motifs (rules + two full worked scenes + 5 snippets)

Create the scene dispatcher `src/components/sections/ServiceMotifs.tsx` (`"use client"`).
It exports `serviceMotif(name: string): ReactNode` - a `switch` on the exact
`SERVICES[].name`. **Rules for every motif `<g>`:**

- Bottom‑anchor within `y ≤ 300`; hero prop in the **left gutter (x ≈ 120-330)**, a
  **different** secondary prop in the **right gutter (x ≈ 1100-1330)** - never mirror.
- Add exactly one sky/foreground accent (a star, embers, an orbiting dot…).
- Opacity language (match the engine): faint fills `0.10-0.16`, solid emblems
  `0.20-0.30`, glints/glow `0.34-0.42`, hairline strokes `~0.24`.
- **No buildings, no `windowsFor`, no rooftops.** Poles are thin staffs with a device on top.
- Everything is `rgb(var(--c) / a)` - never a hard‑coded hex.

```tsx
"use client";
import type { ReactNode } from "react";

export function serviceMotif(name: string): ReactNode {
  switch (name) {
    case "DPDP Ignite™": return igniteMotif();
    case "DPDP Compass™": return compassMotif();
    case "DPDP Build™": return buildMotif();
    case "AI Privacy Shield™": return shieldMotif();
    case "DPDP TrustOps™": return trustOpsMotif();
    case "TrustStack Platform™": return platformMotif();
    case "CDPP Certification™": return certMotif();
    default: return null;
  }
}
```

### Worked scene A - `DPDP Ignite™` (accent orange) - "Daybreak / the spark"

Left: a **sunrise** cresting the near hill with radiating rays + a **torch** on a plinth
with a flame and rising embers. Right: a small **workshop crowd** facing the light + a
floating **idea‑bulb**.

```tsx
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
```

### Worked scene B - `DPDP Compass™` (gold) - "Finding your bearings"

Left: a ground **compass rose** (rings + N/E/S/W ticks + needle) + a **signpost**. Right: a
**dotted route** climbing to a **flag on a survey peak**. Sky: the **pole star** reticle.

```tsx
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
```

### Snippets for the remaining five

Build each like A/B (left hero + right secondary + one sky accent), then drop in the motif.

**`DPDP Build™` (blue) - the framework, NOT a house.** Left: a **keystone arch** of glowing
blocks mid‑assembly + two meshing **gears**. Right: a **blueprint scroll** with a set‑square +
a **crane hook of light** lowering a shield keystone.

```tsx
{/* left: arch of blocks (a bridge span) */}
<g fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1">
  {[0,1,2,3,4,5,6].map((i)=>{const a=(-90+i*30)*Math.PI/180;const cx=220+Math.cos(a)*70;const cy=284+Math.sin(a)*70;return <rect key={i} x={cx-10} y={cy-10} width="20" height="20" rx="2" transform={`rotate(${i*30-90} ${cx} ${cy})`} />;})}
</g>
{/* meshing gears */}
<g fill="none" stroke="rgb(var(--c) / 0.26)" strokeWidth="3">
  <circle cx="150" cy="250" r="16" /><circle cx="150" cy="250" r="5" />
  <circle cx="182" cy="270" r="11" />
</g>
{/* right: blueprint scroll + crane hook lowering a keystone */}
<rect x="1150" y="238" width="120" height="62" rx="3" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
<g stroke="rgb(var(--c) / 0.2)" strokeWidth="1">{[250,262,274,286].map((y)=><line key={y} x1="1150" y1={y} x2="1270" y2={y} />)}{[1180,1210,1240].map((x)=><line key={x} x1={x} y1="238" x2={x} y2="300" />)}</g>
<line x1="1330" y1="110" x2="1330" y2="180" stroke="rgb(var(--c) / 0.24)" strokeWidth="2" />
<path d="M1322 182 q8 10 16 0 Z" fill="rgb(var(--c) / 0.22)" />
<path d="M1318 200 l12 -8 l12 8 v14 q0 12 -12 18 q-12 -6 -12 -18 Z" fill="rgb(var(--c) / 0.2)" />
```

**`AI Privacy Shield™` (indigo/brand) - a shield made of a neural graph.** Left: nodes +
edges arranged inside a **shield outline**, a check at its heart. Right: a **core with
orbiting particles** under a **dashed protective dome**.

```tsx
{/* left: neural shield */}
<path d="M170 196 l50 -16 l50 16 v34 q0 40 -50 62 q-50 -22 -50 -62 Z" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
<g fill="rgb(var(--c) / 0.34)">{[[196,214],[244,214],[220,238],[188,258],[252,258],[220,278]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="3.5" />)}</g>
<g stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" fill="none"><path d="M196 214 L220 238 L244 214 M188 258 L220 238 L252 258 M220 238 L220 278" /></g>
<path d="M206 240 l9 9 l18 -20" fill="none" stroke="rgb(var(--c) / 0.4)" strokeWidth="3" strokeLinecap="round" />
{/* right: orbiting core under a dome */}
<circle cx="1250" cy="250" r="8" fill="rgb(var(--c) / 0.3)" />
<g fill="none" stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5"><ellipse cx="1250" cy="250" rx="46" ry="20" /><ellipse cx="1250" cy="250" rx="46" ry="20" transform="rotate(60 1250 250)" /></g>
<g fill="rgb(var(--c) / 0.34)"><circle cx="1296" cy="250" r="3" /><circle cx="1226" cy="233" r="2.6" /></g>
<path d="M1198 250 a52 52 0 0 1 104 0" fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="2" strokeDasharray="3 7" />
```

**`DPDP TrustOps™` (green) - always‑on watch, a radar mast (not a building).** Left: a slim
**tripod mast** + a **rotating dish** + concentric **sweep rings**. Right: a **monitoring
**console** with an **uptime heartbeat**. Sky: a **satellite** on a dashed orbit.

```tsx
{/* left: radar mast + dish + sweep rings */}
<path d="M206 300 L220 214 L234 300" fill="none" stroke="rgb(var(--c) / 0.22)" strokeWidth="3" />
<line x1="212" y1="258" x2="228" y2="258" stroke="rgb(var(--c) / 0.2)" strokeWidth="2" />
<ellipse cx="220" cy="206" rx="18" ry="9" transform="rotate(-24 220 206)" fill="rgb(var(--c) / 0.2)" stroke="rgb(var(--c) / 0.26)" strokeWidth="1.5" />
<g fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="1.5"><path d="M150 214 a70 70 0 0 1 140 0" /><path d="M170 214 a50 50 0 0 1 100 0" /></g>
{/* right: monitoring console + heartbeat */}
<rect x="1150" y="240" width="150" height="46" rx="4" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
<path d="M1160 264 h26 l6 -14 l8 26 l6 -12 h40 l6 -8 l6 8 h26" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
{/* satellite on an orbit */}
<g transform="translate(1120 110)"><rect x="-5" y="-4" width="10" height="8" rx="1.5" fill="rgb(var(--c) / 0.28)" /><rect x="-16" y="-3" width="9" height="6" fill="rgb(var(--c) / 0.2)" /><rect x="7" y="-3" width="9" height="6" fill="rgb(var(--c) / 0.2)" /></g>
<path d="M1070 120 a60 24 0 0 1 120 0" fill="none" stroke="rgb(var(--c) / 0.14)" strokeWidth="1.5" strokeDasharray="3 7" />
```

**`TrustStack Platform™` (amber) - the stack.** Left: a floating tower of **layered tiles**
(parallelograms) with node dots + connecting lines. Right: a floating **dashboard panel**
(bars + sparkline). Sky: a small **constellation of module dots**.

```tsx
{/* left: layered stack */}
<g>{[0,1,2,3].map((i)=>{const y=250-i*26;return <g key={i}><path d={`M180 ${y} l40 -18 l40 18 l-40 18 Z`} fill={`rgb(var(--c) / ${0.12+i*0.04})`} stroke="rgb(var(--c) / 0.22)" strokeWidth="1" /><circle cx="220" cy={y} r="2.6" fill="rgb(var(--c) / 0.34)" /></g>;})}</g>
<line x1="220" y1="176" x2="220" y2="250" stroke="rgb(var(--c) / 0.16)" strokeWidth="1" strokeDasharray="2 6" />
{/* right: dashboard panel */}
<rect x="1150" y="228" width="150" height="66" rx="5" fill="rgb(var(--c) / 0.12)" stroke="rgb(var(--c) / 0.2)" strokeWidth="1" />
<g fill="rgb(var(--c) / 0.28)"><rect x="1162" y="270" width="14" height="16" /><rect x="1184" y="260" width="14" height="26" /><rect x="1206" y="266" width="14" height="20" /></g>
<path d="M1232 262 l14 10 l12 -16 l14 8" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
{/* module constellation */}
<g fill="rgb(var(--c) / 0.28)"><circle cx="1120" cy="112" r="3" /><circle cx="1156" cy="96" r="2.6" /><circle cx="1180" cy="120" r="2.6" /></g>
<path d="M1120 112 L1156 96 L1180 120" fill="none" stroke="rgb(var(--c) / 0.16)" strokeWidth="1" />
```

**`CDPP Certification™` (red) - the award.** Left: a **laurel wreath** around a **rosette
medal** with ribbon tails. Right: a **summit flag** on a small peak. Sky: rising
**achievement stars**.

```tsx
{/* left: laurel wreath + medal */}
<g fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="3" strokeLinecap="round">
  <path d="M184 292 q-26 -30 -14 -70" /><path d="M256 292 q26 -30 14 -70" />
</g>
<g fill="rgb(var(--c) / 0.2)">{[218,236,250,238,222].map((y,i)=><ellipse key={`l${i}`} cx={176-i*2} cy={y} rx="7" ry="3.5" transform={`rotate(${-50+i*8} ${176} ${y})`} />)}</g>
<circle cx="220" cy="236" r="22" fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.3)" strokeWidth="1.5" />
<path d="M220 224 l3.5 7 8 .6 -6 5.4 2 8 -7.5 -4.4 -7.5 4.4 2 -8 -6 -5.4 8 -.6 Z" fill="rgb(var(--c) / 0.4)" />
<path d="M210 256 l-6 26 l16 -10 l16 10 l-6 -26 Z" fill="rgb(var(--c) / 0.2)" />
{/* right: summit flag */}
<path d="M1300 236 L1330 200 L1360 236 Z" fill="rgb(var(--c) / 0.16)" />
<rect x="1329" y="168" width="2.5" height="34" fill="rgb(var(--c) / 0.24)" />
<path d="M1331 170 l22 7 l-22 7 Z" fill="rgb(var(--c) / 0.3)" />
{/* rising achievement stars */}
<g fill="rgb(var(--c) / 0.28)"><circle cx="1180" cy="120" r="2.4" /><circle cx="1210" cy="98" r="2" /><circle cx="1150" cy="104" r="1.8" /></g>
```

---

## 5) Step 3 - The "extra information" content model (`SERVICE_DETAIL`)

Create `src/content/service-detail.ts`. This is the deep, *accurate* copy that removes the
vagueness (accurate to the DPDP Act 2023 + DPDP Rules 2025). Also export a `SERVICE_ACCENT`
map (mirrors `SECTOR_ACCENT`) so the explorer and scenery share one source of truth.

```ts
export const SERVICE_ACCENT: Record<string, string> = {
  "DPDP Ignite™": "var(--accent-rgb)",
  "DPDP Compass™": "var(--gold-rgb)",
  "DPDP Build™": "var(--blue-rgb)",
  "AI Privacy Shield™": "var(--brand-rgb)",
  "DPDP TrustOps™": "var(--green-rgb)",
  "TrustStack Platform™": "var(--amber-rgb)",
  "CDPP Certification™": "var(--red-rgb)",
};

/** Where each service sits on the compliance journey (for the ribbon/label). */
export type ServiceStage = "Learn" | "Assess" | "Implement" | "Govern" | "Operate" | "Certify";

export type ServiceDetail = {
  stage: ServiceStage;
  /** Punchy headline stat for the briefing header (like the sector briefing). */
  stat: { value: string; label: string };
  /** One plain-English sentence: what this actually is. */
  oneLiner: string;
  /** Who it's genuinely for (rendered as chips). */
  bestFor: string[];
  /** The concrete pain it removes (2 sentences). */
  problem: string;
  /** What you walk away with - outcomes, not features (can extend SERVICES[].points). */
  youGet: string[];
  /** A plausible, specific day-in-the-life story (rendered italic, like the sector scenario). */
  scenario: string;
  /** The after-state - what's different once it's done. */
  outcome: string;
  /** Rough effort/duration. */
  timeline: string;
  /** Other SERVICES[].name this combines with (rendered as links). */
  pairsWith: string[];
};

/** Keyed by the EXACT SERVICES[].name. */
export const SERVICE_DETAIL: Record<string, ServiceDetail> = {
  // ---- FULLY WORKED EXAMPLE - replicate this shape & quality for all seven ----
  "DPDP Compass™": {
    stage: "Assess",
    stat: { value: "2 weeks", label: "Kickoff to board-ready report" },
    oneLiner:
      "A structured two-week assessment that tells you exactly where you stand against the DPDP Act 2023 and Rules 2025 - and what to fix first.",
    bestFor: [
      "Boards & CXOs who need a clear risk picture",
      "DPOs building the business case",
      "Teams that started but aren't sure it's enough",
    ],
    problem:
      "Most teams can't answer the first question a regulator or enterprise client asks: 'where does personal data live, and can you prove consent for it?' Without a baseline, every rupee of later spend is a guess.",
    youGet: [
      "DPDP applicability review - is the Act triggering on you, and where",
      "A personal-data inventory snapshot across your key systems",
      "Notice & consent gap review against DPDP Rules 2025",
      "AI / GenAI privacy risk assessment",
      "A DPDP Maturity Scorecard + a prioritised 90-day roadmap",
    ],
    scenario:
      "A 400-person fintech thought it was 'mostly compliant'. Compass found KYC data flowing into three analytics tools with no consent basis and no retention limit - exactly the exposure a ₹250cr penalty is written for. They fixed it before a bank partner's audit, not after.",
    outcome:
      "You leave with a board-ready scorecard, a ranked list of gaps, and a 90-day plan - so spend is targeted, not scattered.",
    timeline: "≈ 2 weeks",
    pairsWith: ["DPDP Ignite™", "DPDP Build™"],
  },

  // ---- SEEDS - expand each to the full ServiceDetail shape, DPDP-accurate ----
  // "DPDP Ignite™": stage "Learn"; stat e.g. { value: "Half-day", label: "Board + leadership aligned" };
  //   oneLiner: a focused executive workshop that turns "DPDP is Legal's problem" into board-level urgency;
  //   problem: leaders under-rate director personal liability under the Act; bestFor: boards/CXOs/legal/IT/HR/AI leads;
  //   scenario: a board that green-lit the programme only after seeing the personal-liability slide; pairsWith Compass.
  // "DPDP Build™": stage "Implement"; stat { value: "End-to-end", label: "Act 2023 + Rules 2025 coverage" };
  //   oneLiner: full implementation from data inventory to a 72-hour breach playbook; bestFor orgs post-assessment;
  //   youGet: inventory & purpose mapping, notice redesign (22 languages), consent workflows, DP-rights process, breach playbook.
  // "AI Privacy Shield™": stage "Govern"; stat { value: "AI-first", label: "GenAI governance, not an afterthought" };
  //   oneLiner: DPDP governance for GenAI/RAG/agents; problem: right-to-erasure vs models that memorise training data;
  //   youGet: GenAI risk assessment, prompt-leakage checks, RAG personal-data review, AI vendor governance, unlearning advisory.
  // "DPDP TrustOps™": stage "Operate"; stat { value: "Monthly", label: "Your outsourced privacy office" };
  //   oneLiner: an ongoing managed DPO/Responsible-Person function; youGet: grievance workflow, quarterly vendor reviews, board dashboard.
  // "TrustStack Platform™": stage "Operate"; stat { value: "12 modules", label: "Real-time compliance in one place" };
  //   oneLiner: a SaaS control-plane (RoPA, consent register, rights tracker, 72-hr breach countdown, board scorecard).
  // "CDPP Certification™": stage "Certify"; stat { value: "2-yr", label: "Employer-verifiable credential" };
  //   oneLiner: India's first employer-verifiable DPDP professional certification; youGet: 6-module curriculum,
  //   unique cert number, employer verification portal, LinkedIn badge, Hindi + English.
};
```

**Authoring bar (match the Industry Advisor's tone):** concrete, honest, sector‑savvy, no
fluff; keep numbers/statute refs (`Rule 10`, `72-hour`, `₹250cr`); write `youGet` as
outcomes; keep `scenario` a *specific* one‑incident story.

---

## 6) Step 4 - The interactive `ServiceExplorer` (select → reveal)

Create `src/components/sections/ServiceExplorer.tsx` (`"use client"`). Model it on the
**proven** `IndustryAdvisor` structure (themed panel + selector + reveal + `Scenery` pop),
simplified to a **direct pick → briefing** (services don't need a 4‑question funnel):

**State & theming:**

- `const [pick, setPick] = useState<string | null>(null)` (the chosen `SERVICES[].name`).
- `const accent = pick ? SERVICE_ACCENT[pick] : "var(--accent-rgb)"`; set `--c` on the
  `<section>` and pass `accent` to `ServiceScenery`.

**Layout (top → bottom):**

1. `<section id={id} className="section scroll-mt-24 relative overflow-hidden">` with
   `style={{ ["--c"]: accent }}`. First child: the scenery pop - ```tsx
   <ServiceScenery accent={accent} landmark={pick ? serviceMotif(pick) : null} sceneKey={pick ?? undefined} show={!!pick} />
   ```

   All content in a `<div className="container-x relative z-10">`.
2. A `SectionHeader` (reuse `@/components/ui/SectionHeader`): eyebrow "The service stack",
   title "Not sure which service you need? Pick one and see exactly what it does.", lede
   inviting a tap. Provide `easy*` variants (see §8).
3. **The selector** - the 7 services as themed cards (like Industry Advisor's step‑0 sector
   grid: icon tile + name + subtitle + tag), each themed by `SERVICE_ACCENT[name]` via a
   local `--c`, hover lift, `onClick={() => setPick(name)}`, `aria-pressed`. Keep the
   featured (`DPDP Compass™`) visually primary. This grid *replaces the need to understand
   from a flat card* - it's the menu.
4. **The briefing** - when `pick`, render `<ServiceBriefing name={pick} />` in a themed card
   that mirrors `InChatResult` (distinct visual register: bordered, `rgb(var(--c)/…)` glow,
   radial backdrop). Sections, each with a mono uppercase eyebrow + an icon from `lucide-react`:
   - **Header**: stage pill ("Assess") + service name + subtitle, and a `stat` chip on the
     right (value in `font-display`, coloured `rgb(var(--c))`).
   - **What it is** - `oneLiner` (lead paragraph).
   - **Best for** - `bestFor[]` as pills.
   - **The problem it removes** - `problem` (icon `Scale` or `AlertTriangle`).
   - **What you get** - `youGet[]` as a checked list (`Check`, `text-green-soft`), or fall
     back to `SERVICES.find(s=>s.name===name)!.points` if a detail isn't authored yet.
   - **A real scenario** - `scenario` italic (icon `Sparkles`).
   - **The outcome** - `outcome` (icon `ListChecks`).
   - **Footer**: `Request a quote →` (`mailto:hello@dpdp.in?subject=Request a quote - ${name}`),
     plus a `Pairs well with` row where each `pairsWith` name is a button that calls
     `setPick(that)` - visitors hop across services and watch the scene re‑theme (the delightful bit).
   - A `Reset`/`Clear` control (like Industry Advisor's "Start over") sets `pick=null`.
5. Wrap the reveal in framer‑motion (`AnimatePresence`, opacity+`y` - **NOT** `mode="wait"`;
   see rules) keyed on `pick` so switching services crossfades the briefing while the scene
   crossfades underneath.

**Reuse, don't reinvent:** lift the exact class/inline‑style patterns from
`IndustryAdvisor.tsx` (themed panel border/shadow `boxShadow: "0 26px 70px -46px rgb(var(--c)/0.6)"`,
radial `--surface-2` backdrop, pill chips, section dividers `rgb(var(--c)/0.1)`). Icons per
service already live on `SERVICES[].icon` - use them in the selector tiles.

---

## 7) Step 5 - Mount on `/solutions`

`src/app/solutions/page.tsx` is a **server** component; `ServiceExplorer` is a client
component and imports fine. Add it as the primary "understand the services" experience,
**above** the existing grid (keep the grid as a scannable index, or drop it - your call, but
default to keeping it for at‑a‑glance scanning):

```tsx
import { ServiceExplorer } from "@/components/sections/ServiceExplorer";
// ...
<PageHero /* unchanged */ />
<EasyIntro /* unchanged */ />
<ServiceExplorer id="explore" />   {/* NEW - themed panel + scenery pop */}
<ServicesSection id="services" />  {/* keep as the quick index (optional) */}
<CtaBand />
```

Rules (identical to the industry section): the explorer `<section>` is
`relative overflow-hidden`; **all** its content sits in a `relative z-10` wrapper; the
scenery is `z-0`, `aria-hidden`, `pointer-events-none`. If you also want a resting scene
before any pick, set `show` true with a neutral `accent="var(--accent-rgb)"` and
`landmark={null}` - but the intended behaviour is **scene appears on first pick**.

---

## 8) Easy‑read + accessibility + reduced motion (do not skip)

- **Easy‑read:** the site has a full easy‑read engine (`html[data-reading="easy"]`). Any new
  **visible** heading/label/lede you hard‑code must have an easy variant, and the deep
  briefing prose must be covered. Two options, matching existing patterns:
  - For the `SectionHeader`/selector chrome, pass `easyEyebrow/easyTitle/easyLede` props (the
    component already supports them - see `IndustryAdvisor`).
  - For the briefing body strings, add `[normal, easy]` pairs to
    `src/content/easy/solutions.ts` and they'll be picked up by the runtime text engine
    (see `docs/easy-read-master-prompt.md`). Keep numbers/`Rule 10`/`₹250cr`/™ names intact;
    target ~8th‑grade reading level; stay faithful.
  - After wiring, verify per the easy‑read recipe (clear browser cache via CDP, set
    `localStorage['dpdp-reading']='easy'`, reload, assert easy strings present).
- **A11y:** selector buttons are real `<button>`s with `aria-pressed`; the scene is
  `aria-hidden`; keep focus states; the briefing is keyboard reachable in DOM order.
- **Reduced motion:** gate the rise/scene motion behind `prefers-reduced-motion`. Simplest:
  read it once (`const reduce = useReducedMotion()` from framer‑motion) and, when true, drop
  the `initial/animate/exit` offsets (render the scene statically, briefing without slide).

---

## 9) NON‑NEGOTIABLE rules (hard‑won)

1. **No buildings.** No `Building`/`BackRow`/`MidRow`/`windowsFor`/rooftops/skyline in any
   service scene. The world is hills + sky + data‑river + organic foreground + a
   non‑architectural motif. If it looks like the industries city, it's wrong.
2. Left gutter ≠ right gutter. Never mirror one cluster to both.
3. **No `Math.random()`** in SVG - deterministic only (`Math.sin/cos` are allowed and
   SSR‑safe), or hydration will mismatch.
4. Scene wrapper is `aria-hidden` + `pointer-events-none` + `z-0`; content is `relative z-10`.
5. Theme only via `--c`; every fill is `rgb(var(--c) / a)`; never hard‑code a hex.
6. Use plain `<AnimatePresence>` (crossfade). **Never `mode="wait"`** - it stalls in
   backgrounded tabs and blocks the next scene/briefing from mounting.
7. Keep the mask `linear-gradient(to top, #000 82%, transparent)`,
   `viewBox="0 0 1440 300"`, `preserveAspectRatio="xMidYMax meet"`, `className="w-full"`,
   motifs bottom‑anchored (`y ≤ 300`).
8. **Do not touch** `src/components/site/Scenery.tsx` or `IndustryAdvisor.tsx` - the industry
   pop must look identical afterwards. `ServiceScenery` is a separate, sibling engine.
9. Only one service scene is visible at a time; `sceneKey={pick}` drives the crossfade when
   switching services (including via `pairsWith`).

---

## 10) VERIFY before declaring done

1. `npx tsc --noEmit` (in `variation 1/`) → exit 0; no new problems on edited files.
2. Dev server: one detached `next dev` on `:3000` (kill any stray `next` node procs, delete
   `.next` if HMR is stale, restart ONE - see repo notes). The integrated browser caches dev
   chunks by URL, so hard‑refresh / clear cache before judging.
3. At **1440‑wide**, `localStorage['dpdp-reading']='normal'`, open `/solutions`, scroll to the
   explorer, then for **each of the 7 services**: tap it and confirm - (a) a distinct scene
   **rises from the bottom**, (b) it re‑themes to that service's accent, (c) it shows the
   correct non‑building motif in **both** gutters, (d) the briefing reveals the extra info,
   (e) `pairsWith` buttons switch service + crossfade the scene. Screenshot to confirm
   (occluded‑tab a11y snapshots can mislabel as "Loading").
4. **No building** appears in any service scene (visual check).
5. Easy‑read: toggle on → header, selector labels and briefing prose all change; toggle off
   restores. No `Math.random` hydration warnings in the console.
6. No new horizontal overflow (scene stays inside the `overflow-hidden` section); the
   Industry Advisor scenes on `/industries` are unchanged.

---

## 11) One‑line task

> Add `src/components/site/ServiceScenery.tsx` (a **building‑free** hills/sky/data‑river/
> beacon engine, §3), `src/components/sections/ServiceMotifs.tsx` (`serviceMotif(name)` - a
> distinct non‑architectural motif per service, §4), `src/content/service-detail.ts`
> (`SERVICE_ACCENT` + `SERVICE_DETAIL`, §5), and `src/components/sections/ServiceExplorer.tsx`
> (select→reveal briefing + `ServiceScenery` pop, modelled on `IndustryAdvisor`, §6); mount
> `<ServiceExplorer id="explore" />` on `/solutions` above the existing grid in a
> `relative overflow-hidden` section with `relative z-10` content (§7); cover easy‑read +
> reduced motion (§8); obey §9 and pass §10 - without touching `Scenery.tsx` or
> `IndustryAdvisor.tsx`.
