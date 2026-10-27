# Master Prompt v2 - Roll the animated "ignite" hero out across the site

> Paste everything from **§0** onward to a coding agent working in this repo. It is
> repo‑grounded: it points to the **authoritative reference implementation** already
> shipped on `/solutions`, embeds its critical mechanics, defines a client‑safe reusable
> API, the **anatomy** of the effect, a
> **reusable `ConstellationHero` blueprint**, a **per‑page rollout table** (each page gets
> its own word, its own REAL content nodes, and its own typed signature variant), the
> **integration recipe**, the **hard rules**, and a **repo‑tuned verification checklist**.
>
> **Why:** `/solutions` now has a premium hero the CEO signed off on - a single large
> word that sits in **solid theme ink at rest** (black in light theme) and, on **hover**
> of the hero, **ignites** into a
> flowing gradient while a soft **aura blooms from the back to the front** and a
> constellation of **themed tool nodes** (each in its own colour, connected by filaments)
> energises around it. We want *this style* on every **in-scope Tier 1 + Tier 2 page** - > but each page must carry **its own word, its own real content, and its own typed
> animation variant** (not a copy-paste of the services tools).
>
> [!IMPORTANT]
> **Implemented design overrides (11 July 2026; these supersede conflicting
> rollout lines below):**
>
> - `/framework` is intentionally excluded and retains its original `PageHero`.
> - The signed-off rounded service tiles and the two shell corner glows are
>   exclusive to `/solutions`. Other variants use non-tile desktop forms:
>   rings, diamonds, tool rails, scan markers, radar blips, legal tabs, seals,
>   topic markers, course tabs, or paper documents.
> - Desktop is the current visual priority. Non-Service stages are spacious
>   (`360px`; Templates `380px`), restrained legal stages are `300px`, and
>   non-Service focal words reach `text-8xl` at `lg`. The existing mobile pill
>   fallback remains functional, but further mobile polish is deferred.
> - `/templates` uses four real `TEMPLATE_FILTERS` categories from
>   `src/content/templates.ts` and a paper-sheet/document-stack composition.
> - `/industries` bypasses the constellation renderer. It is a model-only
>   desktop hero with six deterministic CSS miniatures: finance towers,
>   hospital campus, school campus, technology hub, commerce storefront and
>   civic complex. Models change every five seconds and are also manually
>   selectable. It uses no raster scene assets.
> - `/act` bypasses the constellation renderer. It is a theme-aware 3D legal
>   codex whose pages turn through all nine real `ACT_CHAPTERS`, with the actual
>   section range and manual chapter index. It has no ignite title, aura,
>   filaments or constellation nodes.
> - `/why-us` bypasses the constellation renderer. Six real `WHY_US` proof
>   plates physically assemble around one integration core, progressing
>   automatically or through manual proof controls.
> - `/tools` bypasses the constellation renderer. It is a two-mode physical
>   workbench: an animated Penalty/ROI/Breach calculator console and a document
>   press for the real Privacy Notice and Consent Form studio surfaces.
> - `/rights` bypasses the constellation renderer. It is a six-position rotary
>   Data Principal control dial using the exact Section 6 and 11-14 rights.
> - `/rules` bypasses the constellation renderer. It is a six-drawer operational
>   index machine with a physical 23-rule counter.
> - `/learn` bypasses the constellation renderer. Its six real rendered surfaces
>   form an ascending learning pathway with a moving progress marker.
> - `/certification` bypasses the constellation renderer. Eight real curriculum
>   modules feed a credential press and animated employer-verification seal.
> - `/cases` bypasses the constellation renderer. Four real case-law categories
>   load as dossiers onto an animated jurisprudence balance.
> - `/scanner` uses a browser-inspection gantry with a moving scan beam and six
>   real public-signal channels.
> - `/security` uses a layered defensive fortress with six posture-control
>   pylons around the hardened Section 8(5) core.
> - `/courses` uses a six-persona academy switchyard routing every learner track
>   into one DPDP curriculum core.
> - `/templates` uses a four-drawer document archive; the active real category
>   opens and raises a structured document sheet.
> - `/blog` uses a five-desk editorial press that typesets the active real topic
>   into a printed analysis sheet.
> - `/privacy`, `/terms` and `/cookies` remain quieter than marketing pages but
>   now use, respectively, a six-compartment notice vault, a six-clause contract
>   ledger and a four-channel consent console with Essential locked on.
> - `/privacy` uses the explicit focal title **Privacy Policy**.
> - The live reference mechanics now reside in `ConstellationHero.tsx` plus
>   `HERO_CONFIGS.solutions`; `SolutionsHero.tsx` is only a compatibility wrapper.

---

## 0) Mission & definition of done

