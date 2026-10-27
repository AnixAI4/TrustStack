# Master Prompt - Build illustrated, per-persona twilight scenery for the DPDP Courses section

> Paste everything from **§0** onward to a coding agent working in this repo. It embeds
> the entire, verified scenery engine (so the agent doesn't need to open any reference
> file), two complete worked landmark examples, drop-in motif snippets for the rest, the
> integration steps for server components, the hard rules, and a verification checklist.

---

## 0) Mission & definition of done
The `/courses` index and `/courses/[slug]` detail pages are visually dry. Add
**decorative, per-persona illustrated SVG scenery** that rises from the bottom of a
section - identical in style, quality and mechanics to the scenery already shipped in
`src/components/sections/IndustryAdvisor.tsx`. Each of the six courses gets its **own
scene + accent colour**. The scenery must never intercept input, never affect
readability, and re-theme entirely by flipping one CSS variable.

**DONE only when:** all six `/courses/<slug>` pages show a distinct, layered, atmospheric
scene (depth layers + varied rooftops + lit windows + moon/stars/clouds/birds +
foreground trees & glowing lamps + a persona landmark & motif), themed to the course
colour, `tsc --noEmit` passes, and the existing Industry Advisor scenes are unchanged.

**Anti-goal:** flat tinted rectangles / a "bar chart" skyline. If it looks like bars, it is wrong.

## 1) The six courses (exact data - do not invent)
| slug | persona | title | accent CSS var |
|---|---|---|---|
| `citizens` | For citizens & families | Know Your Rights | `var(--green-rgb)` |
| `founders` | For founders & SMEs | DPDP for Startups | `var(--accent-rgb)` |
| `practitioner` | For DPOs & privacy leads | The Practitioner Track | `var(--gold-rgb)` |
| `legal` | For legal, risk & compliance | Law & Enforcement | `var(--blue-rgb)` |
| `engineering` | For engineering & security | Privacy Engineering | `var(--brand-rgb)` |
| `students` | For students & aspirants | Foundations & Exam Prep | `var(--amber-rgb)` |

Accent vars already exist in `src/app/globals.css`: `--blue-rgb --green-rgb --amber-rgb
--brand-rgb --accent-rgb --red-rgb --gold-rgb`. Every fill in the scene is
`rgb(var(--c) / <alpha>)`, so setting `--c` once recolours the whole scene.

## 2) Step 1 - Create the shared scenery engine (client module)
Create `src/components/site/Scenery.tsx` with `"use client"` at the top. Paste these
primitives **verbatim** (they are the exact, verified engine) and `export` `Scenery`,
`Building`, `windowsFor`, `BackRow`, `MidRow`, `Atmosphere`, `Foreground`, `Tree`, `Lamp`:

```tsx
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
```

Then **refactor `IndustryAdvisor.tsx`** to import these primitives from `Scenery`
instead of its local copies, and render its per-sector landmark via
`<Scenery accent={accent} landmark={sectorFront(sector.name)} sceneKey={sector.name} />`.
Delete the now-duplicated local primitives from `IndustryAdvisor.tsx`.
**Verify the six industry scenes look identical afterwards.** (If unsure, keep the
industry file as-is and duplicate the primitives into the courses module - shared is
preferred but not mandatory.)

## 3) Step 2 - Course scenery component
Create `src/components/courses/CourseScenery.tsx` (`"use client"`):

```tsx
"use client";
import type { ReactNode } from "react";
import { Scenery, Building, windowsFor } from "@/components/site/Scenery";

const COURSE_ACCENT: Record<string, string> = {
  citizens: "var(--green-rgb)", founders: "var(--accent-rgb)", practitioner: "var(--gold-rgb)",
  legal: "var(--blue-rgb)", engineering: "var(--brand-rgb)", students: "var(--amber-rgb)",
};

export function CourseScenery({ slug }: { slug: string }) {
  return <Scenery accent={COURSE_ACCENT[slug] ?? "var(--accent-rgb)"} landmark={courseLandmark(slug)} sceneKey={slug} />;
}

function courseLandmark(slug: string): ReactNode {
  switch (slug) {
    case "citizens": return citizensLandmark();
    case "founders": return foundersLandmark();
    case "practitioner": return practitionerLandmark();
    case "legal": return legalLandmark();
    case "engineering": return engineeringLandmark();
    case "students": return studentsLandmark();
    default: return null;
  }
}
```

## 4) Step 3 - Landmark rules + two full worked examples
**Rules for every landmark `<g>`:** bottom-anchor at `y=300`; put the hero prop in the
**left gutter (x ≈ 120-330)** and a **different** secondary prop in the **right gutter
(x ≈ 1100-1330)** - never mirror; add exactly one **persona sky/foreground motif**; use
`Building` for generic flank towers and `windowsFor(x, top, w, tone)` for lit windows on
custom shapes. Opacity language: bodies `0.11-0.15`, roof accents `+0.05`, windows
`~0.13` (lit `+0.24`), emblems/details `0.20-0.28`, glow `0.4`.

