# TrustStack™ — Master Context Document
## READ THIS FIRST IN EVERY SESSION

> 📌 **Pending / deferred work lives in [`PENDING.md`](./PENDING.md)** — the single register of everything started-but-not-finished (beta blockers, optional follow-ups, deferred-by-design). Check it before assuming something is "done."

**Version:** 2.5 — June 29, 2026 (P1.5 hardening pass. FIX1 ✅ (v1.5.1, M4 ref bug), FIX2 🟡 (M6/M8 SQL live; M8 escalation cron optional-pending), FIX3 ✅ (v1.5.3, board M1–M8), FIX4 🟡 (v1.5.4 — automated gates all green: npm audit 0 / type-check 0 / build ✅ / secret-scan clean / CORS + auth verified; `.env.example` corrected. Interactive QA + mobile + Vercel env + prod deploy remain a MANUAL sign-off — see progress.md "P1.5 FIX4 Sign-Off Checklist"). All M1–M10 modules code-complete + DB live. Next action: finish the manual FIX4 sign-off, then P2 M11 Team Management.)  

**Prior — v2.4 — June 26, 2026:** post-Session 10 Planning Phase complete — all 35 modules designed across P1.5/P2/P3/P4, prompt files + Implementation_Planner/ (10 docs) + tracker-data.json created.  
**Purpose:** This document gives a cold Claude Code session everything it needs to build any TrustStack module consistently with all other modules.

---

## 1. What We Are Building

**TrustStack™** is India's first native DPDP (Digital Personal Data Protection Act 2023) compliance SaaS platform built by Anix AI.

**Mission:** A mid-market Indian company should be able to go from zero to DPDP-compliant in 30 days, self-serve, no consultants, starting at ₹1.5L/year.

**Key differentiators vs. all 30 competitors analyzed:**
- Only platform built natively for DPDP (not GDPR adapted)
- Consent management in 22 Indian languages
- WhatsApp consent channel (no competitor has this)
- 72-hour DPBI breach notification workflow (no competitor has this)
- Industry-specific DPDP assessment with regulatory overlaps (RBI, DISHA, SEBI etc.)
- 30-day onboarding vs. 17–34 weeks for Big 4

**Brand:** Anix AI | TrustStack™ | TrustChat™ | Compass Score™ | DPDP Compass™

---

## 2. Project Location

```
/Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP/truststack-platform/
```

All code lives here. This is a Next.js 15 project. Run `npm run dev` to start.

---

## 3. Tech Stack (exact versions — do not upgrade without updating this doc)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 15.5.19 (bumped from 15.1.0 in Session 5 — cleared critical security advisories; same major) |
| Language | TypeScript | 5.x (strict mode) |
| UI | React | 19.0.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | Framer Motion | 11.x |
| Icons | Lucide React | 0.469.0 |
| UI Primitives | Radix UI | (Dialog, Tooltip, ScrollArea, Accordion, Tabs) |
| Class Utils | clsx + tailwind-merge + CVA | installed |
| Toast | react-hot-toast | installed |
| AI SDK | @anthropic-ai/sdk | 0.36.3 |
| AI Streaming | Vercel AI SDK (ai) | ❌ removed Session 5 — was unused (chat uses `@anthropic-ai/sdk` directly); removed to clear `@ai-sdk/*` + `jsondiffpatch` advisories |
| LLM Model | claude-sonnet-4-6 | current |
| Database | Supabase (PostgreSQL) | ✅ installed — @supabase/supabase-js 2.108.2 |
| Auth | Supabase Auth | ✅ installed (same package) |
| Storage | Supabase Storage | ✅ installed (same package) |
| Supabase SSR | @supabase/ssr | ✅ installed 0.12.0 |
| Email | Resend | ✅ installed 6.14.0 |
| PDF | @react-pdf/renderer | ✅ installed 4.5.1 (M9) — `serverExternalPackages` in next.config |
| Hosting | Vercel | live |

---

## 4. Environment Variables

File: `.env.local` (gitignored — NEVER commit)

```bash
# ✅ Already set — Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# ✅ Already set — Supabase (Mumbai project: ap-south-1)
# NOTE: Original Sydney project was deleted and recreated in Mumbai for DPDP data residency
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # set
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # set — server-only, NEVER expose to browser

# 🔲 To be added — email
RESEND_API_KEY=re_...

# ✅ Already set
NEXT_PUBLIC_APP_URL=http://localhost:3011
NEXT_PUBLIC_APP_NAME=Anix AI TrustStack
```

---

## 5. What Is Already Built

### ✅ Landing Page & Marketing (complete)
- `src/app/page.tsx` — Main landing page
- `src/app/(marketing)/` — Marketing section layout
- `src/components/marketing/` — Hero, Framework7D, RiskQuestions, ServicesGrid, IndustriesSection, WhyAnixAI, ContactSection
- `src/components/layout/` — Navbar, Footer
- `src/components/ui/` — CookieConsent, ThemeProvider, ThemeToggle

### ✅ Legal Pages (complete)
- `src/app/privacy-policy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/cookie-policy/page.tsx`

### ✅ M10: TrustChat™ (complete)
- `src/components/chatbot/TrustChat.tsx` — Chat widget component
- `src/app/api/chat/route.ts` — Claude API server route
- `src/app/api/health-check/route.ts` — 11-question DPDP health check

### ✅ Supabase Client Files (complete)
- `src/lib/supabase/client.ts` — Browser client (createBrowserClient from @supabase/ssr)
- `src/lib/supabase/server.ts` — Server client with cookie handling
- `src/lib/supabase/admin.ts` — Admin client using service role key (server-only, bypasses RLS)

### ✅ M1: DPDP Compass™ Assessment (complete — Session 1, June 2026)

**Foundation:**
- `src/lib/constants.ts` — All DPDP constants (rights, sectors, maturity levels, sidebar config) + `INDUSTRY_SECTION_LABELS` (added M1b)
- `src/lib/assessment-questions.ts` — 45 core questions + 24 industry questions (FIN1–FIN8, HLT1–HLT8, EDT1–EDT8) + `getIndustryQuestions(industry)` (added M1b)
- `src/types/dpdp.ts` — All TypeScript domain types. `AssessmentSection` includes `industry_fintech | industry_healthtech | industry_edtech` (added M1b)
- `src/middleware.ts` — Protects `/dashboard/*`, allows public API routes
- `src/lib/ai/compass-scorer.ts` — Scoring algorithm. Iterates ALL_QUESTIONS (core + all industry arrays) so industry answers contribute to score. Normalizes dynamically by answered max
- `src/lib/ai/gap-generator.ts` — GAP_MAP covers all 69 question IDs (45 core + 24 industry). `generateGaps(assessmentId, orgId, answers, industry)` — industry param enables `INDUSTRY_GAP_OVERRIDES` for fintech/healthtech/edtech. `forcePriority` field prevents partial-answer downgrade for EdTech Q9/Q19

**Auth:**
- `src/app/(auth)/layout.tsx` — Centered card layout
- `src/app/(auth)/login/page.tsx` — Email/password login
- `src/app/(auth)/signup/page.tsx` — Signup with email confirmation handling
- `src/app/(auth)/create-organization/page.tsx` — Org setup wizard (calls API route, not Supabase directly)
- `src/app/api/auth/callback/route.ts` — Supabase OAuth/email callback handler
- `src/app/api/organizations/create/route.ts` — Server-side org creation (uses admin client)

**Dashboard Shell:**
- `src/components/dashboard/Sidebar.tsx` — Collapsible nav with all module links + Coming Soon badges
- `src/components/dashboard/Topbar.tsx` — User dropdown, org name, sign out
- `src/app/dashboard/layout.tsx` — Fetches org, renders sidebar + topbar
- `src/app/dashboard/page.tsx` — Redirects to `/dashboard/overview`
- `src/app/dashboard/overview/page.tsx` — Compass Score + open gaps + module grid

**Assessment Components:**
- `src/components/modules/assessment/AssessmentQuestion.tsx` — Yes/No/Partial + text + select question types
- `src/components/modules/assessment/AssessmentProgress.tsx` — Section progress bar. Props: `currentSectionIndex`, `answeredInSection`, `totalInSection`, `totalSections`, `sectionLabel` (all required — does NOT read from constants directly)
- `src/components/modules/assessment/CompassScoreGauge.tsx` — Animated SVG score gauge (0–100)
- `src/components/modules/assessment/GapReportCard.tsx` — Gap card with priority, DPDP section, action. Module reference label reads "Resolve in → M2: Consent Management"
- `src/components/modules/assessment/MaturityBadge.tsx` — Level 1–5 maturity badge

**API Routes:**
- `src/app/api/assessment/start/route.ts` — POST: creates assessment record
- `src/app/api/assessment/save-answer/route.ts` — POST: upserts single answer (debounced). Accepts core question IDs (Q1–Q45) AND industry IDs (FIN1–FIN8, HLT1–HLT8, EDT1–EDT8)
- `src/app/api/assessment/submit/route.ts` — POST: fetches org industry, computes score, generates industry-aware gaps, marks complete
- `src/app/api/assessment/results/[id]/route.ts` — GET: returns full assessment + answers + gaps
- `src/app/api/organizations/me/route.ts` — GET: returns current user's org (id, name, industry, revenue_range, etc.)

**Assessment Pages:**
- `src/app/dashboard/assessment/page.tsx` — Assessment list + history
- `src/app/dashboard/assessment/new/page.tsx` — Creates assessment and redirects to [id]
- `src/app/dashboard/assessment/[id]/page.tsx` — Section-by-section questionnaire. Fetches org industry on mount; shows Section 9 for fintech/healthtech/edtech orgs; pre-fills Q1/Q2/Q3 from org registration data; uses `effectiveSections` array (not hardcoded `ASSESSMENT_SECTION_ORDER`)
- `src/app/dashboard/assessment/results/[id]/page.tsx` — Gauge + maturity badge + gap report

