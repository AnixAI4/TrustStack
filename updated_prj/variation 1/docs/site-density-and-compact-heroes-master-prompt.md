# Master Prompt - 75%-Density Site Shell and Compact Route Heroes

> Give this entire prompt to a coding agent working in this repository.
> It is grounded in the current TrustStack source and uses `/industries` as the
> first visual and measurable benchmark before the same compact contract is
> rolled across the other recently added route heroes.

## 0) Product intent

At normal browser zoom, make TrustStack feel as information-dense and well
proportioned as the current site feels when a user manually reduces the browser
to roughly 75%. Do this through the layout system, not by forcing page zoom.

The result must feel like a deliberately composed desktop product, not a large
presentation slide. A visitor on a common laptop must see the page identity,
the hero's useful interaction, and a clear preview of the first real content
section without scrolling.

The attached `/industries` view is the primary problem case. Its newly added
top model hero is visually interesting, but it consumes almost the entire first
viewport and then repeats the same six-sector selection in the following
section.

## 1) Facts from the current implementation

Read the current files before editing. The source on disk wins over this prompt
if it has changed.

- `src/components/sections/IndustryModelsHero.tsx` currently renders:
  - `lg:min-h-[560px]` for the main hero grid;
  - a `h-[430px]` model stage;
  - a `lg:text-9xl` title, which is 128px;
  - a six-tab row with `min-h-20`, which is 80px;
  - `lg:pt-14 lg:pb-8`, which adds another 88px around the content.
- Measured in the live page, the `/industries` hero is about 730px tall. It
  begins below the 64px header and 32px breadcrumb and ends around `y=826`.
  On a 1366x768 laptop, none of the real sector section is visible initially.
- `src/components/sections/IndustriesSection.tsx` immediately renders another
  six-sector selector. The hero and the content section maintain separate
  `active` state, so the two controls can also disagree.
- Many recently added route heroes repeat the same oversized recipe:
  `min-h-[500px]`, `lg:min-h-[540px]`, `h-[430px]`, and `lg:text-9xl`.
- The global typography system in `src/app/globals.css` deliberately removed an
  older root `zoom`. Its body floor is 15-16px and its label floor is 12px.
  Preserve those readability floors.
- The fixed shell height is repeated in three places:
  `Header.tsx` (`h-16`), `SiteFrame.tsx` (`pt-16` / `scroll-mt-16`), and
  `BreadcrumbBar.tsx` (`top-16`). Any shell-height change must update all three
  through one shared contract.

## 2) Non-negotiable interpretation of "75%"

"75%" means the perceived density and amount of useful content visible at
default browser zoom. It does not mean multiplying every pixel by 0.75.

Do not use any of these shortcuts:

- `html { zoom: .75 }`, `body { zoom: .75 }`, or element-wide CSS `zoom`;
- `transform: scale(.75)` on the app shell;
- `html { font-size: 75% }`;
- a viewport meta tag that forces `initial-scale=.75`;
- JavaScript that attempts to control browser zoom;
- a 25% reduction to all text, controls, cards, or touch targets.

Those approaches make 12px labels become 9px, interfere with text-size and Easy
Read controls, distort fixed and `100vw` geometry, and break mobile layouts.
The implementation must instead compact the few things that are actually too
large: shell height, route-hero minimum heights, decorative stages, display
headings, hero gaps, tab rails, and excessive section spacing.

## 3) Definition of done

At 100% browser zoom and a `1366x768` viewport:

1. The fixed header, breadcrumb, complete `/industries` hero, and at least 120px
   of the first real sector section are visible without scrolling.
2. The `/industries` hero is no taller than 480px. Its bottom should normally
   land at or before about `y=590`, including the shell above it.
3. There is only one primary six-sector selector before the Industry Advisor.
   Selecting a sector updates both the hero model and the sector detail card.
4. The first viewport still has a clear visual hierarchy: page title first,
   active sector second, model third. The model is not clipped or reduced to an
   unreadable miniature.
5. Every other newly added top-level route hero follows the shared compact hero
   contract and exposes a hint of its following section at common laptop sizes.
6. Body copy remains at least 15px, micro-labels remain at least 12px, and mobile
   interactive targets remain at least 44px high/wide.
7. There is no horizontal overflow at any required viewport, locale, theme, or
   reading mode.

Treat the pixel targets as acceptance bounds, not as permission to absolutely
position the page to one screenshot.

## 4) Scope

### 4.1 Site shell and shared density

Compact only the high-impact shared geometry:

- fixed header height on desktop;
- corresponding main top offset, sticky breadcrumb offset, and scroll margin;
- default section block spacing;
- shared route-hero padding, title, grid, stage, and control-rail dimensions.

Do not redesign the navigation, colors, typography families, cards, footer,
legal readers, forms, tools, or content architecture. Keep the current 1200px
container unless measurement proves a specific route needs a different local
layout.

