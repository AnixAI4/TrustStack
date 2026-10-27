# Master Prompt - Sitewide 2D Hero Illustration Quality Program

> Paste everything from **Section 0** onward to a coding agent working in this repository.
> This is an implementation prompt, not a mood board. It defines the exact route scope,
> the current component ownership, the known failure modes, the required page-by-page
> workflow, the visual quality bar, the verification harness, and the stop conditions.
>
> **Why this exists:** the top-level route heroes contain a family of custom CSS/DOM/SVG
> illustrations: presses, consoles, towers, ledgers, gantries, wheels, archives and other
> faux-depth machines. They are valuable brand assets, but several were compacted from
> larger stages without a full internal recomposition. Reactive one-off edits have caused
> clipping, detached side faces, overlapping controls, blurry text, blank animated states
> and inconsistent depth. Fixing them properly requires a measured route-by-route quality
> program, not a generic redesign applied everywhere.

---

## 0) Mission and definition of done

Audit and polish every in-scope top-level TrustStack hero illustration listed in Section 4.
Preserve the identity and truthful content of each page while bringing every model to a
consistent professional quality bar.

This is a **2D illustration program**. In this repository, references to a "3D model" or
"physical model" mean the existing CSS/DOM/SVG faux-depth illustration unless the user
explicitly asks for real 3D.

**DONE only when all of the following are true:**

1. Every in-scope route has a before screenshot set, a written local diagnosis, an after
   screenshot set, and a completed acceptance row.
2. Every selectable/automatic state on every hero has been rendered and inspected. It is
   not sufficient to verify only the default state.
3. No model is clipped by its stage, tab rail, hero shell or viewport at the required
   desktop sizes.
4. No model uses detached fake side rectangles, arbitrary skew strips, disconnected oval
   pedestals, or decorative geometry that reads as an implementation artifact.
5. No icon, label, meter, key, rail, sheet or control overlaps another unintentionally.
6. Essential copy and essential model geometry are present on the first frame. Hidden or
   throttled tabs cannot leave a state blank or accumulate exiting states.
7. Light and dark themes both have readable surfaces, borders, windows, controls and
   shadows. Depth cannot disappear in one theme.
8. At mobile and tablet sizes, the hero copy and controls remain usable, no page widens,
   and any intentionally hidden decorative stage leaves no empty fixed-height hole.
9. English, one long-label locale, one Indic locale and one RTL locale do not clip or
   overlap hero copy or controls.
10. Reduced motion preserves the complete final state and disables only nonessential
    movement.
11. Focused ESLint, editor diagnostics and `npx tsc --noEmit` pass after each route batch.
12. No temporary routes, profiles, screenshots, scripts or audit files remain unless the
    prompt explicitly requires a reusable checked-in audit harness.

**Definition of success:** the illustrations should feel like one studio designed them,
while each page still has its own object and visual metaphor.

---

## 1) Non-negotiable intent

### 1.1 Keep the existing medium

- Keep the current CSS/DOM/SVG illustration system.
- Do not add Three.js, React Three Fiber, canvas, WebGL, GLB/GLTF, model-viewer or a 3D
  asset pipeline.
- Do not download stock 3D models.
- Do not replace the illustrations with screenshots, stock photos or generic gradients.
- Do not flatten every route into the same card or dashboard mockup.

### 1.2 Preserve route identity

The current metaphors are intentional. Improve their construction; do not replace them:

- Industries remains six sector miniatures.
- Tools remains calculator console plus document press.
- Blog remains an editorial press.
- Solutions remains the seven-module service engine.
- Act remains a legal codex.
- Rules remains an operational index/drawer machine.
- Rights remains a rotary rights control.
- Scanner remains an inspection gantry.
- Security remains a defensive fortress.
- Templates remains a document archive.
- Certification remains a credential press.
- Cases remains a jurisprudence balance.
- Courses remains a persona router/switchyard.
- Learn remains a learning pathway.
- Why Us remains an integration core.
- Privacy remains a notice vault.
- Terms remains a contract ledger.
- Cookies remains a consent console.
- Framework remains its seven-discipline method visual.

