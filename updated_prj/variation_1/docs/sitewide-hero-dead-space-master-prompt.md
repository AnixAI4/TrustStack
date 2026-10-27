# MASTER PROMPT - Eliminate dead space across every route hero

> Give this entire prompt to a coding agent working in this repository.
> This is an implementation and verification brief, not a request for design
> suggestions. The agent must inspect the live routes, capture a baseline, fix
> the shared causes of wasted space, verify every affected route, and leave the
> working code in the repository.

---

## 0) Mission

Remove the large, empty, visually disconnected areas that appear inside the
top hero on multiple TrustStack routes.

The attached `/cases` screenshot is the primary reference for the failure. The
page title sits near the top-left, the active dossier summary sits much lower,
the illustration is sparse inside a large fixed stage, and a wide quiet band
dominates the middle of the hero. The result looks unfinished and pushes the
real case-law content down even though the hero does not contain enough useful
information to justify that much space.

This is a sitewide layout-system problem. Do not patch only `/cases`, and do not
interpret the task as simply reducing one `height` value. Fix both:

1. **Structural dead space:** unnecessary height, padding, margins, control-rail
   height, hidden responsive boxes, or hero-to-section gaps.
2. **Perceptual dead space:** a large stage whose actual illustration occupies
   only a small central area, copy split into distant islands, or artwork with
   an oversized internal coordinate canvas.

The finished heroes must feel compact, deliberate and information-rich at 100%
browser zoom. The page identity, active hero state, useful control and a clear
preview of the first real section must be visible on an ordinary laptop.

Do not stop after writing a diagnosis or proposing CSS. Implement the fix and
verify the complete route matrix.

---

## 1) Definition of done

The task is complete only when all of the following are true:

1. The conspicuous empty middle shown in the `/cases` reference is gone.
2. The `/cases` kicker, H1, active dossier number, active category and
   description read as one compact copy group, not two vertically separated
   islands.
3. The `/cases` balance fills its stage with a clear silhouette and no oversized
   invisible canvas around it.
4. Every affected top-level route uses an intentional hero variant
   rather than inheriting the same 344px grid regardless of its content.
5. At `1366x768`, each expressive hero with a control rail is no more than
   400px tall; a hero without a rail is no more than 360px tall; restrained
   legal heroes are no more than 320px tall. A route may exceed a bound only if
   measured translated or Easy Read content genuinely requires it, and the
   exception is documented.
6. At least 180px of the first real content section is visible at `1366x768`
   without scrolling. A heading alone does not count; the user must see enough
   of the first card, article, tool or section body to understand what follows.
   The same documented exception rule applies when translated or Easy Read
   content genuinely requires more natural height; normal English mode must
   always meet the 180px target.
7. No desktop copy group has an unexplained internal vertical gap over 28px.
8. Essential copy occupies at least 68% of its allocated desktop grid lane's
   height unless the route intentionally uses a shorter content-led grid.
9. Substantive hero artwork occupies at least 72% of its stage width and 72% of
   its stage height, measured by the union of its visible structural parts.
10. Hiding an illustration below the desktop breakpoint leaves no reserved
   height, blank grid row or off-screen transformed footprint.
11. There is no horizontal overflow, clipping, overlap or unreadably small text
    at any required viewport, locale, theme or reading mode.
12. Body text remains at least 15px, micro-labels remain at least 12px, and
    mobile interactive targets remain at least 44px.
13. Focused ESLint, `npx tsc --noEmit`, route HTTP checks and the expanded hero
    audit pass with no new errors.

These are acceptance bounds, not instructions to absolutely position a page to
match one screenshot.

---

## 2) Start from the real owning code

Read the current source before editing. Source on disk is authoritative if it
has changed since this prompt was written.

Begin with:

- `src/app/globals.css`
- `src/components/sections/CaseBalanceHero.tsx`
- `src/components/sections/PageHero.tsx`
- `src/content/hero-configs.ts`
- `scripts/audit-hero-illustrations.mjs`
- `docs/site-density-and-compact-heroes-master-prompt.md`
- `docs/sitewide-hero-illustration-quality-master-prompt.md`
- `docs/hero-illustration-quality-audit.md`

Then inventory every top-level route and identify the component that directly
owns its top hero. Do not assume the filename list below is complete.

Current custom hero files include:

