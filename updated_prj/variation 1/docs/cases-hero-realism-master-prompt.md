# MASTER PROMPT - Rebuild the Cases hero as a realistic jurisprudence balance

> Paste this entire file into a coding agent working in this repository.
> This is an implementation brief, not a request for concepts or a mood board. The agent
> must inspect the current route, capture the baseline, rebuild the illustration, verify
> all four states, and leave the working code in the repository.

---

## 0) Mission

Rebuild the desktop illustration in the `/cases` hero so it reads immediately as a
credible, carefully constructed judicial balance weighing a real case dossier.

The current composition looks like disconnected wireframe parts: a thin white bar, a
rectangular post, two floating oval plates, a hovering file card and an unrelated 2x2
icon grid. The complete assembly is also tilted in 3D, which makes the one-pixel lines
and text look soft. It feels like a diagram placeholder rather than a finished legal
editorial illustration.

Create **physically coherent illustrated realism** within TrustStack's existing
CSS/DOM/SVG visual language. This does not mean adding a photo, stock image, Three.js,
WebGL or a downloadable 3D model. It means believable construction, materials,
proportions, suspension, grounding, light and motion.

Do not stop after describing a design. Implement it and verify it.

### Definition of done

The route is done only when:

1. The first desktop frame is recognizably a professional brass judicial balance on a
   substantial integrated base, with an active legal dossier visibly resting on one pan.
2. The mast, fulcrum, beam, suspension chains, pans, base and dossier form one connected
   object in one coordinate system.
3. The beam may tilt slightly, but the pans remain horizontal and their suspension lines
   are recalculated from the beam endpoints. No pan or chain rotates as a rigid child of
   the beam.
4. The active dossier is never floating, clipped, transparent or detached from its pan.
5. The duplicate 2x2 icon toolbar is removed from the illustration. The real bottom tab
   rail already provides category navigation.
6. All four real categories render correctly and remain selectable:
   - Right to privacy
   - Consent & confidentiality
   - Surveillance & the state
   - Speech & the internet
7. The assembly is front-facing and crisp. No parent `rotateX`, `rotateY`, perspective
   tilt or hover scale is applied to text-bearing geometry.
8. Light theme, dark theme, reduced motion, 1024px desktop and true mobile all pass.
9. Focused ESLint, editor diagnostics and `npx tsc --noEmit` pass.
10. Before/after evidence and the `/cases` audit row are completed in
    `docs/hero-illustration-quality-audit.md`.

---

## 1) Start from the real owning code

Read these files before editing:

- `src/components/sections/CaseBalanceHero.tsx`
- `src/content/hero-configs.ts` (`cases` config)
- `src/app/globals.css` (the `route-hero-*` contract and theme tokens)
- `scripts/audit-hero-illustrations.mjs`
- `docs/hero-illustration-quality-audit.md`
- `docs/sitewide-hero-illustration-quality-master-prompt.md` only for shared audit rules

The source on disk is authoritative if it differs from this brief.

### Current behavior that must survive

- `data-case-balance`, `data-case-index` and `data-case-category` remain available.
- Four category tabs remain real buttons with correct selected semantics.
- Manual selection remains immediate.
- Existing auto-advance remains, unless a verified local bug requires a narrow fix.
- Hover/focus engagement and `prefers-reduced-motion` support remain.
- Easy Read spans and the route's existing copy remain intact.
- The decorative stage remains hidden at mobile sizes without leaving an empty height.

Do not modify case-law content, detail routes, navigation, the site header or unrelated
hero components.

---

## 2) Baseline diagnosis to confirm

Capture the existing `/cases` route before editing and confirm or correct this diagnosis:

1. **Disconnected construction:** the mast does not visually join the base, fulcrum and
   beam as a load-bearing object.
2. **Incorrect suspension:** the chain lines and pans are nested inside the rotating beam,
   so they rotate with it instead of hanging under gravity.
3. **Flat pan geometry:** each pan is a detached outlined ellipse with no rim, bowl depth,
   attachment point or interior surface.
4. **Floating dossier:** the active card occupies roughly the same area as a pan but does
   not visibly sit inside one or cast a close contact shadow onto it.
5. **Weak proportions:** the balance is sparse and undersized relative to the available
   stage, while the top-right 2x2 icon grid competes with it without belonging to it.
6. **Blurry presentation:** the complete `560 x 390` text-bearing assembly uses parent
   `rotateY`, `rotateX` and `scale` transforms, then relies on shared stage scaling.
