# Easy Read - Full-Site Coverage

Driven by `docs/easy-read-master-prompt.md`. Easy Read is the complete
plain-language edition of the site, not a visual setting or a page summary.

Status: **complete and verified on 2026-07-16**.

## Validation gates

- ✅ `node --import tsx scripts/audit-easy-read.mjs --strict`
  - 7,455 substantial non-official source strings audited
  - 104 static placeholders, tooltips, accessible labels and alt strings audited
  - 0 hard residuals
  - 0 malformed mappings
- ✅ `node --import tsx scripts/audit-easy-routes.mjs`
  - 140/140 concrete English routes return complete server-rendered documents
  - Includes every article, case, course, certification module, template,
    Act section and Rule page
- ✅ `node --import tsx --test tests/easy-read.test.ts`
  - Fallback grammar, exact-map grammar, key uniqueness and meaningful mappings
- ✅ Direct TypeScript check through `node node_modules/typescript/bin/tsc --noEmit`
- ✅ Browser round trips: Easy text appears, technical source disappears, normal
  mode restores exact source text
- ✅ Stateful flows: adaptive quiz, certification exam questions, Industry
  Advisor result, TrustChat, calculators, generated documents, scanner errors,
  scanner reports and security/compliance-manager reports
- ✅ Compliance manager: 16 server tests + 11 endpoint verification checks

## Shared behavior

- ✅ Header, footer, navigation, CTAs, breadcrumbs, cookie controls, accessibility
  controls, TrustChat and shared empty/error states
- ✅ Text nodes added by client components or later DOM mutations
- ✅ `aria-label`, `title`, `placeholder` and `alt` attributes
- ✅ `<option>` labels and other text rendered inside form controls
- ✅ Easy/normal context stays synchronized with `html[data-reading]`
- ✅ Hidden/background tabs no longer rely on animation frames or exit animations
  to apply Easy Read or mount the next Industry Advisor/exam step

## Marketing and tools

- ✅ `/` - hero, search, bento content, risk check, guide and exploration content
- ✅ `/solutions` - service cards, seven deep service briefings and CTAs
- ✅ `/industries` - sector content, all four Advisor questions and result states
- ✅ `/why-us` - comparison and proof content
- ✅ `/framework` - 7D stages, platform content and badge journey
- ✅ `/tools` - calculators, all controls/options/results, Privacy Notice generator
  and Consent Form generator with explicit interpolated Easy bodies
- ✅ `/scanner` - idle, loading, unavailable-service error and full report fixture
- ✅ `/security` - idle, loading, unavailable-service error, full security report,
  remediation, deeper checks and compliance-manager controls

## Law and rights

- ✅ `/act`, `/section` and all 44 `/section/[n]` pages
- ✅ `/rules` and all 23 `/rules/[n]` pages
- ✅ `/cases` and all 10 `/cases/[slug]` pages, including full case narratives
- ✅ `/rights`, including request-letter guidance and complaint process
- Official Act, Rules and Gazette passages remain exact. Easy mode hides those
  official blocks where the page supplies authored plain-language guidance.

## Learning and resources

- ✅ `/learn` - role paths, all adaptive-quiz questions/options/explanations and FAQ
- ✅ `/courses` and all 6 `/courses/[slug]` pages - lessons and activities included
- ✅ `/certification`, all 8 modules and `/certification/exam` - curriculum,
  self-checks, 224-question bank content and exam controls included
- ✅ `/certification/verify`
- ✅ `/blog` and all 11 `/blog/[slug]` pages - full article bodies included
- ✅ `/templates` and all 15 `/templates/[slug]` pages - reader/document preview
  clauses included; downloadable source files remain unchanged

## Site and legal pages

- ✅ `/privacy`
- ✅ `/terms`
- ✅ `/cookies`

## Implementation

- Exact pairs live in `src/content/easy/*.ts` and are aggregated by
  `src/content/easy/index.ts`.
- Deep collections are split into `*-depth.ts` modules for articles, cases,
  courses, certification, assessments, law guidance, templates, advisor/chat and
  service/security content.
- `EasyTextRuntime.tsx` applies and reverses exact/fallback mappings across text
  and control attributes, including late client-rendered states.
- `fallbackEasyText` is a defensive glossary only. Deep professional content now
  has deliberate exact mappings; passing coverage does not depend on fallback
  percentages.

## External dependency note

The standalone Python scanner service at `127.0.0.1:8090` is not included in this
workspace and was not started. Its real unavailable-service state was verified in
both modes. Complete success reports for both scanners were verified with
contract-shaped browser fixtures, and the compliance-manager endpoint was tested
against the running Next.js application.
