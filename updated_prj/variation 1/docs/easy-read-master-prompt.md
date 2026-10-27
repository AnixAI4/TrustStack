# MASTER PROMPT - Full‑Site "Easy Read" Coverage (TrustStack DPDP)

> Paste this whole file to an agent as the task. It is intentionally exhaustive.
> Executing it fully converts **every user‑visible string on every route** so that
> when **Easy read** is ON, the entire site reads in plain, simple language while
> staying legally faithful to the DPDP Act 2023 and DPDP Rules 2025.

---

## 0) Mission (non‑negotiable definition of done)

When a user turns **Easy read** ON, **100% of the human‑readable text they can see
on any page** must switch to a plain‑language version - headings, paragraphs, list
items, card titles/descriptions, badges, tab labels, button text, tooltips shown as
text, table cells, FAQ Q&A, form labels/placeholders, empty states, and CTA copy.
Turning Easy read OFF must restore the exact original text.

You are **not** done until **all 140 concrete routes** are covered, representative
families and dynamic states are verified in the browser, the strict source and
route audits pass, and the installed TypeScript compiler exits 0 when invoked
directly through Node. npm-family commands are prohibited in this workspace.

Do **not** redesign the mechanism. Do **not** ship a "summary card" as a substitute
for translating the body. Partial hero‑only coverage is explicitly a failure.

---

## 1) How Easy read works (the mechanism you extend)

1. The toggle sets `document.documentElement[data-reading="easy"|"normal"]`
   (persisted to `localStorage["dpdp-reading"]`, applied pre‑paint by the script in
   `src/app/layout.tsx`).
2. `src/components/site/EasyTextRuntime.tsx` (mounted globally in `SiteFrame`)
  watches that attribute. While `easy`, it walks every visible text node and
  user-facing `aria-label`, `title`, `placeholder` and `alt` attribute in
  `document.body` and, for each, tries in order:
   - `EASY_MAP[hash]` - the build‑time generated map (`src/content/easy-generated.ts`),
   - `lookupEasyText(text)` - the **exact** dictionary (this is what you grow),
   - `fallbackEasyText(text)` - a conservative jargon substitution for long text.
   It records originals and restores them when Easy read goes OFF. It also observes
   DOM mutations, so async / client‑rendered content is covered too.
3. `<Easy>…</Easy>` (`src/components/site/EasyContent.tsx`) and `<Swap>` do the same
   swap at the component level for known spots; `<EasyIntro>` shows an extra plain
   card. These stay as‑is.

**Therefore: to make any string change, add an exact `[normal, easy]` pair to the
dictionary.** That is the primary unit of work.

### Where pairs live (modular, conflict‑free)

- `src/content/easy/<route>.ts` → `export const PAIRS: [string, string][] = [...]`
- `src/content/easy/index.ts` aggregates every page file into `EXTRA_EASY_PAIRS`.
- `src/content/easy-static.ts` spreads `EXTRA_EASY_PAIRS` into the runtime lookup,
  builds `EASY_TEXT`, and exposes `lookupEasyText` + `fallbackEasyText`.

To add a new page: create `src/content/easy/<route>.ts`, then add one import +
spread line to `src/content/easy/index.ts`. One route = one file = one work unit.

---

## 2) The per‑route workflow (repeat for EVERY route)

For each route in the tracker (Section 6):

1. **Map the surface.** Open the route's `page.tsx` and follow every component it
   renders (`src/components/**`) and every content module it reads
   (`src/content/**`). List them.
2. **Extract every visible string.** From the content data (arrays/objects) AND
   inline JSX text. Capture the EXACT original (copy‑paste; match punctuation,
   em‑dashes ` - `, apostrophes `'`, `&` vs `&amp;`, and `→`/`·` glyphs).
3. **Translate** each string to plain language (rules in Section 3 + glossary in 4).
4. **Write** `src/content/easy/<route>.ts` with `[original, easy]` pairs; wire it in
   `index.ts`.
5. **Verify in the browser** (Section 5). Assert several body strings changed and
   the originals are gone; toggle OFF and assert originals restored.
6. **Validate** with direct Node commands (EXIT 0):
  - `node --import tsx scripts/audit-easy-read.mjs --strict`
  - `node --import tsx scripts/audit-easy-routes.mjs`
  - `node node_modules/typescript/bin/tsc --noEmit`