### 4.2 Custom route heroes

Apply the compact contract to the current custom top heroes for:

- `/act`, `/blog`, `/cases`, `/certification`, `/courses`;
- `/industries`, `/learn`, `/rights`, `/rules`;
- `/scanner`, `/security`, `/solutions`, `/templates`, `/tools`, `/why-us`;
- the restrained `/privacy`, `/terms`, and `/cookies` heroes.

Preserve each route's real content and signature mechanism. This is a density
pass, not a request to replace every hero with the same generic component.
`/industries` is the prototype and must pass before the rest are changed.

## 5) Shared implementation contract

### 5.1 Centralize dimensions

Add a small set of named, theme-independent density tokens or component classes
in `src/app/globals.css`. Reuse them in the custom hero components instead of
continuing the repeated hard-coded size literals.

A suitable desktop baseline is:

- shell header: 56px on desktop, retain 64px on mobile for touch ergonomics;
- route-hero top padding: 28-32px;
- route-hero bottom padding: 20-24px;
- expressive hero grid: 340-360px minimum, not 540-560px;
- expressive visual stage: 300-320px, not 430px;
- restrained legal hero grid: 280-320px;
- hero H1: `text-6xl`, `sm:text-7xl`, `lg:text-8xl` at most; remove
  `lg:text-9xl` from this route-hero family;
- hero control rail: 48-56px, not 80px;
- desktop `.section` block padding: about 48px instead of 64px, while keeping
  enough separation for headings and preserving the special hero-to-first-
  section adjacency rule.

Use discrete responsive breakpoints rather than font sizes tied continuously to
viewport width. Do not create a new `vw`-driven heading scale.

Possible class names are `.route-hero-inner`, `.route-hero-grid`,
`.route-hero-title`, `.route-hero-stage`, and `.route-hero-tabs`. The exact names
may follow a better existing convention, but there must be one authoritative
contract rather than 18 independent copies of the same dimensions.

### 5.2 Keep the shell offsets synchronized

If the desktop header changes from 64px to 56px, update the owning shell pieces
together. Prefer one CSS custom property or one shared responsive class pattern
for:

- the header's height;
- `main` top padding and scroll margin;
- the breadcrumb's sticky `top` offset;
- any drawer/dropdown offsets that assume a 64px header.

Retain a 64px mobile header. If the full desktop navigation no longer fits near
the `lg` boundary, move the full navigation breakpoint upward rather than
allowing controls to overlap or squeezing labels.

### 5.3 Preserve the existing hero rhythm hook

Every route hero must retain the `page-hero` class and its bottom divider. The
existing `.page-hero + .section` and hidden-EasyIntro adjacency selectors depend
on that marker. Update their spacing intentionally if needed; do not accidentally
disable them.

## 6) `/industries` redesign - the benchmark

### 6.1 One sector state and one selector

Lift the active sector state to a small client owner, context, or controlled
component boundary so `IndustryModelsHero` and `IndustriesSection` use the same
active index and change handler.

Render one primary six-sector tablist only. The recommended placement is a
compact rail at the bottom edge of the hero because it connects the model to the
detail section. Remove the second raised sector-button row from
`IndustriesSection` once both views are controlled by the same state.

Do not leave two selectors merely styled differently. Do not let the hero say
"SaaS & IT" while the details still show "BFSI".

The tab rail must:

- be 48-56px high on desktop;
- use all six labels when they fit;
- remain a real `role="tablist"` with selected state and keyboard support;
- use a single horizontal, scrollable, snap-aligned row on narrow screens;
- never become six vertically stacked 80px buttons on mobile;
- preserve visible focus, reduced motion, and a minimum 44px mobile target.

If autoplay remains, pause it while the hero is hovered/focused and stop or
clearly defer it after manual selection. It must not unexpectedly change sector
details while a visitor is reading them.

### 6.2 Compact composition

For the `/industries` hero:

- reduce the main desktop grid from 560px to about 340px;
- reduce the stage from 430px to about 300-320px;
- resize or re-lay out the internal CSS model so it fits cleanly; do not simply
  hide overflow around a clipped 520px-wide model;
- reduce the title from `lg:text-9xl` to at most `lg:text-8xl`;
- tighten the kicker-to-title, title-to-sector, copy, and underline gaps;
- retain the sector counter, active sector name, one concise description, the
  themed grid, and the model artwork;
- keep the left copy and right model balanced rather than allowing the model to
  dominate two-thirds of the hero;
- remove decorative empty height that does not communicate information.

The hero should remain recognizably the current industry-model design. Do not
replace it with a marketing card, stock image, generic gradient banner, or a
large empty title-only slab.

### 6.3 Mobile and tablet behavior

At widths below the full two-column composition:

- hide or deliberately simplify the decorative model stage;
- remove fixed/minimum heights that leave empty space after the stage is hidden;
- keep title, active sector, description, and the compact tab rail visible;
- use native scale and normal document flow;
- make long translated labels scroll or wrap safely without widening the page.