7. **Generic background:** the graph-paper grid reinforces the unfinished CAD-diagram
   feeling instead of an authoritative legal/editorial setting.
8. **Potential stale transitions:** essential copy and dossier content are wrapped in
   `AnimatePresence`; verify that auto-advance never leaves prior content mounted or a
   new state invisible in a throttled tab.

State one falsifiable local hypothesis before the first code edit. A suitable hypothesis
is: replacing the nested rotating DOM assembly with a front-facing balance whose moving
points share one geometry model will remove the visual detachment and make every state
look intentional. The cheapest disconfirming check is a screenshot plus geometry check
for all four states: if a pan center is not directly below its beam endpoint, or a dossier
does not overlap its pan interior, the implementation is still wrong.

---

## 3) Approved visual direction

Build a **museum-quality legal desk instrument**, not a dashboard, abstract constellation
or futuristic machine.

### 3.1 Overall composition

Use a single compact front elevation with these layers:

1. A very restrained editorial background field.
2. A close, soft contact shadow matching the actual base footprint.
3. A low dark-stone or warm-charcoal plinth with a fine top highlight.
4. A substantial brass mast rising from a visible socket in the plinth.
5. A circular fulcrum housing with a real central pin and small engraved accent ring.
6. A tapered brass beam that pivots at the pin.
7. Two suspension assemblies, each connected to a beam endpoint.
8. Two shallow metal pans with rim, inner bowl and underside shading.
9. One active manila/ivory legal dossier resting inside the lower pan.
10. A restrained category accent on the dossier tab, seal and one small fulcrum marker.

The balance should occupy approximately 80-88% of the usable stage width and 86-94% of
its height at the primary desktop capture. It must feel substantial without touching the
stage edges or bottom tab rail.

### 3.2 Material language

Use the existing theme tokens. Do not hardcode a light-only illustration.

- **Brass:** use `--gold-rgb` and `--amber-rgb` in a restrained three-stop material
  gradient, with one narrow top highlight and one darker lower edge.
- **Plinth:** use `--surface`, `--surface-2`, `--line` and theme-aware inset/shadow tokens.
- **Paper:** use a theme-aware warm paper surface, not pure white. Keep dossier text at
  full readable contrast in both themes.
- **Active category:** use the existing node color only for a narrow file tab, small seal,
  fine rule or indicator. Do not flood the entire balance with state color.
- **Shadows:** use close contact shadows and subtle internal shading. No giant glow,
  detached ellipse, neon aura or shadow floating far below the object.

The result should feel warm, editorial and institutional. Avoid saturated tech styling,
blue-dominant gradients, glassmorphism and toy-like gold everywhere.

### 3.3 Realistic structural details

The silhouette must remain clear at screenshot scale. Include enough detail to imply a
real object without turning it into visual noise:

- tapered beam ends or end caps;
- a visible pivot pin and collar;
- a mast foot/socket integrated into the plinth;
- two fine suspension lines per pan, forming a stable triangle;
- a pan rim plus a shallow curved bowl, not only an ellipse;
- a small pan attachment ring or hook;
- a dossier folder tab, two or three document edges, a clipped corner or paper fastener;
- a close dossier-to-pan shadow proving that the file rests on the pan;
- one or two engraved hairlines on the plinth, no fake legal statistics.

Do not draw ornamental scales-of-justice clip art inside the fulcrum. The object itself is
already the scales. A simple pin, collar or restrained TrustStack mark is more credible.

### 3.4 Dossier content

The active dossier may show only truthful state content already present in source:

- `DOSSIER 01` through `DOSSIER 04`;
- the active category name;
- the corresponding existing Lucide icon as a small stamped/seal detail, if useful;
- neutral document rules with no fabricated case number, court, date, judgment, score or
  legal claim.

The long title `Consent & confidentiality` must fit without clipping. Allocate enough
width and allow a deliberate two-line title. Do not reduce essential model text below a
12px effective size.

---

## 4) Geometry and mechanics

Prefer one shared coordinate system for the structural illustration. A single inline SVG
for the balance is acceptable and likely simpler than independently positioned DOM
rectangles. A carefully measured DOM/CSS implementation is also acceptable, but all
moving points must come from one geometry model.

Use a native front-facing frame that fits the current stage. A useful target is a
`viewBox` or coordinate frame around `600 x 320`, rendered with a responsive maximum
width. Confirm the actual stage at 1024px before locking dimensions.