7. **Update** `docs/easy-read-coverage.md` (tick the route; note verified strings).

Prefer shared components once (e.g. `Header`, `Footer`, `CtaBand`, `SiteBreadcrumb`,
`CookieConsent`, `LexBot`) in `src/content/easy/common.ts` so every page benefits.

---

## 3) Translation quality bar (hard rules)

- **Reading level ≈ 8th grade.** Short sentences. Everyday words. Active voice.
- **Faithful - never change meaning.** Do NOT add, drop, soften, or invent any
  obligation, right, deadline, penalty, or number. If the original says "72‑hour",
  "₹250 crore", "22 Indian languages", "Rule 10", "Section 6", "2‑year", the easy
  version keeps the exact figure/identifier.
- **Similar length or shorter.** Never pad.
- **Expand jargon on first use** where it aids a non‑specialist, using the glossary.
- **Preserve inline glyphs** that are part of the visible node: keep a trailing
  `→`, leading `·`, etc., so the node still matches (e.g. `"Request a quote →"`).
- **Casing:** author the pair in **natural case**. Some labels are uppercased by CSS
  (`uppercase` / `tracking‑wider`); the CSS still applies, so write "What can go
  wrong", not "WHAT CAN GO WRONG".
- **Match the exact source string.** The runtime matches whole, whitespace‑normalized
  text nodes. If a node mixes text with an interpolation or nested tag, it will not
  match as one string - handle those spots with `<Easy>`/`<Swap>` in the component
  instead, or map the individual static sub‑strings.

### Never translate (leave verbatim)

- Brand / product names: **TrustStack, Anix, DPDP, LexBot, DPDP Compass™, DPDP
  Ignite™, DPDP Build™, AI Privacy Shield™, DPDP TrustOps™, TrustStack Platform™,
  CDPP Certification™, OneTrust, Big 4**.
- Statute identifiers: **"Section 6", "Rule 10", "Chapter III", "Act No. 22 of
  2023", "G.S.R. 846(E)"**, and the **official Gazette text** on `/section/[n]` and
  `/rules/[n]` (that block is the legal text - it must stay exact).
- URLs, `href`s, mailto, icon names, CSS classes, code snippets, keys/ids.
- Numbers, dates, money, percentages, language counts (keep exact).
- Language names in the language switcher (हिन्दी, বাংলা, …).

---

## 4) Fixed glossary (use consistently across the whole site)

| Legal / technical term | Plain wording |
|---|---|
| Data Fiduciary | the organisation responsible for your data |
| Data Principal | the person the data is about |
| Data Processor | a company that handles data for another |
| Consent Manager | a service that manages your permissions |
| processing / process personal data | using / use personal data |
| consent | permission |
| notice | what you're told before data is used |
| purpose limitation | using data only for the stated reason |
| data minimisation | collecting only what's needed |
| lawful basis | a legal reason |
| grievance redressal | complaint handling |
| breach | data leak |
| retention | how long data is kept |
| erasure | deletion |
| obligations | duties |
| compliance | following the law |
| regulator(s) | authority / authorities |
| cross‑border transfer | sending data outside India |
| Data Protection Board of India | Data Protection Board of India *(keep name; you may add "the government's data watchdog" once)* |
| Significant Data Fiduciary | a large, high‑risk organisation with extra duties |

Keep these consistent; do not invent alternate phrasings per page.

---

## 5) Verification protocol (per route - required, not optional)

Do this in a real browser (the dev server runs at `http://localhost:3000`). Use the
Playwright/browser tooling with the shared page id.

```js
// 1) force easy mode and reload the target route
await page.goto('http://localhost:3000/<route>?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { localStorage.setItem('dpdp-reading','easy'); document.documentElement.setAttribute('data-reading','easy'); });
await page.waitForTimeout(1500);
const t = await page.evaluate(() => document.body.innerText);
// assert: several easy strings PRESENT and their originals ABSENT
// 2) toggle OFF and assert originals restored
await page.evaluate(() => { localStorage.setItem('dpdp-reading','normal'); document.documentElement.setAttribute('data-reading','normal'); });
```

Notes / known gotchas:
- The VS Code embedded browser can be occluded (`innerWidth === 0`) and cache JS
  chunks. Force desktop with `page.setViewportSize({width:1440,height:900})`, and if
  a change "doesn't show," confirm it compiled by grepping `.next/server/app/**` and
  `.next/static/chunks/**` for a unique new easy string before concluding failure.