### 1.3 Truth over decoration

- Use only real labels, counts, stages, sections and categories already present in source.
- Do not invent stats, performance claims, durations, outcomes, modules or legal facts.
- Decorative counters must correspond to the real source count.
- Do not change user-facing copy merely to make an illustration fit. Recompose the
  illustration first.

### 1.4 Quality over speed

- Work on one route at a time.
- Never bulk-apply one transform change to all hero components.
- Never open five edit slices before validating the first.
- A route is not complete until every state has been captured and reviewed.
- If a visual direction is unclear, preserve the current metaphor and improve its craft.

---

## 2) Current system facts - read before editing

The source on disk is authoritative. Read the complete current file before touching a
route. This document describes the current architecture, but source wins if it differs.

### 2.1 Shared compact hero contract

`src/app/globals.css` owns these shared classes/tokens:

- `--route-hero-grid-min: 21.5rem`
- `--route-hero-stage-height: 20rem` (320px)
- `--route-hero-tabs-height: 3.25rem` (52px)
- `.route-hero-inner`
- `.route-hero-grid`
- `.route-hero-title`
- `.route-hero-stage`
- `.route-hero-stage-scale > :first-child { scale: 0.82; transform-origin: center top; }`
- `.route-hero-tabs`

These are layout contracts, not permission to blindly scale an old model.

**Critical geometry rule:** a 390px model scaled by `0.82` becomes 319.8px, which fits a
320px stage only when it is anchored at `top: 0`. Retaining old centered positioning such
as `top: 48%` or `top: 50%` plus `translateY(-50%)` pushes its base into the rail and clips
it.

**Critical industries rule:** the compact Industries internal stage is 450px wide and the
original six model coordinate sets already fit within it. Do not wrap them in a 520px
container and apply `scale(0.84)`. That breaks vertical alignment and makes thin lines
blurry.

### 2.2 Theme tokens

Use existing theme-aware tokens:

- `--bg`, `--surface`, `--surface-2`
- `--text`, `--text-muted`, `--text-faint`
- `--line`, `--line-soft`
- `--accent-rgb`, `--gold-rgb`, `--amber-rgb`, `--blue-rgb`
- `--brand-rgb`, `--green-rgb`, `--red-rgb`
- `--inset-hi`, `--glow`

Do not hardcode a light-only white panel or dark-only black shadow when a token can express
it. A material can use restrained `rgb(var(--text-rgb) / alpha)` shadowing and
`rgb(255 255 255 / alpha)` top highlights, but verify both themes.

### 2.3 Typography and density constraints

- Body copy remains at least 15px effective.
- Labels remain at least 12px effective.
- Do not reintroduce global `zoom`.
- Do not use viewport-width font scaling.
- Do not use negative letter spacing.
- Do not shrink labels to make a model fit.
- Model labels must fit their containers in every required locale.

### 2.4 Current interaction pattern

Most heroes have:

- an active state index;
- auto-advance;
- a bottom tab rail;
- hover/focus engagement;
- reduced-motion support;
- a route-specific `data-*` marker.

Preserve these contracts unless a verified bug requires a local correction. Do not remove
keyboard access, active state semantics, progress indication or Easy Read support.

---

## 3) Known failure modes and required repairs

Search for these patterns before editing each component.

### 3.1 Whole-assembly transforms

**Risky pattern:**

```tsx
<motion.div
  className="[transform-style:preserve-3d]"
  animate={{ rotateY: ..., rotateX: ..., scale: ... }}
>
  {/* all text, borders and controls */}
</motion.div>
```

Why it fails:

- Text and one-pixel borders rasterize and blur.
- The object reads as a tilted screenshot rather than a designed machine.
- Hit areas and visual geometry separate under fractional rendering.
- Internal controls can overlap as the perspective compresses one side.

Required approach:

- Keep the complete machine front-facing.
- Use at most a restrained `y: -2px` to `-4px` hover lift on the assembly.
- Put motion on local, nonessential parts: scan beam, seal, indicator, article sheet,
  meter fill, dial marker or status light.