**Example A - `citizens` (green, cosy neighbourhood):**
```tsx
function citizensLandmark() {
  return (
    <g>
      {/* left: two houses with pitched roofs + chimney + a small school */}
      <rect x="130" y="230" width="86" height="70" fill="rgb(var(--c) / 0.15)" />
      <path d="M120 230 L173 198 L226 230 Z" fill="rgb(var(--c) / 0.2)" />
      <rect x="198" y="202" width="10" height="18" fill="rgb(var(--c) / 0.2)" />
      <rect x="150" y="252" width="20" height="48" fill="rgb(var(--c) / 0.22)" />
      {windowsFor(180, 238, 34, 0.13)}
      <rect x="236" y="246" width="72" height="54" fill="rgb(var(--c) / 0.13)" />
      <path d="M228 246 L272 220 L316 246 Z" fill="rgb(var(--c) / 0.18)" />
      <Building x={54} w={46} top={196} tone={0.14} roof="pitch" />
      <rect x="75" y="156" width="2" height="24" fill="rgb(var(--c) / 0.24)" />
      <path d="M77 158 L95 164 L77 170 Z" fill="rgb(var(--c) / 0.24)" />
      {/* right: community hall + a family silhouette (motif) */}
      <Building x={1150} w={96} top={214} tone={0.15} roof="flat" />
      <path d="M1150 214 L1198 192 L1246 214 Z" fill="rgb(var(--c) / 0.2)" />
      <g fill="rgb(var(--c) / 0.26)">
        <circle cx="1300" cy="268" r="7" /><rect x="1294" y="276" width="12" height="24" rx="4" />
        <circle cx="1320" cy="270" r="6.5" /><rect x="1314" y="278" width="12" height="22" rx="4" />
        <circle cx="1336" cy="282" r="5" /><rect x="1332" y="288" width="9" height="12" rx="3" />
      </g>
      {/* kite */}
      <path d="M1084 118 l10 -8 l10 8 l-10 10 Z" fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
      <path d="M1094 128 q4 8 -2 16" fill="none" stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" />
    </g>
  );
}
```

**Example B - `legal` (blue, law district):**
```tsx
function legalLandmark() {
  return (
    <g>
      {/* left: courthouse - columns + pediment + steps + scales of justice */}
      <rect x="120" y="214" width="188" height="86" fill="rgb(var(--c) / 0.15)" />
      <rect x="106" y="288" width="216" height="12" fill="rgb(var(--c) / 0.13)" />
      <g fill="rgb(var(--c) / 0.2)">
        {[140, 166, 192, 218, 244, 270].map((c) => <rect key={c} x={c} y="222" width="11" height="62" />)}
      </g>
      <path d="M110 214 L214 168 L318 214 Z" fill="rgb(var(--c) / 0.2)" />
      <g stroke="rgb(var(--c) / 0.28)" strokeWidth="2">
        <line x1="214" y1="150" x2="214" y2="176" /><line x1="190" y1="156" x2="238" y2="156" />
        <path d="M190 156 l-8 12 h16 Z" fill="rgb(var(--c) / 0.2)" /><path d="M238 156 l-8 12 h16 Z" fill="rgb(var(--c) / 0.2)" />
      </g>
      <Building x={40} w={44} top={158} tone={0.14} roof="antenna" />
      {/* right: law library + a gavel (motif) */}
      <Building x={1150} w={100} top={188} tone={0.15} roof="setback" />
      <g stroke="rgb(var(--c) / 0.26)" strokeWidth="3" fill="rgb(var(--c) / 0.2)" strokeLinecap="round">
        <rect x="1288" y="248" width="26" height="12" rx="3" transform="rotate(-28 1301 254)" />
        <line x1="1300" y1="260" x2="1322" y2="284" /><rect x="1286" y="286" width="46" height="8" rx="3" />
      </g>
    </g>
  );
}
```

## 5) Signature-motif snippets for the remaining four
Build each landmark like the examples (left hero + right secondary + flank `Building`s),
then drop in the matching motif:

**`founders` (orange)** - startup loft + coffee cart (left), co-working block (right);
replace the sky spot with a **rocket + trail**:
```tsx
<g fill="rgb(var(--c) / 0.2)">
  <path d="M1206 58 q10 -22 20 0 q0 18 -10 26 q-10 -8 -10 -26 Z" />
  <circle cx="1216" cy="76" r="4" fill="rgb(var(--c) / 0.3)" />
  <path d="M1206 90 l6 -6 l4 10 Z" /><path d="M1226 90 l-6 -6 l-4 10 Z" />
</g>
<path d="M1216 98 q-6 30 -18 58" stroke="rgb(var(--c) / 0.14)" strokeWidth="6" fill="none" strokeLinecap="round" />
```

**`practitioner` (gold)** - compliance HQ + clock tower (left), audit office + checklist
billboard (right); **shield emblem**:
```tsx
<path d="M168 206 l24 -8 l24 8 v20 q0 20 -24 30 q-24 -10 -24 -30 Z" fill="rgb(var(--c) / 0.2)" />
<path d="M180 224 l8 8 l16 -16" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="3" strokeLinecap="round" />
```