- `ActCodexHero.tsx`
- `CaseBalanceHero.tsx`
- `CertificationPressHero.tsx`
- `CoursesRouterHero.tsx`
- `EditorialPressHero.tsx`
- `FrameworkMethodHero.tsx`
- `IndustryModelsHero.tsx`
- `LearnPathHero.tsx`
- `LegalUtilityHeroes.tsx`
- `RightsWheelHero.tsx`
- `RulesIndexHero.tsx`
- `ScannerGantryHero.tsx`
- `SecurityFortressHero.tsx`
- `SolutionsHero.tsx`
- `TemplateArchiveHero.tsx`
- `ToolsConsoleHero.tsx`
- `WhyUsIntegrationHero.tsx`

### Current shared geometry to confirm

At the time this brief was written, `src/app/globals.css` defines:

- `--route-hero-top-space: 2rem`;
- `--route-hero-bottom-space: 1.5rem`;
- `--route-hero-grid-min: 21.5rem` (344px);
- `--route-hero-legal-grid-min: 18rem` (288px);
- `--route-hero-stage-height: 21.5rem` (344px);
- `--route-hero-tabs-height: 3.25rem` (52px);
- desktop `.route-hero-grid { min-height: var(--route-hero-grid-min) }`;
- `.route-hero-stage { height: var(--route-hero-stage-height) }`;
- `.route-hero-grid { align-items: center }`.

Measured in the live English `/cases` route at `1366x768`:

| Element | Baseline |
| --- | ---: |
| Complete hero | 454px |
| Main grid | 344px |
| Copy content | 254px |
| Illustration stage | 344px |
| Bottom tab rail | 53px |
| First real section begins | y = 542px |

The outer measurements alone do not capture the screenshot problem. The copy
and the visible balance use only part of their boxes, so the middle reads as a
large empty slab. The audit must measure inner occupancy as well as hero height.

---

## 3) Falsifiable local hypothesis

Before the first edit, confirm or reject this hypothesis:

> Multiple route heroes look empty because one shared 344px minimum grid and
> stage is being used for content of very different intrinsic heights, while
> several illustrations are drawn inside oversized internal canvases. The
> combination creates both unused layout height and low visual occupancy.

The cheapest discriminating check is:

1. At `1366x768`, measure the hero, grid, copy group, stage, visible artwork
   union, control rail and first real section for `/cases`.
2. Calculate copy occupancy and artwork occupancy.
3. Capture the same measurements for `/courses`, `/tools` and `/why-us`.
4. If the heroes have high inner occupancy and no large blank bands, the shared
   geometry hypothesis is wrong; inspect state transitions, hidden elements or
   route-local margins before editing shared CSS.

Do not continue broad exploration after this check. Once the controlling path
is known, make the smallest grounded edit to `/cases` and immediately rerun the
same focused measurement.

---

## 4) Measure the right thing

Hero height by itself is not a sufficient quality metric. Extend
`scripts/audit-hero-illustrations.mjs` or add an equally deterministic audit so
every affected route records the following.

### 4.1 Required rectangles

Record, in CSS pixels:

- viewport;
- fixed header;
- breadcrumb strip;
- complete `section.page-hero`;
- `.route-hero-inner`;
- `.route-hero-grid`;
- copy-column box;
- union of all visible essential copy descendants;
- H1;
- active-state label and description;
- `.route-hero-stage`;
- union of all visible structural artwork parts;
- `.route-hero-tabs` or route-specific primary control rail;
- first real content section;
- first meaningful card, tool, article or section body inside it.

Add stable `data-*` markers to route-local artwork only when needed for reliable
measurement. Do not add visible debugging labels to production UI.

### 4.2 Derived metrics

Calculate:

```text
copyOccupancyY = visibleCopyUnion.height / grid.height
artworkOccupancyX = visibleArtworkUnion.width / stage.width
artworkOccupancyY = visibleArtworkUnion.height / stage.height
firstContentVisible = max(0, min(viewport.height, firstMeaningfulContent.bottom)
                             - max(0, firstMeaningfulContent.top))
largestCopyGap = largest vertical gap between consecutive visible copy blocks
heroViewportShare = hero.height / viewport.height
```

`firstContentVisible` is the true vertical intersection between the first
meaningful content and the viewport. Do not count space below a short element
or an element that is entirely above or below the viewport.

Use the grid height for `copyOccupancyY` because a natural-height copy column can
otherwise report 100% occupancy while sitting inside a much taller, visibly
empty lane. The normal desktop pass threshold is `copyOccupancyY >= 0.68`.
Content-led variants with no allocated minimum lane may report the metric as
informational, but must still pass the copy-gap and first-content checks.

Also report:

- top and bottom unused space inside the copy column;
- top, bottom, left and right unused space inside the artwork stage;
- any visible element whose transformed bounds leave the stage;
- `document.documentElement.scrollWidth - window.innerWidth`;
- computed `display`, `visibility` and `opacity` for essential active content;
- number of selected controls and number of visibly mounted active-state panels.

