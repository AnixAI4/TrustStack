# Master Prompt - Fix the typography system: legible type at the compact "80%" density, and consolidate 5 fonts → 3

> Paste everything from **§0** onward to a coding agent working in this repo. It is
> self-contained: it embeds the **exact current state** (with file:line), the
> **root-cause math** of why text reads "too small / too narrow / barely visible",
> a **paste-in type-scale token block**, the **font-consolidation edits**, the
> **"keep the 80% look but make it legible"** strategy (primary + fallback with the
> arithmetic worked out), the **micro-label codemod**, the a11y / i18n / motion
> guarantees, the hard rules, and a verification checklist.
>
> **Why we're doing this (the complaint, verbatim):** *"the font is too less and there
> are too many fonts… the text is too small and narrow… the main issue is the site has
> to be in 80%."* Translated: the site is deliberately rendered at a compact ~80%
> scale, but the way that scale is implemented (a global `zoom`) shrinks every piece of
> text below a legible size, the uppercase monospace micro-labels read cramped/narrow,
> and there are five competing font families. We keep the **compact, information-dense
> "80%" feel** but make **every glyph legible** and cut the font families to **three**.

---

## 0) Mission & definition of done

Ship a single, coherent **typography system** for Variation 1 that:

**(A) Keeps the compact "80%" density** the site is designed around - it must still feel
information-dense and "fit a lot on screen". We are **not** blowing the design up to
100%; we are decoupling *density* from *legibility*.

**(B) Makes every text run legible.** Enforce hard **effective-size floors** (see §3):
body ≥ **15px**, secondary/muted ≥ **13px**, the smallest label/kicker/badge ≥ **12px**.
**No text anywhere may render below 12px effective.**

**(C) Fixes the "narrow/cramped" feel.** Uppercase labels get a legible size + positive
letter-spacing; the display face never gets negative tracking; the thin high-contrast
serif is replaced by a heavier, more visible serif.

**(D) Consolidates 5 font families → 3 design faces (+ 1 functional Indic face).**
Keep **display + text + one accent**; drop the rest and trim loaded weights.

**DONE only when:**

1. `getComputedStyle(document.body).fontSize` resolves to **≥ 15px effective** on
   desktop, and the smallest label on any page is **≥ 12px effective** (§10 probe).
2. Exactly **three** downloaded Latin design faces remain (display, text, accent) plus
   the one functional Devanagari face; **Playfair is gone** and no `text-[10px]` /
   `text-[11px]` micro-labels remain in `src/`.
3. The page still reads **compact/dense** - section rhythm and card density are visually
   equivalent to the old `zoom: 0.9` layout (not ballooned up).
4. No new **horizontal overflow** at 375px / 768px / 1024px / 1440px; the mobile drawer,
   language picker, chatbot and all reused widgets still work.
5. The a11y **text-size** toolbar (`--a11y-text-scale` → 1 / 1.12 / 1.25) still scales
   the whole site; `prefers-reduced-motion` and RTL/Indic locales are unaffected.
6. `npx tsc --noEmit` passes; a production `next build` is **not** run against a live
   `next dev` (see §9).

**Anti-goal:** "just bump every font size up by hand." That leaves the root-cause
`zoom` shrink and the 5-font sprawl in place and will drift again. Fix the *system*.

---

## 1) Exact current state (do not guess - this is what's on disk)

### 1.1 Five font families are loaded - `src/app/layout.tsx` (lines ~2-46)

```tsx
import { Outfit, Inter, JetBrains_Mono, Playfair_Display, Tiro_Devanagari_Hindi } from "next/font/google";

const display = Outfit({ subsets:["latin"], variable:"--font-display", weight:["400","500","600","700","800"], display:"swap" });
const sans    = Inter({ subsets:["latin"], variable:"--font-sans", display:"swap" });
const mono    = JetBrains_Mono({ subsets:["latin"], variable:"--font-mono", weight:["400","500","600"], display:"swap" });
const serif   = Playfair_Display({ subsets:["latin"], variable:"--font-serif", style:["normal","italic"], weight:["500","600","700"], display:"swap" });
const deva    = Tiro_Devanagari_Hindi({ subsets:["devanagari","latin"], variable:"--font-deva", weight:"400", display:"swap" });
```