### ✅ M1b: Industry-Specific Assessment Layers (complete — Session 1b, June 2026)
- Layer 1: Industry-aware gap recommendations — fintech/healthtech/edtech orgs see tailored `recommended_action` text in gap cards (RBI references for fintech, DISHA for healthtech, parental consent priority for edtech)
- Layer 2: Industry question module — Section 9 added dynamically for fintech/bfsi/healthtech/edtech. 8 questions per industry (24 pts each). Ecommerce/logistics/IT/other see no Section 9.
- `bfsi` industry normalizes to `fintech` for all override lookups
- `npm run type-check` passes with zero errors

### ✅ M4: Grievance Officer Portal (complete — Session 2, June 2026)

**Constants added to `src/lib/constants.ts`:**
- `COMPLAINT_TYPES` — 6 complaint types mapped to DPDP sections
- `GRIEVANCE_LANGUAGES` — English + Hindi + Tamil + Telugu (launch languages)
- `SIDEBAR_MODULES` grievance entry changed to `available: true`

**Types added to `src/types/dpdp.ts`:**
- `GrievanceComplaintType`, `GrievanceStatus`, `GrievanceOfficer`, `GrievanceComplaint`

**Middleware updated:**
- `PUBLIC_API_ROUTES` already includes `/api/grievance/submit`

**Navbar updated (`src/components/layout/Navbar.tsx`):**
- Login button and Sign Up Free button added to desktop nav and mobile drawer

**Components:**
- `src/components/modules/grievance/ComplaintStatusBadge.tsx`
- `src/components/modules/grievance/GrievanceOfficerCard.tsx`
- `src/components/modules/grievance/GrievanceOfficerForm.tsx`
- `src/components/modules/grievance/ComplaintsTable.tsx`
- `src/components/modules/grievance/ComplaintDetail.tsx`
- `src/components/modules/grievance/PublicComplaintForm.tsx`

**API Routes:**
- `src/app/api/grievance/officer/route.ts` — GET + POST (deactivates old officer, inserts new — audit trail)
- `src/app/api/grievance/submit/route.ts` — Public POST, no auth, generates GRV-YYYY-NNN reference, sends email via Resend from `noreply@anixai.io`
- `src/app/api/grievance/complaints/route.ts` — Authenticated GET, paginated, filter + search
- `src/app/api/grievance/complaints/[id]/route.ts` — Authenticated GET + PATCH

**Dashboard Pages:**
- `src/app/dashboard/grievance/page.tsx` — Officer card + stats + recent complaints + auto-refresh (30s poll + visibilitychange)
- `src/app/dashboard/grievance/complaints/page.tsx` — Full list with filter/search/pagination
- `src/app/dashboard/grievance/complaints/[id]/page.tsx` — Complaint detail + status update

**Public Pages (no auth):**
- `src/app/public/grievance/[slug]/page.tsx` — Public form, server component, shows officer contact + complaint form

**Supabase tables (run SQL in editor before testing):**
- `grievance_officers` — with RLS
- `grievance_complaints` — with RLS + public INSERT policy

**Key decisions:**
- Officer edit deactivates old record, inserts new one (preserves audit trail)
- Email failure swallowed so public form always returns reference number
- Email from `noreply@anixai.io` (anixai.io verified in Resend; change to truststack.in once that domain is verified)
- `/public/grievance/*` is NOT in middleware PROTECTED_PREFIXES — works without auth
- **P1.5 FIX1 (reference-number bug):** `grievance_complaints.reference_number` was a *global* `UNIQUE`, which collides when two orgs both submit their first complaint (both compute `GRV-YYYY-001`). The generator in `submit/route.ts` was already org+year scoped; the fix is the schema — drop the global constraint, add a composite `(organization_id, reference_number)` unique index (`grievance_complaints_org_reference_uniq`), matching M5/M8. Migration: `db/fix_grievance_reference_unique.sql` — ✅ **applied in Supabase (2026-06-29), live** (tag `v1.5.1`).

### ✅ M2: Consent Management (complete — Session 3, June 2026; enhanced same session)

**Constants in `src/lib/constants.ts`:**
- `DEFAULT_PURPOSES` — 4 default purposes (essential/analytics/marketing/functional)
- `CONSENT_TRANSLATIONS` — UI-string translations for **19 languages** (en, hi, ta, te, mr, gu, bn, kn, ml, pa, or, as, ur, sa, ne, ko, mai, doi, sd). Kashmiri (ks), Santali (sat), Manipuri (mni) intentionally fall back to English — need professional localization.
- `SIDEBAR_MODULES` consent entry `available: true`

**Types in `src/types/dpdp.ts`:**
- `ConsentPurpose` — added `organization_id`, `name_hi`, `name_ta`, `name_te`, `created_at`
- `ConsentConfig` — removed `purposes: ConsentPurpose[]` (use `consent_purposes` table)
- Added `ConsentChannel`, `ConsentRecord`, `ConsentStats`, `ConsentConfigVersion`, `ConsentConfigVersionPurpose`