- Never animate essential geometry from `scale: 0.7` or an extreme rotation.

### 3.2 Opacity-gated essential mounting

**Risky patterns:**

```tsx
initial={{ opacity: 0 }}
<AnimatePresence mode="wait">
```

Why they fail:

- Background/occluded tabs throttle animation frames.
- The new model can remain transparent.
- `mode="wait"` can leave the old state mounted forever while React state has advanced.
- Multiple descriptions can accumulate and inflate the hero row.

Required approach:

- Essential model wrapper: `initial={false}`.
- Essential copy: render the current keyed element directly.
- Essential model: present at full opacity on the first frame.
- Animate only a small local detail that does not gate comprehension.

### 3.3 Detached fake depth

Reject these visual shortcuts:

- a separate skewed rectangle attached to the right side of every object;
- a side strip taller than the front face;
- a detached ellipse or oval pretending to be a base;
- a bottom bar that does not align with the object footprint;
- a perspective face with a different border language from the front;
- shadows that float far below the object.

Preferred 2D depth language:

- one clean front elevation;
- a thin top highlight;
- internal edge shading;
- a close contact shadow;
- restrained material gradient;
- consistent corner radius and border;
- optional integrated side face only when its polygon geometry is coherent and shared by
  the whole object, not repeated as a flap on each child.

### 3.4 Model-stage mismatch

Symptoms:

- base cut off at the tab rail;
- roof or label clipped at the top;
- internal pieces hanging below a pedestal;
- model appears tiny inside a large empty stage;
- one state fits but another does not.

Repair method:

1. Measure stage bounds.
2. Measure the model's untransformed coordinate frame.
3. Calculate the required top/bottom clearance.
4. Recompose internal coordinates at native size whenever they already fit.
5. If scaling is necessary, anchor deliberately and calculate the resulting footprint.
6. Capture the tallest, widest and most asymmetric state before accepting the change.

Do not hide the mismatch with `overflow-hidden`.

### 3.5 Control collisions

Check for:

- icon placed over a keypad key;
- long title wrapping into a control region;
- sheet text crossing a roller;
- meter labels colliding with bars;
- active row translating over an adjacent module;
- tab labels wrapping into the progress underline;
- close button or status badge covering copy.

Give every control a defined slot. Use stable grid tracks, `min-w-0`, restrained gaps and
explicit maximum lines where appropriate.

### 3.6 Animation as layout

Do not rely on animation to move content into its usable final position. The zero-animation
frame must be a complete, legible model. Animation may add life; it must not assemble the
basic layout.

### 3.7 Generic motion and constant movement

- No perpetual whole-object bobbing.
- No constant full-panel rotation.
- No every-window blinking pattern.
- No every-key border animation.
- Use one or two meaningful motions per model.
- Reduced motion must render the same complete visual state.

---

## 4) In-scope route inventory and state matrix

Audit these routes in the listed component. Expected state count comes from the current
real config/content and must be confirmed against source before capture.