### 4.1 Required physical relationship

For a beam centered at `(cx, cy)`, with half-span `L` and state angle `theta`, derive the
left and right endpoints from the same values. The exact implementation can use SVG
transforms or small helpers, but the visual result must obey these rules:

- the beam pivots around the visible fulcrum pin;
- each suspension assembly begins exactly at its beam endpoint;
- each pan center remains directly below its endpoint;
- each pan remains horizontal while the beam tilts;
- both chain triangles keep the same drop length and spread;
- the dossier remains inside and moves with its pan;
- the dossier never rotates with the beam;
- the loaded pan is slightly lower than the unloaded pan.

Do **not** put chains, pans or dossier inside the same rotated group as the beam. That is
the central physical error in the current implementation.

Keep the state tilt subtle, generally within `1.5deg` to `3deg`. A `5deg` beam tilt reads
as a cartoon and creates excessive pan travel in a compact hero.

### 4.2 Fit targets

Use measurements, not visual guesswork:

- at least 8px clearance from every stage edge;
- at least 12px clearance above the tab rail;
- no transformed descendant outside the stage;
- base width roughly 210-260px, visibly wider than the mast socket;
- beam width roughly 390-440px;
- pan width roughly 125-150px with visible bowl depth;
- dossier width roughly 120-145px, small enough to sit inside the pan rim;
- no label or icon collision at any state.

These are proportion targets, not permission to force a bad fit. Adjust after measuring
the real stage at 1280px and 1024px.

---

## 5) State behavior and motion

The four states should feel like four files being weighed by the same instrument, not
four unrelated illustrations.

### Required state changes

- dossier number;
- dossier title;
- dossier accent color;
- small dossier icon/seal, if retained;
- subtle beam/pan position derived from the active state.

Keep the dossier on the same logical pan across all states unless source content gives a
real reason to move it. Arbitrarily alternating left and right by odd/even index is not
meaningful and should be removed. Consistent placement produces a calmer, more credible
instrument.

### Motion rules

- Render the complete essential balance and current dossier on the first frame.
- Use `initial={false}` for essential keyed content.
- Do not enter from `opacity: 0`.
- Do not use `AnimatePresence mode="wait"` for essential copy or dossier content.
- Prefer direct keyed content with a small color/position transition.
- The whole assembly may lift at most 2-3px on engagement. Do not scale or tilt it in 3D.
- A short, damped beam adjustment on category change is meaningful.
- A one-time 300-500ms highlight passing across the dossier fastener or brass collar is
  optional. No perpetual shimmer, bobbing, rotating emblem or blinking icon grid.
- Reduced motion must show the same complete final geometry immediately.

The timer, manual tabs and focus behavior must not fight each other. Preserve current
behavior unless baseline testing exposes a real defect, then make the smallest local fix.

---

## 6) Copy, accessibility and responsive behavior

### Essential copy

Render exactly one active dossier description in the left copy column. Prefer a direct
keyed live region over overlapping exiting nodes. Preserve:

- `Privacy jurisprudence`;
- the `Cases` heading and Easy Read variant;
- `Dossier NN / 04`;
- active category name;
- the existing category description.

Do not rewrite legal copy to fit the visual.

### Accessibility

- Keep the illustration decorative with `aria-hidden="true"`.
- The bottom controls remain the only tab interface.
- Exactly one tab has `aria-selected="true"`.
- Every tab remains keyboard reachable with a visible focus state.
- The active textual description has one stable `aria-live="polite"` owner.
- Do not duplicate dossier text into the accessibility tree from the decorative model.

### Responsive behavior

- Desktop: render the full illustration, with measured fit at 1440, 1280 and 1024 widths.
- Mobile/tablet below the existing desktop breakpoint: preserve the current intentional
  hiding of the decorative stage and ensure it contributes no blank fixed-height gap.
- At 390px, `document.documentElement.scrollWidth` must equal `window.innerWidth`.
- Do not change shared `route-hero-*` CSS to solve a route-local problem unless a proven
  shared defect requires it and other routes are retested.

---

## 7) Background treatment

The background must support the object instead of making it look like unfinished CAD.

- Reduce or replace the obvious square graph-paper grid.
- Prefer a restrained editorial field: one faint horizontal legal-rule pattern, a subtle
  paper/grain effect made with CSS, or a quiet spotlight behind the brass silhouette.