**API Routes (all under `/api/consent/`):**
- `config/route.ts` — Public GET `?org=slug`, widget config + purposes, `Cache-Control: public, max-age=300`, CORS + OPTIONS
- `record/route.ts` — Public POST, hashes identifier+IP with SHA-256 (org-salted), CORS + OPTIONS
- `withdraw/route.ts` — Public POST, marks non-withdrawn records for hashed identifier as withdrawn, CORS + OPTIONS
- `manage/route.ts` — Auth GET (config+purposes) / Auth POST (upsert config, rebuild purposes, bump widget_version, **write immutable version snapshot**)
- `audit/route.ts` — Auth GET, paginated consent_records with channel/date filters
- `stats/route.ts` — Auth GET, current month: total / consent_rate / withdrawals / by_channel
- `versions/route.ts` — Auth GET, list of immutable config snapshots (returns `available:false` if the table isn't created yet)

**Components (`src/components/modules/consent/`):**
- `EmbedCodeSnippet.tsx`, `ConsentStatsCard.tsx`, `PurposeEditor.tsx`, `WidgetPreview.tsx`, `AuditTable.tsx` (now has a Version column + in CSV), `VersionHistory.tsx`

**Dashboard Pages (`src/app/dashboard/consent/`):**
- `page.tsx` — status banner (shows live version + "View history" link), stats, embed code, purpose list
- `configure/page.tsx` — 4-step wizard: Purposes → Languages → Customize → Preview & Save
- `audit/page.tsx` — audit log
- `versions/page.tsx` — immutable config version history

**Public Widget (`public/consent-widget.js`):**
- Vanilla JS IIFE, no deps. Positions: bottom-bar / corner-popup / center-modal. **19 languages** + **RTL** (`dir="rtl"` for ur/ks/sd). Explicit `data-lang` always honored; `data-lang="auto"` follows browser language.
- **Floating "Privacy choices" button** appears after consent → re-opens the banner pre-filled with prior choices + a **Withdraw consent** button (calls `/api/consent/withdraw`, clears localStorage, shows a confirmation toast).
- Remembers choice in localStorage (`ts_consent_{org}`, `ts_uid_{org}`). Silent fail on all network errors.

**DB (run in Supabase SQL Editor — both DONE for the live project):**
- Core: `consent_configs`, `consent_purposes`, `consent_records` (+ RLS)
- `consent_config_versions` (+ RLS) — immutable per-version snapshot. SQL file: `db/consent_config_versions.sql`

**Key decisions:**
- `consent_purposes` table is source of truth; `consent_configs.purposes` JSONB intentionally unused
- **Public routes use the admin client** (service role) — no user session exists when the widget calls them, so RLS would otherwise block. All 3 public routes set CORS + an `OPTIONS` handler (widget runs cross-origin on client sites)
- Widget derives API base from `script.src` (NOT `window.location`, which is empty on `file://` test pages)
- Manage POST deletes + re-inserts purposes (avoids merge logic) and writes a version snapshot (best-effort — never blocks the save if the table is missing)
- **Consent rate** = % of records that accepted ≥1 *non-required* purpose (a "Reject All" does NOT count). The naive earlier version counted any accepted purpose → pinned at ~100% because `essential` is always accepted
- Config versioning: every save bumps `widget_version` AND snapshots full state; each `consent_record` stamps `config_version` so you can reconstruct exactly what a data principal agreed to (DPDP §6(5))

### ✅ M3: Privacy Notice Builder (complete — Session 4, June 2026)

**Constants in `src/lib/constants.ts`:**
- `DATA_CATEGORIES` (+ `DATA_CATEGORY_GROUPS`) — 16 standard Indian data categories grouped Identity/Contact/Financial/Sensitive/Technical/Other, each with a `sensitive` flag
- `THIRD_PARTY_CATEGORIES` — 7 recipient categories (Step 4 sharing)
- `NOTICE_LANGUAGES` — en/hi/ta/te/mr with `column` mapping to the `content_*` columns
- `INDUSTRY_PURPOSES` + `getIndustryPurposes(industry)` — Step 3 suggestions (bfsi→fintech, default fallback)
- `SIDEBAR_MODULES` privacy-notice entry → `available: true`

**Types in `src/types/dpdp.ts`:** `PrivacyNotice`, `PrivacyNoticeVersion`, and builder shapes (`NoticeCompanyDetails`, `NoticePurposeMapping`, `NoticeRetentionRule`, `NoticeSharing`, `NoticeBuilderData`).

**Lib:**
- `src/lib/ai/notice-generator.ts` — `NOTICE_GENERATION_PROMPT`, `buildNoticeUserPrompt()`, `buildTranslationSystemPrompt()`, `validateNotice()` (shared by builder UI + publish route). No SDK import (client-safe), so the builder can import `validateNotice`
- `src/lib/markdown.ts` — dependency-free Markdown→HTML (`renderMarkdown`, `extractHeadings`), HTML-escaped (XSS-safe for the public page)

**API routes (`/api/privacy-notice/`):**
- `route.ts` — Auth GET: notice + current version + version history (`available:false` if tables missing)
- `save/route.ts` — Auth POST: ensures notice row, writes immutable version snapshot (officer captured server-side)
- `generate/route.ts` — Auth POST: Claude `claude-sonnet-4-6` → English notice (400 if no Grievance Officer)
- `translate/route.ts` — Auth POST: Claude EN→target language (preserves Markdown)
- `publish/route.ts` — Auth POST `{version_id}`: `validateNotice` gate → stamps `published_at`, sets `current_version_id`, `published=true`
- `[slug]/route.ts` — **Public** GET: admin client + `published=true` + CORS + OPTIONS

**Components (`src/components/modules/privacy-notice/`):** `NoticeBuilder.tsx` (8-step wizard), `DataCategorySelector.tsx`, `PurposeMapper.tsx`, `LanguageSelector.tsx`, `NoticePreview.tsx`, `VersionHistory.tsx`, `PublicNoticeView.tsx`.

**Pages:** `src/app/dashboard/privacy-notice/page.tsx` (home), `.../builder/page.tsx`, `src/app/public/[slug]/page.tsx` (public, no auth — org logo + canonical URL).

**Middleware:** `/api/privacy-notice/` added to `PUBLIC_API_ROUTES` (public `[slug]` read; action sub-routes self-enforce auth).

**DB (run in Supabase SQL Editor — ⏳ pending):** `privacy_notices` + `privacy_notice_versions` (immutable, mirrors M2's `consent_config_versions`) + RLS — `db/privacy_notices.sql`. Plus `organizations.logo_url` (optional public-page logo) — `db/add_org_logo_url.sql`.

**Key decisions:**
- A `save` route exists (not in the original prompt) because publish needs an existing `version_id`; save writes the immutable draft snapshot
- Grievance Officer details (DPDP §14) are captured server-side from the live `grievance_officers` record on generate + save — never trusted from the client
- Public reads use the **admin client** + explicit `published=true` (no user session on `/public/[slug]`; same pattern as M2 public routes)
- "Download as PDF" = browser `window.print()` + print CSS (no `@react-pdf` dependency added); Markdown rendered via the in-repo `src/lib/markdown.ts` (no `react-markdown`)

### ✅ M9: Board Dashboard (complete — Session 5, June 2026)

**Last P0 module — platform is launch-ready. Creates NO tables; reads M1–M4.**

**Dependency:** `@react-pdf/renderer@4.5.1` + `serverExternalPackages: ['@react-pdf/renderer']` in `next.config.ts`.

**Types in `src/types/dpdp.ts`:** `OverviewResponse` (+ `OverviewModuleStatus`, `TopAction`, `RecentActivityItem`, `OverviewStats`), `CompassScoreHistory`/`CompassScorePoint`, `BoardReportData` (+ row/gap/timeline shapes).

**Lib (`src/lib/dashboard/`):**
- `aggregate.ts` — `getOverviewData()` + `getReportFacts()` (shared collector over M1–M4), `computeEffectiveScore()`, `maturityFromScore()`, `moduleToUrl()`. Pass any Supabase client (auth server **or** admin).
- `report-content.ts` — `buildBoardReportPrompt()` (Claude), `buildReportHtml()` (preview), `deterministicSummary()` (fallback + public view). No SDK import (client-safe).
- `share-token.ts` — stateless HMAC-SHA256 signed, 7-day, time-limited share token (no table).

**API routes (`/api/dashboard/`):** `overview` (GET), `compass-score` (GET), `report/generate` (POST, Claude `claude-sonnet-4-6` + deterministic fallback), `report/pdf` (POST `{ report }` → `application/pdf`, `runtime='nodejs'`), `report/share` (POST → public URL).

**Components (`src/components/modules/board/`):** `ModuleStatusGrid`, `StatsRow`, `PriorityActionsCard`, `RecentActivityFeed`, `ComplianceCalendar`, `BoardReportPDF.tsx` (server-only react-pdf, 5 pages, `renderBoardReportPdf()`). Reuses `assessment/CompassScoreGauge.tsx` (no board duplicate).

**Pages:** `src/app/dashboard/overview/page.tsx` (replaced M1 placeholder — full board home + empty-state 30-day plan), `dashboard/reports/page.tsx` (generate/PDF/share/preview), `public/board-report/[token]/page.tsx` (public, no auth, signed token).

**Sidebar:** added `reports` (`Board Reports`, `FileBarChart`) to `SIDEBAR_MODULES`; registered `FileBarChart` in `Sidebar.tsx`.

**Key decisions:**
- Headline "effective score" (Step 5) = assessment score + module bonuses (capped +20/100); raw `compass_score` kept for parity + feeds the trend (raw delta vs previous assessment); maturity badge derived from effective score.
- PDF route takes the structured `{ report }` (not `{ report_html }`) — @react-pdf renders primitives, not HTML; avoids a 2nd Claude call.
- Share link = signed stateless token → `/public/board-report/[token]` re-aggregates via admin client (no table); public view uses the deterministic summary (no Claude per view). Matches M2/M3/M4 public-read pattern. `/public/*` is already unauthenticated; `/api/dashboard/*` self-enforces auth.
- Layer 3 industry benchmarking deferred (needs 20+ assessments — §12).
- `type-check` ✅; react-pdf render ✅ (isolated); all routes verified in dev (401 / 307→login / public 200).
- **P1.5 FIX3 — now aggregates M1–M8 (not just M1–M4):** `aggregate.ts` adds `collectComplianceCoverage()` (read-time DSR/ROPA/Vendor/Breach counts, graceful-zero on empty tables), exposed via `BoardComplianceCoverage` on both `OverviewResponse` and `BoardReportData`. The overview gets a **Compliance Coverage** tile row (`components/modules/board/ComplianceCoverage.tsx`), the Claude prompt + deterministic summary + HTML preview gain the M5–M8 facts/alerts, and the PDF gains a **6th page**. Definitions match the modules' own derived helpers (DSR `due_date`/open statuses, vendor `dpa_status`+`dpa_expires_at`, breach `dpbi_notified`+`dpbi_notification_due_at`). No new tables/routes.

### ✅ M5: DSR Management (complete — Session 6, June 2026) — first P1 module

**Data Subject Rights portal for all 7 DPDP rights. A structural twin of M4 Grievance + email-OTP identity verification.**

**Constants (`src/lib/constants.ts`):** `DSR_RIGHT_TYPES` (6 actionable rights — grievance/§14 excluded, links to M4), `DSR_STATUS_LABELS`; `dsr` `SIDEBAR_MODULES` entry → `available: true`.

**Types (`src/types/dpdp.ts`):** `DsrRightType`, `DsrStatus`, `DsrVerificationMethod`, `DsrRequest`, `DsrNomination`, `DsrStats`.

**Lib (`src/lib/dsr/`):**
- `otp.ts` — **server-only**: `generateOtp`/`hashOtp` (request-id-salted sha256)/`hashDataPrincipal` (org-salted, links nomination↔request)/`maskEmail`/`sendOtpEmail` (Resend, `noreply@anixai.io`). Constants `OTP_TTL_MS`=10min, `OTP_MAX_ATTEMPTS`=5.
- `sla.ts` — **client-safe**: `DSR_SLA_DAYS`=30, `dueDateFrom`, `daysRemaining`, `isOpen`/`isClosed`/`isOverdue`.
- `draft.ts` — **client-safe** Claude prompt builders (no SDK import).

**API routes (`/api/dsr/`):**
- `submit/route.ts` — **public** (admin client + CORS/OPTIONS): `DSR-YYYY-NNN`, `due_date`=+30d, inserts as `identity_pending`, writes `dsr_nominations` for `nominate`, issues + emails OTP.
- `otp/verify/route.ts` + `otp/resend/route.ts` — **public** (admin client): hashed-OTP verify (TTL + attempt cap) flips `identity_pending` → `received` and emails the org officer/DPO (best-effort); resend re-issues.
- `requests/route.ts` (GET list, filter/search/paginate), `requests/[id]/route.ts` (GET + linked nomination, PATCH workflow), `stats/route.ts` (overdue/SLA aggregate), `draft/route.ts` (optional Claude `claude-sonnet-4-6`) — all **auth**.

**Components (`src/components/modules/dsr/`):** `DsrStatusBadge`, `SlaIndicator`, `DsrRequestsTable`, `DsrRequestDetail`, `PublicDsrForm` (4-step: select → details → OTP → done).

**Pages:** `src/app/public/dsr/[slug]/page.tsx` (public portal, admin client), `src/app/dashboard/dsr/page.tsx` (home), `.../dsr/requests/page.tsx` (list), `.../dsr/requests/[id]/page.tsx` (detail).

**Middleware:** `/api/dsr/submit` + `/api/dsr/otp/` added to `PUBLIC_API_ROUTES`.

**DB (run in Supabase SQL Editor — ⏳ pending):** `dsr_requests` + `dsr_nominations` + `dsr_otps` + RLS — `db/dsr_requests.sql`. `dsr_otps` is RLS-on with **no policies** (service-role only). `reference_number` is unique **per org** (composite index `dsr_requests_org_reference_uniq`), not global.

**Key decisions:**
- Email is required on the DSR form (email OTP is the only verification method); the DB column stays nullable.
- `dsr_otps` is a dedicated table (not columns on `dsr_requests`) so OTP hashes never appear in request reads and resend/attempt-limiting stays clean.
- "Overdue" is **derived** (`isOverdue` = open && past `due_date`), not written by a cron; the `'overdue'` enum value is retained for completeness.
- Grievance redressal (§14) is not a `right_type` — the portal links it to `/public/grievance/[slug]` (M4).
- Public routes use the **admin client** (matches M2/M3); the `WITH CHECK (true)` insert policy is belt-and-suspenders.
- **Reference numbers are unique per org, not globally** (composite index) — the generator counts per org, so a global `UNIQUE` would collide across orgs. Fixed during M5 testing; M4 grievance fixed in P1.5 FIX1 (`db/fix_grievance_reference_unique.sql` — ✅ applied in Supabase, live).
- **Public OTP routes accept `org_slug`** and scope the reference lookup by org (a bare reference is no longer globally unique). The verify route also emails the org's Grievance Officer (DPO) on success — best-effort.

**Note:** the M9 board still reads M1–M4 only — it does **not** auto-show live M5 status (optional follow-up: extend `aggregate.ts` + `ModuleStatusGrid.tsx`).

### ✅ M7: Vendor DPA Manager (complete — Session 7, June 2026) — second P1 module

**Vendor registry → 45-question DPDP risk questionnaire → automated risk score/tier → Claude DPA generator → DPA status workflow with derived 30-day expiry alerts. A CRUD/status/dashboard twin of M5 DSR + M4 Grievance.**

**Constants (`src/lib/constants.ts`):** `VENDOR_TYPES` (8), `VENDOR_DPA_STATUS_LABELS`, `VENDOR_RISK_TIERS`, `DPA_EXPIRY_WARNING_DAYS`=30, `INDIA_VENDOR_PREASSESSMENTS` (20-vendor library; not bulk-inserted); `vendors` `SIDEBAR_MODULES` entry → `available: true`. (Adds a top-of-file type-only `import type { VendorType, VendorRiskTier }`.)

**Types (`src/types/dpdp.ts`):** `VendorType`, `VendorDpaStatus`, `VendorRiskTier`, `Vendor`, `VendorQuestionnaireResponse`, `VendorStats`.

**Lib (`src/lib/vendors/`):**
- `questionnaire.ts` — **client-safe** 45-question bank (Sections A–G), per-question risk `weight` + `riskyAnswer`/option `risk`.
- `risk.ts` — **client-safe** `computeVendorRisk()` → `risk_score` 0–100 (**higher = riskier**, inverse of Compass) + `risk_tier`; `scoreForTier()` for library seeds.
- `status.ts` — **client-safe** DERIVED expiry helpers (`isExpiringSoon`/`isExpired`/`effectiveDpaStatus`/`dpaNeedsAttention`; analog of `dsr/sla.ts`, no cron).
- `dpa.ts` — **client-safe** Claude DPA prompt builders (no SDK import).
- `token.ts` — **server-only** HMAC-SHA256 signed questionnaire token (copy of M9 `share-token.ts`), 30-day TTL.
- `email.ts` — **server-only** `sendQuestionnaireEmail` (Resend, `noreply@anixai.io`).

**API routes (`/api/vendors/`):** `route.ts` (auth GET list/filter/search/paginate + POST create/library), `[id]/route.ts` (auth GET+PATCH+DELETE), `stats/route.ts` (auth aggregate), `[id]/dpa/route.ts` (auth Claude `claude-sonnet-4-6`), `[id]/send-questionnaire/route.ts` (auth — signed token + Resend), `questionnaire/submit/route.ts` (**public** admin client + CORS/OPTIONS — token-verified, upserts answers, recomputes risk).

**Components (`src/components/modules/vendors/`):** `VendorStatusBadge`, `VendorRiskBadge`, `DpaExpiryIndicator`, `VendorsTable`, `VendorFormModal`, `VendorLibraryPicker`, `DpaPreview` (Markdown + print), `VendorDetail`, `PublicVendorQuestionnaire`.

**Pages:** `src/app/dashboard/vendors/page.tsx` (home), `.../vendors/list/page.tsx` (registry), `.../vendors/[id]/page.tsx` (detail), `src/app/public/vendor-questionnaire/[token]/page.tsx` (public, server component, admin-client token load).

**Middleware:** `/api/vendors/questionnaire/` added to `PUBLIC_API_ROUTES` (only the public questionnaire sub-tree; the rest self-enforces auth).

**DB (run in Supabase SQL Editor — ⏳ pending):** `vendors` + `vendor_questionnaire_responses` + RLS — `db/vendors.sql`. No per-org reference number (the M4/M5 global-unique pitfall does not apply).

**Key decisions:**
- Risk score is the **inverse of the Compass Score** (higher = riskier); normalised by answered weight so partial completion isn't penalised.
- DPA expiry alerts are **derived at read time** (`effectiveDpaStatus` + `isExpiringSoon(…,30)`); no cron, `dpa_status='expired'` still settable manually.
- Public questionnaire uses a **stateless signed token + admin client** (no vendor login, no token table) — mirrors M9 share-token + M2/M5 public-route pattern; submit never returns the internal risk to the vendor.
- DPA export is **Markdown + `window.print`** (reuses `src/lib/markdown.ts`); no `@react-pdf` dependency added. SDK call isolated in the route.
- Pre-assessed India library is a **constant added per-org on demand** (spec's 10 expanded to 20, clearly marked).

### ✅ M6: ROPA Builder (complete — Session 8, June 2026) — third P1 module

**Record of Processing Activities — the internal inventory of every personal-data processing activity. A CRUD/status/dashboard twin of M7 Vendor + M5 DSR, with an AI-assist, an industry-template library, a ROPA↔Consent read-time cross-reference, server-side DPO approval, and PDF/CSV export. NO public routes (internal only) — middleware untouched.**

**Constants (`src/lib/constants.ts`):** `ROPA_SUBJECT_TYPES` (customers/employees/children/vendors/website_visitors), `ROPA_STATUS_LABELS`, `ROPA_INDUSTRY_TEMPLATES` (fintech/healthtech/edtech/ecommerce/hrtech) + `DEFAULT_ROPA_TEMPLATE` + `getRopaTemplates()` (bfsi→fintech, default fallback; mirrors `getIndustryPurposes`) + co-located `RopaTemplateActivity` interface; `ropa` `SIDEBAR_MODULES` entry → `available: true` (the `Database` icon was already registered). Reuses `DPDP_BASES` (legal basis), `DATA_CATEGORIES`/`DATA_CATEGORY_GROUPS`.

**Types (`src/types/dpdp.ts`):** `RopaStatus` (`draft|active|archived`), `RopaSubjectType`, `RopaEntry` (DB row), `RopaStats`, `RopaConsentCoverage` (cross-ref result), `RopaAiSuggestion` (AI-suggest response).

**Lib (`src/lib/ropa/`):**
- `ai.ts` — **client-safe** (no SDK): `ROPA_AI_SYSTEM_PROMPT`, `buildRopaSuggestPrompt()`, `sanitizeRopaSuggestion()` (defensive enum/key validation).
- `consent.ts` — **client-safe** pure matcher: `computeConsentCoverage()` / `buildCoverageMap()` (token-overlap of consent-based activities against M2 `consent_purposes`; `CONSENT_LEGAL_BASIS = 'consent_s6'`).

**API routes (`/api/ropa/`):** `route.ts` (auth GET list/filter[status,subject_type]/search/paginate + inline coverage + POST create/template), `[id]/route.ts` (auth GET+coverage / PATCH edit+DPO-approval+validated status transitions / DELETE), `stats/route.ts` (auth aggregate + consent gap counts), `ai-suggest/route.ts` (auth Claude `claude-sonnet-4-6`, structured JSON), `export/pdf/route.ts` (auth, `@react-pdf`, `runtime='nodejs'`), `export/csv/route.ts` (auth, hand-rolled RFC-4180 CSV). Coverage is served inline by list/detail/stats — no separate endpoint.

**Components (`src/components/modules/ropa/`):** `RopaStatusBadge`, `RopaConsentBadge`, `RopaTable`, `RopaEntryForm` (create/edit + AI-assist panel + vendor processor chips), `RopaTemplatePicker`, `RopaEntryDetail` (approval workflow + status + field display), `RopaReportPDF.tsx` (server-only `@react-pdf` register, `renderRopaReportPdf()`).

**Pages (`src/app/dashboard/ropa/`):** `page.tsx` (home + stats + 30s refresh + exports + consent-gap alert), `list/page.tsx` (filters + search + pagination), `[id]/page.tsx` (detail). Plain `dashboard/ropa/` folder (verified 307→login).

**DB (Supabase SQL Editor — ✅ applied 2026-06-29, live):** `ropa_entries` + RLS (org-members) + org-scoped indexes — `db/ropa.sql`. No per-org reference number; no public policy.

**Key decisions:**
- ROPA↔Consent is a **read-time join, never a stored column** — `consent.ts` matches each consent-based activity against `consent_purposes`; computed inline in list/detail/stats (a separate `/consent-coverage` route would be redundant).
- **DPO approval is server-side** — `PATCH {approve:true}` stamps `dpo_approved`/`dpo_approved_at`/`last_reviewed_at` and sets `status='active'` atomically; the authenticated user acts as DPO (no separate DPO entity). draft→active→archived validated; activating requires prior sign-off.
- **AI-assist returns structured JSON** parsed defensively (`sanitizeRopaSuggestion` filters enums, drops unknown keys); prompt builder kept client-safe, SDK call isolated in the route.
- **Templates are a per-org "Add from template" library** (not bulk-inserted); export = `@react-pdf` PDF register + hand-rolled CSV — **zero new deps**, `npm audit` = 0, `type-check` ✅.

### ✅ M8: Breach Response (complete — Session 9, June 2026) — fourth/last P1 module

**Internal breach log + the 72-hour DPBI notification workflow (DPDP §8(6) + Rules 2025 Rule 7) — TrustStack's most unique feature, no competitor has it. A CRUD/status/dashboard twin of M5 DSR + M6 ROPA + M7 Vendor: per-org reference (M5), Claude notification draft (M7 DPA), DERIVED 72-hour countdown (M5 SLA / M7 expiry), secret-gated email escalations. INTERNAL only — no public routes, middleware untouched.**

**Constants (`src/lib/constants.ts`):** `BREACH_NATURE_TYPES` (6), `BREACH_STATUS_LABELS` (open/contained/resolved), `DPBI_DEADLINE_HOURS`=72, `BREACH_ESCALATION_HOURS`=[48,24,12,6,2]; `breach` `SIDEBAR_MODULES` entry → `available: true` (`AlertTriangle` already registered). Reuses `DATA_CATEGORIES`. Adds `BreachNature` to the top type-only import.

**Types (`src/types/dpdp.ts`):** `BreachNature`, `BreachStatus` (open/contained/resolved — DPBI-notified is a separate boolean, not a status), `BreachUrgency`, `BreachIncident`, `BreachStats`.

**Lib (`src/lib/breach/`):**
- `countdown.ts` — **client-safe** DERIVED date math (analog of `dsr/sla.ts` + `vendors/status.ts`): `dueAtFrom`, `hoursRemaining`, `minutesRemaining`, `isOverdue`, `urgencyLevel`, `formatCountdown`, `needsDpbiNotification`. No cron.
- `notification.ts` — **client-safe** Claude prompt builders (no SDK): `DPBI_SYSTEM_PROMPT` + `buildDpbiUserPrompt()` (exact Rule 7 prompt; formal letter, not JSON; `DpbiContact` injected server-side).
- `escalation.ts` — **server-only** `sendBreachEscalationEmail` (Resend dynamic import, `noreply@anixai.io`).

**API routes (`/api/breach/`):** `route.ts` (auth GET list/filter[status,nature]/search/paginate + POST log — per-org `BRH-YYYY-NNN`, due_at=discovered+72h, `logged_by` server-side), `[id]/route.ts` (auth GET + PATCH — validated open→contained→resolved with `resolved_at`, `mark_dpbi_notified`/`principals_notified` server-side timestamps, post-mortem), `stats/route.ts` (auth aggregate, derived overdue/due_soon), `[id]/dpbi-draft/route.ts` (auth Claude `claude-sonnet-4-6`, officer pulled server-side, persisted), `escalations/run/route.ts` (**no session**, `CRON_SECRET`-gated, admin client, idempotent via `escalations_sent[]`).

**Components (`src/components/modules/breach/`):** `BreachStatusBadge`, `BreachCountdown` (table pill + live ticking detail `banner`), `BreachTable` (the register), `BreachDetail` (countdown + DPBI draft + mark-notified + principal notification + status workflow + post-mortem), `BreachLogModal` (mirrors `RopaEntryForm`).

**Pages (`src/app/dashboard/breach/`):** `page.tsx` (home), `list/page.tsx` (register), `[id]/page.tsx` (detail). Plain `dashboard/breach/` folder (verified 307→/login).

**DB (Supabase SQL Editor — ✅ applied 2026-06-29, live):** `breach_incidents` + RLS (org-members) + **composite per-org `(organization_id, reference_number)` unique index** + `escalations_sent text[]` + org-scoped indexes — `db/breach_incidents.sql`. No public policy. (Escalation *emails* still need `CRON_SECRET` + an external scheduler — optional, see Key decisions.)

**Key decisions:**
- 72-hour countdown is **DERIVED at read time, no cron** — due_at stamped on create for indexed scans; detail banner ticks client-side (minute-accurate, no polling). Nothing flips status automatically.
- Reference is **per org, not global** (composite index) — generator counts the org's incidents for the year (`BRH-YYYY-NNN`); avoided the latent M4 global-unique bug up-front.
- **DPBI-notified is a boolean, not a status** — lifecycle stays open/contained/resolved; all workflow timestamps stamped server-side in PATCH.
- **DPBI draft = formal letter** (not JSON) — client-safe prompt builder, SDK call isolated in the route, follow-up contact pulled from the active M4 Grievance Officer server-side, draft persisted.
- **Escalation emails need an external scheduler** — `POST /api/breach/escalations/run` is idempotent + `CRON_SECRET`-gated; emails do NOT auto-send. Wiring Vercel Cron / GitHub Action / Supabase pg_cron (~15 min) is a documented deployment step. Zero new deps; `npm audit` = 0; `type-check` ✅.

### 🎉 All modules M1–M10 built + all DB schema applied (M6 + M8 SQL run 2026-06-29). Remaining before launch: QA pass (FIX4) + optional M8 escalation cron.

---

## 6. App Router Structure

```
src/
  app/
    (marketing)/            ← existing: public marketing pages
    (auth)/                 ← login, signup, create-organization
      login/
      signup/
      create-organization/
    dashboard/              ← authenticated platform (NOT a route group — avoids URL collision)
      layout.tsx            ← Dashboard shell
      page.tsx              ← Redirects to /dashboard/overview
      overview/page.tsx     ← M9: Board Dashboard home (replaces M1 placeholder)
      reports/page.tsx      ← M9: Board report (PDF + share link)
      assessment/           ← M1: Compass Assessment
        page.tsx
        new/page.tsx
        [id]/page.tsx
        results/[id]/page.tsx
      consent/              ← M2: Consent Management
      privacy-notice/       ← M3: Privacy Notice Builder
      grievance/            ← M4: Grievance Officer Portal
      dsr/                  ← M5: DSR Management (Phase 1)
      ropa/                 ← M6: ROPA Builder (Phase 1)
      vendors/              ← M7: Vendor DPA (Phase 1)
      breach/               ← M8: Breach Response (Phase 1)
      settings/
    api/
      auth/callback/        ← Supabase auth callback
      organizations/create/ ← Server-side org creation (admin client)
      assessment/
        start/
        save-answer/
        submit/
        results/[id]/
      consent/
        config/             ← Public: GET widget config
        record/             ← Public: POST consent event
      grievance/
        submit/             ← Public: POST complaint
      chat/                 ← ✅ exists
      health-check/         ← ✅ exists
    public/
      [slug]/               ← M3: Hosted Privacy Notice
      grievance/[slug]/     ← M4: Public grievance form
  components/
    auth/
    dashboard/              ← Sidebar, Topbar
    modules/
      assessment/           ← ✅ 5 components built
      consent/
      privacy-notice/
      grievance/
      board/
    chatbot/                ← ✅ TrustChat.tsx
    ui/                     ← shared primitives
    layout/                 ← ✅ Navbar, Footer
    marketing/              ← ✅ landing sections
  lib/
    supabase/
      client.ts             ← ✅ Browser client
      server.ts             ← ✅ Server client
      admin.ts              ← ✅ Admin client (service role)
    ai/
      compass-scorer.ts     ← ✅ Scoring algorithm
      gap-generator.ts      ← ✅ Gap generation (generic + industry-aware in Layer 1)
      notice-generator.ts   ← Privacy notice AI generation (M3)
    utils.ts                ← ✅ cn(), formatCurrency(), truncate()
    constants.ts            ← ✅ All DPDP constants
    assessment-questions.ts ← ✅ All 45 questions
  types/
    dpdp.ts                 ← ✅ All TypeScript domain types
  middleware.ts             ← ✅ Auth protection for /dashboard/*
```

---

## 7. Authentication & Multi-Tenancy Model

### Auth Provider: Supabase Auth
- Email + password signup
- Email verification (configurable in Supabase dashboard)
- Google OAuth (optional, add later)

### Multi-tenancy: Organization-based
Every user belongs to exactly one **organization**. All compliance data belongs to an organization, never a user directly.

### Critical implementation pattern for org creation:
**Never use the browser Supabase client directly for org creation.** After signup/redirect, the browser JWT may not be wired up yet, causing RLS violations. Always use the API route `/api/organizations/create` which:
1. Verifies auth server-side (cookies always reliable)
2. Uses the admin client to bypass RLS for the insert
3. Returns success/error as JSON

### Row-Level Security (RLS)
Every Supabase table MUST have RLS enabled. Standard pattern:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read" ON table_name FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members can write" ON table_name FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));
```

### CRITICAL RLS pitfall — infinite recursion:
**Never write an RLS policy on `organization_members` that queries `organization_members`.** It causes infinite recursion. The correct read policy is simply:

```sql
CREATE POLICY "members can read membership" ON organization_members FOR SELECT
  USING (user_id = auth.uid());
```

### User Roles
- `admin` — full access, can invite users, manage billing
- `dpo` — full compliance access, cannot manage billing/users
- `viewer` — read-only access to dashboard
- `board` — read-only access to M9 Board Dashboard only

---

## 8. Full Supabase Schema

**Canonical schema for ALL modules. Every session must use these exact table and column names.**

### Applied RLS fixes (run in Supabase after initial schema)
These 3 policies were added after the initial schema to fix RLS issues discovered during M1 testing:

```sql
-- Fix infinite recursion in organization_members
DROP POLICY IF EXISTS "members can read membership" ON organization_members;
CREATE POLICY "members can read membership" ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to create orgs (via API route)
CREATE POLICY "authenticated users can create org" ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to insert their own membership
CREATE POLICY "users can insert own membership" ON organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### Core Tables

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cin TEXT,
  gstin TEXT,
  registered_state TEXT,
  industry TEXT,              -- 'fintech' | 'edtech' | 'ecommerce' | 'bfsi' | 'healthtech' | 'retail' | 'it' | 'hrtech' | 'logistics' | 'media' | 'other'
  employee_count_range TEXT,  -- '1-50' | '51-200' | '201-500' | '501-2000' | '2000+'
  revenue_range TEXT,         -- '<10Cr' | '10-50Cr' | '50-200Cr' | '200-500Cr' | '500Cr+'
  logo_url TEXT,              -- M3: optional logo shown on the public privacy notice page (db/add_org_logo_url.sql)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

### M1: DPDP Compass™ Assessment

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'in_progress',  -- 'in_progress' | 'completed'
  compass_score INTEGER,                        -- 0-100
  maturity_level INTEGER,                       -- 1-5
  risk_tier TEXT,                               -- 'critical' | 'high' | 'medium' | 'low' | 'managed'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,   -- 'Q1'...'Q45' (core) | 'FIN1'...'FIN8' (fintech) | 'HLT1'...'HLT8' (healthtech) | 'EDT1'...'EDT8' (edtech)
  section TEXT NOT NULL,
  answer TEXT NOT NULL,        -- 'yes' | 'no' | 'partial' | free text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT assessment_answers_assessment_question_unique UNIQUE (assessment_id, question_id)
);