Give every in-scope top-level page in §4 a hero built on the `/solutions` "ignite
constellation" pattern:
a centred, capitalised, gradient‑on‑hover **focal word** flanked by a small constellation
of **page‑specific, factually‑true nodes**, over the existing `PageHero` shell (divider,
blobs, tightened padding). Each page keeps the pattern's *mechanics* but supplies its own
*content and a signature variant*.

**DONE only when:**

1. A reusable **`ConstellationHero`** component exists (generalised from `SolutionsHero`),
   and every Tier 1 + Tier 2 route in §4 renders its hero through it (or a thin per-page
   wrapper).
   Its public props are **React Server Component safe**: plain strings, booleans and
   serializable objects only - no Lucide component functions, callbacks, JSX or ReactNode
   props crossing from a server `page.tsx` into the client hero.
2. On each page the focal word is **solid ink at rest** and **ignites to the gradient on
   hover / focus / tap**, reverting the same way on leave (the exact `/solutions` behaviour).
3. Every converted page's constellation nodes map to **real, true things on that page** - no invented stats, durations or outcomes (see hard rule §6.5). If a page has no natural
   set of nodes, it uses the restrained variant (word + aura only).
4. The pattern is preserved on the `<section>`: `page-hero relative overflow-hidden
   border-b border-line` + inner `container-x pt-10 pb-6 lg:pt-14 lg:pb-8` (so the
   hero→section rhythm fix and divider stay intact).
5. Easy‑read, reduced‑motion, keyboard access, SSR‑safety (no `Math.random`), both themes
   (dark + light) and mobile (no horizontal overflow) all hold on every converted page.
6. `npx tsc --noEmit` passes; **no** `next build` is run against a live `next dev`.

**Anti‑goals:** don't ship the *same* seven service tools on other pages; don't fabricate
node labels to fill space; don't turn legal/utility pages (`/privacy`, `/terms`,
`/cookies`) into loud marketing - use the **restrained variant** there; don't convert
dynamic/detail/utility routes outside the explicit tiers in §4.

---

## 1) The reference (already shipped on `/solutions` - do not regress it)

### 1.1 Component - `src/components/sections/SolutionsHero.tsx`

This file on disk is the **authoritative gold standard**. Read the complete current file
before editing; the snippets below intentionally show only the mechanics that must be
preserved and are **not** a complete copy of the component. (Rendered on `/solutions` via
`src/app/solutions/page.tsx`, which uses `<SolutionsHero />` in place of
`<PageHero .../>`.) If this document and the source differ, the source wins and this
document must be updated in the same change.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Compass, Hammer, BrainCircuit, Headset, LayoutGrid, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tool = { name: string; short: string; Icon: LucideIcon; rgb: string };

const TOOLS: Tool[] = [
  { name: "DPDP Ignite", short: "Ignite", Icon: Sparkles, rgb: "var(--accent-rgb)" },
  { name: "DPDP Compass", short: "Compass", Icon: Compass, rgb: "var(--gold-rgb)" },
  { name: "DPDP Build", short: "Build", Icon: Hammer, rgb: "var(--blue-rgb)" },
  { name: "AI Privacy Shield", short: "AI Shield", Icon: BrainCircuit, rgb: "var(--brand-rgb)" },
  { name: "DPDP TrustOps", short: "TrustOps", Icon: Headset, rgb: "var(--green-rgb)" },
  { name: "TrustStack Platform", short: "Platform", Icon: LayoutGrid, rgb: "var(--amber-rgb)" },
  { name: "CDPP Certification", short: "Certify", Icon: GraduationCap, rgb: "var(--red-rgb)" },
];

// Deterministic node positions relative to the centred word - 4 flank the right,
// 3 flank the left (spread on both sides). No random → SSR-safe.
const NODES = [
  { x: 205, y: -84 }, { x: 250, y: -30 }, { x: 250, y: 32 }, { x: 205, y: 86 },
  { x: -212, y: -62 }, { x: -252, y: 10 }, { x: -206, y: 80 },
].map((p) => ({ ...p, dist: Math.round(Math.hypot(p.x, p.y)), angle: (Math.atan2(p.y, p.x) * 180) / Math.PI }));
```

The rest of the file: a `hovered`/`pinned` → `open` state with a 140 ms close‑debounce
(so moving the pointer across the composition doesn't flicker), pointer handlers on the
**centred flex container** (so hovering anywhere in the hero ignites), `onFocus/onBlur` +
`onClick` + Enter/Space on the word (keyboard + tap), and an `OrbitStage` that renders the
aura, the focal glow, the filaments and the node chips. The word:

```tsx
<span
  role="button" tabIndex={0} aria-expanded={open} aria-label="Our services - reveal the stack"
  className={`services-title cursor-pointer rounded-lg text-6xl font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:text-7xl${open ? " is-lit" : ""}`}
  onFocus={openNow} onBlur={closeSoon}
  onClick={() => setPinned((p) => !p)}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPinned((p) => !p); } }}