| Batch | Route | Component | Current metaphor | Expected states | Primary risks to inspect |
| --- | --- | --- | --- | ---: | --- |
| A | `/industries` | `IndustryModelsHero.tsx` | Sector miniatures | 6 | fake tower sides, platform alignment, blank state, native fit |
| A | `/tools` | `ToolsConsoleHero.tsx` | Calculator + document press | 2 | whole-panel tilt, keypad/header collision, pedestal, sheet bounds |
| A | `/blog` | `EditorialPressHero.tsx` | Editorial press | 5 | base clipping, centered scaled model, stacked copy, article insert |
| A | `/solutions` | `SolutionsHero.tsx` | Service engine | 7 | fake chassis extrusion, active-row travel, copy stacking, density |
| B | `/scanner` | `ScannerGantryHero.tsx` | Inspection gantry | 6 | browser-frame blur, beam clipping, signal labels, whole tilt |
| B | `/security` | `SecurityFortressHero.tsx` | Defensive fortress | 6 | ring/pylon overlap, whole tilt, central core readability |
| B | `/templates` | `TemplateArchiveHero.tsx` | Document archive | 4 | drawer/sheet clipping, whole tilt, paper readability |
| B | `/rules` | `RulesIndexHero.tsx` | Rules index machine | 6 | drawer depth, 23-rule counter, rail alignment, whole tilt |
| B | `/act` | `ActCodexHero.tsx` | Legal codex | 9 | page turn clipping, text blur, book base, essential mount |
| C | `/certification` | `CertificationPressHero.tsx` | Credential press | 8 | seal clipping, press fit, module transition accumulation |
| C | `/cases` | `CaseBalanceHero.tsx` | Jurisprudence balance | 4 | fulcrum geometry, label overlap, whole tilt, plate clipping |
| C | `/courses` | `CoursesRouterHero.tsx` | Persona switchyard | 6 | rail routing, persona labels, core alignment, whole tilt |
| C | `/learn` | `LearnPathHero.tsx` | Learning path | 6 | step spacing, marker motion, clipped final station |
| C | `/rights` | `RightsWheelHero.tsx` | Rights control dial | 6 | dial labels, marker clipping, active state legibility |
| C | `/why-us` | `WhyUsIntegrationHero.tsx` | Integration core | 6 | plate convergence, central overlap, excessive perspective |
| C | `/framework` | `FrameworkMethodHero.tsx` | Seven-discipline method | 7 | method labels, active stage fit, line routing |
| D | `/privacy` | `LegalUtilityHeroes.tsx` (`PrivacyVaultHero`) | Notice vault | 6 | overly loud styling, compartment clipping, legal legibility |
| D | `/terms` | `LegalUtilityHeroes.tsx` (`TermsLedgerHero`) | Contract ledger | 6 | ledger lines, clause labels, whole tilt |
| D | `/cookies` | `LegalUtilityHeroes.tsx` (`ConsentConsoleHero`) | Consent console | 4 | locked Essential state, toggles, control overlap, whole tilt |

### 4.1 Out-of-scope routes

Do not redesign these in this program unless a direct regression from an in-scope edit is
proven:

- `/` homepage hero;
- dynamic/detail routes such as `/blog/[slug]`, `/cases/[slug]`, `/rules/[n]`,
  `/courses/[slug]`, `/certification/[module]`, `/templates/[slug]`;
- exams, verification pages and document readers;
- content sections below the hero except where the hero creates actual page overflow.

The scanner promo on `/tools`, for example, is not part of the console model. Do not edit
it because a broken screenshot tool cropped the page. Measure the true viewport first.

---

## 5) Required audit artifacts

Create a durable audit record at:

```text
docs/hero-illustration-quality-audit.md
```

The audit must contain one row per in-scope route:

| Route | Component | States | Baseline captured | Root cause | Files changed | Desktop | Tablet | Mobile | Light | Dark | Reduced motion | Locales | Result |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

For each route, include:

1. Baseline screenshot filenames or contact-sheet name.
2. Exact local diagnosis, in one to three sentences.
3. The controlling code path, not merely the route wrapper.
4. The smallest intended edit.
5. Before/after measurements for model and stage bounds.
6. State-by-state result.
7. Any residual risk.

Do not write "looks good" without measurements and screenshot evidence.

### 5.1 Optional reusable harness

If repeated manual capture becomes error-prone, add:

```text
scripts/audit-hero-illustrations.mjs
```

Use only built-in Node APIs plus an installed Chromium browser. Do not add Playwright or
Puppeteer solely for this audit unless the repository already adopts one.

The harness should:

- locate Edge/Chrome;
- open the current local server;
- use the DevTools protocol;
- set exact device metrics;
- set consent storage to prevent the banner obscuring captures;
- set locale/theme state deliberately;
- navigate to each route;
- wait for the route's `data-*` hero marker;
- select or deterministically expose each state;
- save PNGs under an ignored temporary directory;
- report `innerWidth`, `scrollWidth`, hero bounds, stage bounds and active state;
- fail when the page is wider than the viewport or the expected state count is missing.