CREATE TABLE assessment_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  gap_description TEXT NOT NULL,
  priority TEXT NOT NULL,       -- 'p0' | 'p1' | 'p2' | 'p3'
  dpdp_section TEXT,
  recommended_action TEXT NOT NULL,
  module_to_fix TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### M2: Consent Management

```sql
CREATE TABLE consent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  widget_version TEXT NOT NULL DEFAULT '1',
  purposes JSONB NOT NULL DEFAULT '[]',
  languages TEXT[] NOT NULL DEFAULT '{en}',
  position TEXT NOT NULL DEFAULT 'bottom-bar',
  primary_color TEXT NOT NULL DEFAULT '003366',
  show_reject_all BOOLEAN NOT NULL DEFAULT TRUE,
  require_age_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  config_version TEXT NOT NULL,
  data_principal_hash TEXT NOT NULL,
  channel TEXT NOT NULL,              -- 'web' | 'whatsapp' | 'sms' | 'aadhaar'
  purposes_accepted TEXT[] NOT NULL DEFAULT '{}',
  purposes_rejected TEXT[] NOT NULL DEFAULT '{}',
  language TEXT NOT NULL DEFAULT 'en',
  user_agent TEXT,
  ip_hash TEXT,
  withdrawn BOOLEAN NOT NULL DEFAULT FALSE,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consent_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  purpose_key TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_hi TEXT,
  name_ta TEXT,
  name_te TEXT,
  description_en TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  dpdp_basis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, purpose_key)
);

-- Immutable per-version config snapshot (Session 3 enhancement). Full SQL + RLS: db/consent_config_versions.sql
CREATE TABLE consent_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  purposes JSONB NOT NULL DEFAULT '[]',
  languages TEXT[] NOT NULL DEFAULT '{en}',
  position TEXT NOT NULL DEFAULT 'bottom-bar',
  primary_color TEXT NOT NULL DEFAULT '003366',
  show_reject_all BOOLEAN NOT NULL DEFAULT TRUE,
  require_age_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, version)   -- RLS: members SELECT/INSERT own org only; NO update/delete (immutable)
);
```