All five variables are injected on `<html className={...}>`. `Outfit` alone ships **5
weights**; `Playfair` ships italic + 3 weights. This weight bloat is part of "too many
fonts".

### 1.2 The "80%" is a global `zoom` - `src/app/globals.css` (lines ~152-190)

```css
html {
  /* Was 0.8 ("barely visible"); raised to 0.9. */
  zoom: 0.9;
  font-size: calc(100% * var(--a11y-text-scale, 1));
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}
@supports not (zoom: 1) {           /* Firefox: shrink via root rem instead */
  html { font-size: calc(14.4px * var(--a11y-text-scale, 1)); }   /* 16 × 0.9 */
}
@media (max-width: 1023.98px) {     /* mobile: native scale, else vw math breaks */
  html { zoom: 1; }
}
@supports not (zoom: 1) {
  @media (max-width: 1023.98px) { html { font-size: calc(16px * var(--a11y-text-scale, 1)); } }
}
```

### 1.3 The Tailwind type config - `tailwind.config.ts` (lines ~55-67)

```ts
fontFamily: {
  display: ["var(--font-display)", "system-ui", "sans-serif"],
  sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
  mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
  serif:   ["var(--font-serif)", "Georgia", "serif"],
  deva:    ["var(--font-deva)", "serif"],
},
letterSpacing: { tighter: "0em", tight: "0em" },  // negative tracking already neutralised
```

### 1.4 The micro-labels (the "small & narrow" offenders)

- `.eyebrow` - `src/app/globals.css` ~line 564: `text-[13px] font-semibold uppercase tracking-[0.1em]`.
- `.badge` - `src/app/globals.css` ~line 638: `text-[11px] font-semibold uppercase tracking-wider`.
- **300+ inline** `font-mono text-[10px]` / `text-[11px]` / `text-xs` uppercase kickers
  across **60+ files** (e.g. `Footer.tsx`, `Header.tsx`, `IndustryAdvisor.tsx`,
  `FrameworkSection.tsx`, every `[slug]` hero, etc.). Grep to enumerate:
  ```
  text-\[10px\]|text-\[11px\]|text-\[13px\]
  ```
- `body` has **no explicit font-size** (`globals.css` ~line 204) → it inherits the
  `html` size, so it is fully at the mercy of the `zoom` shrink.

---

## 2) Root-cause diagnosis - the math of "barely visible"

Effective pixel size = `nominal × zoom` (on desktop `zoom = 0.9`; the old value was `0.8`).

| Token / class | Nominal | Effective @0.9 | Effective @0.8 (old) | Verdict |
| --- | --- | --- | --- | --- |
| `body` (root 16px) | 16px | **14.4px** | 12.8px | borderline |
| `text-sm` (0.875rem) | 14px | 12.6px | 11.2px | small |
| `text-xs` (0.75rem) | 12px | 10.8px | 9.6px | too small |
| `.eyebrow` `text-[13px]` | 13px | 11.7px | 10.4px | too small |
| `.badge` `text-[11px]` | 11px | 9.9px | 8.8px | **barely visible** |
| kicker `text-[10px]` | 10px | **9px** | **8px** | **barely visible** |

Two root causes, both systemic:

1. **A blunt global `zoom` shrinks *everything* below the legibility floor.** Because it
   multiplies every rem/px, the only "fix" applied so far was nudging `0.8 → 0.9`, which
   is still too small and cannot lift the `text-[10px]` labels into a legible band.
   `zoom` also mis-computes `100vw` / `position:fixed` widths as `viewport ÷ zoom`, which
   is exactly why the mobile guard `@media(max-width:1023.98px){html{zoom:1}}` had to be
   added - a symptom that the mechanism is wrong.