>
  Services
</span>
```

That snippet reflects the current source, including one accessibility debt. During the
shared-component extraction, **remove the custom `aria-label`** so the accessible heading
name remains the visible word. Add a separate sr-only instruction and connect it via
`aria-describedby`, as required by §6.6. This intentional correction is covered by the
regression gate.

Key `OrbitStage` behaviours (all keyed off `open`):

- **Aura** (`.stack-aura` inside a framer wrapper): `opacity 0→1`, `scale 0.3→1` on open - i.e. it comes **from the back (small/deep) to the front (expanded)**; reverses on leave.
- **Focal glow**: `opacity 0→1`, `scale 0.4→1.18` on open.
- **Filaments** (one-pixel centre-faded gradient bars, `origin-left`, rotated to each
   node): `scaleX 0.90→1`, `opacity 0.16→0.64` - supporting texture, not a diagram grid.
- **Nodes** (always visible at rest; never faint "ghosts"): compact 46px neutral/tinted
   surfaces, `scale 0.94→1.03`, position `x*0.92,y*0.92` → `x,y`, restrained shadow.
   Nodes are stable at rest (no perpetual bobbing) and **icon-only on desktop**. Do not
   render floating hover labels; they clutter the compact hero. Full names remain in source
   data and appear in the labelled mobile strip.
- Mobile (`< lg`): the stage is `hidden lg:block`; instead a **static labelled pill strip**
  (`lg:hidden`) lists the nodes (no hover on touch).

### 1.2 CSS - `src/app/globals.css` (inside `@layer components`, after `.page-hero + .section`)

```css
/* focal word - ink at rest, gradient when `.is-lit` */
.services-title {
  display: inline-block;
  background: linear-gradient(100deg, var(--accent) 0%, var(--amber) 42%, var(--gold) 62%, var(--accent) 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text;
  color: var(--text);
  -webkit-text-fill-color: var(--text);
  transition: color 0.9s ease-in-out, -webkit-text-fill-color 0.9s ease-in-out;
  animation: services-sheen 7s ease-in-out infinite;
}
.services-title.is-lit { color: transparent; -webkit-text-fill-color: transparent; }
@keyframes services-sheen { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.stack-aura { animation: stack-aura 6s ease-in-out infinite; }
@keyframes stack-aura { 0%,100% { opacity: 0.55; transform: scale(0.92); } 50% { opacity: 0.95; transform: scale(1.08); } }
```

**The ignite trick (reuse it verbatim):** the word always has the gradient as its
`background` + `background-clip: text`, but is *filled* with solid `var(--text)` ink via
`-webkit-text-fill-color`. Adding `.is-lit` transitions the fill to `transparent`, which
*reveals* the clipped gradient - a clean "ink → gradient" crossfade with no second copy
of the text. Because `-webkit-text-fill-color` is `transition`ed, hover in **and** out
animate symmetrically ("goes back the same way it came in").

### 1.3 Theme tokens available (rgb triplets - use as `rgb(var(--x-rgb))` or `rgb(var(--x-rgb) / 0.5)`)

`--accent-rgb` (orange), `--gold-rgb`, `--amber-rgb`, `--blue-rgb`, `--brand-rgb`
(magenta/pink), `--green-rgb`, `--red-rgb`. Plus `--text`, `--surface-2`, `--line`. All are
theme‑aware (defined for dark `:root` and light `:root[data-theme="light"]`), so the whole
effect adapts to both themes for free.

---

## 2) Anatomy - the seven ingredients every converted hero must have

1. **The shell** - `<section className="page-hero relative overflow-hidden border-b
   border-line">` + the two blur blobs + inner `container-x pt-10 pb-6 lg:pt-14 lg:pb-8`.
   (Non‑negotiable: preserves the divider + the hero→section rhythm fix + the
   `.page-hero + [data-rm="easy"] + .section` sibling rule.)
2. **A centred focal `<h1>` word** - capitalised, `font-display font-bold`, `text-6xl
   sm:text-7xl` (dominating), with the `.services-title` ignite treatment (rename per §3).
3. **Ignite on hover/focus/tap** - solid ink → gradient, reverting the same way; driven by
   an `open` state, pointer handlers on the centred container, focus/click on the word.
4. **Aura from back → front** - a soft radial that scales `0.3→1` + fades in on `open`.
5. **A themed node constellation** flanking the word on **both** sides - 2-8 REAL items,
   each its own hue, connected to the centre by filaments; always visible at rest, energise
   on hover; icon-only on desktop.
6. **An animated underline** under the word - short and refined (`width: 72%`, `height:
   3px`, `scaleX 0.58→1` on open), never a heavy full-width bar.
7. **Mobile fallback** - stage hidden `< lg`, replaced by a centred static labelled pill
   strip; **no horizontal overflow** at 390 px.

---

## 3) The reusable blueprint - `ConstellationHero`

Generalise `SolutionsHero` into `src/components/sections/ConstellationHero.tsx` so every
server `page.tsx` passes only **serializable configuration** and the client component owns
all Lucide constructors, animation state and variant rendering. Keep `SolutionsHero`
working by reimplementing it as a thin wrapper over `ConstellationHero` (preferred), or
temporarily leave it intact until the `/solutions` regression gate in §7 passes.

Create `src/content/hero-configs.ts` for **plain data only**. It may export strings,
booleans and arrays of serializable objects; it must not import Lucide icons, React, client
components, functions or JSX. `ConstellationHero.tsx` contains the client-side icon and
colour registries.

### 3.1 Proposed API

```tsx
export type HeroIconKey =
   | "sparkles" | "compass" | "hammer" | "brain-circuit" | "headset"
   | "layout-grid" | "graduation-cap" | "search" | "clipboard-list"
   | "pencil-ruler" | "shield-check" | "rocket" | "bar-chart"
   | "refresh" | "database" | "heart-pulse" | "school" | "shopping-cart"
   | "landmark" | "scale" | "calculator" | "file-text" | "book-open";

export type HeroColorKey = "accent" | "gold" | "amber" | "blue" | "brand" | "green" | "red";

export type HeroVariant =
   | "orbit" | "sequence" | "hexagon" | "converge" | "pulse"
   | "scan" | "radar" | "legal" | "document-stack" | "restrained";

export type HeroNode = {
   name: string;          // full, factually true name
   short: string;         // short decorative label
   iconKey: HeroIconKey;  // SERIALIZABLE string; never pass a Lucide component function
   colorKey: HeroColorKey;// SERIALIZABLE token key; resolved client-side
};

export type ConstellationHeroProps = {
   word: string;
   easyWord?: string;
   instruction?: string;  // sr-only description; does not replace the visible heading name
   nodes?: readonly HeroNode[]; // 2-8 real items; decorative, never links
   variant?: HeroVariant;
};
```

Inside the **client** component, resolve the keys:

```tsx
const ICONS: Record<HeroIconKey, LucideIcon> = {
   sparkles: Sparkles,
   compass: Compass,
   hammer: Hammer,
   // …complete every key in the union; TypeScript enforces coverage
};

const COLORS: Record<HeroColorKey, string> = {
   accent: "var(--accent-rgb)", gold: "var(--gold-rgb)",
   amber: "var(--amber-rgb)", blue: "var(--blue-rgb)",
   brand: "var(--brand-rgb)", green: "var(--green-rgb)", red: "var(--red-rgb)",
};
```

**Boundary rule:** route files are Server Components by default. Never pass
`LucideIcon`, callback functions, component constructors, JSX or `ReactNode` flourishes
to `ConstellationHero`. A `variant` string selects a client-side renderer that can access
the hero's private `open` state. Nodes are decorative, so they deliberately have no
`href`; if navigation is needed, render a separate semantic link list outside the
`aria-hidden` constellation.

### 3.2 Generalised node placement (deterministic, any N)

Replace the hardcoded 7‑item `NODES` with a function that flanks **both** sides for any
`N` nodes - `ceil(N/2)` on the right, `floor(N/2)` on the left, spread vertically:

```tsx
function layout(n: number) {
   const RX = n <= 4 ? 200 : 230;
   const RY = n <= 4 ? 70 : 86;               // compact: fits lg:min-h-[260px]
  const right = Math.ceil(n / 2), left = n - right;
  const arc = (count: number, side: 1 | -1) =>
    Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0.5 : i / (count - 1);   // 0..1 top→bottom
      const ang = (-58 + 116 * t) * (Math.PI / 180);   // -58°..+58° from the horizontal
      const x = side * Math.round(Math.cos(ang) * RX);
      const y = Math.round(Math.sin(ang) * RY);
      return { x, y };
    });
  return [...arc(right, 1), ...arc(left, -1)].map((p) => ({
    ...p, dist: Math.round(Math.hypot(p.x, p.y)), angle: (Math.atan2(p.y, p.x) * 180) / Math.PI,
  }));
}
```

Clamp `min-h` so the fan never clips: `min-h-[200px] lg:min-h-[260px]` matches the compact
reference geometry (`RY <= 86`). Desktop nodes are icon-only, so no floating label may
extend outside the stage. Do not combine `RY = 150` with a 260px stage - it clips nodes.

### 3.3 What stays shared vs. per‑page

- **Shared (in `ConstellationHero`):** the shell, `open` state + debounce, the ignite CSS
   class (rename `.services-title` → a neutral `.ignite-word`; keep `.is-lit`,
   `.stack-aura`, `services-sheen`→`ignite-sheen`), aura, focal glow, filaments, node chips,
  underline, mobile strip, a11y, reduced‑motion, SSR‑safety.
- **Per‑page (serializable props):** the `word`, `easyWord`, `nodes` (real content + icon
   keys + colour keys), and a **`variant` string** for the page's signature animation.

> Make the class migration **atomically**: first add `.ignite-word` and
> `@keyframes ignite-sheen` while temporarily retaining `.services-title` as an alias;
> then migrate `SolutionsHero` to the shared component and neutral class in the same
> change; run §7.3; only after it passes remove the legacy alias/keyframe. Never delete or
> rename `.services-title` in an earlier step - that would break the reference before the
> regression gate can run. Keep the classes in the SAME `@layer components` block, right
> after `.page-hero + .section`.

---

## 4) Per‑page rollout plan

The repository has 30 `page.tsx` routes; **"across the site" does not mean converting all
30 indiscriminately**. Use these explicit tiers:

- **Tier 1 - MUST convert (product/marketing indexes):** `/solutions`, `/framework`,
   `/industries`, `/rights`, `/why-us`, `/tools`, `/scanner`, `/security`, `/act`, `/rules`,
   `/learn`, `/certification`, `/courses`, `/templates`, `/blog`, `/cases`.
- **Tier 2 - MUST use restrained variant (legal notices):** `/privacy`, `/terms`,
   `/cookies`. Word + underline + subtle aura only; no node constellation.
- **Tier 3 - MUST leave unchanged in this rollout:** `/` (its homepage hero is a separate
   designed experience), `/section`, `/certification/verify`, `/certification/exam`, and
   every detail/dynamic route: `/blog/[slug]`, `/cases/[slug]`,
   `/certification/[module]`, `/courses/[slug]`, `/rules/[n]`, `/section/[n]`,
   `/templates/[slug]`. Do not "optionally" convert these; that creates unbounded scope.
   These routes intentionally remain on their current hero/layout for this rollout;
   `PageHero` and `ConstellationHero` will coexist. A future, separately scoped rollout
   may revisit them.

Convert Tier 1 + Tier 2 to `ConstellationHero` using the word + REAL nodes + a signature
`variant`. **Nodes must come from actual repository content** - the source column names
where the true data lives. Build only plain serializable records in
`src/content/hero-configs.ts`; do not reuse content objects that contain Lucide component
functions.

| Route | Focal word | Node source (REAL content) | Suggested hues | Typed variant / behavior |
| --- | --- | --- | --- | --- |
| `/solutions` | **Services** ✅ done | `SERVICES` (7 tools) | full 7-hue set | `orbit` - reference constellation |
| `/framework` | **Framework** | the 7D stages in `dpdp.ts` (Discover, Define, Design, Defend, Deploy, Demonstrate, Drive) | accent→green ramp | `sequence` - D1→D7 stagger + ordered journey path |
| `/industries` | **Industries** | names from `INDUSTRIES`; explicit `iconKey` map; derive colours from existing `SECTOR_ACCENT` in `content/industry-advisor.ts` | existing sector mapping | `orbit`; do not claim `INDUSTRIES` itself has colour fields |
| `/rights` | **Rights** | `DATA_PRINCIPAL_RIGHTS` from `content/rights.ts` | blue/green/gold | `hexagon` - exactly six rights |
| `/why-us` | **Why us** | `WHY_US` differentiators from `content/dpdp.ts` | accent/amber | `converge` |
| `/tools` | **Tools** | two honest records from rendered sections: **Calculators** + **Document Studio**; expand only after centralising real tool data | blue/green | `pulse`; two honest nodes beat invented categories |
| `/scanner` | **Scan** | inspect `SCANNER_COPY` plus rendered scanner UI; include only categories actually present | accent/red | `scan` |
| `/security` | **Security** | inspect `SECURITY_COPY` plus rendered security UI; include only categories actually present | red/blue | `radar` |
| `/act` | **The Act** | `ACT_CHAPTERS` from `content/act.ts`; shorten only existing chapter titles | ink/gold | `legal` |
| `/rules` | **Rules** | `RULE_FILTERS` from `content/rules.ts`, excluding `all` | ink/gold | `legal` |
| `/learn` | **Learn** | inspect actual exports/rendered paths in `content/learn.ts` and `courses.ts` | green/blue | `orbit` |
| `/certification` | **Certify** | `MODULES` from `content/curriculum.ts` | gold/green | `orbit`; add a future typed `seal` variant only with a complete contract |
| `/courses` | **Courses** | `COURSES` personas from `content/courses.ts` | blue/green | `orbit` |
| `/templates` | **Templates** | category values in `content/template-documents.json`, deduplicated | amber/blue | `document-stack` |
| `/blog` | **Insights** | `BLOG_FILTERS` from `content/blog.ts`, excluding `all` | accent | `orbit` |
| `/cases` | **Cases** | `CASE_FILTERS` from `content/cases.ts`, excluding `all` | gold | `orbit` |
| `/privacy` | **Privacy** | no nodes | accent | `restrained` - word + aura only |
| `/terms` | **Terms** | no nodes | ink | `restrained` |
| `/cookies` | **Cookies** | no nodes | ink | `restrained` |

> **Word choice:** always ONE short, capitalised word (two max, e.g. "The Act"). It must
> be a real noun for the page, not a slogan. Keep the page's `metadata.title` unchanged.

### 4.1 Deterministic variant contracts (do not improvise)

Implement these inside the client `ConstellationHero`; select with the serializable
`variant` string. Every variant receives `open`, `reduce`, `nodes`, `positions` and colour
tokens. It may change geometry/decoration, never the shared shell, title, ignite, keyboard
or mobile behavior.

- **`orbit` (default):** the §3.2 bilateral arc. Filaments run centre→node; node
   `scale 0.94→1.03`, position `0.92×→1×`, filament opacity `0.16→0.64`. Nodes remain
   stable at rest; the aura is the continuous ambient motion.
- **`sequence` (Framework):** use the source order. Place nodes on a shallow deterministic
   S-path; on open, node `i` transitions with `delay: reduce ? 0 : i * 0.08`. Draw one SVG
   `<path>` through the positions using `pathLength: 0→1`; no random path generation.

   ```ts
   const SEQUENCE_7 = [
      { x: -250, y: -75 }, { x: -205, y: -95 }, { x: -150, y: -70 },
      { x: -105, y: -25 }, { x: 105, y: 25 }, { x: 160, y: 70 },
      { x: 225, y: 90 },
   ] as const;
   const SEQUENCE_PATH =
      "M -250 -75 C -210 -110 -150 -85 -105 -25 " +
      "C -40 0 40 0 105 25 C 150 45 190 95 225 90";
   ```

- **`hexagon` (Rights):** exactly six points around the title:

   ```ts
   const hexagon = Array.from({ length: 6 }, (_, i) => {
      const a = (-90 + i * 60) * Math.PI / 180;
      return { x: Math.round(Math.cos(a) * 235), y: Math.round(Math.sin(a) * 105) };
   });
   ```

- **`converge` (Why us):** use bilateral positions. At rest nodes sit at `1.07×` their
   final coordinates; on open they converge to `1×` while filaments strengthen.
- **`pulse` (Tools):** use bilateral positions. On open, each node gets one restrained
   scale pulse `1→1.06→1` with `i * 0.07` stagger; no infinite attention-seeking pulse.
- **`scan` (Scanner):** default nodes plus one decorative absolute line across the word.
   On open animate line `x: -55%→55%`, opacity `0→0.8→0`, duration `1.2s`. Repeat only
   while hovered; with reduced motion show one static line and do not repeat.
- **`radar` (Security):** default nodes plus an aura layer using a low-opacity
   `conic-gradient(from 0deg, transparent 0 75%, rgb(var(--red-rgb)/.16) 92%, transparent)`.
   Rotate `0→360deg` in 4s linear, repeating continuously only while open; reduced motion
   = one static 45deg sweep.
- **`legal` (Act / Rules):** no floating keyframe. Use subdued gold/ink chips, `§`-style
   labels and two thin parallel underline rules; open increases contrast only. Keep this
   restrained and editorial.
- **`document-stack` (Templates):** render three decorative rectangular sheets behind the
   title. Rest offsets: `(-8,6)`, `(0,0)`, `(8,-6)`; on open spread to `(-18,10)`, `(0,0)`,
   `(18,-10)`. Nodes still contain only real template categories.
- **`restrained` (Privacy / Terms / Cookies):** render no nodes, filaments or mobile strip.
   Keep the ink→gradient title, underline and a smaller aura (`max-width: 360px`).

No variant accepts JSX, a component function or a render callback. If a new variant is
needed, add it to the `HeroVariant` union and implement it inside the client component.
For **all** variants under reduced motion: set every stagger/delay to `0`, use one flat
`{ duration: 0.25, ease: "linear" }` transition, suppress pulse keyframes and repeating
motion, and leave the final open/closed visual state understandable.

---

## 5) Integration recipe (per page)

1. In `src/app/<route>/page.tsx`, replace the `import { PageHero }` + `<PageHero .../>`
   block with `import { ConstellationHero }` + `<ConstellationHero {...HERO_CONFIGS.route} />`.
   Keep `EasyIntro`, section components and `CtaBand` exactly as they are.
2. Build `HeroNode[]` as plain data in `src/content/hero-configs.ts` from REAL repository
   content (don't invent). Pass `iconKey` + `colorKey` strings, never Lucide functions or
   CSS values. Prefer 2-8 nodes, but **two honest nodes beat five invented ones**. Every
   non-restrained config must contain 2-8 nodes; `restrained` must contain zero nodes.
3. Pick one `HeroVariant` from §4.1. Do not pass a `flourish` component/ReactNode and do
   not fork the hero. Add a typed client-side variant only when §4.1 requires it.
4. Preserve the shell exactly (§2.1). Confirm the next sibling is still the (hidden‑in‑
   normal) `EasyIntro` then the first `.section`, so the rhythm rule keeps matching.
5. Easy-read: `ConstellationHero` is a client component. Render the existing `Swap`
    markup contract directly from serializable strings, keeping both variants inside the
    interactive word:

   ```tsx
    const instructionId = useId();

    <h1>
       <span
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-describedby={instructionId}
       >
          <span data-rm="normal">{word}</span>
          <span data-rm="easy">{easyWord ?? word}</span>
       </span>
    </h1>
    <span id={instructionId} className="sr-only">
       {instruction ?? "Activate to reveal the visual theme"}
    </span>
   ```

    Import `useId` from React. `easyWord` defaults to `word`; the existing global
    `data-rm` CSS controls which span is rendered. The constellation is decorative
    (`aria-hidden`) and its labels are hidden from assistive technology, so it needs no
    easy copy.
6. Run §7.2 verification on that route before moving on.
7. `ConstellationHero` intentionally renders **no eyebrow/kicker**. The first section below
   it must retain a distinct, useful `SectionHeader eyebrow`. Do not add a second hero pill
   or recreate the duplicate-label defect; see `docs/eyebrow-labels-master-prompt.md`.

---

## 6) Hard rules

1. **Preserve the shell** on every converted hero: `page-hero relative overflow-hidden
   border-b border-line` + inner `container-x pt-10 pb-6 lg:pt-14 lg:pb-8`. Do not remove
   the `border-b` or change the padding (it's the divider + the hero→section rhythm fix).
2. **Ignite = hover/focus/tap**, ink→gradient, reverting the SAME way. No auto‑loop.
   (The CEO explicitly wanted it hover‑driven.)
3. **SSR‑safe:** deterministic node positions only - **no `Math.random`**; `initial={false}`
   on all motion elements so server + client first paint match.
4. **Reduced motion:** gate scale/drift with `useReducedMotion()`; use a flat `duration:
   0.25` transition with no spring bounce, oscillation, repeating scan or radar rotation.
   The global CSS reset freezes the keyframe animations. The hover state must remain
   understandable without motion. **Hydration safety:** `useReducedMotion()` is
   browser-only and can differ from SSR on the first client render. Keep the first render
   deterministic and apply the preference only after mount:

   ```tsx
   const prefersReducedMotion = useReducedMotion();
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   const reduce = mounted && !!prefersReducedMotion;
   ```

   Do not branch Framer Motion `animate`, `style`, `className` or transition props directly
   on an ungated `useReducedMotion()` value; that causes server/client style mismatches.
5. **NO fabricated claims.** Nodes must be REAL page content (see the CEO principle:
   "we can't just throw stuff around which isn't true"). No invented durations, counts,
   percentages, or outcome promises anywhere in the hero. Icons/labels must reflect actual
   things the page offers.
6. **a11y:** the focal word is the page `<h1>` and a `role="button"` with `aria-expanded`,
   keyboard operable (Enter/Space). Its accessible name must remain the visible word - do
   **not** replace it with a longer `aria-label`. Put an sr-only instruction beside it,
   give that element an id, and reference it through `aria-describedby`. The whole
   constellation/aura/filaments are decorative and `aria-hidden`; therefore they contain
   no links, buttons or focusable descendants. Keep the `focus-visible` ring. Never put
   non-phrasing block elements inside `<h1>` (chips live in the sibling stage, not h1).
7. **Don't shrink** `--fs-*`, `--tracking-label`, `.section` padding, or the `--eyebrow*`
   tokens (owned by the typography/theme systems). Sub‑12px labels are forbidden - node
   labels use `text-label`.
8. **Both themes** must work (all colours are `--*-rgb` / `--text` / `--surface-2` tokens,
   so this is automatic - don't hardcode hex).
9. **Never run `next build` while `next dev` is live** (corrupts `.next`). Validate with
   `npx tsc --noEmit`.
10. Keep it reversible and DRY: one shared `ConstellationHero`; per‑page differences are
   serializable data + a typed `variant`, not forked copies.
11. **Verify assumptions before editing:** open the named content file and the current
   route component. If a claimed data export/category/colour does not exist, update
   `hero-configs.ts` from the actual rendered content; do not create a fake fact to satisfy
   this document.

---

## 7) Execution order and verification

### 7.1 Staged execution (do not edit 19 routes in one burst)

1. **Foundation:** create `hero-configs.ts`, `ConstellationHero.tsx`, the icon/colour
   registries, neutral `.ignite-*` CSS and all typed variants. Do not touch routes yet.
2. **Reference migration:** make `SolutionsHero` a thin wrapper over the shared component.
   Run the full `/solutions` regression gate below. Do not proceed until it matches.
3. **Pilot:** convert `/framework` (`sequence`) and `/privacy` (`restrained`) to exercise
   both complex and minimal paths. Validate both fully.
4. **Tier 1 batches:** convert at most 3 related routes per batch, run typecheck + focused
   browser verification after each batch.
5. **Tier 2 legal batch:** after the `/privacy` pilot, convert the remaining `/terms` and
   `/cookies` routes with `restrained`.
6. **Final audit:** confirm every Tier 1 + Tier 2 route uses `ConstellationHero` and every
   Tier 3 route remains unchanged.

### 7.2 Verification checklist (per converted route)

Server HTML is ground truth (the VS Code preview tab reverts to `app/loading.tsx` when
occluded - see `/memories/repo/truststack-dpdp.md`). For the ignite, use Playwright.

1. ✅ `npx tsc --noEmit` passes.
2. ✅ **No‑JS SSR** (`Invoke-WebRequest http://localhost:3000/<route> -UseBasicParsing`):
   the focal word is present as the `<h1>`; no fabricated strings (durations/counts) appear.
3. ✅ **Ignite on hover** (Playwright): read the word's computed `-webkit-text-fill-color`:
   `alpha≈1` (ink) at rest → hover the hero → `alpha≈0` (gradient) → move off → `alpha≈1`
   again. (Pin‑open for a screenshot via `page.click` on the word.)
4. ✅ **Both themes:** toggle the header theme switch (desktop width - it's hidden `< lg`)
   and confirm the word + nodes + aura read correctly in dark AND light.
5. ✅ **Mobile (390 px):** the stage is hidden, the static node strip shows, and
   `document.body.scrollWidth <= window.innerWidth` (no horizontal overflow).
6. ✅ **Easy-read:** use the site's Easy Read switch (or set
   `document.documentElement.dataset.reading = "easy"` for a focused probe). The focal
   word displays `easyWord ?? word`, remains the one `<h1>`, and there are no console or
   hydration errors.
7. ✅ **Reduced motion:** emulate `prefers-reduced-motion: reduce` before navigation. Hover
   still changes ink→gradient, but there is no spring bounce, repeating scan, radar spin
   or floating loop; transitions are flat ≤0.25s.
8. ✅ **Accessibility:** one `<h1>`; visible word remains its accessible name; instruction
   is connected with `aria-describedby`; Enter/Space and click pin/unpin; decorative stage
   has `aria-hidden="true"` and no focusable descendants.
9. ✅ Nodes are all REAL content for that page (spot-check against source); no fabricated
   durations, counts, percentages, case studies or promised outcomes were introduced.
10. ✅ The first section retains one useful eyebrow; the hero introduces no eyebrow pill,
    so there is no duplicate-label regression.

### 7.3 Mandatory `/solutions` regression gate

Before and after migrating `SolutionsHero` onto `ConstellationHero`, capture and compare:

- Desktop 1440×900, light + dark: at-rest ink state and hovered/pinned gradient state.
- Hover probe: text-fill alpha `1→0→1`, aura `scale 0.3→1→0.3`, tools energise and return.
- Click and keyboard pinning: state remains open after pointer leaves; second activation
  closes it.
- Per-node label hover; seven real service nodes and correct colours/icons.
- Mobile 390×844: static node strip, no stage, no horizontal overflow.
- Reduced motion and Easy Read as above.

Treat any visible layout, timing, colour, spacing, interaction or content difference as a
regression unless it is explicitly required by this prompt. Keep the current
`SolutionsHero.tsx` available until the shared implementation passes this gate.

---

## 8) TL;DR

Extract `/solutions`'s hero into a client-safe reusable **`ConstellationHero`** (centred word that's
**ink at rest** and **ignites to a gradient on hover** while an **aura blooms back→front**
and **themed nodes** flank it on both sides, filaments + underline + mobile strip + full
a11y/reduced‑motion/SSR‑safety). Server routes pass **only serializable icon/colour/variant
keys**; the client owns Lucide constructors and animation renderers. Put it on every Tier
1 + Tier 2 page in §4 with that page's **one capitalised word**, **real content nodes**
(never fabricated - hard rule §6.5), and typed **signature variant** (framework = sequence; rights =
hexagon; scanner = scan; security = radar; legal pages = restrained). Leave Tier 3 routes
unchanged. Keep the `page-hero` shell + padding, pass the `/solutions` regression gate,
then verify each batch (tsc, no‑JS SSR, hover‑ignite, a11y, easy-read, reduced motion,
both themes and 390px). Never run `next build` while `next dev` is live.