**`engineering` (indigo)** - data-centre + server racks + status lights (left),
circuit-board-facade block (right); **`</>` billboard + rooftop satellite dish + node links**:
```tsx
<g fill="none" stroke="rgb(var(--c) / 0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
  <path d="M172 150 l-10 8 l10 8" /><path d="M204 150 l10 8 l-10 8" />
</g>
<g stroke="rgb(var(--c) / 0.24)" strokeWidth="2" fill="rgb(var(--c) / 0.2)">
  <ellipse cx="1214" cy="150" rx="16" ry="9" transform="rotate(-28 1214 150)" />
  <line x1="1214" y1="150" x2="1214" y2="168" /><circle cx="1204" cy="143" r="2.5" />
</g>
```

**`students` (amber)** - **domed** library + bell/clock tower (left), dorm + **stack of
books** (right); **graduation cap on a plinth**:
```tsx
<path d="M150 200 A36 36 0 0 1 222 200 Z" fill="rgb(var(--c) / 0.2)" />
<g fill="rgb(var(--c) / 0.18)">
  <rect x="1280" y="272" width="46" height="10" /><rect x="1284" y="260" width="40" height="10" /><rect x="1278" y="248" width="48" height="10" />
</g>
<g fill="rgb(var(--c) / 0.22)">
  <path d="M1150 232 L1188 220 L1226 232 L1188 244 Z" /><circle cx="1188" cy="262" r="4" />
</g>
<path d="M1188 244 L1188 260" stroke="rgb(var(--c) / 0.24)" strokeWidth="3" fill="none" />
```

## 6) Step 4 - Mount on the (server-component) course pages
`src/app/courses/[slug]/page.tsx` and `src/app/courses/page.tsx` are **server**
components; `CourseScenery` is a client component and imports fine into them.

In `[slug]/page.tsx`, wrap a **tall** section (the hero region, the outcomes grid, or
curriculum) so the scene has a stage:
```tsx
import { CourseScenery } from "@/components/courses/CourseScenery";
// ...
<section className="section relative overflow-hidden">
  <CourseScenery slug={course.slug} />
  <div className="container-x relative z-10">
    {/* existing section content unchanged */}
  </div>
</section>
```
Rules: the staging `<section>` must be `relative overflow-hidden`; **all** its content
goes in a `relative z-10` wrapper; pick a section tall enough that the skyline reads in
the left/right gutters at desktop width. On the `/courses` index, this is optional - if
used, put ONE scene behind the hero (`relative z-10` content), never behind the card grid.

## 7) NON-NEGOTIABLE rules (hard-won)
1. Every scene needs ≥3 tonal layers, ≥4 rooftop styles, scattered lit windows, sky
   (moon/stars/clouds/birds), and foreground (trees + glowing lamps). No flat blocks.
2. Left gutter ≠ right gutter. Never mirror one cluster to both.
3. **No `Math.random()`** in SVG - deterministic only (hydration safety), like `windowsFor`.
4. Scene wrapper is `aria-hidden` + `pointer-events-none` + `z-0`; content is `z-10`.
5. Theme only via `--c`; all fills `rgb(var(--c) / a)`; never hard-code hex.
6. Use plain `<AnimatePresence>` (crossfade) - never `mode="wait"` (stalls in
   backgrounded tabs and blocks the next scene from mounting).
7. Keep the mask `linear-gradient(to top, #000 82%, transparent)`.
8. `viewBox="0 0 1440 300"`, `preserveAspectRatio="xMidYMax meet"`, `className="w-full"`,
   landmarks bottom-anchored at `y=300`.

## 8) VERIFY before declaring done
1. `npx tsc --noEmit` → exit 0; no problems on edited files.
2. If HMR looks stale: kill the `variation 1` `next` node procs → delete `.next` →
   `npm run dev` → wait for `Ready`. The integrated browser caches dev chunks by stable
   URL, so **hard-refresh (`Ctrl+Shift+R`)** / clear browser cache before judging.
3. At 1440-wide, normal reading mode (`localStorage['dpdp-reading']='normal'`), open each
   `/courses/<slug>`, scroll to the staged section, and confirm: rises from the bottom,
   sits in both gutters, re-themes to the course colour, correct landmark + motif.
   Screenshot to confirm (occluded-tab a11y snapshots can mislabel as "Loading").
4. Industry Advisor scenes unchanged after the Step 1 extraction.
5. No new horizontal page overflow (scene stays inside the `overflow-hidden` section).

## 9) One-line task
> Extract the scenery engine from `IndustryAdvisor.tsx` into
> `src/components/site/Scenery.tsx`, refactor Industries to consume it (unchanged), then
> add `src/components/courses/CourseScenery.tsx` (slug→accent map + a distinct
> `courseLandmark` per persona per §3-§5) and mount `<CourseScenery slug={course.slug} />`
> in a `relative overflow-hidden` section (content `relative z-10`) on
> `courses/[slug]/page.tsx`, obeying §7 and passing §8.