2. **Sub-`text-xs` absolute-px micro-labels in monospace.** Uppercase JetBrains Mono at
   9-10px with letter-spacing reads cramped and "narrow" - this is the "narrow" complaint.
   The thin, high-contrast Playfair serif compounds "barely visible" at small sizes.

**Conclusion:** keep the *compact density* (users like a dense, high-tech layout) but
deliver it through a **compact-but-legible type + spacing scale**, not through a global
pixel shrink; and cut the font sprawl.

---

## 3) Target system - legibility floors + compact density

Non-negotiable **effective-size floors** (after any residual scaling):

| Role | Token | Effective target |
| --- | --- | --- |
| Body copy | `--fs-base` | **15-16px** |
| Small / secondary | `--fs-sm` | 14-15px |
| Muted / meta | `--fs-xs` | 13-14px |
| **Smallest label / kicker / badge** | `--fs-label` | **12-13px (hard floor 12px)** |
| Section heading | `--fs-2xl … --fs-3xl` | fluid |
| Hero display | `--fs-display` | fluid |

Density is preserved by (a) a **tight modular ratio** (~1.2 minor-third) so steps don't
balloon, (b) **dense line-heights** (`--lh-*` below), and (c) **compact spacing tokens**
so cards/sections keep the old rhythm even though nothing renders below 12px.

---

## 4) The type-scale token block (paste into `globals.css`)

Add this inside `:root { … }` in `src/app/globals.css` (near the existing
`--a11y-text-scale` declaration). All sizes are **fluid** via `clamp()` so they scale
with the viewport and **never collapse below the floor**:

```css
:root {
  /* ---- Fluid, compact-but-legible type scale (min values are the legibility floor) ----
     Read as clamp(MIN, PREFERRED, MAX). No step ever renders below 12px. */
  --fs-label:  clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);  /* 12 → 13px  (retires text-[10px]/[11px]) */
  --fs-xs:     clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem); /* 13 → 14px */
  --fs-sm:     clamp(0.875rem, 0.84rem + 0.2vw, 0.9375rem);  /* 14 → 15px */
  --fs-base:   clamp(0.9375rem, 0.9rem + 0.25vw, 1rem);      /* 15 → 16px  body */
  --fs-lg:     clamp(1.0625rem, 1rem + 0.35vw, 1.1875rem);   /* 17 → 19px */
  --fs-xl:     clamp(1.25rem, 1.15rem + 0.6vw, 1.5rem);
  --fs-2xl:    clamp(1.5rem, 1.3rem + 1.1vw, 2rem);
  --fs-3xl:    clamp(1.875rem, 1.55rem + 1.7vw, 2.75rem);
  --fs-display:clamp(2.35rem, 1.8rem + 3vw, 3.8rem);

  /* Dense line-heights keep the compact rhythm without cramping glyphs. */
  --lh-tight: 1.14;
  --lh-snug:  1.28;
  --lh-normal:1.55;
  --lh-relaxed:1.72;

  /* Uppercase micro-label tracking - positive only, never negative (fixes "narrow"). */
  --tracking-label: 0.09em;
}
```

Base wiring (also in `globals.css`):

```css
body {
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  line-height: var(--lh-normal);
  /* keep the existing font-feature-settings / antialiasing / overflow-x rules */
}
```

You may optionally expose these to Tailwind (`tailwind.config.ts → theme.extend.fontSize`)
as `label/xs/sm/base/lg/xl/2xl/3xl/display` mapped to the vars, so components can use
`text-label`, `text-base`, etc. If you do, keep Tailwind's built-in steps working too.

---

## 5) Font consolidation - 5 → 3 design faces (+ 1 functional Indic)

