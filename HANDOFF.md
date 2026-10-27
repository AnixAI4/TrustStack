# TrustStack + TrustDeck — Complete Project Handoff (Single File)

**Generated:** 2026-08-09
**Repo:** `https://github.com/AyushWaman843/dpdp_scanner.git`
**App:** `updated_prj/variation 1` (TrustStack + TrustDeck) + `dpdp_comp2/dpdp_comp` (Flask engine)

> Secrets are never included. Configure from `.env.example` / `.env.local` locally.

---

## Table of contents

1. [Master index / runbook](#part-0--master-index--runbook)
2. [TrustStack (full)](#part-1--truststack-non-trustdeck--exhaustive-product-handoff)
3. [TrustDeck (full)](#part-2--trustdeck--exhaustive-compliance-workspace-handoff)
4. [Literal catalogs (pages, APIs, files)](#part-3--literal-catalogs--pages-apis-libs-content-sql-locales)
5. [Flask scanner engine](#part-4--dpdp-flask-scanner-engine--handoff)
6. [Playwright live evidence](#part-5--playwright-live-evidence-2026-08-09)


---

# PART 0 — Master index / runbook


**Yes — this pack covers both TrustStack and TrustDeck in full**, plus the Flask scanner engine and Playwright proof.

The first single-file draft (~740 lines) was only an **ops digest**. The exhaustive material is split below so nothing important is collapsed into one skim-sized page.

**Raw crawl JSON:** `updated_prj/variation 1/docs/handoff-crawl*.json`  
**Repo:** `https://github.com/AyushWaman843/dpdp_scanner.git`

> Secrets are never documented here. Use `.env.example` / `.env.local` locally. Do not commit secrets.

---

## Memorize the product split

| Brand | Where | Who |
|-------|-------|-----|
| **TrustStack** | `/`, `/act`, `/scanner`, `/templates`, `/certification`, `/subscribe`, … | Public + signed-in |
| **TrustDeck** | `/trustdeck/*` | Pilot + organization |
| **Public TrustDeck portals** | `/trustdeck/public/*` | Principals / vendors / board (no Pilot) |
| **Scanner engine** | Flask `:5000` | Server-to-server from TrustStack |

**One Next.js app hosts both:** `updated_prj/variation 1` (`truststack-variation-1` @ 0.1.1).  
Internal code still says “platform”; user routes say **TrustDeck**. Legacy `/platform` → `/trustdeck`.

---

## Monorepo map

```
newUpdated/
├── HANDOFF.md                 ← you are here (index)
├── handoff/                   ← exhaustive parts 01–05
├── updated_prj/variation 1/   ← CURRENT TrustStack + TrustDeck app
├── updated_prj/dpdp-main/     ← business/strategy markdowns
├── dpdp_comp2/dpdp_comp/      ← Flask DPDP scanner engine
├── truststack-platform/       ← older /dashboard snapshot (archive)
├── research-paper/            ← unrelated research pack
└── lib/                       ← vendored JS assets (not an app)
```

Checkout counts: **79** `page.tsx`, **78** API `route.ts`, **81** `src/lib` files, **67** content files, **23** locales.

---

## Run locally (verified)

```powershell
# Terminal A — Flask engine
cd dpdp_comp2\dpdp_comp
.\venv\Scripts\python.exe app.py
# → http://127.0.0.1:5000

# Terminal B — TrustStack / TrustDeck
cd "updated_prj\variation 1"
npm run dev
# → http://localhost:3000   ← use localhost, not 127.0.0.1
```

Required TrustStack env (names): Supabase trio, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `DPDP_ENGINE_URL`, `DPDP_ENGINE_API_KEY`, Razorpay (+ `RAZORPAY_ALLOW_TEST=1` for test keys), optional Anthropic/Resend.

Apply SQL: `updated_prj/variation 1/supabase/platform/README.md`.

---

## Auth & Pilot gates (short)

- Middleware: public allowlist → else `/welcome?redirect=…`
- Sign-in: `POST /api/auth/sign-in` (cookies) — **origin must match** `NEXT_PUBLIC_APP_URL`
- Pilot map (`paid-routes.ts`): TrustDeck=`platform`, tools=`tools`, security=`scanner_full`, cert=`certifications`, chat=`trustchat`; scanner = quota only; templates = à la carte
- TrustDeck layout also needs org membership

Full TrustStack entitlement table → Part 01. Full TrustDeck module matrix → Part 02.

---

## Payments (short)

Razorpay: Pilot checkout, extra scans, template unlocks.  
Live-first config in `razorpay-config.ts`; test keys blocked unless `RAZORPAY_ALLOW_TEST=1`.  
DB subscription status spelling: **`cancelled`**.

---

## Landmines

1. `/trustdeck/settings` is **404** (sidebar stub)  
2. `scanner-agent` for `/security` **not in repo** (`:8090`)  
3. `localhost` vs `127.0.0.1` breaks sign-in  
4. Flask `.env` must be UTF-8  
5. Stale scan report IDs need **re-scan** if `results/` missing  
6. `/trustdeck/assessment/new` **creates** a new assessment every visit  
7. DSR AI draft + ROPA AI suggest APIs exist with **partial/no UI wiring**  
8. `truststack-platform/` is **not** the live app  

---


---

# PART 1 — TrustStack

## TrustStack (non-TrustDeck) — Exhaustive Product Handoff

**App root:** `updated_prj/variation 1`  
**Brand:** TrustStack — DPDP Act 2023 + Rules 2025 education, tools, scanner, templates, certification  
**This document is Part 1 of the handoff pack.** TrustDeck is in `handoff/02-TRUSTDECK.md`.

TrustStack and TrustDeck live in the **same Next.js app**. TrustStack is everything outside `/trustdeck/*` (plus shared auth, payments, chrome).

---

## 1. What TrustStack is

TrustStack is the public-facing India privacy-law product:

1. **Education** — Act, Rules, rights, courses, blog, cases, learn hub  
2. **Self-serve tools** — DPDP URL/PDF scanner, calculators, document generators  
3. **Paid unlocks** — Pilot subscription (tools/cert/security/TrustDeck), à-la-carte templates, extra scan credits  
4. **Certification** — study modules + timed exam + public verify  
5. **TrustChat** — LexBot / AI assistant (Pilot)

---

## 2. Homepage (`/`) — section-by-section

File: `src/app/page.tsx`

| Order | Component | Path | Purpose |
|------|-----------|------|---------|
| 1 | `DpdpKnowSection` | `src/components/home/DpdpKnowSection.tsx` | Dismissible “know DPDP” band → explainer modal; storage `dpdp-know-section-dismissed` |
| 2 | `Hero` | `src/components/home/Hero.tsx` | Brand hero, India map, search, Act stats, CTAs |
| 3 | `EasyIntro` | `src/components/site/EasyContent.tsx` | Easy-read intro |
| 4 | `BentoShowcase` | `src/components/home/BentoShowcase.tsx` | Feature mosaic (Act, scanner, tools, TrustChat); Pilot locks |
| 5 | `RiskCheck` | `src/components/home/RiskCheck.tsx` | 7D risk self-check; `dpdp-risk-v1` |
| 6 | `ExploreBand` | `src/components/sections/ExploreBand.tsx` | Destination cards from `src/content/home.ts` |
| 7 | `CtaBand` | `src/components/sections/CtaBand.tsx` | Closing CTAs |
| 8 | `Marquee` | `src/components/ui/Marquee.tsx` | Bilingual ticker |

Content: `src/content/home.ts`, `dpdp.ts`, `dpdp-explainer.ts`, `risk-explainers.ts`.

**Playwright (2026-08-09):** H1 “Read the DPDP Act like a story…”; CTAs Get assessment, free risk check, Read the Act, Consent, Data breach.

---

## 3. Marketing & knowledge pages

### Solutions `/solutions`
- Services catalogue (assessment, implementation, AI governance)
- `SolutionsHero`, `ServiceExplorer`, `EasyIntro`, `CtaBand`
- Content: `hero-configs.ts`, `service-detail.ts`
- **Auth:** redirected to `/welcome` when logged out

### Framework `/framework`
- Anix 7D DPDP Framework + platform/badge showcases
- `FrameworkMethodHero`, `FrameworkSection`, `PlatformShowcase`, `BadgeShowcase`
- **Auth-gated** like solutions

### Tools `/tools` (Pilot `tools`)
- Client calculators (penalty / ROI / breach cost) + document generators
- `ToolsConsoleHero`, `ToolsGate`, `ScannerCallout`, `Calculators`, `Generators`
- **Auth + Pilot**

### Industries `/industries`
- Sector playbooks + `IndustryAdvisor` guided chat
- Content: `dpdp.ts`, `industry-advisor.ts`

### Why us `/why-us`
- Differentiation + comparison
- `WhyUsIntegrationHero`, `WhyUsSection`, `ComparisonSection`

### Assurance `/assurance` (public)
- Release evidence, methodology, negative controls
- Content: `truststack-assurance.ts`
- CTAs: Run your own scan, privacy policy, verify independently

### Act `/act` + `/section/[n]`
- Full Act browser (44 sections)
- Index: `ActCodexHero`, `ActBrowser`
- Detail: Gazette official text + plain companion + related rules
- Content: `act.ts`, `section-official-text.ts`, `section-plain.ts`, `section-enrichment.ts`, `act-provenance.ts`
- Legacy: `/section?s=n` redirects

### Rules `/rules` + `/rules/[n]`
- DPDP Rules 2025 (23 rules), mapped to Act
- `RulesIndexHero`, `RulesBrowser`
- Content: `rules.ts`, `rule-official-text.ts`

### Learn `/learn`
- Role courses grid, quiz, tool links, FAQ
- `LearnPathHero`, `LearnQuiz`, `Faq`, `KolamBand`

### Courses `/courses` + `/courses/[slug]`
- Six persona tracks: `citizens`, `founders`, `practitioner`, `legal`, `engineering`, `students`
- Content: `courses.ts`, `course-lessons.ts`, `course-activities.ts`

### Blog `/blog` + `/blog/[slug]`
- Editorial insights
- `EditorialPressHero`, `BlogBrowser`
- Content: `blog.ts`, `blog-articles.ts`

### Cases `/cases` + `/cases/[slug]`
- Privacy case-law library
- `CaseBalanceHero`, `CasesBrowser`, `CaseBody`
- **Auth-gated** when logged out

### Rights `/rights` (public)
- Data Principal rights + free request-letter generator
- `RightsWheelHero`, `RightsRequestGenerator`
- Content: `rights.ts`
- Playwright: Access §11, Correct/Erase §12, Grievance §13, Nominate §14

### Legal
| Route | Purpose |
|-------|---------|
| `/privacy` | TrustStack’s own privacy notice |
| `/terms` | Terms / disclaimer / seats / Razorpay |
| `/cookies` | Cookie policy + categories |

### Welcome `/welcome`
- Plan chooser: Get Started Free / Start Pilot Access
- Bare chrome (`WelcomeClient`)

---

## 4. Auth & account

| Route | Purpose |
|-------|---------|
| `/auth/sign-in` | Email/password → `POST /api/auth/sign-in` + device register |
| `/auth/sign-up` | Prefer `POST /api/auth/register` (pre-confirmed) |
| `/auth/forgot-password` | Reset link |
| `/auth/reset-password` | Set new password |
| `/auth/device` | Device session UI |
| `/auth/callback` | OAuth / magic / recovery |
| `/account` | Profile, Pilot badge, daily scans, feature list |
| `/account/organization` | Org create, members, roles, invites, seats |
| `/invite/[token]` | Accept org invite |
| `/subscribe` | Pilot Razorpay checkout |

**Roles:** `owner` / `admin` / `member` / `dpo` / `viewer` / `board`

**Critical:** `NEXT_PUBLIC_APP_URL` origin must match browser (`localhost` ≠ `127.0.0.1`) or sign-in API origin checks fail.

---

## 5. Scanner product (deep)

### Routes
- `/scanner` — workspace
- `/scanner/report/[reportId]` — report viewer

### UI files
- `ScannerWorkspace.tsx` — URL vs PDF modes, quota, history, checkout, POST scan
- `ScannerQuotaBanner.tsx`, `PilotDailyResetChip.tsx`, `ScannerHistoryPanel.tsx`
- `ScannerReportLoader.tsx` → `DpdpEngineReport.tsx` (Flask) or `ScannerAssessmentReport.tsx` (legacy)
- `RemediationPlan.tsx`

### Flow
1. Sign in; `GET /api/scanner/quota`
2. `POST /api/scanner` → `assertCanScan` / `reserveScan`
3. **URL mode:** `runDpdpUrlScan` → Flask `POST /api/scan` → poll job → fetch report (`X-API-Key`, Bearer JWT, `X-TrustStack-Proxy: 1`)
4. On engine failure → local `buildUrlScanReport` fallback
5. **PDF mode:** `pdf-parse` → local `buildPdfPolicyReport` (not Flask)
6. Save history → open report page
7. PDF download: `GET /api/scanner/report/[id]/pdf` (Flask PDF preferred)

### Quota
| Tier | Rule |
|------|------|
| Free | 1 lifetime preview |
| Pilot | 1 scan / UTC day |
| Both | Prepaid credits (default ₹299) |

Tables: `user_entitlements`, `daily_scan_usage`, `user_scans`

**Page is NOT Pilot-path-gated** — quota enforced in API. Sign-in still required (middleware).

### APIs
`/api/scanner`, `/quota`, `/checkout`, `/confirm`, `/history`, `/history/item`, `/report/[id]/pdf`

### Env
`DPDP_ENGINE_URL`, `DPDP_ENGINE_API_KEY`, `DPDP_ENGINE_ENABLED`, `EXTRA_SCAN_PRICE_PAISE`

---

## 6. Templates (à la carte — not in Pilot)

- Browse: `/templates` (sign-in) — Pilot does **not** unlock bodies
- Detail: `/templates/[slug]` → Razorpay unlock → reader + Word/PDF
- Catalog: `src/content/templates.ts` — 15 docs

| Slug | ₹ |
|------|---|
| consent-withdrawal, cookie-policy | 49 |
| consent-form, privacy-policy, data-retention-policy, employee-data-policy, dpi-request-form | 99 |
| dpa, cross-border-transfer, vendor-dpa, breach-notice | 149 |
| data-protection-policy, dpia, ropa, breach-playbook | 199 |

APIs: `/api/templates/checkout|confirm|purchases|dev-unlock|[slug]/content|[slug]/download`  
UI: `TemplatesBrowser`, `ProtectedTemplateReader`, `TemplateDocument`, gates in `components/gates/`

---

## 7. Certification (Pilot `certifications`)

| Route | Purpose |
|-------|---------|
| `/certification` | Programme overview |
| `/certification/[module]` | 8 study modules |
| `/certification/exam` | Timed exam (bare chrome): 5 Q, 100% pass, 10 min, bank ~224 |
| `/certification/verify` | Public format check `CDP-XXXX-XXXX` (free) |

**Modules:** foundations, notice-consent, legitimate-uses, rights-duties, fiduciary-obligations, children, significant-data-fiduciaries, breach-board-penalties

Content: `certification.ts`, `curriculum.ts`, `exam-bank.ts`, `dpdpa-questions.ts`  
UI: `ModuleQuiz`, `Flashcards`, `ScenarioChallenge`, `DpdpExam`, `CertificateStudio`

**Playwright:** exam page H1 “The DPDP Practitioner examination”; Begin the exam / Exit.

---

## 8. Security + AI Compliance Manager

### `/security` (Pilot `scanner_full`)
- `SecurityFortressHero`, `DpdpSecurityScanner`
- `POST /api/security-scanner` → `{SCANNER_SERVICE_URL}/api/security-scan` default **:8090**
- **scanner-agent folder is NOT in this checkout** — expect failure until that service exists

### AI Compliance Manager
- Embedded after security report: `AiComplianceManager.tsx`
- `POST /api/security-compliance-manager` (Pilot `tools` API gate)
- Tabs: Brief / Action queue / Questions; horizons do_now / plan_next / monitor
- Server: `src/lib/server/security-compliance-manager.ts`

---

## 9. Payments on TrustStack

| Flow | Entry | APIs |
|------|-------|------|
| Pilot ₹999/mo (display) | `/subscribe` | `/api/subscription/checkout`, `/confirm`, `/status` |
| Extra scan | Scanner UI | `/api/scanner/checkout`, `/confirm` |
| Template unlock | Template detail | `/api/templates/checkout`, `/confirm` |

Config: `src/lib/payments/razorpay-config.ts` — live-first; test keys need `RAZORPAY_ALLOW_TEST=1`.  
Optional lead email via Resend (`LEAD_NOTIFICATION_EMAIL`).

---

## 10. Site chrome & UX systems

| Piece | Files | Notes |
|-------|-------|-------|
| Shell | `SiteFrame.tsx`, `layout.tsx` | Bare chrome on exam/welcome/auth/subscribe; hides marketing chrome on TrustDeck |
| Header/Footer | `Header.tsx`, `Footer.tsx` | Nav from `site.ts`; Pilot locks |
| TrustChat | `LexBot.tsx`, `LexBotLauncher.tsx` | Local KB + `POST /api/chat` (Pilot) |
| Settings | `SettingsPanel.tsx` | Easy read, language, a11y |
| Cookies | `CookieConsent.tsx` | `dpdp-consent` |
| A11y | `A11yToolbar.tsx` | Size, spacing, contrast, dyslexia font, reduce motion |
| Easy read | `ReadingMode*`, `EasyTextRuntime`, `Swap` | `data-reading` |
| i18n | `next-intl`, `messages/*.json` (23), `/i18n/site/{locale}.json` | RTL: `ur`, `ks` |

---

## 11. Entitlement quick map (TrustStack)

| Surface | Access |
|---------|--------|
| Act / Rules / Rights / Blog / Learn (browse) / Assurance / legal | Public |
| Solutions / Framework / Industries / Why-us / Cases | Sign-in (middleware) |
| `/scanner` | Sign-in + quota |
| `/security` + AI manager | Pilot |
| `/tools` | Pilot |
| `/templates` | Sign-in browse; ₹ unlock body |
| `/certification` (+ modules/exam) | Pilot; `/verify` free |
| TrustChat AI | Pilot |
| TrustDeck | Pilot `platform` → see Part 2 |

---

## 12. Content folder map (`src/content`)

See also full file list in `handoff/03-APIS-PAGES-FILES.md`.

Key roots: `site.ts`, `home.ts`, `act*`, `rules*`, `rights.ts`, `templates*`, `cases.ts`, `blog*`, `learn.ts`, `courses*`, `certification*`, `scanner.ts`, `security-scanner.ts`, `lexbot-kb.ts`, `truststack-assurance.ts`, `easy/` pair dictionaries.

---

## 13. Locales (23)

`en hi bn te mr ta ur gu kn or ml pa as mai sa kok sd ne si mni doi sat ks`  
Files: `messages/{code}.json`

---

## 14. Component folders (TrustStack-heavy)

- `src/components/home/`
- `src/components/sections/`
- `src/components/resources/`
- `src/components/scanner/`
- `src/components/tools/`
- `src/components/site/`
- `src/components/gates/`
- `src/components/auth/`
- `src/components/courses/`

---

*Continue to `handoff/02-TRUSTDECK.md` for the compliance workspace.*


---

# PART 2 — TrustDeck

## TrustDeck — Exhaustive Compliance Workspace Handoff

**App root:** `updated_prj/variation 1`  
**URL prefix:** `/trustdeck/*` · **API prefix:** `/api/trustdeck/*`  
**Gate:** Pilot feature `platform` + organization membership  
**This document is Part 2.** TrustStack marketing/tools are in `handoff/01-TRUSTSTACK.md`.

Legacy redirects: `/platform` → `/trustdeck`, `/api/platform` → `/api/trustdeck`.

---

## 1. What TrustDeck is

TrustDeck is the **operator compliance OS** for Data Fiduciaries under DPDP:

| Group | Modules |
|-------|---------|
| Command centre | Overview, Board Reports, DPDP Compass™ |
| Governance | Consent, Privacy Notice, Grievance, DSR |
| Operations | ROPA, Vendor DPA, Breach Response |

Public portals (no Pilot) let principals/vendors/board recipients interact without login.

---

## 2. Chrome & shell

### Entry & layout
- `src/app/trustdeck/(app)/layout.tsx` — auth + Pilot + `requirePlatformOrg` → `PlatformOrgProvider` → `PlatformChrome`
- `/trustdeck` redirects to `/trustdeck/overview`
- Auth-branded: `/trustdeck/login`, `/signup`, `/create-organization`

### PlatformChrome
**File:** `src/components/platform/dashboard/PlatformChrome.tsx`

- Top bar: org name, TrustDeck label, **Guide** (tutorial), theme toggle, account, back to TrustStack
- Left rail: hover-expand; modules from `SIDEBAR_MODULES` / groups in `src/lib/platform/constants.ts`
- Settings in rail → `RailSettings` (Easy read, Language, A11y) — **not** a settings page
- Overview: `TrustDeckTutorial` strip until `localStorage trustdeck-tour-v1 = dismissed`
- Mobile: `PlatformMobileNav`
- Canvas: `TrustDeckRouteTransition`, `LexBotLauncher` (platform mode)

### Tutorial (5 steps)
Assessment → Consent → DSR → ROPA → Board Reports (`TrustDeckTutorial.tsx`)

### Sidebar config
- Live: `src/lib/platform/constants.ts`
- Parallel: `src/lib/platform/sidebar-modules.ts` (Settings `available: false`)
- **`/trustdeck/settings` → 404** (confirmed Playwright)

### Shared UI
`ModulePage`, `ModulePageHeader`, `ModuleStatGrid`, `ModuleNotice`, `ModuleEmptyState`, `ModuleRefreshControl`, `ModuleDetailState`

---

## 3. Overview `/trustdeck/overview`

**Purpose:** Readiness home — score, module status, priorities, activity, calendar.

**UI:** `overview/page.tsx`, `ModuleStatusGrid`, `StatsRow`, `PriorityActionsCard`, `RecentActivityFeed`, `ComplianceCalendar`, `ComplianceCoverage`, `BoardPanel`  
**Lib:** `src/lib/platform/dashboard/aggregate.ts`  
**API:** `GET /api/trustdeck/dashboard/overview`, `GET .../compass-score`

**Tables read:** assessments, gaps, consent_*, privacy_notices*, grievance_*, dsr_requests, ropa_entries, vendors, breach_incidents, organizations

**Happy path:** Land → if no assessment, start Compass → clear priorities → open Board report CTA

**Playwright live state (Pilot org):** Compass score 50; Consent active 0 records; Privacy notice not created; Grievance no officer; 1 pending DSR; 1 vendor; 0 breaches.

**Empty copy:** Score pending / Start your assessment; You're on track; No activity yet; module tiles “Not created” / “Open module”.

---

## 4. Board Reports `/trustdeck/reports`

**Purpose:** Date-ranged board pack — HTML preview, PDF, 7-day signed share link + AI executive summary.

**UI:** `reports/page.tsx`, `BoardReportPDF.tsx`  
**Lib:** `report-content.ts`, `share-token.ts`  
**APIs:**  
- `POST /api/trustdeck/dashboard/report/generate` (Claude summary, fallback deterministic)  
- `POST .../report/pdf`  
- `POST .../report/share` (HMAC token, no DB row)

**Public:** `/trustdeck/public/board-report/[token]` (deterministic summary only)

**Happy path:** Set From/To → Generate → Preview → Download PDF / Share link

**Playwright:** H1 Board Reports; CTA Generate Board Report

---

## 5. DPDP Compass™ `/trustdeck/assessment*`

**Purpose:** ~45-question readiness assessment → Compass Score™, maturity, prioritized gaps mapped to modules.

**Routes:**
| Path | Role |
|------|------|
| `/assessment` | Hub + history |
| `/assessment/new` | **Creates** assessment then redirects |
| `/assessment/[id]` | In-progress questionnaire |
| `/assessment/results/[id]` | Score + gaps |

**UI:** `AssessmentQuestion`, `AssessmentProgress`, `CompassScoreGauge`, `MaturityBadge`, `GapReportCard`  
**Lib:** `assessment-questions.ts`, `constants.ts` (maturity labels)  
**Note:** Scorer files under `platform/ai/` exist; runtime scoring on submit is **deterministic** (not live LLM).

**APIs:** `POST start`, `save-answer`, `submit`; `GET results/[id]`  
**Tables:** `assessments`, `assessment_answers`, `assessment_gaps`

**Happy path:** Start → answer sections (autosave) → submit → results → module CTAs

**⚠️ Visiting `/assessment/new` always creates a new row** (Playwright created `d95bccd8-…`).

**Playwright hub:** Continue assessment; scores 50 (Level 3 Defined) and 0 (Level 1 Initial).

---

## 6. Consent Management `/trustdeck/consent*`

**Purpose:** Purpose-based consent widget config, versioning, audit (Section 6 evidence).

**Routes:** hub, `/configure` (wizard), `/versions`, `/audit`  
**UI:** `PurposeEditor`, `WidgetPreview`, `EmbedCodeSnippet`, `ConsentStatsCard`, `AuditTable`, consent `VersionHistory`  
**APIs:** `manage`, `stats`, `config` (public), `versions`, `audit`, `record`, `withdraw`  
**Tables:** `consent_configs`, `consent_purposes`, `consent_records`, `consent_config_versions`

**Happy path:** Configure purposes → languages → customize → preview & save → embed snippet → audit traffic

**Playwright configure:** Steps 1 Purposes → 2 Languages → 3 Customize → 4 Preview & Save

**Empty:** Launch a consent experience / No consent records yet / No version history yet

---

## 7. Privacy Notice Builder `/trustdeck/privacy-notice*`

**Purpose:** Generate/translate/version/publish Section 5 notice; public readable page.

**Routes:** hub, `/builder`, public `/trustdeck/public/[slug]`  
**UI:** `NoticeBuilder`, `NoticePreview`, `PublicNoticeView`, `DataCategorySelector`, `PurposeMapper`, `LanguageSelector`  
**APIs:** list, `generate`, `translate`, `save`, `publish`, `[slug]`  
**Tables:** `privacy_notices`, `privacy_notice_versions` (+ grievance officer for contact)

**AI:** Anthropic generate + translate

**Happy path:** Create → categories/purposes/rights/languages → Generate → Translate → Save → Publish → share public link  
**Stale:** >12 months annual review warning

**Playwright builder:** EN/HI/TA/TE/MR; data categories including Aadhaar/PAN, financial, health, biometric, children, location

---

## 8. Grievance Officer `/trustdeck/grievance*`

**Purpose:** Appoint Section 14 officer; public complaint portal; SLA handling.

**Routes:** hub, `/complaints`, `/complaints/[id]`, public `/trustdeck/public/grievance/[slug]`  
**UI:** `GrievanceOfficerCard/Form`, `ComplaintsTable`, `ComplaintDetail`, `ComplaintStatusBadge`, `PublicComplaintForm`  
**APIs:** `officer`, `complaints`, `complaints/[id]`, `submit` (public + email notify)  
**Tables:** `grievance_officers`, `grievance_complaints`

**Happy path:** Appoint → share portal → intake → under review → resolve with notes

**Playwright:** Appoint officer; complaints filters All/New/Under Review/Resolved/Escalated  
**Empty:** Appoint a Grievance Officer / No grievances filed yet

---

## 9. DSR Management `/trustdeck/dsr*`

**Purpose:** Sections 11–15 rights (except grievance): public intake, OTP identity, 30-day SLA, fulfill/deny.

**Routes:** hub, `/requests`, `/requests/[id]`, public `/public/dsr/[slug]` + `/complete`  
**UI:** `DsrRequestsTable`, `DsrRequestDetail`, `DsrStatusBadge`, `SlaIndicator`, `PublicDsrForm`, `DsrLinkComplete`  
**Lib:** `dsr/otp.ts`, `finalize-verification.ts`, `sla.ts`, `draft.ts`  
**APIs:** `stats`, `requests`, `requests/[id]`, `submit`, OTP verify/resend/complete-link, `draft`  
**Tables:** `dsr_requests`, `dsr_nominations`, `dsr_otps`

**AI:** `POST .../dsr/draft` exists; **UI does not call it yet**

**Happy path:** Copy public link → principal submits → OTP → operator processing → fulfill/deny  
**Hub polls ~30s when visible**

**Playwright:** Copy / View Public Page; filters Received → Denied  
**Empty:** No DSR requests yet

---

## 10. ROPA Builder `/trustdeck/ropa*`

**Purpose:** Record of Processing Activities — inventory, legal bases, consent coverage, DPO approve, export.

**Routes:** hub, `/list`, `/[id]`  
**UI:** `RopaTable`, `RopaEntryForm`, `RopaEntryDetail`, `RopaTemplatePicker`, status/consent badges, `RopaReportPDF`  
**Lib:** `ropa/ai.ts`, `ropa/consent.ts`; templates in `constants.ts`  
**APIs:** CRUD, `stats`, `export/pdf`, `export/csv`, `ai-suggest`  
**Tables:** `ropa_entries` (+ consent_purposes for coverage)

**AI:** `ai-suggest` API + form hook; **hub/list may open form without wiring `onRequestAi`** — verify before promising UI assist

**Happy path:** Add Activity / Template → fill → activate / DPO review → export  
**Playwright:** Add from Template / Add Activity; list Draft/Active/Archived  
**Empty:** No ROPA entries yet

---

## 11. Vendor DPA Manager `/trustdeck/vendors*`

**Purpose:** Register processors, risk tier, questionnaires, AI DPA draft, signature/expiry.

**Routes:** hub, `/list`, `/[id]`, public `/public/vendor-questionnaire/[token]`  
**UI:** `VendorsTable`, `VendorDetail`, `VendorFormModal`, `VendorLibraryPicker`, `DpaPreview`, risk/status badges, `PublicVendorQuestionnaire`  
**Lib:** `vendors/{client,dpa,email,questionnaire,risk,status,token}.ts`  
**APIs:** CRUD, `stats`, `send-questionnaire`, `dpa`, `questionnaire/submit`  
**Tables:** `vendors`, `vendor_questionnaire_responses`

**AI:** Anthropic DPA on detail

**Happy path:** Add / Library → send questionnaire → vendor answers → generate DPA → mark signed  
**Playwright:** Add from Library; list Pending/Sent/Signed/Expired  
**Empty:** No vendors registered

---

## 12. Breach Response `/trustdeck/breach*`

**Purpose:** Log breaches, 72h DPBI clock, AI DPBI draft, escalations, register.

**Routes:** hub, `/list`, `/[id]` (no public form)  
**UI:** `BreachLogModal`, `BreachTable`, `BreachDetail`, `BreachCountdown`, `BreachStatusBadge`  
**Lib:** `breach/countdown.ts`, `escalation.ts`, `notification.ts`; constants `DPBI_DEADLINE_HOURS`, `BREACH_ESCALATION_HOURS`  
**APIs:** CRUD, `stats`, `dpbi-draft`, `escalations/run` (`CRON_SECRET`)  
**Tables:** `breach_incidents`

**AI:** Anthropic DPBI draft

**Happy path:** Log → watch countdown → generate DPBI → notify Board → contain/resolve  
**Playwright:** Log Breach; register Open/Contained/Resolved  
**Empty:** No breaches logged / 72-hour clock starts at discovery

---

## 13. Public portals (no Pilot)

| Route | Audience |
|-------|----------|
| `/trustdeck/public/[slug]` | Privacy notice readers |
| `/trustdeck/public/dsr/[slug]` (+ `/complete`) | Data principals |
| `/trustdeck/public/grievance/[slug]` | Complainants |
| `/trustdeck/public/vendor-questionnaire/[token]` | Vendors |
| `/trustdeck/public/board-report/[token]` | Board share recipients |

---

## 14. Org APIs

`POST /api/trustdeck/organizations/create`  
`GET .../me`  
`GET/POST/DELETE .../invites`  
`DELETE .../members/[userId]`

---

## 15. AI features matrix (TrustDeck)

| Module | AI? | Notes |
|--------|-----|-------|
| Overview | No | Deterministic aggregate |
| Board Reports | Yes | Executive summary on generate |
| Compass | No | Deterministic score/gaps |
| Consent | No | — |
| Privacy Notice | Yes | Generate + translate |
| Grievance | No | — |
| DSR | API only | `draft` not wired in UI |
| ROPA | Partial | `ai-suggest` wiring incomplete from hub |
| Vendors | Yes | DPA draft |
| Breach | Yes | DPBI draft |

Stack: Anthropic via `src/lib/ai/anthropic.ts` + `ANTHROPIC_API_KEY` (default model often Haiku).

---

## 16. Schema (TrustDeck)

See `supabase/platform/README.md` run order. Core tables per module listed above. Roles on `organization_members` include owner/admin/member/dpo/viewer/board. Subscriptions: `truststack_subscriptions` (status **`cancelled`**).

---

## 17. Operator day-one path (tutorial-aligned)

1. Create org → Overview  
2. Run Compass assessment to completion  
3. Configure Consent + publish  
4. Publish Privacy Notice  
5. Appoint Grievance Officer + open DSR portal  
6. Seed ROPA + key Vendors  
7. Know Breach Log path  
8. Generate Board Report  

---

*Catalog of every page/API path: `handoff/03-APIS-PAGES-FILES.md`. Engine: `handoff/04-ENGINE-FLASK.md`. Crawl evidence: `handoff/05-PLAYWRIGHT-EVIDENCE.md`.*


---

# PART 3 — Literal catalogs

## Literal catalogs — pages, APIs, libs, content, SQL, locales

Generated from the checkout on 2026-08-09.

## App Router pages (79)

| URL | Source file |
|-----|-------------|
| `/` | `src/app/page.tsx` |
| `/account` | `src/app/account/page.tsx` |
| `/account/organization` | `src/app/account/organization/page.tsx` |
| `/act` | `src/app/act/page.tsx` |
| `/assurance` | `src/app/assurance/page.tsx` |
| `/auth/device` | `src/app/auth/device/page.tsx` |
| `/auth/forgot-password` | `src/app/auth/forgot-password/page.tsx` |
| `/auth/reset-password` | `src/app/auth/reset-password/page.tsx` |
| `/auth/sign-in` | `src/app/auth/sign-in/page.tsx` |
| `/auth/sign-up` | `src/app/auth/sign-up/page.tsx` |
| `/blog` | `src/app/blog/page.tsx` |
| `/blog/{slug}` | `src/app/blog/[slug]/page.tsx` |
| `/cases` | `src/app/cases/page.tsx` |
| `/cases/{slug}` | `src/app/cases/[slug]/page.tsx` |
| `/certification` | `src/app/certification/page.tsx` |
| `/certification/exam` | `src/app/certification/exam/page.tsx` |
| `/certification/verify` | `src/app/certification/verify/page.tsx` |
| `/certification/{module}` | `src/app/certification/[module]/page.tsx` |
| `/cookies` | `src/app/cookies/page.tsx` |
| `/courses` | `src/app/courses/page.tsx` |
| `/courses/{slug}` | `src/app/courses/[slug]/page.tsx` |
| `/framework` | `src/app/framework/page.tsx` |
| `/industries` | `src/app/industries/page.tsx` |
| `/invite/{token}` | `src/app/invite/[token]/page.tsx` |
| `/learn` | `src/app/learn/page.tsx` |
| `/privacy` | `src/app/privacy/page.tsx` |
| `/rights` | `src/app/rights/page.tsx` |
| `/rules` | `src/app/rules/page.tsx` |
| `/rules/{n}` | `src/app/rules/[n]/page.tsx` |
| `/scanner` | `src/app/scanner/page.tsx` |
| `/scanner/report/{reportId}` | `src/app/scanner/report/[reportId]/page.tsx` |
| `/section` | `src/app/section/page.tsx` |
| `/section/{n}` | `src/app/section/[n]/page.tsx` |
| `/security` | `src/app/security/page.tsx` |
| `/solutions` | `src/app/solutions/page.tsx` |
| `/subscribe` | `src/app/subscribe/page.tsx` |
| `/templates` | `src/app/templates/page.tsx` |
| `/templates/{slug}` | `src/app/templates/[slug]/page.tsx` |
| `/terms` | `src/app/terms/page.tsx` |
| `/tools` | `src/app/tools/page.tsx` |
| `/trustdeck` | `src/app/trustdeck/(app)/page.tsx` |
| `/trustdeck/assessment` | `src/app/trustdeck/(app)/assessment/page.tsx` |
| `/trustdeck/assessment/new` | `src/app/trustdeck/(app)/assessment/new/page.tsx` |
| `/trustdeck/assessment/results/{id}` | `src/app/trustdeck/(app)/assessment/results/[id]/page.tsx` |
| `/trustdeck/assessment/{id}` | `src/app/trustdeck/(app)/assessment/[id]/page.tsx` |
| `/trustdeck/breach` | `src/app/trustdeck/(app)/breach/page.tsx` |
| `/trustdeck/breach/list` | `src/app/trustdeck/(app)/breach/list/page.tsx` |
| `/trustdeck/breach/{id}` | `src/app/trustdeck/(app)/breach/[id]/page.tsx` |
| `/trustdeck/consent` | `src/app/trustdeck/(app)/consent/page.tsx` |
| `/trustdeck/consent/audit` | `src/app/trustdeck/(app)/consent/audit/page.tsx` |
| `/trustdeck/consent/configure` | `src/app/trustdeck/(app)/consent/configure/page.tsx` |
| `/trustdeck/consent/versions` | `src/app/trustdeck/(app)/consent/versions/page.tsx` |
| `/trustdeck/dsr` | `src/app/trustdeck/(app)/dsr/page.tsx` |
| `/trustdeck/dsr/requests` | `src/app/trustdeck/(app)/dsr/requests/page.tsx` |
| `/trustdeck/dsr/requests/{id}` | `src/app/trustdeck/(app)/dsr/requests/[id]/page.tsx` |
| `/trustdeck/grievance` | `src/app/trustdeck/(app)/grievance/page.tsx` |
| `/trustdeck/grievance/complaints` | `src/app/trustdeck/(app)/grievance/complaints/page.tsx` |
| `/trustdeck/grievance/complaints/{id}` | `src/app/trustdeck/(app)/grievance/complaints/[id]/page.tsx` |
| `/trustdeck/overview` | `src/app/trustdeck/(app)/overview/page.tsx` |
| `/trustdeck/privacy-notice` | `src/app/trustdeck/(app)/privacy-notice/page.tsx` |
| `/trustdeck/privacy-notice/builder` | `src/app/trustdeck/(app)/privacy-notice/builder/page.tsx` |
| `/trustdeck/reports` | `src/app/trustdeck/(app)/reports/page.tsx` |
| `/trustdeck/ropa` | `src/app/trustdeck/(app)/ropa/page.tsx` |
| `/trustdeck/ropa/list` | `src/app/trustdeck/(app)/ropa/list/page.tsx` |
| `/trustdeck/ropa/{id}` | `src/app/trustdeck/(app)/ropa/[id]/page.tsx` |
| `/trustdeck/vendors` | `src/app/trustdeck/(app)/vendors/page.tsx` |
| `/trustdeck/vendors/list` | `src/app/trustdeck/(app)/vendors/list/page.tsx` |
| `/trustdeck/vendors/{id}` | `src/app/trustdeck/(app)/vendors/[id]/page.tsx` |
| `/trustdeck/create-organization` | `src/app/trustdeck/(auth)/create-organization/page.tsx` |
| `/trustdeck/login` | `src/app/trustdeck/(auth)/login/page.tsx` |
| `/trustdeck/signup` | `src/app/trustdeck/(auth)/signup/page.tsx` |
| `/trustdeck/public/board-report/{token}` | `src/app/trustdeck/public/board-report/[token]/page.tsx` |
| `/trustdeck/public/dsr/{slug}` | `src/app/trustdeck/public/dsr/[slug]/page.tsx` |
| `/trustdeck/public/dsr/{slug}/complete` | `src/app/trustdeck/public/dsr/[slug]/complete/page.tsx` |
| `/trustdeck/public/grievance/{slug}` | `src/app/trustdeck/public/grievance/[slug]/page.tsx` |
| `/trustdeck/public/vendor-questionnaire/{token}` | `src/app/trustdeck/public/vendor-questionnaire/[token]/page.tsx` |
| `/trustdeck/public/{slug}` | `src/app/trustdeck/public/[slug]/page.tsx` |
| `/welcome` | `src/app/welcome/page.tsx` |
| `/why-us` | `src/app/why-us/page.tsx` |

## API routes (78)

| URL | Source file |
|-----|-------------|
| `/api/auth/register` | `src/app/api/auth/register/route.ts` |
| `/api/auth/session/register` | `src/app/api/auth/session/register/route.ts` |
| `/api/auth/sign-in` | `src/app/api/auth/sign-in/route.ts` |
| `/api/chat` | `src/app/api/chat/route.ts` |
| `/api/invites/accept` | `src/app/api/invites/accept/route.ts` |
| `/api/scanner` | `src/app/api/scanner/route.ts` |
| `/api/scanner/checkout` | `src/app/api/scanner/checkout/route.ts` |
| `/api/scanner/confirm` | `src/app/api/scanner/confirm/route.ts` |
| `/api/scanner/history` | `src/app/api/scanner/history/route.ts` |
| `/api/scanner/history/item` | `src/app/api/scanner/history/item/route.ts` |
| `/api/scanner/quota` | `src/app/api/scanner/quota/route.ts` |
| `/api/scanner/report/{reportId}/pdf` | `src/app/api/scanner/report/[reportId]/pdf/route.ts` |
| `/api/security-compliance-manager` | `src/app/api/security-compliance-manager/route.ts` |
| `/api/security-scanner` | `src/app/api/security-scanner/route.ts` |
| `/api/subscription/checkout` | `src/app/api/subscription/checkout/route.ts` |
| `/api/subscription/confirm` | `src/app/api/subscription/confirm/route.ts` |
| `/api/subscription/status` | `src/app/api/subscription/status/route.ts` |
| `/api/templates/checkout` | `src/app/api/templates/checkout/route.ts` |
| `/api/templates/confirm` | `src/app/api/templates/confirm/route.ts` |
| `/api/templates/dev-unlock` | `src/app/api/templates/dev-unlock/route.ts` |
| `/api/templates/purchases` | `src/app/api/templates/purchases/route.ts` |
| `/api/templates/{slug}/content` | `src/app/api/templates/[slug]/content/route.ts` |
| `/api/templates/{slug}/download` | `src/app/api/templates/[slug]/download/route.ts` |
| `/api/trustdeck/assessment/results/{id}` | `src/app/api/trustdeck/assessment/results/[id]/route.ts` |
| `/api/trustdeck/assessment/save-answer` | `src/app/api/trustdeck/assessment/save-answer/route.ts` |
| `/api/trustdeck/assessment/start` | `src/app/api/trustdeck/assessment/start/route.ts` |
| `/api/trustdeck/assessment/submit` | `src/app/api/trustdeck/assessment/submit/route.ts` |
| `/api/trustdeck/breach` | `src/app/api/trustdeck/breach/route.ts` |
| `/api/trustdeck/breach/escalations/run` | `src/app/api/trustdeck/breach/escalations/run/route.ts` |
| `/api/trustdeck/breach/stats` | `src/app/api/trustdeck/breach/stats/route.ts` |
| `/api/trustdeck/breach/{id}` | `src/app/api/trustdeck/breach/[id]/route.ts` |
| `/api/trustdeck/breach/{id}/dpbi-draft` | `src/app/api/trustdeck/breach/[id]/dpbi-draft/route.ts` |
| `/api/trustdeck/consent/audit` | `src/app/api/trustdeck/consent/audit/route.ts` |
| `/api/trustdeck/consent/config` | `src/app/api/trustdeck/consent/config/route.ts` |
| `/api/trustdeck/consent/manage` | `src/app/api/trustdeck/consent/manage/route.ts` |
| `/api/trustdeck/consent/record` | `src/app/api/trustdeck/consent/record/route.ts` |
| `/api/trustdeck/consent/stats` | `src/app/api/trustdeck/consent/stats/route.ts` |
| `/api/trustdeck/consent/versions` | `src/app/api/trustdeck/consent/versions/route.ts` |
| `/api/trustdeck/consent/withdraw` | `src/app/api/trustdeck/consent/withdraw/route.ts` |
| `/api/trustdeck/dashboard/compass-score` | `src/app/api/trustdeck/dashboard/compass-score/route.ts` |
| `/api/trustdeck/dashboard/overview` | `src/app/api/trustdeck/dashboard/overview/route.ts` |
| `/api/trustdeck/dashboard/report/generate` | `src/app/api/trustdeck/dashboard/report/generate/route.ts` |
| `/api/trustdeck/dashboard/report/pdf` | `src/app/api/trustdeck/dashboard/report/pdf/route.ts` |
| `/api/trustdeck/dashboard/report/share` | `src/app/api/trustdeck/dashboard/report/share/route.ts` |
| `/api/trustdeck/dsr/draft` | `src/app/api/trustdeck/dsr/draft/route.ts` |
| `/api/trustdeck/dsr/otp/complete-link` | `src/app/api/trustdeck/dsr/otp/complete-link/route.ts` |
| `/api/trustdeck/dsr/otp/resend` | `src/app/api/trustdeck/dsr/otp/resend/route.ts` |
| `/api/trustdeck/dsr/otp/verify` | `src/app/api/trustdeck/dsr/otp/verify/route.ts` |
| `/api/trustdeck/dsr/requests` | `src/app/api/trustdeck/dsr/requests/route.ts` |
| `/api/trustdeck/dsr/requests/{id}` | `src/app/api/trustdeck/dsr/requests/[id]/route.ts` |
| `/api/trustdeck/dsr/stats` | `src/app/api/trustdeck/dsr/stats/route.ts` |
| `/api/trustdeck/dsr/submit` | `src/app/api/trustdeck/dsr/submit/route.ts` |
| `/api/trustdeck/grievance/complaints` | `src/app/api/trustdeck/grievance/complaints/route.ts` |
| `/api/trustdeck/grievance/complaints/{id}` | `src/app/api/trustdeck/grievance/complaints/[id]/route.ts` |
| `/api/trustdeck/grievance/officer` | `src/app/api/trustdeck/grievance/officer/route.ts` |
| `/api/trustdeck/grievance/submit` | `src/app/api/trustdeck/grievance/submit/route.ts` |
| `/api/trustdeck/organizations/create` | `src/app/api/trustdeck/organizations/create/route.ts` |
| `/api/trustdeck/organizations/invites` | `src/app/api/trustdeck/organizations/invites/route.ts` |
| `/api/trustdeck/organizations/me` | `src/app/api/trustdeck/organizations/me/route.ts` |
| `/api/trustdeck/organizations/members/{userId}` | `src/app/api/trustdeck/organizations/members/[userId]/route.ts` |
| `/api/trustdeck/privacy-notice` | `src/app/api/trustdeck/privacy-notice/route.ts` |
| `/api/trustdeck/privacy-notice/generate` | `src/app/api/trustdeck/privacy-notice/generate/route.ts` |
| `/api/trustdeck/privacy-notice/publish` | `src/app/api/trustdeck/privacy-notice/publish/route.ts` |
| `/api/trustdeck/privacy-notice/save` | `src/app/api/trustdeck/privacy-notice/save/route.ts` |
| `/api/trustdeck/privacy-notice/translate` | `src/app/api/trustdeck/privacy-notice/translate/route.ts` |
| `/api/trustdeck/privacy-notice/{slug}` | `src/app/api/trustdeck/privacy-notice/[slug]/route.ts` |
| `/api/trustdeck/ropa` | `src/app/api/trustdeck/ropa/route.ts` |
| `/api/trustdeck/ropa/ai-suggest` | `src/app/api/trustdeck/ropa/ai-suggest/route.ts` |
| `/api/trustdeck/ropa/export/csv` | `src/app/api/trustdeck/ropa/export/csv/route.ts` |
| `/api/trustdeck/ropa/export/pdf` | `src/app/api/trustdeck/ropa/export/pdf/route.ts` |
| `/api/trustdeck/ropa/stats` | `src/app/api/trustdeck/ropa/stats/route.ts` |
| `/api/trustdeck/ropa/{id}` | `src/app/api/trustdeck/ropa/[id]/route.ts` |
| `/api/trustdeck/vendors` | `src/app/api/trustdeck/vendors/route.ts` |
| `/api/trustdeck/vendors/questionnaire/submit` | `src/app/api/trustdeck/vendors/questionnaire/submit/route.ts` |
| `/api/trustdeck/vendors/stats` | `src/app/api/trustdeck/vendors/stats/route.ts` |
| `/api/trustdeck/vendors/{id}` | `src/app/api/trustdeck/vendors/[id]/route.ts` |
| `/api/trustdeck/vendors/{id}/dpa` | `src/app/api/trustdeck/vendors/[id]/dpa/route.ts` |
| `/api/trustdeck/vendors/{id}/send-questionnaire` | `src/app/api/trustdeck/vendors/[id]/send-questionnaire/route.ts` |

## src/lib files (81)

- `src/lib/ai/anthropic.ts`
- `src/lib/payments/razorpay-config.ts`
- `src/lib/payments/razorpay.ts`
- `src/lib/platform/ai/client.ts`
- `src/lib/platform/ai/compass-scorer.ts`
- `src/lib/platform/ai/gap-generator.ts`
- `src/lib/platform/ai/notice-generator.ts`
- `src/lib/platform/breach/countdown.ts`
- `src/lib/platform/breach/escalation.ts`
- `src/lib/platform/breach/notification.ts`
- `src/lib/platform/dashboard/aggregate.ts`
- `src/lib/platform/dashboard/report-content.ts`
- `src/lib/platform/dashboard/share-token.ts`
- `src/lib/platform/dsr/draft.ts`
- `src/lib/platform/dsr/finalize-verification.ts`
- `src/lib/platform/dsr/otp.ts`
- `src/lib/platform/dsr/sla.ts`
- `src/lib/platform/ropa/ai.ts`
- `src/lib/platform/ropa/consent.ts`
- `src/lib/platform/security/token-secret.ts`
- `src/lib/platform/supabase/admin.ts`
- `src/lib/platform/supabase/client.ts`
- `src/lib/platform/supabase/server.ts`
- `src/lib/platform/vendors/client.ts`
- `src/lib/platform/vendors/dpa.ts`
- `src/lib/platform/vendors/email.ts`
- `src/lib/platform/vendors/questionnaire.ts`
- `src/lib/platform/vendors/risk.ts`
- `src/lib/platform/vendors/status.ts`
- `src/lib/platform/vendors/token.ts`
- `src/lib/platform/assessment-questions.ts`
- `src/lib/platform/constants.ts`
- `src/lib/platform/markdown.ts`
- `src/lib/platform/org.ts`
- `src/lib/platform/sidebar-modules.ts`
- `src/lib/platform/utils.ts`
- `src/lib/scanner/assessment-map.ts`
- `src/lib/scanner/dpdp-engine.ts`
- `src/lib/scanner/dpdp-types.ts`
- `src/lib/scanner/entitlements.ts`
- `src/lib/scanner/pdf-report.ts`
- `src/lib/scanner/report-cache.ts`
- `src/lib/scanner/report-pdf.ts`
- `src/lib/scanner/scan-report-store.ts`
- `src/lib/scanner/url-report.ts`
- `src/lib/security/api-guard.ts`
- `src/lib/security/bot-detection.ts`
- `src/lib/security/csrf.ts`
- `src/lib/security/device-session.ts`
- `src/lib/security/index.ts`
- `src/lib/security/pilot-gate.ts`
- `src/lib/security/rate-limiter.ts`
- `src/lib/security/validation.ts`
- `src/lib/server/security-compliance-manager.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/types.ts`
- `src/lib/supabase/verified-user.ts`
- `src/lib/anchored-menu.ts`
- `src/lib/breadcrumbs.ts`
- `src/lib/cn.ts`
- `src/lib/content-runtime-events.ts`
- `src/lib/easy-hash.ts`
- `src/lib/hero-auto-advance.ts`
- `src/lib/motion.ts`
- `src/lib/paid-routes.ts`
- `src/lib/pdf.ts`
- `src/lib/pilot-checkout.ts`
- `src/lib/pilot-paths.ts`
- `src/lib/platform-return.ts`
- `src/lib/progress.ts`
- `src/lib/safe-storage.ts`
- `src/lib/seal.ts`
- `src/lib/search-index.ts`
- `src/lib/security-compliance-contract.ts`
- `src/lib/subscription-access.ts`
- `src/lib/supabase.ts`
- `src/lib/template-pricing.ts`
- `src/lib/template-purchases.ts`

## src/content files (67)

- `src/content/act-provenance.ts`
- `src/content/act.ts`
- `src/content/blog-articles.ts`
- `src/content/blog.ts`
- `src/content/cases.ts`
- `src/content/certification.ts`
- `src/content/course-activities.ts`
- `src/content/course-lessons.ts`
- `src/content/courses.ts`
- `src/content/curriculum.ts`
- `src/content/demo.ts`
- `src/content/dpdp-explainer.ts`
- `src/content/dpdp.ts`
- `src/content/dpdpa-questions.ts`
- `src/content/easy-generated.ts`
- `src/content/easy-static.ts`
- `src/content/exam-bank.ts`
- `src/content/hero-configs.ts`
- `src/content/home.ts`
- `src/content/industry-advisor.ts`
- `src/content/learn.ts`
- `src/content/lexbot-kb.ts`
- `src/content/quiz-bank.ts`
- `src/content/rights.ts`
- `src/content/risk-explainers.ts`
- `src/content/rule-official-text.ts`
- `src/content/rules.ts`
- `src/content/sample-questions.ts`
- `src/content/scanner.ts`
- `src/content/section-enrichment.ts`
- `src/content/section-official-text.ts`
- `src/content/section-plain.ts`
- `src/content/security-compliance-legal.ts`
- `src/content/security-scanner.ts`
- `src/content/service-detail.ts`
- `src/content/site.ts`
- `src/content/template-documents.json`
- `src/content/template-documents.ts`
- `src/content/templates.ts`
- `src/content/trail.ts`
- `src/content/truststack-assurance.ts`
- `src/content/easy/act.ts`
- `src/content/easy/advisor-chat-depth.ts`
- `src/content/easy/assessments-depth.ts`
- `src/content/easy/blog-depth.ts`
- `src/content/easy/blog.ts`
- `src/content/easy/cases-depth.ts`
- `src/content/easy/cases.ts`
- `src/content/easy/certification-depth.ts`
- `src/content/easy/certification.ts`
- `src/content/easy/common.ts`
- `src/content/easy/courses-depth.ts`
- `src/content/easy/courses.ts`
- `src/content/easy/framework.ts`
- `src/content/easy/home.ts`
- `src/content/easy/index.ts`
- `src/content/easy/law-depth.ts`
- `src/content/easy/learn.ts`
- `src/content/easy/legal.ts`
- `src/content/easy/rights.ts`
- `src/content/easy/rules.ts`
- `src/content/easy/security.ts`
- `src/content/easy/services-security-depth.ts`
- `src/content/easy/solutions.ts`
- `src/content/easy/templates-depth.ts`
- `src/content/easy/templates.ts`
- `src/content/easy/tools.ts`

## Locales (messages/)

- `messages/as.json`
- `messages/bn.json`
- `messages/doi.json`
- `messages/en.json`
- `messages/gu.json`
- `messages/hi.json`
- `messages/kn.json`
- `messages/kok.json`
- `messages/ks.json`
- `messages/mai.json`
- `messages/ml.json`
- `messages/mni.json`
- `messages/mr.json`
- `messages/ne.json`
- `messages/or.json`
- `messages/pa.json`
- `messages/sa.json`
- `messages/sat.json`
- `messages/sd.json`
- `messages/si.json`
- `messages/ta.json`
- `messages/te.json`
- `messages/ur.json`

## SQL migrations

- `supabase/master.sql`
- `supabase/scanner_entitlements.sql`
- `supabase/scanner_history.sql`
- `supabase/scan_reports.sql`
- `supabase/secure_questions.sql`
- `supabase/platform/00_core.sql`
- `supabase/platform/01_access_control.sql`
- `supabase/platform/02_session_registry.sql`
- `supabase/platform/03_payment_receipts.sql`
- `supabase/platform/04_database_hardening.sql`
- `supabase/platform/add_org_logo_url.sql`
- `supabase/platform/assessment_user_isolation.sql`
- `supabase/platform/backfill_org_member_ids.sql`
- `supabase/platform/breach_incidents.sql`
- `supabase/platform/consent_config_versions.sql`
- `supabase/platform/dsr_requests.sql`
- `supabase/platform/fix_grievance_reference_unique.sql`
- `supabase/platform/privacy_notices.sql`
- `supabase/platform/ropa.sql`
- `supabase/platform/vendors.sql`
- `supabase/platform/verify_security.sql`

## Flask Python modules (dpdp_comp2/dpdp_comp root)

- `activate_pro_manual.py`
- `api_handlers.py`
- `api_validation.py`
- `app.py`
- `auth.py`
- `auth_user.py`
- `cache.py`
- `captcha.py`
- `checkout_copy.py`
- `compliance_checker.py`
- `confidence_refinement.py`
- `config.py`
- `create_demo_user.py`
- `document_ingest.py`
- `entitlements.py`
- `gunicorn.conf.py`
- `job_store.py`
- `llm_analyzer.py`
- `payment_ledger.py`
- `razorpay_payments.py`
- `razorpay_subscriptions.py`
- `razorpay_webhooks.py`
- `report_generator.py`
- `scan_quota.py`
- `scan_runner.py`
- `scraper.py`
- `security.py`
- `supabase_entitlements.py`
- `supabase_premium.py`
- `supabase_store.py`
- `supabase_subscriptions.py`
- `test_pdf.py`
- `truststack_tiers.py`
- `user_reconcile.py`
- `utils.py`
- `wsgi.py`


---

# PART 4 — Flask engine

## DPDP Flask Scanner Engine — Handoff

**Root:** `dpdp_comp2/dpdp_comp`  
**Default bind:** `127.0.0.1:5000`  
**TrustStack talks to this** via `DPDP_ENGINE_URL` + shared `API_KEY`.

---

## Run locally

```powershell
cd dpdp_comp2\dpdp_comp
.\venv\Scripts\activate
pip install -r requirements.txt
# UTF-8 .env with API_KEY, Supabase, optional DEEPSEEK_*, RAZORPAY_*
.\venv\Scripts\python.exe app.py
```

Open: `GET /health` (no key). All `/api/*` need `X-API-Key` except Razorpay webhook.

Optional UI: `web/` Next app (`basePath: /scanner`) — not required when using TrustStack.

Production: Docker / Render (`render.yaml`, `DEPLOY.md`), gunicorn `wsgi:app`.

---

## TrustStack proxy contract

```
X-API-Key: <shared with TrustStack DPDP_ENGINE_API_KEY>
X-TrustStack-Proxy: 1
Authorization: Bearer <user Supabase JWT>
POST /api/scan
```

Effects: skip Flask sign-in gate; skip local quota consume; auto-unlock full report/PDF for owner.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness + meta |
| GET | `/api/health/supabase` | Table probe |
| GET | `/api/quota` | Quota snapshot |
| GET | `/api/user/nav-status` | Premium flag |
| GET/POST | `/api/user/scans` | History |
| POST | `/api/quota/claim` | Claim anonymous scan |
| POST | `/api/scan` | Start URL or PDF scan → `job_id` |
| GET | `/api/scan/<job_id>` | Poll |
| GET | `/api/history` | Assessments |
| GET | `/api/meta` | Versions / premium flags |
| GET | `/api/report/<id>` | Preview or full JSON |
| GET | `/api/report/<id>/status` | access_tier |
| GET | `/api/report/<id>/pdf` | PDF (premium) |
| GET | `/api/report/<id>/previous` | Prior same URL |
| POST | `/api/report/<id>/checkout` | Unlock order |
| POST | `/api/report/<id>/unlock` | Verify unlock |
| POST | `/api/scan/checkout` | Pay-before-scan |
| POST | `/api/scan/confirm-payment` | Confirm prepaid |
| POST | `/api/webhooks/razorpay` | Webhooks |
| POST | `/api/subscription/pro/create` | **410** (use TrustStack Pilot) |
| POST | `/api/subscription/pro/confirm` | Legacy |
| GET | `/api/subscription/status` | Pilot + legacy |
| POST | `/api/subscription/cancel` | Legacy Pro cancel |

---

## Scan pipeline

1. `POST /api/scan` — rate limit, reserve slot (`free`/`prepaid`/`pilot_daily`/`pro`; TrustStack forces prepaid semantics)
2. Background `start_scan` / `start_pdf_scan` in `scan_runner.py`
3. Scrape (`scraper.py`) or PDF ingest (`document_ingest.py`)
4. Analyze (`llm_analyzer.py` DeepSeek or keyword) + `compliance_checker.py`
5. `save_report` → `results/{opaque_id}.json`; job → `jobs/{id}.json`
6. Poll complete → `report_id`; auto-unlock for prepaid/Pilot/TrustStack
7. PDF via `report_generator` / handlers (premium gated unless unlocked)

**Dirs (auto-created):** `results/`, `jobs/`, `uploads/` under `DATA_DIR`.

**Landmine:** Missing `results/<id>` → PDF/report 404; **re-run scan**. Errno 2 on missing folder was hardened.

---

## Key Python modules

`app.py`, `config.py`, `scan_runner.py`, `job_store.py`, `entitlements.py`, `api_handlers.py`, `document_ingest.py`, `scraper.py`, `llm_analyzer.py`, `compliance_checker.py`, `report_generator.py`, `razorpay_payments.py`, `razorpay_webhooks.py`, `scan_quota.py`, `truststack_tiers.py`, `supabase_*.py`, `auth.py`, `auth_user.py`, `security.py`, `payment_ledger.py`, `captcha.py`

---

## Supabase (engine)

`user_entitlements`, `user_scans`, `report_unlocks`, `visitor_scans`, `scan_reports`, `scan_jobs`, `truststack_subscriptions`, `daily_scan_usage`, `organization_members`, legacy `subscriptions`

Auth verify: Supabase `/auth/v1/user` with user JWT.

---

## Razorpay (engine-local)

Unlock report (~₹299), pay-before-scan, legacy Pro. Webhook HMAC `RAZORPAY_WEBHOOK_SECRET`. Prefer TrustStack Pilot for subscriptions.

---

## Env names (selected)

`API_KEY`, `PORT`, `DATA_DIR`, `FLASK_*`, `SUPABASE_*`, `RAZORPAY_*`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `FREE_SCANS_PER_USER`, `PILOT_SCANS_PER_DAY`, `PREMIUM_*`, `TURNSTILE_*`, `MAX_CONCURRENT_SCANS`, `SCAN_*_TIMEOUT*`, `CORS_ORIGINS`, `GUNICORN_*`

**Encoding:** `.env` must be UTF-8 or `load_dotenv` crashes.


---

# PART 5 — Playwright evidence

## Playwright live evidence (2026-08-09)

**Base URL used successfully for auth:** `http://localhost:3000`  
**Engine:** `http://127.0.0.1:5000`  
**Scripts:** `updated_prj/variation 1/scripts/handoff-crawl*.mjs`  
**Raw JSON:** `updated_prj/variation 1/docs/handoff-crawl*.json`

> Prefer `localhost` over `127.0.0.1` for the Next app so origin matches `NEXT_PUBLIC_APP_URL`.

---

## Unauthenticated behavior

Redirected to `/welcome?redirect=…`:  
`/solutions`, `/framework`, `/tools`, `/industries`, `/why-us`, `/cases`, `/scanner`, `/templates`, `/account`, `/certification`, `/security`, all `/trustdeck/*`

Still public: `/`, `/welcome`, `/assurance`, `/act`, `/rules`, `/section/[n]`, `/learn`, `/courses`, `/blog`, `/rights`, legal pages, auth pages, `/certification/verify`

`/subscribe` → `/auth/sign-up?plan=pilot`

---

## Authenticated Pilot session

Header showed Pilot account badge. Opened successfully:

| Route | H1 / signal |
|-------|-------------|
| `/account` | Account Settings |
| `/scanner` | Privacy compliance, quantified in seconds |
| `/templates` | Templates |
| `/tools` | Tools |
| `/security` | Security |
| `/certification` | Certify |
| `/certification/exam` | The DPDP Practitioner examination |
| `/solutions` `/framework` `/industries` `/why-us` `/cases` | Marketing pages load |

`/subscribe` redirected to `/` (already Pilot).

---

## TrustDeck crawl (full modules)

| Requested | Final | H1 |
|-----------|-------|----|
| `/trustdeck` | `/trustdeck/overview` | Overview |
| `/trustdeck/overview` | same | Overview — score 50, module strip M1–M8 |
| `/trustdeck/reports` | same | Board Reports |
| `/trustdeck/assessment` | same | Assessment (scores 50 & 0 in history) |
| `/trustdeck/assessment/new` | `/assessment/{uuid}` | Organization Profile (**created new assessment**) |
| `/trustdeck/consent` | same | Consent Management |
| `/trustdeck/consent/configure` | same | Configure Consent Widget (4-step wizard) |
| `/trustdeck/consent/versions` | same | Consent Version History |
| `/trustdeck/consent/audit` | same | Consent Audit Log |
| `/trustdeck/privacy-notice` | same | Privacy Notice Builder |
| `/trustdeck/privacy-notice/builder` | same | Build your privacy notice |
| `/trustdeck/grievance` | same | Grievance Officer Portal |
| `/trustdeck/grievance/complaints` | same | Complaints |
| `/trustdeck/dsr` | same | DSR Management |
| `/trustdeck/dsr/requests` | same | Data Rights Requests |
| `/trustdeck/ropa` | same | ROPA Builder |
| `/trustdeck/ropa/list` | same | Processing Activities |
| `/trustdeck/vendors` | same | Vendor DPA Manager |
| `/trustdeck/vendors/list` | same | Vendor Registry |
| `/trustdeck/breach` | same | Breach Response |
| `/trustdeck/breach/list` | same | Breach Register |
| `/trustdeck/create-organization` | `/overview` | Already has org |
| `/trustdeck/settings` | `/settings` | **404** |

Overview live tiles observed: Consent 0 records; Notice not created; No grievance officer; DSR 1 pending; Vendors 1; Breaches 0.

---

## Side effects

- New Compass assessment id created during crawl: `d95bccd8-7df5-4366-b3d2-835afdbdb844` — delete in Supabase if unwanted.