The harness must never write a production route merely to expose state. If a temporary
verification route is unavoidable, create it only during local verification and delete it
before final checks.

---

## 6) Visual quality standard

### 6.1 Material language

Use a quiet, precise, professional instrument language:

- one-pixel theme-aware borders;
- close contact shadows;
- subtle inset top highlights;
- restrained surface gradients;
- clear front elevation;
- sparse accent colour;
- readable controls;
- consistent small radii (generally 2px to 8px inside models);
- no oversized rounding that turns machinery into toy cards.

Accent colour should indicate state and function, not flood every surface.

### 6.2 Depth hierarchy

A convincing 2D object should have this order:

1. Background aura or grid.
2. Ground/contact shadow.
3. Chassis/base.
4. Primary face.
5. Internal modules/controls.
6. Active-state accent.
7. One meaningful animated detail.

Do not place a decorative pedestal over the lower part of the model. Do not let a shadow
read as a second object.

### 6.3 Line hierarchy

- Outer chassis border: strongest.
- Internal module border: medium.
- Decorative grid/window border: weakest.
- Active accent edge: strong but local.
- Do not use the same line opacity for every nested rectangle.

### 6.4 Text inside illustrations

- Keep model text horizontal and crisp.
- Do not rotate the parent containing text.
- Kicker and status labels use `text-label` or equivalent 12px floor.
- Main model title must fit one line where the design allocates one line.
- If the title is long, reallocate control slots or reduce model-local title size one step;
  do not overlap controls.
- Never place icons over text or keypad keys.

### 6.5 Windows, keys, modules and repeated elements

- Repetition should have restrained variation, not synchronized flashing.
- Highlight only a deterministic minority.
- Use stable dimensions so animation never changes layout.
- A selected key/module may carry a subtle tint; inactive elements remain readable.

### 6.6 Pedestals and shadows

A pedestal is allowed only when it is structurally connected to the model. Otherwise use
a contact shadow. Avoid large white ellipses beneath rectangular equipment.

### 6.7 Theme behavior

For each route capture both:

```js
document.documentElement.setAttribute("data-theme", "light")
document.documentElement.setAttribute("data-theme", "dark")
```

Do not rely on a browser `--force-dark-mode` flag; this app uses explicit theme tokens and
persisted theme state.

---

## 7) Page-by-page implementation workflow

Repeat this entire workflow for one route before opening the next edit slice.

### Step 1 - Read the owner

Read:

- route `page.tsx`;
- complete hero component;
- config/content records supplying states;
- relevant shared `.route-hero-*` CSS;
- one neighboring hero only if needed to understand a local convention.

Do not map the entire repository before the first edit.

### Step 2 - Capture baseline

At minimum capture:

- `1366x768` desktop;
- `1440x1000` desktop;
- `1024x768` tablet;
- true `390x844` mobile via DevTools device metrics;
- light and dark desktop;
- reduced-motion desktop;
- every hero state at desktop.

Create a contact sheet for multi-state heroes.

### Step 3 - Measure

Record:

- viewport width and height;
- document `scrollWidth`;
- hero bounds;
- grid bounds;
- stage bounds;
- model bounds;
- tab rail bounds;
- active state key/index;
- model descendants extending beyond the stage;
- visible live-region count;
- essential nodes at zero opacity.

A screenshot alone is not enough to diagnose geometry.

### Step 4 - Name one falsifiable local hypothesis

Examples:

- "The press is cut off because the 390px model is scaled to 319.8px but remains
  vertically centered in a 320px overflow-hidden stage."
- "The keypad overlaps because its 140px footprint begins above the header's lower edge."
- "Education is blank because the essential parent mounts at opacity 0 and the hidden tab
  never advances the animation."
- "The tower side looks detached because every tower appends an independent 24px skewed
  rectangle beyond its front face."

### Step 5 - Make the smallest grounded edit

Prefer:

- native-size recomposition;
- top anchoring;
- integrated shading;
- stable grid tracks;
- direct keyed rendering;
- local motion;
- `min-w-0` and explicit control slots.

Avoid:

- global scaling;
- shared CSS changes for a local defect;
- increasing hero height before proving internal recomposition cannot fit;
- hiding overflow;
- deleting useful content;
- shrinking all text.

### Step 6 - Immediate focused validation

The next action after the first edit must be the narrowest executable check:

```powershell
npx eslint "src/components/sections/<HeroFile>.tsx"
```

Then inspect editor diagnostics for the touched file. If the route has a focused test, run
it before more edits.

### Step 7 - Recapture the same matrix

Use the same viewports, theme, motion and state order as baseline. Compare like for like.

### Step 8 - Update the audit row

Only mark the route complete when all acceptance checks pass.

### Step 9 - Stop at batch boundary

After each batch in Section 4:

- run `npx tsc --noEmit`;
- run focused ESLint for every touched hero;
- fetch every batch route and require HTTP 200;
- inspect new dev-server logs only;
- present contact sheets for review;
- do not begin the next batch if any route is unresolved.

---

## 8) Route-specific review guidance

### 8.1 Industries

Preserve all six real sectors and the shared controlled state with the detail section.

Inspect:

- BFSI tower edges and windows;
- Healthcare wings and cross;
- Education roof/body relationship;
- SaaS rack alignment and cloud connector;
- E-Commerce storefront, awning and parcels;
- Government dome, columns and base.

Hard rules:

- No independent skewed side flap on each tower.
- Render original coordinate sets at native size when they fit the 450px stage.
- Essential wrapper uses `initial={false}`.
- Every state must appear in normal motion and reduced motion.

### 8.2 Tools

Preserve Calculator and Document Studio.

Calculator acceptance:

- straight front-facing chassis;
- private-engine label on one line;
- Penalty/ROI/Breach title in its allocated header line;
- controls icon in a dedicated slot;
- keypad entirely below header;
- meters do not collide with keypad;
- no detached oval pedestal;
- keys do not all flash.

Document Studio acceptance:

- complete press frame;
- rollers align;
- sheet remains inside output slot;
- labels remain readable;
- no whole-panel perspective rotation.

### 8.3 Blog

- A scaled 390px press must be top-anchored in the 320px stage.
- The base must remain above the rail.
- Render one current desk description directly.
- Render one current article sheet directly.
- Keep the insert complete even when animation is throttled.

### 8.4 Solutions

- Service engine remains a seven-module instrument.
- Exactly one active module.
- Active row travel remains restrained (about 4px to 8px, not 30px).
- Chassis depth must be coherent; no single skew strip pretending to be the whole side.
- Inactive rows remain readable.
- Header, rail, module labels and state counter stay aligned.

### 8.5 Scanner and Security

- Remove whole-frame perspective transforms containing text.
- Preserve scan beam, ring or pylon motion locally.
- The first frame must show the complete browser/fortress.
- Signals and controls must fit long labels.

### 8.6 Act, Rules and Templates

- Paper/document text remains crisp.
- Pages, drawers and sheets cannot depend on opacity-from-zero entrance.
- Legal labels and counters are factual and readable.
- Moving paper must remain within a visible slot throughout its animation.

### 8.7 Certification, Cases, Courses, Learn, Rights, Why Us and Framework

- Keep each route's current metaphor.
- Confirm the largest/tallest state, not only state 1.
- Keep active controls semantically selected.
- Recompose local geometry rather than enlarging the shared stage.
- Use one meaningful local motion and a complete reduced-motion state.

### 8.8 Privacy, Terms and Cookies

These are legal pages. Keep them quieter than product pages.

- Low-contrast decorative machinery, high-contrast legal copy.
- No aggressive glow or constant movement.
- Consent console must show Essential as locked and cannot imply optional consent is
  required.
- All controls remain legible and logically grouped.

---

## 9) Responsive requirements

### 9.1 Desktop

Required widths:

- 1024px
- 1280px
- 1366px
- 1440px

At 1366x768:

- hero title, active state, model and rail must be visible;
- model must not touch or cross the rail;
- next section should be hinted where the existing compact page contract intends it;
- no model may force the hero taller through stale exiting content.

### 9.2 Mobile

Required true device viewport:

- 390x844 through `Emulation.setDeviceMetricsOverride`.

Do not trust only:

```text
msedge --headless --window-size=390,844
```

Headless Chromium may impose a roughly 500px minimum layout viewport and crop the image to
390px, falsely making a healthy page look horizontally clipped. Always record
`window.innerWidth` and `document.documentElement.scrollWidth` in the capture.

Mobile acceptance:

- `scrollWidth === innerWidth`;
- title and active description fit;
- tab rail is horizontally usable or all short controls fit;
- decorative desktop model is deliberately hidden or simplified;
- no empty desktop-stage height remains;
- first content section stays within viewport;
- fixed cookie/chat controls remain inside the true viewport.

### 9.3 Long locales and RTL

Test at least:

- English (`en`);
- Hindi (`hi`);
- one locale with long translated labels;
- one RTL locale (`ur`, `sd` or `ks`).

Check:

- tab labels;
- state descriptions;
- model-local text;
- numeric counters;
- direction of meaningful progress or document flow;
- no transformed text mirroring.

Do not edit translations unless visible source copy changes.

---

## 10) Accessibility and motion requirements

- Keep one semantic `h1` per route.
- Keep tablists and `aria-selected` states.
- Keep keyboard navigation where present.
- Decorative models remain `aria-hidden`.
- Current state copy uses one visible live region, not stacked exiting regions.
- Focus must pause or safely defer auto-advance where the current hero contract requires.
- Manual selection must not be immediately overridden.
- `prefers-reduced-motion` must show the same complete information.
- No flashing faster than accessibility guidance.
- Do not animate opacity of essential content from zero.

---

## 11) Verification protocol

### 11.1 Server discipline

Before capture:

1. Confirm one listener on port 3000.
2. Confirm the owner command line points to this exact workspace.
3. Do not run `next build` while `next dev` is active.
4. Use `npx tsc --noEmit` for type validation during development.
5. Fetch the route and require HTTP 200.

### 11.2 Clean screenshots

Before screenshot capture, set a valid consent record so the cookie banner does not cover
the model:

```js
localStorage.setItem(
  "dpdp-consent",
  JSON.stringify({ v: "2025-06", cats: { essential: true } })
);
```

Capture the real page, not a synthetic isolated component, for final smoke evidence.

### 11.3 State verification

For each state record:

- state index;
- state key/name;
- selected-tab count (must equal 1);
- stage display and bounds;
- model bounds;
- visible live-region count;
- horizontal overflow;
- screenshot filename.

If auto-advance is used for capture, verify the captured state key; do not infer state from
elapsed time alone.

### 11.4 Visual contact sheets

For multi-state heroes create one labeled contact sheet. Review it at readable size. The
sheet is required evidence, but temporary image files must be removed after review unless
the repository intentionally tracks visual baselines.

### 11.5 Commands

Per route:

```powershell
npx eslint "src/components/sections/<HeroFile>.tsx"
```

Per batch:

```powershell
npx tsc --noEmit
```

Then fetch all batch routes and scan only new dev-log output for:

```text
SyntaxError
TypeError
GET ... 500
Build Error
Module not found
hydration
```

If `npm run audit:i18n` has a baseline failure unrelated to these no-copy visual edits,
record it separately. Do not regenerate 22 language catalogs when no visible string changed.

---

## 12) Hard acceptance checklist for every route

A route cannot be marked complete unless every applicable item is yes.

### Geometry

- [ ] Model fits inside stage.
- [ ] Model does not cross tab rail.
- [ ] No essential part is hidden by overflow.
- [ ] No detached fake side face.
- [ ] No detached decorative pedestal.
- [ ] Contact shadow aligns with footprint.
- [ ] Internal controls have stable slots.
- [ ] Text does not overlap controls.

### Rendering