### 4.3 Gap classification

Every large gap must be assigned to one of these categories before fixing it:

1. **Container gap:** fixed/min-height, padding, margin, grid row or alignment.
2. **Composition gap:** sparse artwork or an oversized internal canvas.
3. **Content gap:** title and active summary are separated instead of grouped.
4. **Control gap:** a rail or button row is taller than its content requires.
5. **Responsive gap:** a hidden stage still contributes geometry.
6. **Transition gap:** exiting content remains while entering content is absent,
   transparent or waiting for an animation.
7. **Section gap:** hero bottom padding plus following section top padding creates
   a blank band around the divider.

Do not call all seven categories "padding." The fix must target the category
that the measurements prove.

---

## 5) Scope

Audit and fix the top heroes for:

- `/act`
- `/blog`
- `/cases`
- `/certification`
- `/courses`
- `/framework`
- `/industries`
- `/learn`
- `/privacy`
- `/rights`
- `/rules`
- `/scanner`
- `/security`
- `/solutions`
- `/templates`
- `/terms`
- `/cookies`
- `/tools`
- `/why-us`

Also inspect any other top-level route found by the source inventory that uses
`page-hero`, `route-hero-*`, a custom top illustration, or a large first-screen
banner.

Dynamic detail pages, legal readers, quizzes, certificate editors and tools
inside later sections are out of scope unless they independently contain the
same top-of-page dead-space defect.

Do not redesign the site header, breadcrumb behavior, footer, content model,
navigation, card system or unrelated sections.

---

## 6) Shared layout contract

### 6.1 Replace one-size geometry with explicit variants

Do not keep one `--route-hero-grid-min` as the unquestioned size for every
custom hero. Create a small, named set of shared variants based on content need.
For example:

- **compact:** short copy plus light illustration, approximately 264-280px grid;
- **standard:** normal copy plus substantive illustration, approximately
  288-304px grid;
- **legal:** restrained legal pages, approximately 232-264px grid;
- **content-led:** no desktop minimum when the route does not need a fixed stage.

The exact token names may follow the repository style, but each route must opt
into an intentional variant. Avoid route-specific arbitrary literals when two
or more routes share the same need.

Use content-led `min-height`, `height: auto`, grid tracks and normal flow. Do not
use `vh` for desktop hero height; a hero must not grow emptier on a taller
monitor.

### 6.2 Compact baseline

A suitable starting point, subject to measured adjustment, is:

- desktop hero top padding: 20-24px;
- desktop hero bottom padding before a rail: 12-16px;
- standard grid/stage: 288-304px;
- compact grid/stage: 264-280px;
- legal grid/stage: 232-264px;
- desktop control rail: 44-48px;
- copy block spacing: 12px from kicker to H1, 16-20px from H1 to active summary;
- active label to active title: 6-8px;
- active title to description: 8-12px.

These are starting dimensions, not a command to shrink every route identically.
Text wrapping in a real locale may make a hero taller. Natural content growth is
acceptable; unexplained empty space is not.

### 6.3 Keep copy as one visual group

Kicker, H1, current item number, current item title and current description must
read as one group.

- Do not use `justify-between`, `space-between`, separate grid rows with `1fr`,
  or absolute top/bottom anchoring to push the H1 and summary apart.
- Do not give the copy column a fixed height merely to match the artwork.
- Center the complete natural-height copy group against the artwork when there
  is spare space.
- Keep the largest normal gap between consecutive blocks at 28px or less.
- Preserve a clear hierarchy; compact does not mean cramped.

### 6.4 Artwork must fill its stage

Reducing the outer stage while retaining a huge internal canvas and clipping it
is not a valid fix.

For each custom illustration:

- identify the visible structural bounds rather than the wrapper bounds;
- tighten its internal coordinate system around the real object;
- recompose parts so the object occupies 72-90% of stage width and height;
- preserve 8-16px safe clearance from stage edges;
- remove duplicate decorative controls already represented by the real rail;
- remove detached shadows or invisible transformed extents that inflate bounds;
- keep text-bearing artwork front-facing and crisp;
- use route-local responsive composition when an illustration cannot fit the
  shared stage honestly.

Do not solve sparse artwork by applying a blind transform scale to the entire
hero. Scaling a route-local decorative assembly is acceptable only after its
transform origin and translated bounds are measured at every desktop width.

### 6.5 Control rails