- Compare on **normalized** text (collapse whitespace); UI uppercasing is CSS‑only,
  so match case‑insensitively when asserting.
- If a spot won't swap because the node isn't a pure string, fix it at the component
  with `<Easy>`/`<Swap>` and note it.

---

## 6) Coverage tracker - all 140 concrete routes (keep `docs/easy-read-coverage.md` in sync)

Marketing / top‑level:
- [ ] `/` (home) - `src/components/home/*`, `src/content/home.ts`, `dpdp.ts`
- [ ] `/solutions` - `ServicesSection` + `SERVICES` (dpdp.ts)  ← **started**
- [ ] `/industries` - `IndustriesSection`, `IndustryAdvisor`, `dpdp.ts`, `industry-advisor.ts`  ← **done**
- [ ] `/why-us` - `WhyUsSection`, `ComparisonSection`, `dpdp.ts`  ← **done**
- [ ] `/framework` - `FRAMEWORK` (dpdp.ts), `TIMELINE`
- [ ] `/tools` - tool cards + risk explainers (`risk-explainers.ts`)

The law:
- [ ] `/act` - `ActBrowser`, `act.ts` (catalog already swaps summaries)
- [ ] `/section` and `/section/[n]` - `section-enrichment.ts`, `section-plain.ts` (official text stays verbatim)
- [ ] `/rules` and `/rules/[n]` - `rules.ts` (official gazette text stays verbatim)
- [ ] `/cases` and `/cases/[slug]` - `cases.ts`
- [ ] `/rights` - `rights.ts` (partly done via hero/intro)

Learn:
- [ ] `/learn` - `learn.ts`, quiz/faq
- [ ] `/courses` and `/courses/[slug]` - `courses.ts`, `course-lessons.ts`, `course-activities.ts`
- [ ] `/certification`, `/certification/[module]`, `/certification/exam` - `certification.ts`, `curriculum.ts`, `exam-bank.ts`
- [ ] `/blog` and `/blog/[slug]` - `blog.ts`, `blog-articles.ts`
- [ ] `/templates` and `/templates/[slug]` - `templates.ts`, `template-documents.ts`

Site / legal:
- [ ] `/privacy`, `/terms`, `/cookies`
- [ ] Shared chrome: `Header`, `Footer`, `CtaBand`, `SiteBreadcrumb`, `CookieConsent`, `LexBot`, `A11yToolbar` → `src/content/easy/common.ts`

Guidance on the big legal pages: translate the **explanatory** copy ("In plain
English", key points, summaries, UI labels), but leave the **official statute text**
verbatim (it is already hidden in Easy read on the detail pages).

---

## 7) Batching, order, and scale

- Recommended order (highest visibility first): `common` → `/` → `/solutions` →
  `/tools` → `/framework` → `/rights` → `/learn` → `/courses` → `/cases` →
  `/templates` → `/blog` → `/certification` → law pages → `/privacy` `/terms` `/cookies`.
- One route per file; after each, verify + typecheck + tick the tracker. Never batch
  so much that a failure is hard to localize.
- Reuse the glossary so wording is consistent site‑wide.
- Long content collections (blog articles, course lessons, exam bank) are large:
  translate the **visible** copy a user actually reads on the rendered page; skip
  data that never renders as visible prose.

---

## 8) Output contract per route

- New file `src/content/easy/<route>.ts` exporting `PAIRS`.
- One import + spread line added to `src/content/easy/index.ts`.
- No edits needed to `EasyTextRuntime` or `easy-static.ts` (unless adding a new
  glossary rule to `fallbackEasyText`, which is allowed and encouraged when a term
  recurs site‑wide).
- Tracker updated. Typecheck green. Browser‑verified.

---

## 9) Self‑check before declaring a route done

- [ ] Did I capture EVERY visible string on the rendered page (not just the hero)?
- [ ] Are all numbers, dates, penalties, statute refs, and brand names preserved?
- [ ] Reading level ≈ 8th grade, meaning unchanged, length ≤ original?
- [ ] Verified in the browser: easy strings present, originals absent, OFF restores?
- [ ] Strict content/attribute audit, 140-route audit and direct Node TypeScript
  check all exit 0? Tracker updated?

Repeat until all 140 concrete routes and required dynamic states pass. That - and
only that - is "the entire purpose."