- [ ] Complete first frame.
- [ ] Complete reduced-motion frame.
- [ ] No opacity-gated essential mount.
- [ ] No `mode="wait"` dependency for essential state.
- [ ] No whole-assembly perspective transform containing text.
- [ ] One visible active state.
- [ ] Inactive states do not remain in layout.

### Visual quality

- [ ] Light theme reads clearly.
- [ ] Dark theme reads clearly.
- [ ] Border hierarchy is coherent.
- [ ] Accent colour is restrained.
- [ ] Repeated elements are stable and not toy-like.
- [ ] Model remains route-specific.

### Responsive

- [ ] 1366x768 passes.
- [ ] 1440x1000 passes.
- [ ] 1024x768 passes.
- [ ] True 390x844 passes.
- [ ] `scrollWidth === innerWidth` on mobile.
- [ ] Hidden desktop stage leaves no empty hole.
- [ ] Tabs remain usable.

### Content and interaction

- [ ] All real states captured.
- [ ] Exactly one tab selected.
- [ ] Keyboard/focus behavior preserved.
- [ ] Auto-advance does not fight manual selection.
- [ ] No fabricated text or data.
- [ ] Required locales pass.

### Engineering

- [ ] Focused ESLint passes.
- [ ] Editor diagnostics are clean.
- [ ] Batch TypeScript check passes.
- [ ] Route returns HTTP 200.
- [ ] No new log errors.
- [ ] No scratch artifacts remain.

---

## 13) Batch rollout and sign-off order

### Batch A - Current high-visibility reference set

1. `/industries`
2. `/tools`
3. `/blog`
4. `/solutions`

Why first: these four establish the approved visual language for buildings, consoles,
presses and modular engines. Do not proceed until the contact sheets are reviewed.

### Batch B - Operational machines

1. `/scanner`
2. `/security`
3. `/templates`
4. `/rules`
5. `/act`

### Batch C - Learning, trust and institutional models

1. `/certification`
2. `/cases`
3. `/courses`
4. `/learn`
5. `/rights`
6. `/why-us`
7. `/framework`

### Batch D - Restrained legal models

1. `/privacy`
2. `/terms`
3. `/cookies`

At every batch boundary provide:

- routes completed;
- root causes fixed;
- files changed;
- before/after contact sheets;
- viewport/theme/locale matrix;
- lint/type/HTTP results;
- unresolved risks;
- explicit recommendation to proceed or stop.

---

## 14) Anti-regression rules

- Do not reintroduce real 3D dependencies.
- Do not reintroduce `scale(0.84)` around Industries models.
- Do not mount essential model wrappers at `opacity: 0`.
- Do not center a scaled 390px press in a 320px overflow-hidden stage.
- Do not rotate complete text-bearing machines with `rotateX`/`rotateY`.
- Do not append independent skewed rectangles to every tower.
- Do not place controls over keypad keys or labels.
- Do not use a detached white ellipse as a universal pedestal.
- Do not infer mobile overflow from a headless Chromium cropped screenshot; measure the
  true emulated viewport.
- Do not change shared hero CSS to fix one component unless at least three verified routes
  have the same root cause and all three are tested in the same patch.
- Do not run destructive git or filesystem commands.
- Do not revert concurrent user changes.

---

## 15) Required final report

The final response must state:

1. Every route audited.
2. Every route changed.
3. The root cause fixed on each changed route.
4. The number of states screenshot-verified per route.
5. Desktop, mobile, theme, reduced-motion and locale results.
6. Focused ESLint and full TypeScript results.
7. Any baseline failures not caused by the work.
8. Any route deliberately left unchanged and why.
9. The location of `docs/hero-illustration-quality-audit.md`.

Do not claim completion with phrases such as "all good" or "looks polished" without the
completed matrix and screenshot evidence.

---

## 16) Execution instruction

Execute this program with senior product-design and frontend-engineering judgment.
Preserve the current brand, content, route behavior and compact density. Spend real effort
on each model. Diagnose locally, edit minimally, validate immediately, and do not advance
until the current route is demonstrably complete.