- Keep one primary control rail per hero.
- Use 44-48px desktop height unless content proves more is needed.
- Retain at least 44px touch targets on mobile.
- Make narrow layouts a single horizontal, scrollable, snap-aligned row.
- Do not stack four to nine controls into a tall mobile block.
- Remove local `min-h-20` and similar rules that fight the shared compact rail.
- Preserve roles, selected state, keyboard access and visible focus.

### 6.6 Hero-to-section rhythm

Preserve the `page-hero` marker and bottom divider. The existing adjacency rules
for `.page-hero + .section` and a hidden Easy Read introduction must continue to
work.

Measure the final space; do not guess from class names. The divider must read as
the hero's edge, and the first real section must begin soon enough to be visible
in the laptop viewport. Do not use a negative margin to pull later content under
the hero.

---

## 7) `/cases` is the first benchmark

Fix and verify `/cases` before changing the rest of the site.

### 7.1 Copy composition

In `CaseBalanceHero.tsx`:

- keep `Privacy jurisprudence`, the `Cases` H1, dossier counter, active category
  and existing description;
- render them as one compact natural-height stack;
- keep H1-to-dossier spacing between 16px and 20px;
- ensure only one current description is visibly mounted;
- do not rewrite or truncate legal copy to hit a height target.

### 7.2 Balance composition

The current illustration uses a `560 x 390` assembly inside the shared stage,
with thin structural parts occupying only a portion of that coordinate space.
Rebuild or reframe it so the visible balance, pans, base and dossier fill the
new compact stage.

Follow `docs/cases-hero-realism-master-prompt.md` for physical quality, but keep
this task's density requirements authoritative:

- one coherent balance;
- one dossier visibly resting on a pan;
- no duplicate 2x2 icon toolbar;
- no empty perimeter created by a legacy 560x390 wrapper;
- no parent 3D tilt on text-bearing geometry;
- no clipped pan, chain, file or shadow;
- artwork occupancy of at least 78% width and 76% height for this route.

### 7.3 `/cases` acceptance at `1366x768`

- complete hero: 380-400px maximum;
- grid/stage: approximately 280-296px unless measured content requires more;
- rail: 44-48px;
- largest copy gap: 20px maximum;
- copy top and bottom unused space: no more than 24px each;
- first meaningful case-law card: at least 180px visible;
- no artwork part outside the stage;
- all four categories remain selectable and aligned with the displayed copy and
  dossier.

After the first substantive `/cases` edit, immediately rerun the focused
measurement and screenshot. If the empty band remains, repair `/cases` before
editing another route.

---

## 8) Sitewide rollout

After `/cases` passes, migrate routes in small groups.

### Group A - same high-risk pattern

- `/certification`
- `/courses`
- `/learn`
- `/rights`
- `/tools`
- `/why-us`

### Group B - dense or specialized interactive heroes

- `/act`
- `/rules`
- `/industries`
- `/solutions`
- `/scanner`
- `/security`
- `/templates`
- `/blog`
- `/framework`

### Group C - restrained legal heroes

- `/privacy`
- `/terms`
- `/cookies`

For each route:

1. Record the baseline.
2. Classify the gap.
3. Select the smallest suitable shared variant.
4. Tighten the route's actual artwork coordinate box.
5. Remove redundant controls or empty wrappers, not useful content.
6. Run that route's focused screenshot and geometry check.
7. Do not proceed to the next group until the current group passes.

Do not flatten every route into the same generic banner. Preserve each route's
identity and useful mechanism; normalize density, not personality.

---

## 9) Responsive, theme and state requirements

### Desktop and compact desktop

Verify at:

- `1280x720`
- `1366x768`
- `1440x900`
- `1920x1080`
- `1024x768`

The hero must not become taller merely because the viewport is taller. At
`1024x768`, deliberately reduce the artwork or switch to the compact
single-column variant if the two-column composition cannot fit cleanly.

### Mobile

Verify at:

- `390x844`
- `360x800`

When the decorative stage is hidden:

- its computed display must be `none`;
- it must contribute zero layout height;
- the grid must not retain a desktop minimum height;
- the copy must remain a compact natural-height stack;
- controls must remain one horizontal scroll row;
- the document width must not exceed the viewport by more than 1px.

### Themes, reading modes and locales

Verify representative routes in:

- light and dark theme;
- normal and Easy Read mode;
- English;
- one long-label Indic locale;
- Hindi or Malayalam;
- Urdu or another RTL locale;
- normal and reduced motion.

Allow the hero to grow naturally when translated text wraps. Do not restore a
fixed empty stage just to keep every locale at identical height.

### State transitions

Essential copy and the current illustration state must exist on the first
frame and throughout transitions.