At `1024-1279px`, use a deliberately reduced two-column stage or switch to the
compact single-column version. Do not squeeze the full 520px model into an
undersized column.

## 7) Rollout to the other custom heroes

After `/industries` passes its visual and measured checks, migrate the other
custom heroes to the shared dimensions in small groups.

For each hero:

1. Replace the repeated padding, 500-560px grid, 430px stage, and `text-9xl`
   literals with the shared compact contract.
2. Recompose the route-specific visual inside the smaller stage so it remains
   legible and intentional. Local scaling of decorative internals is acceptable;
   scaling the app shell is not.
3. Compact manual selectors, counters, and tab rails to 48-56px where present.
4. Keep all true labels, chapter names, tools, rights, modules, categories, and
   controls. Do not remove useful content solely to hit a height target.
5. Preserve dark/light theming, Easy Read swaps, keyboard/tap behavior, reduced
   motion, deterministic SSR, and the existing route data attributes.
6. Ensure animations never gate essential DOM mounting. Avoid `mode="wait"` or
   opacity-from-zero wrappers for essential copy when a hidden/background tab
   could freeze the transition.

The restrained legal heroes should be shorter and quieter than marketing and
product heroes. `/solutions` must retain its signed-off service-engine identity,
but its outer geometry must follow the new compact first-viewport contract.

## 8) Readability and interaction guardrails

- Body copy must remain 15-16px; do not shrink `--fs-base`.
- Labels must remain at least 12px; do not shrink `--fs-label`.
- Do not reduce the Easy Read multiplier or bypass it with fixed pixel text.
- Keep mobile touch targets at least 44px.
- Desktop compact controls may be 40px only when they are not the mobile target.
- No text may overlap, clip, or overflow its control in English or long
  translated strings.
- Preserve visible focus and logical tab order.
- Honor `prefers-reduced-motion`.
- Do not fabricate claims, numbers, sectors, or decorative labels.
- Do not change user-facing copy unless necessary; if copy changes, regenerate
  and audit the translation catalogs using the repository's existing workflow.

## 9) Required verification

### 9.1 Focused checks after the first edit

Prototype only `/industries`, then validate it before touching the other heroes:

- run the focused TypeScript/ESLint checks available for the touched files;
- inspect the live DOM at `1366x768` and record header, breadcrumb, hero, title,
  stage, tablist, and first-section rectangles;
- confirm hero height is at most 480px and at least 120px of the first real
  section is visible;
- confirm one primary sector tablist controls both model and detail content;
- click all six sectors and verify model, active label, selected tab, and detail
  card agree every time.

Only after that check passes should the shared contract be rolled to the next
small group of heroes.

### 9.2 Viewport matrix

Check at minimum:

- `1280x720`, `1366x768`, `1440x900`, and `1920x1080` desktop;
- `1024x768` tablet/compact desktop;
- `390x844` and `360x800` mobile.

For every viewport, assert:

- `document.documentElement.scrollWidth <= window.innerWidth + 1`;
- the fixed header does not overlap the breadcrumb or page content;
- title, model, labels, and controls do not overlap;
- the hero does not expand just because the viewport is taller;
- mobile tabs do not stack into a tall six-row block;
- the next section is visibly hinted on desktop laptop viewports.

### 9.3 Modes and themes

Verify the benchmark routes in:

- light and dark theme;
- normal and Easy Read mode;
- English plus at least one long-label Indic locale and one RTL locale;
- normal and reduced motion.

Use screenshots for visual framing and DOM measurements for geometry. Do not
trust browser screenshots alone for overflow or state synchronization.

### 9.4 Repository checks

- Run `npx tsc --noEmit` from this project.
- Run focused ESLint on touched TypeScript/TSX files.
- Run the translation audit only if user-visible source strings changed.
- Do not run `next build` while `next dev` is writing the same `.next` folder.
- Do not modify unrelated files or erase existing user changes.

## 10) Final acceptance checklist

The task is complete only when all are true:

- default 100% browser zoom feels intentionally close to the requested
  75%-density view without any CSS/browser zoom hack;
- `/industries` hero is at most 480px at `1366x768`;
- the first real sector section is visible in the initial laptop viewport;
- one synchronized sector selector replaces the two conflicting selectors;
- all custom route heroes use a shared compact geometry contract;
- unique hero artwork and truthful content remain intact;
- body and label readability floors remain intact;
- fixed/sticky shell offsets remain synchronized;
- desktop, tablet, mobile, themes, locales, Easy Read, keyboard, and reduced
  motion all pass;
- TypeScript and focused lint checks pass with no new errors.

In the final report, include a compact before/after measurement table for
`/industries`, list the shared tokens/classes introduced, list every migrated
hero, and state exactly which viewport/theme/mode checks were run.