- Keep enough contrast that the beam and suspension lines remain visible in both themes.
- Do not add gradient orbs, bokeh blobs, a dark vignette, a giant seal watermark or fake
  courtroom scenery.
- Preserve the page's light, spacious character and the existing border below the hero.

---

## 8) Implementation sequence

Follow this order and validate after the first substantive edit:

1. Run the existing hero audit for the `/cases` baseline and capture all four states.
2. Measure the hero, stage, current assembly, tab rail and overflow at primary desktop,
   1024px and 390px.
3. Record the confirmed root cause in `docs/hero-illustration-quality-audit.md`.
4. In `CaseBalanceHero.tsx`, first remove the whole-assembly 3D transform/scaling path and
   replace only the structural balance with the coherent front-facing geometry.
5. Immediately run the focused `/cases` capture or equivalent narrow check. If the pans,
   chains or dossier do not align, repair this same slice before changing copy/background.
6. Replace the duplicate icon grid and current floating dossier treatment with the
   integrated dossier-on-pan composition.
7. Simplify essential state transitions so the active copy and dossier are always present.
8. Refine materials, line hierarchy, contact shadows and the route-local background.
9. Capture every state in normal and reduced-motion modes, then run the complete matrix.
10. Update the audit row and route evidence only after the implementation passes.

Keep the change local. No new dependency should be necessary.

---

## 9) Required verification

Use the existing script and current local server. Confirm the script's current CLI from
source, then run the equivalent of:

```powershell
node scripts/audit-hero-illustrations.mjs --route cases --phase before
node scripts/audit-hero-illustrations.mjs --route cases --phase after
```

### Screenshot matrix

Capture and inspect:

- all 4 states in normal motion;
- all 4 states in reduced motion;
- 1440px light;
- 1280px light;
- 1024px light;
- primary desktop dark;
- true 390px mobile;
- English plus the shared audit locales: Hindi, Malayalam and Urdu/RTL.

### Geometry checks

For every desktop state, verify:

- one balance assembly exists;
- one current dossier exists;
- one selected tab exists;
- no essential node has computed opacity `0`;
- all visual descendants remain inside the stage;
- the stage remains above the tab rail;
- pan centers sit under beam endpoints;
- pans are horizontal;
- the dossier bounds overlap the loaded pan interior and remain inside the pan width;
- the base/contact shadow follows the actual object footprint;
- no stale prior description or dossier remains visibly mounted.

Add route-local `data-balance-part` markers only if they make these checks reliable. Do
not expose production debug text.

### Engineering checks

Run:

```powershell
npx eslint src/components/sections/CaseBalanceHero.tsx
npx tsc --noEmit
```

Also confirm:

- `/cases` returns HTTP 200;
- editor diagnostics are clean for touched files;
- no new hydration, runtime or build errors appear in the dev log;
- no temporary route, screenshot, profile or scratch file remains in the repository.

Do not run `next build` while `next dev` is writing to the same `.next` directory.

---

## 10) Rejection criteria

Reject the result and continue working if any of these are true:

- it is still mainly thin rectangles and detached ellipses;
- the balance could be mistaken for a clothes rail, antenna or abstract chart;
- a pan or chain rotates rigidly with the beam;
- the active dossier floats above, beside or outside a pan;
- the mast does not visibly connect base, pivot and beam;
- a second icon toolbar remains inside the decorative stage;
- the complete model is rotated in `rotateX`/`rotateY` or scaled on hover;
- gold floods every surface or a large glow substitutes for material detail;
- labels are tiny, blurred, clipped or overlapping;
- `Consent & confidentiality` does not fit cleanly;
- light mode looks washed out or dark mode loses edges/shadows;
- any state begins blank or depends on an exit animation completing;
- the model clips at 1024px or creates horizontal mobile overflow;
- only the default state was inspected;
- the final report says merely "looks premium" without screenshots and measurements.

---

## 11) Final report

When finished, report:

1. The confirmed root causes.
2. The exact files changed.
3. The physical construction and state behavior implemented.
4. Before/after assembly and stage measurements.
5. All four state results in normal and reduced motion.
6. Light, dark, 1024px, 390px and locale results.
7. ESLint, TypeScript, HTTP and diagnostics results.
8. Any remaining risk.

The final answer must point to the before/after evidence and state explicitly whether the
`/cases` audit row is ready to be marked Pass.