- Do not use `AnimatePresence mode="wait"` for essential content.
- Do not make entering essential content start at `opacity: 0`.
- Do not depend on requestAnimationFrame completing before mounting content.
- Prefer direct keyed content or transitions that keep the final state present.
- In reduced motion, render the complete final state immediately.
- Confirm auto-advance never creates a temporarily empty copy or artwork box.

---

## 10) Prohibited shortcuts

Do not use:

- `html`, `body` or app-shell `zoom`;
- `transform: scale(...)` on the site shell or complete hero;
- `html { font-size: 75% }`;
- viewport meta tricks or JavaScript browser-zoom control;
- negative margins that visually cover the gap while preserving bad geometry;
- absolute positioning that removes essential copy from normal flow;
- `overflow: hidden` to conceal clipped artwork;
- smaller-than-15px body copy or smaller-than-12px labels;
- deleting useful content solely to meet a height number;
- one global height reduction without inspecting route-local artwork;
- giant background decoration added merely to fill an empty area;
- a generic marketing card replacing every bespoke illustration;
- fabricated statistics, legal claims, case numbers or product facts;
- unrelated redesigns or refactors.

---

## 11) Required verification

### 11.1 Automated route audit

Expand the route map in `scripts/audit-hero-illustrations.mjs` so every hero in
scope can be captured by name. The audit must produce:

- a screenshot for each required viewport;
- a JSON or clearly parseable measurement record;
- all derived occupancy and gap metrics;
- a non-zero exit code when an acceptance bound fails;
- before and after output directories;
- all active states for routes with tabs or auto-advance.

The command shape may remain:

```powershell
node scripts/audit-hero-illustrations.mjs --route cases --phase before
node scripts/audit-hero-illustrations.mjs --route cases --phase after
```

Then run the equivalent for every route in scope.

### 11.2 DOM assertions

For every viewport assert:

```text
document.documentElement.scrollWidth <= window.innerWidth + 1
hero.bottom <= firstSection.bottom
largestCopyGap <= allowed route bound
visible selected control count == 1
visible active content count == 1
essential active content opacity > 0
hidden mobile stage height == 0
copyOccupancyY >= 0.68, unless the route uses a documented content-led variant
```

For substantive desktop artwork also assert:

```text
artworkOccupancyX >= 0.72
artworkOccupancyY >= 0.72
artwork bounds remain inside stage bounds
```

Use screenshots to judge composition and DOM measurements to judge geometry.
Neither is sufficient alone.

### 11.3 Engineering checks

Run:

```powershell
npx eslint <every touched TypeScript/TSX file>
npx tsc --noEmit
```

Also verify:

- every route in scope returns HTTP 200;
- editor diagnostics are clean for touched files;
- there are no new hydration, runtime or animation errors;
- the dev log contains no new route failures;
- no temporary screenshot, browser profile or scratch file remains in the repo.

Do not run `next build` while `next dev` is writing to the same `.next`
directory.

---

## 12) Rejection criteria

Reject the result and continue working if any of these are true:

- `/cases` still has a large blank band between the H1 and dossier summary;
- only `/cases` was fixed while sibling heroes retain the same failure;
- the hero is shorter but the artwork still floats in a mostly empty stage;
- the stage was clipped instead of recomposed;
- one fixed height was replaced by a different one-size fixed height;
- text or artwork was made tiny to create the impression of compactness;
- the first section is technically present but only its blank padding is visible;
- mobile retains an empty stage after the illustration is hidden;
- long translated labels overlap, clip or widen the document;
- Easy Read text overflows a fixed-height hero;
- a current state disappears during auto-advance or reduced motion;
- tab targets fall below 44px on mobile;
- useful controls or truthful content were deleted;
- a negative margin, shell scale or CSS zoom hides the root cause;
- only the default state, English, light theme or one desktop width was tested;
- the final report uses subjective claims such as "looks cleaner" without
  before/after measurements and screenshots.

---

## 13) Final report

The final answer must include:

- The confirmed root causes, separated into structural and perceptual space.
- Every file changed.
- The shared hero variants/tokens introduced.
- Every route audited and every route changed.
- A before/after table with, at minimum:

```text
route | hero px | grid px | rail px | largest copy gap px |
copy occupancy | artwork occupancy X/Y | first content visible px
```

- `/cases` results for all four states.
- Desktop, 1024px and mobile results.
- Light, dark, Easy Read, translated and RTL results.
- ESLint, TypeScript, HTTP, diagnostics and runtime results.
- Any documented exception and the measured reason it could not meet a common
    bound.

Do not mark the task complete until the attached `/cases` failure is visibly
gone and the full route matrix proves that the same dead-space pattern has not
been left elsewhere. This completion gate is non-negotiable.