### M3: Privacy Notice

```sql
CREATE TABLE privacy_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  current_version_id UUID,
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE privacy_notice_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES privacy_notices(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content_en TEXT NOT NULL,
  content_hi TEXT,
  content_ta TEXT,
  content_te TEXT,
  content_mr TEXT,
  grievance_officer_name TEXT NOT NULL,
  grievance_officer_email TEXT NOT NULL,
  grievance_officer_phone TEXT,
  change_summary TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### M4: Grievance Officer Portal

```sql
CREATE TABLE grievance_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  appointed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grievance_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT UNIQUE NOT NULL,  -- e.g. 'GRV-2026-001'
  complainant_name TEXT NOT NULL,
  complainant_email TEXT,
  complainant_phone TEXT,
  complaint_type TEXT NOT NULL,           -- 'consent' | 'access' | 'correction' | 'erasure' | 'breach' | 'other'
  description TEXT NOT NULL,
  attachment_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'new',     -- 'new' | 'under_review' | 'resolved' | 'escalated_to_dpbi'
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- M5: DSR Management (full SQL + RLS: db/dsr_requests.sql)
CREATE TABLE dsr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,             -- 'DSR-2026-001' — UNIQUE PER ORG (composite index dsr_requests_org_reference_uniq), NOT global
  right_type TEXT NOT NULL,                   -- 'access' | 'correction' | 'completeness' | 'erasure' | 'restrict' | 'nominate'
  requestor_name TEXT NOT NULL,
  requestor_email TEXT,
  requestor_phone TEXT,
  requestor_identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_method TEXT,                   -- 'email_otp' | 'sms_otp' | 'aadhaar'
  request_details TEXT,
  affected_data_categories TEXT[],
  status TEXT NOT NULL DEFAULT 'received',    -- 'received' | 'identity_pending' | 'processing' | 'fulfilled' | 'denied' | 'overdue'
  assigned_to UUID REFERENCES auth.users(id),
  fulfillment_notes TEXT,
  denial_reason TEXT,
  fulfilled_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,                       -- created_at + 30 days
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dsr_nominations (              -- Section 15 (no GDPR equivalent)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  data_principal_hash TEXT NOT NULL,         -- sha256(org:requestor_email) — links to dsr_requests
  nominee_name TEXT NOT NULL,
  nominee_email TEXT NOT NULL,
  nominee_phone TEXT,
  relationship TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dsr_otps (                      -- email-OTP material; RLS ON + NO policies = service-role only
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dsr_request_id UUID NOT NULL REFERENCES dsr_requests(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,                    -- sha256(request_id:code), never the raw code
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### M7: Vendor DPA Manager (full SQL + RLS: db/vendors.sql)

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  vendor_type TEXT NOT NULL,                 -- 'cloud' | 'payments' | 'analytics' | 'marketing' | 'crm' | 'hr' | 'communications' | 'other'
  data_location TEXT[],
  india_data_residency BOOLEAN DEFAULT FALSE,
  personal_data_categories TEXT[],
  risk_tier TEXT,                            -- 'low' | 'medium' | 'high' | 'critical' (computed from questionnaire; HIGHER = riskier)
  risk_score INTEGER,                        -- 0-100 computed (inverse of Compass Score)
  dpa_status TEXT NOT NULL DEFAULT 'pending',-- 'pending' | 'sent' | 'signed' | 'expired'
  dpa_signed_at TIMESTAMPTZ,
  dpa_expires_at TIMESTAMPTZ,                -- 30-day expiry alert is DERIVED from this (no cron)
  dpa_document_url TEXT,                     -- link to an externally-hosted signed copy
  questionnaire_completed BOOLEAN DEFAULT FALSE,
  questionnaire_completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,                 -- 'A1' … 'G6'
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- UNIQUE (vendor_id, question_id) via vendor_qresp_vendor_question_uniq (submit upserts on it)
);
-- RLS: both gated by organization_members. Public submit uses the service-role
-- admin client (bypasses RLS), so no public-insert policy is needed.
```

### M6: ROPA Builder (full SQL + RLS: db/ropa.sql)

```sql
CREATE TABLE ropa_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL,
  activity_description TEXT,
  data_controller_name TEXT NOT NULL,
  data_categories TEXT[] NOT NULL DEFAULT '{}',     -- DATA_CATEGORIES keys
  data_subject_types TEXT[] NOT NULL DEFAULT '{}',  -- 'customers' | 'employees' | 'children' | 'vendors' | 'website_visitors'
  processing_purposes TEXT[] NOT NULL DEFAULT '{}',
  legal_basis TEXT NOT NULL,                        -- DPDP_BASES id
  data_sources TEXT[],
  recipients TEXT[],
  cross_border_transfer BOOLEAN DEFAULT FALSE,
  transfer_countries TEXT[],
  retention_period TEXT,
  security_measures TEXT[],
  processor_names TEXT[],
  dpo_approved BOOLEAN DEFAULT FALSE,               -- flipped server-side on DPO approval
  dpo_approved_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',             -- 'draft' | 'active' | 'archived'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: org members manage their own ROPA (the standard organization_members
-- pattern). INTERNAL only — no public routes, no public policy. Indexes:
-- (organization_id, status) and (organization_id, created_at desc). The
-- ROPA↔Consent cross-reference is computed at READ TIME (no stored column).
```

### M8: Breach Response (full SQL + RLS: db/breach_incidents.sql)

```sql
CREATE TABLE breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,                  -- 'BRH-2026-001' — UNIQUE PER ORG (composite index breach_incidents_org_reference_uniq), NOT global
  discovered_at TIMESTAMPTZ NOT NULL,              -- when the org became aware
  occurred_at TIMESTAMPTZ,                         -- when it actually happened (if known)
  nature TEXT NOT NULL,                            -- 'unauthorized_access' | 'accidental_disclosure' | 'ransomware' | 'data_loss' | 'insider_threat' | 'other'
  data_categories_affected TEXT[] NOT NULL DEFAULT '{}',
  data_subjects_affected_approx INTEGER,
  systems_involved TEXT[],
  discovery_method TEXT,
  containment_actions TEXT,
  -- 72-hour DPBI countdown (DERIVED at read time; due_at stored for indexed scans)
  dpbi_notification_due_at TIMESTAMPTZ NOT NULL,   -- discovered_at + 72 hours
  dpbi_notified BOOLEAN NOT NULL DEFAULT FALSE,
  dpbi_notified_at TIMESTAMPTZ,
  dpbi_notification_draft TEXT,                    -- Claude-generated DPBI letter
  principals_notified BOOLEAN NOT NULL DEFAULT FALSE,
  principals_notified_at TIMESTAMPTZ,
  notification_method TEXT,
  status TEXT NOT NULL DEFAULT 'open',             -- 'open' | 'contained' | 'resolved' (DPBI-notified is the boolean above, NOT a status)
  root_cause TEXT,
  remediation_actions TEXT,
  resolved_at TIMESTAMPTZ,
  escalations_sent TEXT[] NOT NULL DEFAULT '{}',   -- crossed escalation thresholds already emailed (idempotency)
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: org members manage their own breaches (standard organization_members
-- pattern). INTERNAL only — no public routes, no public policy. The 72-hour
-- countdown is DERIVED at read time (no cron). Indexes: composite per-org
-- (organization_id, reference_number) UNIQUE + (org, status) + (org, created_at
-- desc) + (org, dpbi_notification_due_at) + (org, dpbi_notified). The escalation
-- ALERT emails need an external scheduler hitting POST /api/breach/escalations/run.
```

---

## 9. Supabase Client Setup

**Browser client** (`src/lib/supabase/client.ts`) — already created, do not recreate:
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server client** (`src/lib/supabase/server.ts`) — already created, do not recreate.

**Admin client** (`src/lib/supabase/admin.ts`) — already created, do not recreate. Use for server-side operations that need to bypass RLS (e.g., org creation, gap insertion).

---

## 10. DPDP Domain Constants

All constants live in `src/lib/constants.ts`. Key exports:
- `DPDP_RIGHTS` — 7 rights (Sections 11–17)
- `DPDP_BASES` — 7 lawful processing bases
- `MATURITY_LEVELS` — Level 1–5 with colors, bgColors, score ranges
- `RISK_TIERS` — critical / high / medium / low / managed
- `INDUSTRY_SECTORS` — 10 sectors
- `EMPLOYEE_COUNT_RANGES`, `REVENUE_RANGES`, `DATA_RECORDS_RANGES`, `DATA_ACCESS_EMPLOYEE_RANGES`
- `SUPPORTED_LANGUAGES` — 22 Indian languages
- `ASSESSMENT_SECTION_LABELS` — display names for 8 sections
- `ASSESSMENT_SECTION_ORDER` — canonical section order array
- `SIDEBAR_MODULES` — all nav items with availability flags

---

## 11. Compass Score Algorithm

**File:** `src/lib/ai/compass-scorer.ts` (already built)

**Section weights (112 raw pts → normalized to 0–100):**
- Section 1 (Org Profile): 0 pts — informational only
- Section 2 (Data Fiduciary): 16 pts (2 pts × 8 questions)
- Section 3 (Consent): 18 pts (3 pts × 6 questions)
- Section 4 (Privacy Notice): 12 pts (3 pts × 4 questions)
- Section 5 (User Rights): 18 pts (3 pts × 6 questions)
- Section 6 (Security): 18 pts (3 pts × 6 questions)
- Section 7 (Breach): 15 pts (3 pts × 5 questions)
- Section 8 (Vendor): 15 pts (3 pts × 5 questions)
- **Total raw: 112 pts → normalized to 100**

**When industry-specific questions are added (Layer 2):**
- Industry module adds up to 24 pts (3 pts × 8 questions)
- New total raw max: 136 pts → still normalized to 100
- scorer already normalizes by `totalMax` dynamically, so no scorer change needed

**Special case — Q38 (breach history) is inverted:**
- `no` (no breach) = full points
- `partial` (minor incident handled) = half points
- `yes` (breach occurred) = 0 points

**Maturity level from score:**
- 0–20: Level 1 (Critical) — red
- 21–40: Level 2 (Developing) — amber
- 41–60: Level 3 (Defined) — blue
- 61–80: Level 4 (Managed) — green
- 81–100: Level 5 (Optimized) — purple

---

## 12. Industry-Specific Assessment Architecture

**This is a planned feature in 3 layers. Read carefully before building any assessment-related code.**

### Background
The 45-question core assessment is generic and applies to all Data Fiduciaries. Different industries have different risk profiles, regulatory overlaps, and common gaps. Industry-specific layers add differentiation and increase value for customers.

### Layer 1 — Industry-aware gap recommendations ✅ Complete (Session 1b)
**What it does:** Same 45 questions, same scoring, but the `recommended_action` in gap cards changes based on the org's industry (already captured in `organizations.industry`).

**Files to change:**
- `src/lib/ai/gap-generator.ts` — Add `industry` parameter to `generateGaps()`. Add an `INDUSTRY_GAP_OVERRIDES` map that replaces `recommended_action` for key questions per industry.
- `src/app/api/assessment/submit/route.ts` — Fetch org's industry and pass to `generateGaps()`
- No UI changes needed

**Industry overrides needed for at minimum:** fintech, healthtech, edtech (highest-risk industries for DPDP)

**Example for Q14 (consent mechanism):**
- fintech: "Deploy consent widget covering payment data, UPI transaction history, and credit bureau queries. Cross-reference RBI Master Direction on IT §6."
- healthtech: "Implement separate consent flows for clinical data vs. platform data. Health records require distinct, revocable consent under DPDP + DISHA."
- edtech: "Every user under 18 requires verifiable parental consent. This is your highest legal risk — implement before any other consent change."

### Layer 2 — Industry-specific question module ✅ Complete (Session 1b)
**What it does:** After the 8 generic sections, adds a 9th section "Industry-Specific Obligations" with 6–8 questions for Fintech, Healthtech, and EdTech. Other industries skip this section.

**Question IDs:** Use prefix format — `FIN1`–`FIN8`, `HLT1`–`HLT8`, `EDT1`–`EDT8`

**Files to change:**
- `src/lib/assessment-questions.ts` — Add industry question arrays, export `getIndustryQuestions(industry: string)`
- `src/lib/constants.ts` — Add `INDUSTRY_SECTION_LABEL` and update `ASSESSMENT_SECTION_ORDER` to conditionally include industry section
- `src/lib/ai/compass-scorer.ts` — Already handles dynamic `totalMax`, no change needed
- `src/lib/ai/gap-generator.ts` — Add industry-specific gap definitions for new question IDs
- `src/app/dashboard/assessment/[id]/page.tsx` — Fetch org's industry, conditionally show industry section as Section 9
- `src/app/api/assessment/submit/route.ts` — Pass industry to gap generator

**Fintech questions (FIN1–FIN8):**
- FIN1: Do you store or process payment instrument data (card numbers, UPI VPAs, netbanking credentials)?
- FIN2: Are your AI-based credit scoring or underwriting models explainable to users who are denied?
- FIN3: Do you share customer financial data with credit bureaus (CIBIL, Experian, Equifax)?
- FIN4: Is your data handling aligned with RBI's Master Direction on IT Framework for NBFCs/Banks?
- FIN5: Do you obtain explicit consent before sharing financial data with insurance or lending partners?
- FIN6: Do you have a process to handle data requests from SEBI, RBI, or ED investigations?
- FIN7: Do users have a mechanism to opt out of financial product cross-selling based on their data?
- FIN8: Do your KYC processes comply with PMLA data retention requirements alongside DPDP?

**Healthtech questions (HLT1–HLT8):**
- HLT1: Do you process health records, prescriptions, diagnostic reports, or mental health data?
- HLT2: Is clinical consent (for treatment) clearly separated from data consent in your flows?
- HLT3: Do patients have a mechanism to restrict access to their health records to specific providers?
- HLT4: Is your platform aligned with DISHA (Digital Information Security in Healthcare Act)?
- HLT5: Do you share health data with insurance companies, employers, or research institutions?
- HLT6: Are telemedicine session recordings treated as sensitive personal data with appropriate controls?
- HLT7: Do you have a process for handling requests from ABDM (Ayushman Bharat Digital Mission)?
- HLT8: Do you have specific retention policies for health data that differ from your general policy?

**EdTech questions (EDT1–EDT8):**
- EDT1: Do you have an age verification mechanism before account creation?
- EDT2: Do you process academic performance data, behavioral analytics, or learning profiles of students?
- EDT3: Do you share student data with third-party proctoring, assessment, or analytics tools?
- EDT4: For students under 18, does your parental consent cover all data shared with third parties?
- EDT5: Do you collect biometric data (face recognition for proctoring) from students?
- EDT6: Are parents able to access and delete their child's data through a dedicated mechanism?
- EDT7: Do your teacher/tutor onboarding processes include background checks that create personal data records?
- EDT8: Is student performance data used for any automated decisions that affect their educational outcomes?

### Layer 3 — Industry benchmarking *(build inside M9, after 20+ assessments exist)*
**What it does:** Shows "Your score is X% higher than the average [industry] company on TrustStack."
**Files to change:** `src/app/dashboard/assessment/results/[id]/page.tsx` — add a benchmarking query against assessments table filtered by org industry.
**When to build:** Only after you have enough data. The query is trivial; don't build early.

---

## 13. Design System

**Brand colors (Tailwind config):**
```javascript
// tailwind.config.ts — already added
truststack: {
  navy:  '#003366',
  navy2: '#1A5276',
  blue:  '#2874A6',
  ice:   '#D6E4F0',
  teal:  '#0E6655',
}
```

**Primary color:** `#003366` (navy)  
**Accent:** `#2874A6`  
**Success:** `#059669` (green)  
**Warning:** `#D97706` (amber)  
**Error:** `#DC2626` (red)  
**Dashboard background:** `#F4F8FC`  
**Card background:** `#FFFFFF`  
**Text primary:** `#1A1A2E`  
**Text secondary:** `#6B7280`

**Component patterns:**
- Cards: `bg-white rounded-xl border border-gray-100 shadow-sm`
- Buttons primary: `bg-[#003366] text-white hover:bg-[#1A5276]`
- Buttons secondary: `border border-[#003366] text-[#003366] hover:bg-[#D6E4F0]`
- Page header: `text-2xl font-bold text-[#003366]`
- Section label: `text-xs font-semibold text-gray-500 uppercase tracking-wider`

---

## 14. Coding Standards

- **TypeScript strict mode** — no `any`, no `ts-ignore` without explanation
- **Server Components by default** — add `'use client'` only when needed
- **API routes** — always validate input, always return typed responses, never expose raw Supabase errors
- **Error handling** — use try/catch in all API routes; return `{ error: string }` on failure
- **No console.log in production code**
- **Database queries** — always scope to `organization_id`; never query without RLS context
- **Sensitive data** — never log personal data; hash identifiers before storing in consent records
- **File naming** — kebab-case for files, PascalCase for components
- **No hardcoded strings** — use constants from `src/lib/constants.ts`
- **Supabase nested selects** — cast with `as unknown as Type` (not `as Type`) to satisfy TypeScript
- **Org creation pattern** — always use `/api/organizations/create` API route, never direct browser client insert
- **Per-org reference numbers** — any human-facing sequential id generated per org (e.g. `GRV-`/`DSR-YYYY-NNN`) MUST use a composite `unique (organization_id, reference_number)`, NOT a global `UNIQUE`, or a second org's first record collides on insert. Any public lookup by such a reference must then be scoped by org (accept `org_slug`). (M5 fixed in Session 6; M4 fixed in P1.5 FIX1 — `db/fix_grievance_reference_unique.sql`, ✅ applied in Supabase, live.)

---

## 15. Module Dependencies

```
M1 Compass Assessment ✅ — no dependencies (complete)
M2 Consent Management ← no dependencies (parallel with M1)
M3 Privacy Notice     ← depends on M4 (needs Grievance Officer data)
M4 Grievance Officer  ← no dependencies (build before M3)
M9 Board Dashboard    ← depends on M1, M2, M3, M4 (reads all)
M10 TrustChat         ✅ — done

Build order: M4 → M2 → M3 → M9
Industry Layers: Layer 1 (gap recommendations) — build in M1b session
                 Layer 2 (industry questions)   — build in M1b session or after M4
                 Layer 3 (benchmarking)         — build inside M9 once data exists
```

---

## 16. Public Endpoints (no auth required)

| Route | Called by | What it does |
|---|---|---|
| `POST /api/consent/record` | Consent widget on client's website | Records a consent event |
| `GET /api/consent/config?org=[slug]` | Consent widget | Gets widget configuration |
| `POST /api/consent/withdraw` | Consent widget (Privacy choices → Withdraw) | Withdraws consent for a hashed identifier |
| `POST /api/grievance/submit` | Public grievance form | Submits a complaint |
| `GET /public/[slug]` | Anyone | Views org's hosted privacy notice |
| `GET /grievance/[slug]` | Anyone | Views grievance submission form |
| `POST /api/dsr/submit` + `/api/dsr/otp/*` | Public DSR portal (M5) | Submits a rights request + email-OTP verification |
| `GET /public/dsr/[slug]` | Anyone | Views the DSR request portal (M5) |
| `POST /api/vendors/questionnaire/submit` | Public vendor questionnaire (M7) | Stores answers + recomputes risk (signed token, admin client) |
| `GET /public/vendor-questionnaire/[token]` | Vendor via emailed link (M7) | Views the 45-question vendor questionnaire |

All other `/api/*` and `/dashboard/*` routes require authentication.

**Exception — system (not public, not session-auth):** `POST /api/breach/escalations/run` (M8) has no user session and is **not** public — it is gated by a shared `CRON_SECRET` (header `x-cron-secret` or `Authorization: Bearer`) and meant to be hit by an external scheduler (Vercel Cron / GitHub Action / Supabase pg_cron). It uses the service-role admin client. Without a matching secret it returns 401. M8 added NO public routes — middleware (`PUBLIC_API_ROUTES`) was untouched.

---

## 17. How to Update progress.md

At the end of every session, update `implementation/progress.md`:
1. Change module status from `🔲 Not Started` to `✅ Complete`
2. List all files created
3. Add key decisions made
4. Add blockers or notes for the next session

---

## 18. Planning Phase (Session 10 — June 26, 2026)

### What Was Planned

All 35 modules designed across 6 phases:
- **P0 (7 modules):** M1, M1b, M2, M3, M4, M9, M10 — ✅ All live
- **P1 (4 modules):** M5, M6, M7, M8 — ✅ All built (M6+M8 SQL pending)
- **P1.5 (4 fixes):** FIX1 (M4 ref bug), FIX2 (SQL+Cron), FIX3 (M9 enhance), FIX4 (QA)
- **P2 (10 modules):** M11–M19 + Tracker Dashboard — Commercialization
- **P3 (6 modules):** M20–M25 — Scale + Enterprise
- **P4 (5 modules):** M26–M30 — Innovation

### New Files Created in Session 10

**Implementation_Planner/ (planning documents):**
- `00_Master_Plan.md` — Navigation hub + phase overview
- `01_Feature_Inventory.md` — Complete table of all 35 features with status
- `02_Phase_P15_Critical_Fixes.md` — P1.5 fixes detail
- `03_Phase_P2_Commercialization.md` — P2 modules detail
- `04_Phase_P3_Scale.md` — P3 modules detail
- `05_Phase_P4_Innovation.md` — P4 modules detail
- `06_Rollout_Milestones.md` — 3-milestone production rollout plan
- `07_Business_Model.md` — 6 subscription tiers + PAYG pricing
- `08_Subscription_Engine_Design.md` — Full billing engine technical design (DB schema + gateway abstraction)
- `09_Tracker_Dashboard_Spec.md` — Tracker dashboard full spec
- `10_Git_Branch_Strategy.md` — Branch naming, commit format, PR template
- `11_Session_Checklist.md` — Mandatory before/after session checklist
- `12_Production_Deployment.md` — Vercel + Supabase deployment guide
- `tracker-data.json` — All 35 modules initialized (most in not_started status)

**Prompt_Library/ (implementation prompts for cold Claude sessions):**
- `P15_FIX1_M4_Reference_Bug.md` (tag: v1.5.1)
- `P15_FIX2_M6_M8_SQL_And_Cron.md` (tag: v1.5.2)
- `P15_FIX3_M9_Enhancement.md` (tag: v1.5.3)
- `P15_FIX4_Production_Hardening.md` (tag: v1.5.4)
- `P2_M11_Team_Management.md` (tag: v2.1.0)
- `P2_M12_Billing_Subscription_Engine.md` (tag: v2.2.0)
- `P2_M13_PAYG_Credits_Engine.md` (tag: v2.3.0)
- `P2_M14_Onboarding_Wizard.md` (tag: v2.4.0)
- `P2_M15_WhatsApp_Consent.md` (tag: v2.5.0)
- `P2_M16_Aadhaar_OTP.md` (tag: v2.6.0)
- `P2_M17_Trust_Center.md` (tag: v2.7.0)
- `P2_M18_Alert_Center.md` (tag: v2.8.0)
- `P2_M19_ReConsent_Campaign.md` (tag: v2.9.0)
- `P2_Tracker_Dashboard.md` (tag: v2.10.0)
- `P3_M20_Sector_Packs.md` (tag: v3.1.0)
- `P3_M21_TrustStack_Academy.md` (tag: v3.2.0)
- `P3_M22_Compliance_Badge.md` (tag: v3.3.0)
- `P3_M23_DPO_as_a_Service.md` (tag: v3.4.0)
- `P3_M24_India_DSR_Connectors.md` (tag: v3.5.0)
- `P3_M25_DPDP_API.md` (tag: v3.6.0)
- `P4_M26_AI_Governance.md` (tag: v4.1.0)
- `P4_M27_Consent_Propagation.md` (tag: v4.2.0)
- `P4_M28_ISO27701_Pathway.md` (tag: v4.3.0)
- `P4_M29_Data_Discovery.md` (tag: v4.4.0)
- `P4_M30_Privacy_as_Code.md` (tag: v4.5.0)

### Key Architectural Decisions Made in Session 10

| Decision | Detail |
|---|---|
| Payment gateway abstraction | `PaymentGateway` interface + factory (env var `PAYMENT_GATEWAY=razorpay`) — swap gateway without code changes |
| Trial days from DB | `subscription_plans.trial_days` — never hardcoded |
| PAYG atomic deduct | Supabase RPC `deduct_payg_credits()` with balance check — prevents race conditions |
| Tracker source of truth | `tracker-data.json` version-controlled with code — migrate to Supabase table when ready |
| Per-org reference numbers | Universal: all reference numbers use composite `UNIQUE(organization_id, reference_number)` |
| Connector credentials | Supabase Vault (`pgsodium`) — never in application DB |
| API key storage | SHA-256 hash only — never store plaintext API key after creation |
| PII scanner constraint | Scanner detects PII patterns but NEVER stores actual PII values |
| ISO 27701 content in DB | Store control text in `iso27701_controls` table — updateable without deployment |
| SDK offline buffer | `@truststack/privacy` SDK buffers events when API unreachable, syncs on reconnect |

### Next Actions (in order)

1. **Execute P1.5 FIX1** — `git checkout -b feature/p15-fix1-m4-reference-bug` → follow `P15_FIX1_M4_Reference_Bug.md` → tag v1.5.1
2. **Execute P1.5 FIX2** — apply SQL, set CRON_SECRET, Vercel Cron → tag v1.5.2
3. **Execute P1.5 FIX3** — extend M9 board dashboard → tag v1.5.3
4. **Execute P1.5 FIX4** — full QA pass, mobile check → tag v1.5.4 (BETA READY)
5. **P2 begins** — M11 Team Management → M12 Billing → M13 PAYG → M14 Onboarding → ...

Before every session: Read `implementation/Implementation_Planner/11_Session_Checklist.md`