**Keep:** `Outfit` (display) · `Inter` (text/UI/labels) · `JetBrains Mono` (the ONE
accent - it *is* the label/kicker identity, used in 300+ places). **Drop:** `Playfair` - its role (the legal "official text" reader in `OfficialText.tsx` and headings in
`Generators.tsx`) is served better at small sizes by system **Georgia**, which is
heavier/more legible and costs **zero download**. **`Tiro Devanagari Hindi` stays** as a
*functional* Indic face (it is not a "design" font - it renders Devanagari locales; other
Indic scripts fall back to system fonts already). This satisfies "display + text + one
accent" while respecting i18n.

> Alternative (if you'd rather keep the serif as the accent and drop mono): repoint the
> `font-mono` utility's `--font-mono` to a **system** `ui-monospace, "SF Mono", …` stack
> (removes the JetBrains download with **zero markup churn**, since all 300+ `font-mono`
> usages still resolve) and keep Playfair. Pick **one** of the two; the primary path
> above (keep mono, drop Playfair) is recommended because the labels are the dominant
> surface and Georgia improves the serif's legibility.

### 5.1 `src/app/layout.tsx` edits

```tsx
// import: remove Playfair_Display
import { Outfit, Inter, JetBrains_Mono, Tiro_Devanagari_Hindi } from "next/font/google";

// trim weights to what's actually used, delete the `serif` const entirely
const display = Outfit({ subsets:["latin"], variable:"--font-display", weight:["400","600","700"], display:"swap" });
const sans    = Inter({ subsets:["latin"], variable:"--font-sans", display:"swap" });
const mono    = JetBrains_Mono({ subsets:["latin"], variable:"--font-mono", weight:["400","600"], display:"swap" });
const deva    = Tiro_Devanagari_Hindi({ subsets:["devanagari","latin"], variable:"--font-deva", weight:"400", display:"swap" });
// (const serif = Playfair_Display(...))  ← DELETE

// <html> className: drop ${serif.variable}
className={`${display.variable} ${sans.variable} ${mono.variable} ${deva.variable}`}
```

### 5.2 `tailwind.config.ts` - point `serif` at the system stack

```ts
fontFamily: {
  display: ["var(--font-display)", "system-ui", "sans-serif"],
  sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
  mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
  serif:   ["Georgia", "Cambria", "Times New Roman", "serif"],  // was var(--font-serif) → Playfair
  deva:    ["var(--font-deva)", "serif"],
},
```

No component markup needs to change for the serif swap - every `font-serif` usage now
resolves to Georgia. Verify `OfficialText.tsx` (the legal reader) still reads well and
bump its size to `--fs-sm`/`--fs-base` if needed.

---

## 6) The "80%" fix - compact density **without** tiny text

You must **keep the compact feel** but remove the pixel-shrink that made text illegible.

### 6.1 PRIMARY (recommended) - retire `zoom`, keep density in the *scale*

Replace the whole `html { zoom … }` block (§1.2) with:

```css
html {
  /* The global `zoom` shrink is GONE. It forced every rem ~10-20% smaller (labels
     rendered 8-9px, "barely visible") and broke 100vw / position:fixed math (that's
     why the mobile zoom:1 guard existed). Compact "80%" density now lives in the
     type + spacing SCALE (tight steps, dense line-heights, compact spacing tokens),
     so text stays legible while the layout stays information-dense. */
  font-size: calc(100% * var(--a11y-text-scale, 1));
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
}
```

Then **delete** both `@supports not (zoom:1)` forks and the `@media(max-width:1023.98px){html{zoom:1}}`
guard - they only existed to patch `zoom`. To keep the old compact rhythm, tighten the
**spacing**, not the font pixels: reduce oversized section paddings/gaps by ~10-15%
(prefer editing shared primitives like `.container-x`, `.card`, and section wrappers, or
add compact spacing tokens `--space-*`). Net result: same density, legible type, no
viewport bugs, and Firefox no longer needs a special case.

### 6.2 FALLBACK - literal CSS 80% (only if a stakeholder insists on `zoom: 0.8`)

If the site *must* be a literal `zoom: 0.8`, counter the shrink by **raising the root rem**
so effective type clears the floors, and keep the mobile guard:

```css
html {
  zoom: 0.8;                                   /* literal 80% layout */
  font-size: calc(125% * var(--a11y-text-scale, 1));  /* 16 × 1.25 = 20px; × 0.8 zoom = 16px effective */
  scroll-behavior: smooth; -webkit-text-size-adjust: 100%;
}
@supports not (zoom: 1) { html { font-size: calc(16px * var(--a11y-text-scale, 1)); } } /* Firefox: no zoom → 16px */
@media (max-width: 1023.98px) { html { zoom: 1; font-size: calc(100% * var(--a11y-text-scale,1)); } }
```

**Arithmetic (why this is legible):** root 20px × 0.8 = **16px** effective body; `text-sm`
→ 14px; `text-xs` → 12px (floor). **Caveats you must accept with this path:** (a) absolute-px
labels like `text-[10px]` do **not** benefit from the rem bump and stay tiny - you must
still run the §7 codemod; (b) `zoom` still mis-computes `100vw`/fixed widths on desktop - re-test overflow at every breakpoint; (c) Playwright/`getBoundingClientRect` report
**pre-zoom** coordinates, so multiply on-screen positions by 0.8 when measuring.

> Recommendation: ship **6.1**. It gives the same compact look, is the most robust, and
> eliminates the exact bug class that caused this ticket. Use 6.2 only under an explicit
> "must be literal 80%" constraint.

---

## 7) Kill the micro-labels (codemod)

Every sub-`text-xs` label must move to the `--fs-label` floor. Do a repo-wide,
**review-each-hit** replacement across `src/` (do **not** blind-`sed`):

| Find (Tailwind) | Replace with |
| --- | --- |
| `text-[10px]` | `text-label` (or `text-xs`) |
| `text-[11px]` | `text-label` (or `text-xs`) |
| `.eyebrow` `text-[13px]` | `--fs-label` (edit the `.eyebrow` rule in `globals.css`) |
| `.badge` `text-[11px]` | `--fs-label` (edit the `.badge` rule) |

- If you exposed the tokens to Tailwind (§4), `text-label` maps to `var(--fs-label)`.
  Otherwise replace with `text-xs` and let the scale carry it.
- For every uppercase label, ensure tracking is **positive** (`tracking-[0.09em]` /
  `var(--tracking-label)`), never negative - this removes the "narrow/cramped" feel.
- Update the two component primitives in `globals.css`:

```css
.eyebrow { font-size: var(--fs-label); letter-spacing: var(--tracking-label); /* …unchanged… */ }
.badge   { font-size: var(--fs-label); letter-spacing: var(--tracking-label); /* …unchanged… */ }
```

Enumerate remaining offenders before you finish:
```
grep -rE "text-\[(10|11|13)px\]" src/     # must return ZERO after the codemod
```

---

## 8) Accessibility, i18n & motion - do not regress

- **A11y text size** must keep working: the toolbar sets `--a11y-text-scale` to
  `1 / 1.12 / 1.25` and the root `font-size: calc(100% * var(--a11y-text-scale,1))`
  multiplies it. Because the new scale is rem/`clamp`-based, all `--fs-*` tokens scale
  automatically. Verify all three steps in `A11yToolbar.tsx`.
- **Do not touch** the a11y classes in `globals.css` (`a11y-dyslexic`, `a11y-line-*`,
  `a11y-focus-mode`, `a11y-underline`) or the `--a11y-line-height` mechanism.
- **RTL & Indic:** keep `--font-deva` for Devanagari locales; confirm Urdu/Arabic (RTL)
  and Tamil/Telugu/Bengali/etc. still fall back cleanly (no boxes/tofu). Test at least
  `hi` (Devanagari) and one non-Devanagari Indic locale.
- **Reduced motion:** the existing `@media (prefers-reduced-motion: reduce)` reset and
  `.a11y-no-motion` must be preserved verbatim.
- **Reused vanilla-JS widgets:** audit `src/app/widgets.css` and `india-map.css` for
  **hardcoded px font sizes** that assumed the `zoom` context - bump any that now read
  too small/large. These widgets share the `dpdp-theme` key; don't break them.

---

## 9) Hard rules

1. **No negative letter-spacing** on the display face anywhere (it caused the earlier
   "narrow" headings; `letterSpacing.tight/tighter` are already `0em` - keep them).
2. **No text below 12px effective** - this is the whole point. Verify with §10.
3. **Preserve compact density** - do not let the layout balloon to a roomy 100% look;
   tighten spacing to compensate (§6.1).
4. **Exactly one accent face** - don't reintroduce a 4th Latin design font later.
5. **Never run `next build` while `next dev` is running** on this project (they share
   `.next` → webpack corruption). Validate with `npx tsc --noEmit`; if you must build,
   stop dev first, then `Remove-Item -Recurse -Force .next`, build, restart dev.
6. **Don't blanket find/replace** the micro-labels with a shell script - review each hit
   (some `font-mono` usages are code/kbd, not kickers).
7. Keep all existing **CSS variable names** and component class names (`.eyebrow`,
   `.badge`, `.container-x`, `.card`, `.btn*`, `.chip`, `.gradient-text`) so nothing
   downstream breaks - only change their *values*.

---

## 10) Verification checklist

Run all of these before declaring done:

1. **Typecheck:** `npx tsc --noEmit` → clean.
2. **Font count:** confirm `src/app/layout.tsx` imports exactly `Outfit, Inter,
   JetBrains_Mono, Tiro_Devanagari_Hindi` (no `Playfair_Display`), and
   `grep -rE "text-\[(10|11|13)px\]" src/` returns **zero**.
3. **Effective body size (desktop):** in the browser console - ```js
   getComputedStyle(document.body).fontSize   // expect ≥ 15px  (× 0.8 if you kept zoom → still ≥ 12)
   ```
4. **Smallest label floor:** - ```js
   [...document.querySelectorAll('.eyebrow,.badge,[class*="text-"]')]
     .map(e => parseFloat(getComputedStyle(e).fontSize)).filter(Boolean).sort((a,b)=>a-b)[0]
   // expect ≥ 12  (if zoom kept, this is pre-zoom; × 0.8 must still be ≥ 12 → so pre-zoom ≥ 15)
   ```
   > Note: under `zoom`, `getComputedStyle` and `getBoundingClientRect` report **pre-zoom**
   > values - multiply by the zoom factor to get on-screen px.
5. **No horizontal overflow:** at 375 / 768 / 1024 / 1440 - ```js
   document.documentElement.scrollWidth <= window.innerWidth + 1   // expect true
   ```
   Confirm the mobile drawer opens fully on-screen (no menu pushed off the right edge).
6. **Density check:** screenshot `/`, `/industries`, `/solutions`, a `[slug]` page and a
   long legal reader (`/act` or `/section/[n]`) - they must look **compact/dense**, not
   ballooned, and every label must be readable.
7. **A11y:** toggle text-size through all three steps - the whole site scales; toggle
   dyslexic/line-spacing/contrast - still work.
8. **i18n:** switch to `hi` (Devanagari renders via `--font-deva`) and one RTL locale
   (`ur`) - no tofu, layout intact.
9. **Legibility gut-check:** the `text-[10px]` monospace kickers that read "barely
   visible" are now ≥ 12px with positive tracking and no longer feel narrow.

> Because the VS Code integrated browser tab is often backgrounded
> (`document.hidden === true`), CSS animations/rAF freeze and accessibility snapshots may
> show a stale "Loading" state - that is a harness artifact, not a bug. Validate text via
> `getComputedStyle` numbers and `Invoke-WebRequest` HTML (no JS), plus screenshots of the
> visible tab; don't trust the a11y snapshot alone.
