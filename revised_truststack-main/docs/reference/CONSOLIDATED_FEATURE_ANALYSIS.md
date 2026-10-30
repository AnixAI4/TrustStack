# One TrustStack platform — consolidated feature analysis

**Owner:** Aniket Mhala · **Prepared by:** Claude · **Started:** 28 Oct 2026

This is the working file for consolidating the old app and the new app into one
platform that works for any industry. It is built in seven steps, and each
step waits for Aniket's approval before the next one starts.

| Step | Section | Status |
|---|---|---|
| 1 | Feature census: everything in both apps, checked against the code | ✅ Approved 28 Oct 2026 |
| 2 | Consolidated map: old vs new, keep / merge / drop / new | ✅ Approved 28 Oct 2026 (including 2.6); the s.11 fix merged (D-140) |
| 3 | Sentinel design: continuous compliance assurance | ✅ Approved 28 Oct 2026 (Q1–Q6 as recommended) |
| 4 | Market research: competitors, what every tool has, gaps we can own | ✅ Approved 28 Oct 2026 (Q1–Q5 as recommended) |
| 5 | Industry-agnostic model: core vs industry packs | ✅ Approved 28 Oct 2026 (Q1–Q6 as recommended) |
| 6 | Build sequence: client side and AnixAI side | ✅ Approved 28 Oct 2026 (Q1–Q5 as recommended) |
| 7 | Final pack: top 10, sales story, sign-off | ✅ Approved 28 Oct 2026 — **analysis closed** |

No code is changed by this analysis.

---

## Step 1 — Feature census

### 1.1 What was checked

| App | Where | Checked on 28 Oct 2026 |
|---|---|---|
| **Old app** ("DPDP Compass" / TrustStack v2.3) | `DPDP/truststack-platform`, branch `truststack` @ `f01f310` | Its tracker (`implementation/Tracker/tracker-data.json`, 40 modules), `progress.md`, `PENDING.md`, the feature inventory, the prompt library (41 prompts) — **and the code**: 47 pages, 16 API groups, 12 database scripts |
| **New app** (revised TrustStack) | `DPDP_revised/revised_truststack`, `main` @ `1acbc58` | `SLICES.md`, `STATE.md`, `DECISIONS.md` (138 decisions), slice files 00B–14, spec Steps A–P — **and the code**: 38 pages, about 140 API routes, 31 database migrations, the `core` package (35 modules, each with tests) |

**How "status" is set.** A feature counts as **Built** only when its pages,
API and database tables exist in the code. **Partly built** means the code
exists but something stops it from working fully, such as a missing scheduler,
a known legal-accuracy fault or unfinished sign-off. **Not built** means at
most a written design or prompt. Where the docs and the code disagree, the
code wins, and the disagreement is noted.

**What this step does not do.** It does not re-test anything on the live
sites. The old app's "live" status comes from its own tracker. The new app's
"live" status comes from `STATE.md`, which records the gate results and
production deploys for each slice.

### 1.2 The two apps at a glance

| | Old app | New app |
|---|---|---|
| Built as | 13 separate modules, one after another (M1–M13) | 12 slices around one spine: scope → questions → evidence → score → gaps → actions → reports |
| Assessment | 45 fixed questions + 8 industry questions for fintech / health / edtech | 98 core + **1,429** industry questions across **10 industry packs**, chosen by a scope wizard, scored on **16 DPDP domains** |
| Scoring idea | Weighted answers → Compass Score 0–100, maturity 1–5 | **Evidence caps claims**: a "yes" without accepted evidence is capped; frozen and provisional scores are never blended |
| Money and legal risk | One-line penalty figures in the design only | **Exposure Command Centre**: penalty exposure against the statutory ceiling, a forecast to 13 May 2027, what-if, snapshots (exposure model 1.7.0) |
| AI | Claude writes notices, DPAs, breach letters, ROPA entries; a public chatbot | Gateway with guardrails, the whole legal text in the prompt, citations checked; **drafts only, a person accepts**; a reference set of 40 test cases |
| Commercial | Razorpay subscriptions, 5 tiers, pay-as-you-go credits | One licence per client and industry (D-040); **no billing in the code yet** |
| Languages | Consent widget in 19 languages; notices EN→HI/TA/TE/MR | Consent widget in EN / HI / MR / UR; notices EN→HI/MR |
| Tests | Type-check and build; manual QA | 1,403 core + 900 web unit + 581 RLS + 24 SQL gates + 485 end-to-end |
| Its future | **Frozen (D-002)**; retired in Slice 13 | The platform going forward |

### 1.3 Old app — every feature

Status key: ✅ Built · 🟡 Partly built · 🔲 Not built (design or prompt only)

#### Built modules (M1–M13)

| ID | Feature | What it does, in plain words | Status | Checked in code |
|---|---|---|---|---|
| M1 | **DPDP Compass™ Assessment** | 45 questions on DPDP duties → a Compass Score 0–100 and maturity level 1–5 → an AI gap report with priorities; save and resume | ✅ | `dashboard/assessment/*`, `lib/assessment-questions.ts` |
| M1b | **Industry layers** | Industry-aware advice (RBI for fintech, DISHA for health, parental consent for edtech) + 8 extra questions each for fintech / healthtech / edtech | ✅ | Inside the assessment pages |
| M2 | **Consent Management** | A website consent banner (vanilla JS, 19 languages + right-to-left scripts), 4-step set-up wizard, consent log with CSV export, consent and withdrawal rates, fixed version snapshots (s.6), a preference centre for withdrawal | ✅ | `dashboard/consent/{configure,audit,versions}`, `public/consent-widget.js` |
| M3 | **Privacy Notice Builder** | 8-step wizard → Claude writes the notice → translation EN→HI/TA/TE/MR → a public notice page; versions; a staleness alert at 12 months | ✅ | `dashboard/privacy-notice/builder`, `public/[slug]` |
| M4 | **Grievance Officer Portal** | Appoint the grievance officer (with history), a public complaint form, a complaint list with a status workflow, email alerts | ✅ | `dashboard/grievance/*`, `public/grievance/[slug]` |
| M5 | **Data Subject Requests** | A public portal for the DPDP rights (access, correction, erasure, nomination…), email OTP to verify the person, an SLA tracker, a DPO workflow, an AI draft reply | 🟡 | `dashboard/dsr/*`, `public/dsr/[slug]`. **Legal fault:** a hard-coded 30-day SLA the Rules don't set (FIX5) |
| M6 | **ROPA Builder** | A register of processing activities: draft → active → archived, DPO approval, AI-assisted entry, 5 industry templates, a consent cross-check, PDF and CSV export | ✅ | `dashboard/ropa/*`, `db/ropa.sql` (applied 29 Jun 2026) |
| M7 | **Vendor DPA Manager** | Vendor register, a 45-question vendor questionnaire sent by secure link, an automatic risk tier, AI-written DPA, DPA status and expiry alerts, a library of 20 pre-assessed Indian vendors | ✅ | `dashboard/vendors/*`, `public/vendor-questionnaire/[token]` |
| M8 | **Breach Response** | Breach log with a workflow, a 72-hour countdown, an AI-drafted letter to the Board (Rule 7), notifying affected people, a post-mortem | 🟡 | `dashboard/breach/*`. **Escalation emails never send** (no scheduler, FIX2). **Legal fault:** a single clock, not the Rule 7 two-clock (FIX5) |
| M9 | **Board Dashboard** | The Compass gauge, module status, priority actions, a compliance calendar, an AI-written 6-page board report PDF, a 7-day public share link; covers M1–M8 since FIX3 | ✅ | `dashboard/overview`, `dashboard/reports`, `public/board-report/[token]` |
| M10 | **TrustChat™** | A DPDP chatbot on the landing page and in the dashboard; an 11-question health check; answers with section references | ✅ | `api/chat`, `api/health-check` |
| M11 | **Team Management** | Invite by email, roles (admin / DPO / member / board), role-based menus, seat limits per plan | ✅ | `dashboard/team`, `invite/accept` (v2.1.0) |
| M12 | **Billing & Subscriptions** | Razorpay subscriptions, 5 tiers set in the database, trials, upgrade/downgrade, a feature gate on 10 billable actions, a pricing page | 🟡 | `dashboard/billing/*`, `pricing`, `db/billing.sql` (v2.2.0). **Not production-ready:** recurring payments need Razorpay KYC; only one paid plan is mapped, so switching to the others skips payment |
| M13 | **Pay-as-you-go credits** | A credit wallet, a price per feature, top-up by Razorpay, a usage ledger | ✅ | `api/billing/credits/*`, `db/payg.sql` (v2.3.0) |
| — | **Tracker dashboard** | Anix's internal build-status page | ✅ | A Claude artifact fed by `tracker-data.json` |
| — | **Landing page + lead capture** | A public DPDP landing page, Calendly booking, a form that saves leads | ✅ | `db/briefing_requests.sql` + GTM files (marketing, not the product) |

#### Fixes before charging customers (P1.5)

| ID | What | Status |
|---|---|---|
| FIX1 | Grievance reference numbers clashing across organisations | ✅ Fixed (v1.5.1) |
| FIX2 | Apply the ROPA and breach database scripts; schedule escalations | 🟡 Scripts applied; **scheduler never set up** |
| FIX3 | Board dashboard to cover M5–M8 | ✅ Fixed (v1.5.3) |
| FIX4 | Production hardening | 🟡 Automated checks done; **manual QA, mobile check and production env sign-off never done** |
| FIX5 | **DPDP Rules 2025 accuracy**: configurable rights SLA, grievance 90 days (R14(3)), the access answer to list whom data was shared with (s.11(1)(b)), guardian consent for persons with disability (R11), the breach two-clock (R7), retention triggers (R8) | 🔲 **Never started.** Its own docs mark it "do before charging" |

#### Designed but not built (P2–P4 and Sentinel)

Each of these has a written build prompt in `implementation/Prompt_Library/`. None has any code.

| ID | Feature | What it would do |
|---|---|---|
| M14 | **30-day Onboarding Wizard** | A day-by-day checklist and progress tracker, a "your first 30 days" plan built from the gaps, demo data |
| M15 | **WhatsApp Consent** | Consent and withdrawal over WhatsApp Business (STOP command), in the same consent log |
| M16 | **Aadhaar OTP / DigiLocker** | High-assurance identity for parental consent, rights requests and vendor eSign (via Leegality) |
| M17 | **Trust Center** | A public compliance profile page with a verified badge for B2B buyers (re-scoped as Sentinel's public face) |
| M18 | **Alert Center** | A live alert feed and email digest: consent-withdrawal spikes, rights SLA at risk, breach 72h, DPA expiry, rule updates (re-scoped as Sentinel's alert face) |
| M19 | **Re-Consent Campaign** | When the consent text changes, find who agreed to the old version, ask again, track the response |
| — | **Public DPDP Score Scanner** | Free, no sign-up: enter a website URL → a DPDP score → upsell |
| M20 | **Sector Packs** | BFSI (RBI, SEBI, IRDAI overlays), healthcare (DISHA, ABDM), edtech, e-commerce (Consumer Protection Act) |
| M21 | **TrustStack Academy™** | Role-based DPDP training with quizzes and certificates; a "TrustStack-Certified DPO" credential |
| M22 | **Compliance Badge** | A verified badge for scores above 75; a public verification page; quarterly re-check |
| M23 | **DPO-as-a-Service** | An advisory queue between the client and an Anix expert; 1 advisor to 20–30 clients |
| M24 | **India DSR Connectors** | Carry out erasure and export automatically in Zoho, Freshdesk, Razorpay, CleverTap, MoEngage, Exotel |
| M25 | **DPDP Compliance API** | A REST API + Node/Python SDKs + webhooks: "Stripe for DPDP" |
| M26 | **AI Governance** | An AI system inventory, training-data consent checks, unlearning impact, AI vendor checks |
| M27 | **Consent Signal Propagation** | Push a withdrawal to connected systems in real time, with proof per system |
| M28 | **ISO 27701 Pathway** | Map TrustStack to ISO 27701 controls; an 8-week certification path |
| M29 | **Automated Data Discovery** | Scan databases for Aadhaar, PAN, mobile, IFSC, UPI patterns; suggest ROPA entries |
| M30 | **Privacy-as-Code SDK** | Code annotations, a GitHub check, a Jira plugin, ROPA generated from code |
| **M31** | **Sentinel™: continuous monitoring and evidence** | See 1.5 |
| M32 | **Support Copilot** | AI first-line customer support for TrustStack's own clients |
| M33 | **Partner Console** | A channel console for chartered accountants and law firms who resell or deliver TrustStack |

#### Old app totals (verified)

| | Count |
|---|---|
| Built and working | 12 modules (M1–M4, M6, M7, M9–M11, M13) + Tracker + landing page |
| Partly built | M5, M8, M12; FIX2, FIX4 |
| Not built | FIX5 + 21 designed modules (M14–M33 + Scanner) |

### 1.4 New app — every feature

All of the features below are **built and live** on `main` @ `1acbc58`,
except where the status says otherwise. Each row names the slice that built it.

#### Foundation and the platform

| Slice | Feature | What it does, in plain words | Checked in code |
|---|---|---|---|
| 0B, 1 | **Tenancy, sign-in, roles** | Each client is a separate organisation with database-level isolation (RLS); users, roles and permissions; organisation switcher; email invites (with resend) | `tenancy_rbac`, `invite_reissue` migrations; `dashboard/users`, `invites/accept`; `core/rbac.ts`, `membership.ts` |
| 10.5 | **App shell and simplicity pass** | The old app's look, a fixed left menu, a top bar showing your role, toasts, pagination, tabs; every screen audited and fixed against a non-lawyer test | `docs/UX_REVIEW.md`; `components/` |
| — | **Audit trail** | Who did what, on every register | `audit_*` in 26 files |

#### The assessment spine

| Slice | Feature | What it does | Checked in code |
|---|---|---|---|
| 2 | **Organisation profile + scope wizard** | Industry, departments, systems, vendors, kinds of people whose data you hold, risk tags → decides which questions apply | `dashboard/{organization,scope}`; `core/scope.ts`; `scope_wizard` migration |
| 3 | **Question bank (black box)** | 98 core + 1,429 industry questions in **10 packs**: university, edtech, BFSI, healthcare, SaaS, manufacturing, retail, professional services, public sector, general. Triggers pick the questions; a version snapshot per assessment; the client cannot see the whole bank (D-040) | `docs/question_packs/` (1,429 unique codes, 0 duplicates); `core/questions.ts`, `triggers.ts`, `packs.ts` |
| 4 | **Evidence + the "evidence caps claims" rule** | Upload evidence (signed links), link it to answers, a reviewer accepts it; a "yes" without accepted evidence cannot score full marks | `evidence/*` routes; `core/engine.ts`; `evidence_scoring` |
| 5 | **Scoring engine** | 16 DPDP domains, red flags, a confidence level, immutable score snapshots, parity with the validated Excel MVP (baseline 24.7015) | `core/scoring.ts`, `domains.ts`; `scoring_engine` |
| 6 | **Gaps + one actions list** | A gap register worked out from the answers, priorities P0–P3, owners, a 30/60/90-day roadmap; an action closes on evidence or review. One actions list for every module | `dashboard/{assessments/[id]/gaps,actions}`; `core/gaps.ts` |
| 7 | **ROPA register** | Records of processing in the DPDP structure, completeness out of 100, a risk floor worked out in SQL, Excel/CSV import and export, ROPA gaps on the shared actions list | `dashboard/ropa/{new,import,lookup,gaps}`; `core/ropa.ts` |

#### Seeing and reporting

| Slice | Feature | What it does | Checked in code |
|---|---|---|---|
| 8 | **Dashboards** | An executive overview (frozen vs provisional score, never blended), a 16-domain scorecard, ten ROPA metrics, actions by owner and 30/60/90 | `dashboard`; `core/dashboard.ts` |
| 9 | **Exposure Command Centre** | How close you are to a DPDP penalty, where you sit within the statutory ceiling (Schedule) and why, a forecast of readiness by 13 May 2027 at your current pace, which actions retire the most exposure, a what-if, dated snapshots | `dashboard/exposure`; `exposure/{what-if,snapshots}`; `core/{exposure,forecast,intelligence}.ts` |
| 9, 10 | **Reports (10 kinds)** | Exposure brief (Board), programme status (DPO), owner action pack, evidence pack (auditor), gap-action tracker, ROPA register, evidence index, Security & Breach (CISO), Legal Position (counsel), Processor Exposure (procurement). PDF, versioned, signed, audited; plus working spreadsheets | `dashboard/reports`; `core/{reports,workbooks}.ts` |

#### Workflow modules (Slice 10, eight stages)

| Stage | Feature | What it does | Checked in code |
|---|---|---|---|
| 1 | **Breach register** | Incidents, the Rule 7 clocks worked out at read time, actions and evidence; feeds the exposure model | `dashboard/breaches/*`; `core/breach.ts` |
| 2 | **Rights + grievance register** | Rights requests (access, correction, erasure, nomination, grievance) with time limits from the Rules (grievance 90 days) | `dashboard/rights/*`; `core/rights.ts` |
| 3a | **Public intake** | A public page per client: rights request, grievance, with email confirmation | `p/[slug]/{rights,grievance}`; `public/[slug]/submissions/*` |
| 3b | **Notice + consent + children's consent** | Notice builder and versions, a public notice page, a consent banner (EN/HI/MR/UR), consent records and lookup, verifiable parental consent (s.9, R10) | `dashboard/consent/*`, `p/[slug]/notice`, `public/widget/consent-v1.js`; `core/consent.ts` |
| 4a | **Processor register + questionnaire** | Processors, a DPDP questionnaire, a review, the controls that feed exposure | `dashboard/processors/*`; `core/vendors.ts` |
| 4b | **Vendor-facing questionnaire link** | The vendor answers and uploads documents by secure link and code, no login | `v/[token]`; `vendor-links/*` |
| 5 | **Retention + erasure** | Retention schedules, erasure logs (counted only when processors were told), R8 notice and Seventh-Schedule periods | `dashboard/retention/*`; `core/retention.ts` |
| 6 | **AI risk register** | AI systems that use personal data, their risks and evidence | `dashboard/ai-risk/*`; `core/ai-risk.ts` |

#### AI assistant (Slice 11)

| Stage | Feature | What it does | Checked in code |
|---|---|---|---|
| 1a | **Safe AI gateway** | One route to the model; the whole DPDP Act and Rules in a cached prompt; structured output; guardrails; citations checked; an on/off switch per client and a contract check | `ai_gateway`; `core/ai-{guardrails,citations}.ts` |
| 1b | **Explain helpers** | Plain-language help on a question, an evidence item, a gap or a score; thumbs up/down | `ai/[task]`; `ai_explain_helpers` |
| 2a | **Register drafts** | AI drafts a ROPA record, the Rule 7(2) breach intimation, a rights response. A register writer accepts or discards it; the AI never writes to a register | `ai/drafts/*`; `core/ai-drafts.ts` |
| 2b | **Notice, translation, report narrative** | A notice drafted from the consent-based records; Hindi/Marathi translation; a report narrative from the stored figures | `ai_notice_narrative` |
| — | **Reference set** | 40 test cases checked by a DPDP expert, run against the live model | `core/ai-reference-set.ts` |

**Live, with one limit:** on the live site the assistant is **switched off**
until the AI provider's DPA with zero data retention (item A1) is signed.

#### Not built yet

| Slice | Feature | What it would do | State |
|---|---|---|---|
| 12 | **Reassessment and trend** | A full, delta or event-triggered reassessment that carries answers forward, compares baseline with current (naming any scope change), shows the trend, and produces a Reassessment Report | Full prompt written; **awaiting "SLICE_12 approved"** |
| 13 | **Hardening + launch readiness** | MFA, failed-access logging, **evidence expiry**, **reminders and a job runner** (scheduled emails, escalations), production infrastructure, UAT, retiring the old app | Outline only |
| 14 | **Platform console + licensing → launch** | An Anix console across all clients; one licence per client and industry; approval of industry packs; production go-live (Mumbai University first) | Outline only |
| 15 | **Client-hosted deployment** | One-click install in the client's own premises or cloud: single tenant, Compose/Helm/Terraform, an offline licence, a protected question bank, the client's own AI provider or a private model | Proposed, not scheduled |
| — | **Sentinel** | Named only in the vision ("later evolve into Sentinel-style continuous assurance", spec 01) and the pricing tiers ("Enterprise / Sentinel", spec 05) | **No slice, no design** |

#### New app totals (verified)

| | Count |
|---|---|
| Built and live | 33 features across Slices 0–11 (the assistant is off on the live site until A1) |
| Not built | Slices 12, 13, 14, 15 + Sentinel |
| Found in the PRD, proposal and deck but not in either app (1.8) | 18 features: 13 not built, 5 partly built |
| Requested on 28 Oct 2026 | Dynamic feature tracker (1.9); industry landing pages (1.10) |

### 1.5 Sentinel — where it stands

**Old app.** Sentinel (M31) is **fully designed but has no code**. The design (`P4_M31_Sentinel_Engine.md`, competitive-analysis files 20–25):

- **Treats DPDP duties as controls that are tested continuously.** There are 17 controls: consent ×2, notice ×2, rights, rights-request SLA, breach two-clock, retention, vendor ×2, children, guardian, significant data fiduciary, the Rule 6 security checklist, cross-border transfer, lawful basis, accuracy, and exemptions.
- **Each test is mechanical** (Pass / Drift / Fail). The AI never sets a status; it only explains.
- **A tamper-evident evidence ledger**: each entry is chained to the one before it.
- **A live posture dashboard** with ₹ exposure per failing control, plus a one-click evidence pack.
- **An applicability engine** that recommends a tier (Not needed / Lite / Recommended / Critical), so small clients are never pushed into it.
- **Its public face is the Trust Center (M17); its alerts face is the Alert Center (M18).**

**New app.** There is **no Sentinel slice**, but several parts it would need already exist:

| Sentinel needs | Already in the new app? |
|---|---|
| Duties mapped to Act and Rules provisions | ✅ 16 domains, exposure model 1.7.0 with provisions |
| Facts to test against (consent, rights, breach, retention, processors, AI) | ✅ All six registers (Slice 10) |
| Exposure in ₹ against the Schedule | ✅ Exposure Command Centre |
| Evidence with review and links | ✅ Slice 4; **expiry is not built** (Slice 13) |
| Something that runs on a schedule | ❌ No job runner (Slice 13) |
| Alerts and email reminders | ❌ None (Slice 13) |
| Repeat assessments, trend | ❌ Slice 12 |
| A tamper-evident ledger | ❌ An audit trail, but not hash-chained |
| A public proof page | ❌ Only public intake pages exist |

**This means:** in the new app, Sentinel would be a layer on top of Slices
12–13, not a separate product. Step 3 will design it on that basis.

### 1.6 First observations (input to Step 2, not decisions)

1. **The new app is deeper on what counts legally.** Evidence-capped scoring, 16 domains, 1,429 industry questions, the exposure model, 10 reports, AI that only drafts. Most old-app modules M1–M9 have a stronger new version.
2. **The old app is ahead on reach and money.** 19 widget languages (new: 4), billing and pay-as-you-go, a public chatbot and health check, a board share link, a 20-vendor library, ROPA industry templates, and the landing page with lead capture.
3. **The old app's legal faults are fixed in the new app's design.** Rules-based SLAs, grievance 90 days, the breach two-clock, retention triggers and guardian consent for persons with disability (R11, in `core/consent.ts`) are all anchored in the Slice 10 stages. One item still needs checking in Step 2: does the access answer list the fiduciaries and processors the data was shared with (s.11(1)(b))?
4. **The old app's roadmap holds most of the growth ideas** (M14–M33 + Scanner). None of them is in the new app's slice plan yet, except sector packs (largely done as the 10 question packs) and AI governance (partly done as the AI risk register).
5. **Both apps need the same "always-on" layer next**: scheduled jobs, reminders, evidence expiry, alerts. That layer is the base of Sentinel.
6. **Licensing vs billing.** The new app chose one licence per client (D-040). The old app built Razorpay subscriptions and credits. Step 2 has to decide whether self-serve billing comes back, for example for small clients, or stays out.

### 1.7 Questions asked, and Aniket's answers (28 Oct 2026)

| # | Question | Answer |
|---|---|---|
| 1 | Is any feature missing from the PRD, the Excel MVP, the deck or the commercial proposal? | "You only double check." → done in 1.8 |
| 2 | Is the old app's Tracker an AnixAI feature? | An internal tool — but **from now on there must be a dynamic tracker across all features, old and new** → 1.9 |
| 3 | Should the platform have a public front door? | **Yes: simple but powerful, advanced landing pages, per industry / sector.** No free scanner and no health check → 1.10 |

### 1.8 Double-check against the source documents

**Read on 28 Oct 2026:**
- PRD v1.0 (Step 15, 4 Sep 2026; the three PRD files are identical)
- Commercial Proposal and Pricing (Step 16)
- Sales & Demo Deck (Step 17)
- the Excel MVP (Step 12, 13 sheets)
- the Platform Brochure (Step 5)
- the Website Landing Page Copy (Step 13)
- the spec pack (Steps A–P)

**Already covered by the census.** These are all in the new app, built or in a planned slice:
- 16 domains with weights totalling 100
- 98 core + 108 university questions
- scores 0–5 and evidence levels E0–E5
- raw, applicable and adjusted scores, with red-flag caps
- the gap rules (scores 0–2 create gaps; red flags create P0 actions)
- the ROPA fields
- the eight workflow registers
- the PRD's ten roles (all ten exist in `core/rbac.ts`)
- the executive dashboard, the 16-domain scorecard and the ROPA dashboard
- Excel/CSV import and export
- the guardrail that AI output is a draft until a person approves it
- reassessment modes and versions V1–V5 (Slice 12)
- every Excel MVP sheet (`Reassessment_Trend` → Slice 12)

**Missing from the census, now added.** Status is checked against the new app's code.

| Source | Feature | What it is | Status in the new app |
|---|---|---|---|
| PRD §4, proposal §7 (University / Multi-Entity tier, ₹45–90 L/yr) | **Multi-entity hierarchy** | A parent organisation with affiliated units or colleges: each unit has its own scorecard, rolled up into a central dashboard | 🔲 Not built (one client = one tenant today, D-040) |
| Proposal §9 | **Affiliated-unit rollout pack** | Templates, a coordinator view and a checklist for each college or unit | 🔲 Not built (one question, UNI-VEN-007, covers it) |
| PRD §12 | **Risk heatmap** | Critical / high / medium / low risk by domain and by process | 🔲 Not built (`heatmap`: no hits in the code) |
| PRD §12 | **Evidence dashboard** | Evidence submitted, missing, outdated, rejected or adequate, at a glance | 🟡 As a report (evidence index), not a live dashboard |
| PRD §12.1, §21 | **Word and PowerPoint exports** | Executive report in Word, board pack in PPT | 🔲 Not built (PDF + spreadsheets only) |
| PRD §10, §16 | **Evidence expiry and freshness** | Expired evidence lowers confidence until it is refreshed | 🔲 Slice 13 |
| PRD US-02, §4 | **Reminders and escalations** | Owners reminded about assigned questions and actions; overdue items escalated | 🔲 Slice 13 (assigning owners is built; reminders are not) |
| PRD §16 | **AI: evidence relevance check** | Flags whether an uploaded file looks relevant to the question; a reviewer still decides | 🔲 Not among the 10 AI tasks |
| PRD §16 | **AI: remediation recommender** | Suggests the fix, owner, evidence and timeline for a gap | 🟡 `gap_helper` explains a gap but doesn't propose an action plan |
| PRD §16 | **AI: AI-tool risk checker** | Flags personal-data and automated-decision risk in an AI tool | 🟡 The AI risk register is manual; no AI check |
| PRD §17 | **Evidence redaction / masking** | Mask personal data in uploaded evidence | 🔲 Not built |
| PRD §4, Excel MVP | **Benchmarking** | "You vs others in your sector" | 🔲 Not built (the old app also deferred it until 20+ assessments) |
| PRD §21, E11 | **Integrations** | Evidence and metadata pulled from ERP / LMS / HRMS, SharePoint / Drive, ticketing, SIEM; an API export | 🔲 Not built (overlaps old M24, M25) |
| Proposal §9 | **Breach tabletop drill** | Run a simulated breach exercise and keep it as evidence | 🔲 Not built |
| Proposal §9, PRD §4 | **DPIA workflow** | Run a data-protection impact assessment when a trigger fires (SDF, AI, children, cross-border) | 🟡 Triggers and SDF readiness exist; no DPIA workflow |
| Proposal §9 | **Training attendance as evidence** | Role-wise training, recorded as evidence | 🔲 Not built (overlaps old M21 Academy) |
| Proposal §3–8 | **Engagement / service layer** | Briefing → assessment (Starter / Professional / Enterprise) → 90-day sprint → subscription → managed assurance retainer → add-ons | 🟡 The consultant role exists; there is no engagement workspace, service catalogue or retainer view in the product |
| Deck slide 13, PRD §18 | **Sentinel™ (as sold today)** | "Continuous assurance, drift alerts, evidence-on-demand and board visibility" | 🔲 Matches the old M31 design → Step 3 |

**Positioning rules to carry into every step** (PRD §5, deck slide 13, brochure §3):
- never claim a compliance guarantee or certificate
- never call TrustStack a statutory Consent Manager unless it is registered with the Board
- assess SDF status as preparedness only, never self-declare it
- AI and template output stays a draft until legal approval

### 1.9 Dynamic tracker across all features (Aniket, 28 Oct 2026)

**The requirement.** One live tracker for every feature, old and new. It is
internal to AnixAI, and it is kept current from now on.

**My recommendation.**

1. **One feature register as the single source**: a data file in this repo
   (`docs/reference/feature_register.json`). It holds one row per consolidated
   feature: ID, name, old-app name, new-app name, slice, status, DPDP basis,
   client value and AnixAI value. Step 2's consolidated map becomes this file,
   so the tracker and the analysis never disagree.
2. **Status checked against the code.** A small script compares each row with
   the repo: does the route or migration named in the row exist, and what does
   `STATE.md` say? If a row's status doesn't match the code, the tracker shows
   a warning instead of quietly showing the wrong status.
3. **A live tracker page** (a private claude.ai artifact), republished from
   the register. It is filterable by status, slice, industry, client side vs
   AnixAI side, and Sentinel.
4. **Kept current by the Sync Step.** Every slice already ends with a Sync
   Step that updates `STATE.md`. Updating the register and republishing the
   tracker becomes part of that step, and the handover check verifies it.
5. **It replaces** the old app's `tracker-data.json` dashboard, which stops
   being updated.

**When.** Build it right after Step 2 is approved. Step 2 decides the final
list of consolidated features, and building earlier would mean redoing every
row.

### 1.10 Landing pages per industry (Aniket, 28 Oct 2026)

**Decided:** simple but powerful, advanced landing pages for each industry.
**No free scanner and no health check.**

Note: the old app has an 11-question health check in its code
(`api/health-check`, part of TrustChat). Step 2 will mark it "drop" so that it
is retired with the old app.

**My recommended approach.** Step 4's research on competitors' sites will
refine it.

| Choice | Recommendation | Why |
|---|---|---|
| Where it lives | A **separate marketing site** in this repo (`apps/site`): static pages, its own deploy, on the main domain; the app stays on its own subdomain | Fast pages and good search ranking; a marketing change can never break the product; client-hosted installs don't carry marketing |
| How pages are made | **One page template + one content file per industry** | Adding an industry means adding one file. The 10 industries match the 10 question packs, and each one already has a marketing kit in `marketing material/` |
| What each industry page shows | Its pain in its own words; its regulators layered on DPDP (e.g. RBI / SEBI / IRDAI for BFSI; ABDM for health; UGC for universities); whose data it holds; its top five DPDP risks with the penalty ceilings (Schedule); how many questions its pack has; a sample report; an FAQ with Act and Rules citations | Specific beats generic: a buyer sees their own sector, not a privacy brochure |
| What makes it "advanced" without a scanner | A live countdown to 13 Nov 2026 / 13 May 2027; an interactive view of the penalty ceilings (an explainer only, no data is entered); a short demo video per industry; a sample Board report to download | Shows the product's depth without collecting anything |
| Calls to action | Two only: **Book a briefing** (Calendly) and **Request a readiness assessment** (a form) | Matches the commercial ladder (briefing → assessment) |
| Practise what we sell | The lead form uses TrustStack's own notice and consent banner; no tracking without consent; privacy-friendly analytics | A DPDP vendor must be visibly compliant on its own site |
| Languages | English first; Hindi next | Matches the app's languages |
| Claims | No guarantees, no "certified", no "Consent Manager" (1.8 rules) | Credibility with regulated buyers |

**When.** Step 6 places it in the build order. The content can start
earlier, because the industry marketing kits already exist.

**To approve:** reply "Step 1 approved", or "Step 1 approved with changes: …".

---

## Step 2 — Consolidated map

**Approved inputs:** Step 1, including 1.8–1.10 (Aniket, 28 Oct 2026).

### 2.1 How each decision was made

Every capability from both apps and the source documents is one row. Each row
gets one decision:

| Decision | Meaning |
|---|---|
| **KEEP** | The new app's version stands as it is. Nothing to bring over. |
| **MERGE** | Keep the new app's version and bring a named strength over from the old app or the documents. |
| **NEW** | Not built anywhere yet (or only in a design); belongs in the platform. |
| **PARK** | Worth doing later; not in the core build until a trigger is met (a client asks, a volume threshold is reached). |
| **DROP** | Not carried into the one platform. |

**Rules applied, in this order:**
1. **The law wins.** Anything that conflicts with the Act or the Rules is dropped or fixed, however good it looks.
2. **The new app is the base** (D-002). The old app is frozen and retired in Slice 13. Its code is never ported as it stands; only its ideas are.
3. **Simplicity.** A feature must make life easier for a non-lawyer, or it is parked.
4. **Industry-agnostic core.** Anything sector-specific goes into an industry pack (Step 5).
5. **Self-hostable.** Every kept feature must also work in a client's own premises (Slice 15).

Rows carry an ID (**F-01 …**), which the dynamic tracker (1.9) will use.
"Basis" cites the DPDP Act 2023 (s.) and the DPDP Rules 2025 (R.). Rule
numbers were checked against the Gazette text (G.S.R. 846(E)).

### 2.2 The map

#### A. Platform foundation

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-01 | Organisations, users, roles | M11 Team (4 roles) | Slice 1 (10 PRD roles, RLS) | s.8(5), R.6 | ✅ | **KEEP** | — |
| F-02 | App shell, simplicity rubric | Old look and feel | Slice 10.5 (old look, audited) | — | ✅ | **KEEP** | — |
| F-03 | Audit trail | Activity log | On every register | R.6(1)(c), (e) | ✅ | **KEEP** | Becomes Sentinel's tamper-evident ledger (F-42) |
| F-04 | MFA, session timeout, failed-access logging | — | Slice 13 | R.6 | 🔲 | **NEW** | Planned |
| F-05 | **Multi-entity hierarchy** (group → units / affiliated colleges) | — | — | s.8(1) | 🔲 | **NEW** | Unlocks the University / Multi-Entity tier (₹45–90 L/yr). Also fits banking groups, hospital chains, conglomerates |
| F-06 | Guided first 30 days | M14 Onboarding Wizard (design) | First-run guidance + next steps (Slice 10.5 B1) | — | 🟡 | **MERGE** | Extend first-run into a "your first 30 days" plan built from the client's own gaps |
| F-07 | Languages | Widget: 19 languages + right-to-left; notices EN→HI/TA/TE/MR | Widget EN/HI/MR/UR; notices EN→HI/MR | s.5(3) (English or any Eighth-Schedule language) | 🟡 | **MERGE** | Bring the old widget's language set into the new widget and notice translation. Kashmiri, Santali and Manipuri still need a professional translator |
| F-08 | Anix platform console | — | Slice 14 | — | 🔲 | **NEW** | Planned: all clients, licences, approving industry packs |
| F-09 | Licensing and billing | M12 Razorpay subscriptions + M13 pay-as-you-go | One licence per client and industry (D-040); no billing | — | 🟡 | **MERGE** — *Aniket to decide (2.4 Q1)* | Licence first (Slice 14). Self-serve billing only if a small-business tier is chosen. The old gateway design can be reused; its code cannot |
| F-10 | Client-hosted deployment | — | Slice 15 (proposed) | — | 🔲 | **NEW** | Planned |

#### B. Assess and score — the spine

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-11 | Organisation profile + scope | M1 profile | Slice 2 scope wizard | s.8(1) | ✅ | **KEEP** | — |
| F-12 | Assessment and question bank | M1 (45 Q) + M1b (24 industry Q) | 98 core + 1,429 Q in 10 packs, chosen by triggers | Whole Act | ✅ | **KEEP** | The old questions are retired |
| F-13 | Evidence ("evidence caps claims") | — | Slice 4 | — | ✅ | **KEEP** | The core differentiator |
| F-14 | Scoring: 16 domains, red flags, confidence | Compass Score, maturity 1–5 | Slice 5 (matches the Excel MVP) | — | ✅ | **KEEP** | Keep the name **DPDP Compass™** for the assessment and score |
| F-15 | Evidence expiry and freshness | — | Slice 13 | R.6 (review) | 🔲 | **NEW** | Planned; it is also a Sentinel signal |
| F-16 | Evidence redaction / masking | — | — | s.8(5), R.6(1)(a) | 🔲 | **PARK** | Clients should be told to upload redacted copies. Build only when a regulated client asks |
| F-17 | Gaps + one actions list | Priority actions on the board | Slice 6 (P0–P3, 30/60/90) | — | ✅ | **KEEP** | — |
| F-18 | **Reminders, escalations, job runner** | M8 escalation runner (never scheduled) | Slice 13 | s.8(6), s.13, R.7, R.14 (timelines) | 🔲 | **NEW** | One job runner for everything: owner reminders, overdue actions, breach clocks, rights deadlines. It is Sentinel's engine room |
| F-19 | Reassessment and trend | — | Slice 12 (full prompt ready) | R.13(1) (SDF annual DPIA/audit) | 🔲 | **NEW** | Planned; awaits "SLICE_12 approved" |
| F-20 | Sector benchmarking | M9 Layer 3 (deferred) | — | — | 🔲 | **PARK** | Trigger: 20 or more finalised assessments in a sector |

#### C. Registers and workflows

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-21 | ROPA / processing register | M6 (5 industry templates, AI entry, PDF/CSV) | Slice 7 (DPDP structure, completeness, risk floor, import/export) + AI draft | s.8(1), s.5, s.6 | ✅ | **MERGE** | Bring the old **industry starter templates** into each industry pack, so a client starts from 10–20 typical activities for its sector |
| F-22 | Privacy notice | M3 (8-step wizard, 4 translations, public page, 12-month staleness alert) | Stage 3b + AI notice and translation | s.5, R.3 | ✅ | **MERGE** | Bring over the **staleness alert** (as a Sentinel check) and more translation languages (F-07) |
| F-23 | Consent capture, widget, preference centre | M2 (19 languages, preference centre, consent stats, CSV, version snapshots) | Stage 3b (records, lookup, versions, 4 languages) | s.6, s.6(4), R.3 | ✅ | **MERGE** | Bring over the **preference centre** (withdraw as easily as giving, s.6(4)) and **consent and withdrawal statistics** |
| F-24 | Children's and guardian consent | — | Stage 3b (s.9, R.10, R.11 court or other appointed guardian) | s.9, R.10, R.11, R.12 | ✅ | **KEEP** | DigiLocker verification later (F-50) |
| F-25 | Rights and grievance | M4 + M5 (email OTP, **hard 30-day SLA — wrong**) | Stage 2 (Rules-based time limits, grievance 90 days) | s.11–14, R.14 | 🟡 | **KEEP + fix** | **Legal fix:** the access answer must list every Data Fiduciary and Data Processor the data was shared with (s.11(1)(b)). The public page already promises it (`core/intake.ts`), but the response doesn't compile it. Build it from the ROPA "shared with" field + the processor register. The old 30-day rule is dropped |
| F-26 | Public pages (notice, rights, grievance) | Separate public pages per module | One page per client `/p/[slug]` | s.8(9), R.9 (contact published) | ✅ | **KEEP** | — |
| F-27 | Breach register | M8 (single 72-hour clock) | Stage 1 (Rule 7 clocks: tell affected people without delay; Board within 72 hours) | s.8(6), R.7 | ✅ | **KEEP** | The old single-clock model is dropped |
| F-28 | Breach tabletop drill | — (proposal add-on) | — | s.8(5), R.6(1)(f) | 🔲 | **NEW** (small) | Run a scripted drill on the breach register in "exercise" mode; keep the record as evidence |
| F-29 | Processors / vendors | M7 (45-Q questionnaire, AI DPA writer, 20-vendor India library, DPA expiry alert) | Stage 4a/4b (register, questionnaire, review, secure vendor link) | s.8(2), s.8(7)(b) | ✅ | **MERGE** | Bring over (1) the **vendor library**, kept by AnixAI and refreshed centrally; (2) **contract-expiry tracking**, as a Sentinel check; (3) **DPA clause drafting** through the guarded AI (a draft for counsel, F-40) |
| F-30 | Retention and erasure | — | Stage 5 (schedules, erasure logs, R.8 48-hour notice) | s.8(7), R.8 | ✅ | **KEEP** | — |
| F-31 | AI risk register | M26 AI Governance (design) | Stage 6 (manual register) | s.8(1), s.10, R.13(3) | ✅ | **MERGE** | Keep the register; add from M26 (1) training-data consent check, (2) an AI-assisted risk check of a listed AI tool (F-40) |
| F-32 | **DPIA workflow** | — | Triggers + SDF readiness only | s.10(2)(c), R.13(1) | 🟡 | **NEW** | A guided DPIA: triggered by SDF, AI, children's data, cross-border; output kept as evidence. Mandatory for SDFs; good practice for anyone high-risk |
| F-33 | SDF readiness | — | Exposure model (SDF status entered, never inferred) | s.10, R.13 | ✅ | **KEEP** | Preparedness only, never self-declared (positioning rule) |
| F-34 | Cross-border transfer | — | Domain 15 questions; ROPA "leaves India" flag | s.16, R.15 | 🟡 | **MERGE** | A short register view of transfers (country, data, processor) built from ROPA; feeds Sentinel |

#### D. See and report

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-35 | Executive dashboard | M9 Board (calendar, priority actions) | Slice 8 overview + 16-domain scorecard | — | ✅ | **MERGE** | Bring over the **compliance calendar** (deadlines from the registers + 13 May 2027) |
| F-36 | **Exposure Command Centre** | — | Slice 9 (penalty exposure, forecast, what-if, snapshots) | s.33, Schedule | ✅ | **KEEP** | The flagship differentiator |
| F-37 | Reports | Board PDF (AI-written) | 10 kinds, versioned, signed | — | ✅ | **MERGE** | Add **Word and PowerPoint exports** (PRD §12.1); add the Reassessment Report (Slice 12) |
| F-38 | Secure board share link | M9 7-day signed link | — | — | 🔲 | **MERGE** | A time-limited, read-only link to a stored report for board members without accounts |
| F-39 | Risk heatmap + live evidence dashboard | — (PRD §12) | Evidence index as a report only | — | 🔲 | **NEW** (small) | Two dashboard tiles built from data that already exists |

#### E. AI

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-40 | AI assistant (guarded gateway, explain, draft) | Direct Claude writing: notice, DPA, breach letter, ROPA, board report | Slice 11: 10 tasks, drafts only, citations checked, a reference set | — | ✅ (off on the live site until A1) | **MERGE** | Add four tasks on the same gateway: **evidence relevance check**, **remediation plan for a gap**, **AI-tool risk check**, **DPA clause draft**. The old direct-writing approach is dropped |
| F-41 | Public chatbot (TrustChat) | M10 on the landing page + dashboard | In-app assistant only | — | — | **DROP** (public) | A public legal chatbot risks being read as legal advice and costs money on every visit. Clients get the in-app assistant. *(Q3 in 2.4)* |

#### F. Continuous assurance — Sentinel™ (designed in Step 3)

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-42 | **Sentinel engine**: controls tested continuously, tamper-evident ledger, live posture | M31 (17 controls, design only) | Facts exist in the registers; no engine | s.8(1), s.8(5), R.6 + every control's provision | 🔲 | **NEW** | A layer on Slices 12–13 (F-18, F-19, F-15) |
| F-43 | Applicability tiers (Not needed / Lite / Recommended / Critical) | M31 Slice A | — | — | 🔲 | **NEW** (part of F-42) | Small clients are never pushed into Sentinel |
| F-44 | Alert Center | M18 (design) | — | — | 🔲 | **MERGE into F-42** | Sentinel's alert face: one feed + an email digest |
| F-45 | Trust Center + Compliance Badge | M17 + M22 (designs) | — | — | 🔲 | **MERGE into one, PARK** | Sentinel's public face. Wording must say "evidence posture as of [date]", never "compliant" or "certified". Build after Sentinel has run for some months |
| F-46 | Law and rule change watch | M18 "rule update" alert | — | — | 🔲 | **NEW** (part of F-42) | AnixAI publishes a change once; affected clients get a task and the relevant questions are re-asked (delta reassessment, F-19) |
| F-47 | One-click evidence pack | M31 Slice C | Evidence pack report (Slice 9) | s.8(1), s.28 (inquiry) | 🟡 | **MERGE** | The existing report gains the ledger's verification and a "for the Board / for an inquiry" cover |

#### G. Reach and growth

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-48 | **Industry landing pages** | One landing page + lead form + Calendly | — | — | 🔲 | **NEW** | As in 1.10 |
| F-49 | Free scanner and health check | Health check built (M10); scanner designed | — | — | — | **DROP** | Aniket, 28 Oct 2026 |
| F-50 | DigiLocker / Aadhaar verification | M16 (design, via Leegality) | — | R.10 (virtual token, e.g. DigiLocker) | 🔲 | **PARK** | Trigger: an edtech, children's or health client. Use DigiLocker tokens as R.10 describes, never store Aadhaar numbers |
| F-51 | WhatsApp consent | M15 (design) | — | s.6 | 🔲 | **PARK** | Trigger: a BFSI or retail client that runs consent over WhatsApp; it needs a WhatsApp Business provider |
| F-52 | Re-consent campaign | M19 (design) | Consent versions exist | s.6, R.3 | 🔲 | **PARK** | Needs messaging (email/WhatsApp) first; a Sentinel check flags who consented to an old version |
| F-53 | Consent signal propagation | M27 (design) | — | s.6(6) (stop processing on withdrawal) | 🔲 | **PARK** | Comes with the API (F-55) |
| F-54 | Connectors and integrations (ERP, LMS, HRMS, SharePoint, ticketing, SIEM; DSR auto-fulfilment) | M24 (design) | — (PRD E11) | — | 🔲 | **PARK** | Start with what clients ask for, after the API exists |
| F-55 | Public API + webhooks | M25 (design) | Internal `/api/v1` only | — | 🔲 | **PARK** | Prerequisite for F-53, F-54 and some client-hosted setups |
| F-56 | Automated data discovery | M29 (design) | — | s.8(1) | 🔲 | **PARK** | A large build; partner with a discovery tool rather than build |
| F-57 | ISO 27701 / other framework mapping | M28 (design) | — | — | 🔲 | **PARK** | An add-on for enterprises that also need ISO or RBI mappings |
| F-58 | Privacy-as-Code SDK | M30 (design) | — | — | — | **DROP** | Our buyers are DPOs, legal and leadership, not developers |
| F-59 | Sector overlays (RBI, SEBI, IRDAI, ABDM, UGC…) | M20 Sector Packs (design) | 10 industry question packs | Sector laws alongside DPDP | 🟡 | **MERGE** | Becomes the "regulator overlay" inside each industry pack (Step 5) |

#### H. AnixAI side and services

| ID | Capability | Old app | New app | Basis | Status | Decision | What changes |
|---|---|---|---|---|---|---|---|
| F-60 | **Engagement workspace** (consultant view of the service ladder: briefing → assessment → sprint → retainer; monthly cadence; advisory notes) | M23 DPO-as-a-Service (design) | Consultant role only | — | 🔲 | **NEW** | Merges M23. Lets Anix run more clients per consultant, which is what the proposal's retainer prices depend on |
| F-61 | **Dynamic feature tracker** (internal) | Tracker dashboard (manual JSON) | — | — | 🔲 | **NEW** — *build next, after Step 2* | As in 1.9. The old tracker is retired |
| F-62 | Industry pack approval and publishing | — | Slice 14 (D-040) | — | 🔲 | **NEW** (part of F-08) | Planned |
| F-63 | Partner console (CA and law-firm channel) | M33 (design) | — | — | 🔲 | **PARK** | After Slice 14's console exists; reuse it |
| F-64 | Support copilot | M32 (design) | — | — | 🔲 | **PARK** | Trigger: more clients than one person can support |
| F-65 | Training and certificates (Academy) | M21 (design) | — | s.8(5) (organisational measures) | 🔲 | **PARK** | A small "training record as evidence" field comes first; a full Academy later |
| F-66 | Lead capture and booking | Landing form + Calendly | — | s.5, s.6 (our own notice and consent) | 🔲 | **MERGE into F-48** | — |

### 2.3 Totals

| Decision | Count | Rows |
|---|---:|---|
| KEEP | 15 | F-01, 02, 03, 11, 12, 13, 14, 17, 24, 25 (with a legal fix), 26, 27, 30, 33, 36 |
| MERGE | 18 | F-06, 07, 09, 21, 22, 23, 29, 31, 34, 35, 37, 38, 40, 44, 45, 47, 59, 66 |
| NEW | 17 | F-04, 05, 08, 10, 15, 18, 19, 28, 32, 39, 42, 43, 46, 48, 60, 61, 62 |
| PARK | 13 | F-16, 20, 50–57, 63, 64, 65 |
| DROP | 3 | F-41 public chatbot, F-49 scanner + health check, F-58 privacy-as-code (plus the old app's code itself) |
| **Total** | **66** | |

#### 2.3.1 What the old app gives the one platform

These are **ideas** to rebuild in the new app's code, not code to copy:

1. Consent widget languages: 19 + right-to-left (F-07)
2. Consent preference centre + consent and withdrawal statistics (F-23)
3. Notice staleness alert after 12 months (F-22 → Sentinel)
4. ROPA industry starter templates (F-21 → industry packs)
5. Vendor library + contract-expiry alerts + DPA clause drafting (F-29)
6. Compliance calendar (F-35)
7. Secure board share link (F-38)
8. Escalation-runner design: idempotent, one alert per event (F-18)
9. The whole Sentinel M31 design (F-42–F-47)
10. Billing gateway design, if a small-business tier is chosen (F-09)

#### 2.3.2 What is dropped, and why

- **The old app's code**: frozen (D-002), retired in Slice 13.
- **The 30-day rights SLA and the single breach clock**: wrong under R.14 and R.7.
- **Direct AI writing without guardrails**: replaced by the gateway.
- **The public chatbot, scanner and health check**: Aniket's decision for the last two; legal-advice risk and cost for the chatbot.
- **Privacy-as-Code**: wrong buyer.

### 2.4 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | **Billing.** Licence only, or also self-serve subscriptions for small clients? | **Licence only for now** (D-040). Add self-serve billing only when a small-business tier is on the price list; Step 6 can place it |
| Q2 | **The legal fix in F-25** (the access answer to list who the data was shared with, s.11(1)(b)). Fix it now as a small change, or inside Slice 12? | **Fix it now**, as a small separate change. The public page already promises it |
| Q3 | **Public chatbot.** Drop it with the scanner and health check? | **Drop.** The landing pages carry an FAQ with citations instead |
| Q4 | **Brand names.** Keep three names: **TrustStack™** (the platform), **DPDP Compass™** (the assessment and score), **Sentinel™** (continuous assurance)? | **Yes.** They match the deck, the proposal and the logos already made |

#### Aniket's answers (28 Oct 2026)

| # | Answer | What it changes |
|---|---|---|
| Q1 | **We need both:** hosting in the client's own environment or cloud, **and** a small-business tier. **Priority now: licence only.** | F-09 stays a licence (Slice 14) first. F-10 (client-hosted) and a **small-business tier with self-serve billing (F-68)** are both confirmed; Step 6 orders them |
| Q2 | **Yes, fix it now.** | Built, approved and merged as `ced5cda` (PR #44, D-139/D-140) (2.5) |
| Q3 | **Keep the chatbot.** Also: **let each client tick the features they want; save it per client; charge the licence on what is ticked; changeable at any time; or all features for a fixed fee.** | F-41 changes from DROP to **MERGE** (2.6). New row **F-67 Feature selection and module licensing** (2.6) |
| Q4 | **Agreed:** TrustStack™ (platform) · DPDP Compass™ (assessment) · Sentinel™ (continuous assurance). | Used from here on |

### 2.5 The s.11(1)(b) fix (Q2)

**What the law says** (Act s.11(1)(b), checked in the Gazette text): an access
reply gives "the identities of all other Data Fiduciaries and Data Processors
with whom the personal data has been shared … along with a description of the
personal data so shared". **s.11(2)** excludes sharing with an authority
allowed by law that asked in writing to prevent, detect or investigate
offences or cyber incidents, or to prosecute or punish them.

**What was built:**
- On every **access** request, a panel: "Who the person's data was shared with".
- It is compiled from the processing register: each record's linked
  processors (with the register's own label, Data Processor or another Data
  Fiduciary) and each record's "Who it is shared with" text, together with the
  kinds of data.
- It is a paged, searchable table, with a "Copy the list for the reply" button.
- Records whose basis is another s.7 use or an exemption are left out, because
  s.11 doesn't reach them, and the panel says how many were left out.
- Records with no basis decided yet are kept in, and marked.
- **No database change.** It is read-only, with nothing about the requester.
  It is tested for cross-tenant access, so an Org B user cannot reach it.

**One finding from the seed data:** Mumbai University's records name internal
teams ("departments, exam section") in "Who it is shared with". These are not
"other Data Fiduciaries". The panel flags text-only entries for a person to
check, and the walk-through suggests a ROPA hint to keep internal teams out of
that field.

### 2.6 Per-client feature selection and the chatbot (Q3) — my views

**Feature selection (F-67): a strong idea.** It makes the platform simpler for each client and easier to sell at different price points. My recommendations:

1. **Two ways to buy:**
   - **"Everything"** for a fixed licence fee. This is the default and the easiest to sell.
   - **"Choose your modules"**: the client ticks modules on one visual screen and sees the licence fee change as they tick.
2. **A small core is always on.** These are the spine; without them, nothing else means anything:
   - organisation and scope
   - the DPDP Compass assessment and score
   - evidence
   - gaps and actions
   - the ROPA register
   - the dashboard
   - the core reports
   - users and the audit trail
3. **Everything else can be ticked:**
   - the six workflow registers (breach, rights and grievance, notice and consent, processors, retention, AI risk)
   - the AI assistant and the chatbot
   - Sentinel
   - multi-entity
   - extra languages
   - Word/PPT exports
   - later, the parked modules (WhatsApp, DigiLocker, connectors, API)
4. **The law is never switched off.** Unticking a module removes a tool, not a
   duty. The assessment still asks about breaches, rights and notices. If a
   client unticks, for example, Rights and grievance, the screen says plainly
   that every Data Fiduciary must still answer requests and grievances (s.11–13,
   R.14), and asks the client to confirm how they will do it. That confirmation
   is recorded. This keeps us credible and protects AnixAI.
5. **Changes at any time:**
   - Switching a module **on** works at once.
   - Switching it **off** takes effect at the end of the licence period; the fee changes pro rata, per the contract.
   - Data in a switched-off module is **kept read-only, never deleted**. The registers are the client's evidence, and erasure follows their own retention rules (s.8(7)). Switching back on restores everything.
6. **Who changes it:**
   - The client's Organisation Admin makes the choice.
   - AnixAI's console (Slice 14) confirms it and issues the updated licence.
   - For the small-business tier, the change is self-serve and billed automatically (F-68).
   - Every change is audited.
7. **How it is enforced:**
   - Server-side, in the same guard that checks permissions today; the menu simply hides unticked modules.
   - For client-hosted installs, the module list is part of the **signed offline licence file** (Slice 15), so it works without calling home.
8. **Where it goes:** this is the "what a licence grants" part of Slice 14, so
   it is designed and built there. Step 6 places it.

**The chatbot (F-41): keep it, rebuilt safely.** My recommendation:
- **Build it on the existing guarded AI gateway, not the old direct calls.** It:
  - answers from the Act and Rules with citations
  - shows a clear "general information, not legal advice" line
  - collects no personal data and keeps no chat history beyond a short session
  - has a rate limit and a monthly cost cap
- **Two uses from one build:**
  - (a) on AnixAI's industry landing pages, to answer visitors' DPDP questions
  - (b) an optional module a client can tick, to put it on their own public page (`/p/[slug]`) for their customers
- It is **off by default** for clients.

**New rows in the map:**

| ID | Capability | Old app | New app | Basis | Status | Decision |
|---|---|---|---|---|---|---|
| F-41 | Public chatbot (revised) | M10 TrustChat | In-app assistant only | — | 🔲 | **MERGE** — rebuilt on the guarded gateway; landing pages + optional client module (was DROP) |
| F-67 | **Feature selection and module licensing** | M12 feature gate (per plan) | — | — | 🔲 | **NEW** — part of Slice 14 |
| F-68 | **Small-business tier with self-serve billing** | M12 + M13 (Razorpay, pay-as-you-go) | — | — | 🔲 | **NEW** — after licence; reuses the old gateway's design |

**Revised totals:** KEEP 15 · MERGE 19 · NEW 19 · PARK 13 · DROP 2 · **68 rows**.

**Approved:** "approved Step 2, including 2.6" (Aniket, 28 Oct 2026).

### 2.7 The dynamic tracker (F-61), built after approval

- **Source:** `docs/reference/feature_register.json`, one row per feature (all 68), with the files that prove each built row.
- **Check:** `python3 tools/feature_tracker.py` looks every named file up on `origin/main` and flags any row the code doesn't back.
- **Live page:** https://claude.ai/artifact/PZeYB4vxU8RRUSnYoB1YSq — totals, progress by family, decisions, the rows that disagree with the code, and a searchable table of every feature.
- **Kept current:** a new step in the handover check (PLAYBOOK §6.5) after every slice or fix.
- **First run (28 Oct 2026, `origin/main` @ `e41dde2`):** built 23 · partly built 7 · not built 36 · dropped 2. **One warning:** F-61's own files are not on `main` until this branch's PR (#43) is merged. After approval: build the dynamic tracker
(F-61) from this map, then start Step 3 (Sentinel design).

---

## Step 3 — Sentinel™ design: continuous compliance assurance

**Inputs read (28 Oct 2026):**
- **The old app's Sentinel design:** `P4_M31_Sentinel_Engine.md` and competitive-analysis files 20–25 (control library, applicability framework, master map).
- **The deck and proposal**, which sell Sentinel as "continuous assurance, drift alerts, evidence-on-demand and board visibility".
- **The new app's data model** (`origin/main`).
- **The Gazette text:** Act s.4–17 and the Schedule; Rules 3–15, read with `pdftotext`.

**Corrections to the old design.** The old map cites several Rules wrongly. Checked against the Gazette:

| Duty | Correct Rule |
|---|---|
| Rights | **R.14** (not R.13) |
| SDF duties | **R.13** (not R.12) |
| Cross-border | **R.15** (not R.17) |
| Contact information | **R.9** |
| Grievance period | **R.14(3)** |
| Child-processing exemptions | **R.12** + Fourth Schedule |
| One-year logs | **R.6(1)(e)** and **R.8(3)** |

Every row below uses the Gazette numbers.

### 3.1 Sentinel in one line

**Sentinel watches your DPDP duties every day, using the facts already in your
registers, and tells you, with proof, the moment one slips.**

- The **DPDP Compass™** score says how ready you are; it is a point-in-time assessment.
- The **Exposure Command Centre** says what a slip could cost (₹, against the Schedule).
- **Sentinel** says what is slipping *today*, and keeps tamper-evident proof of every day it was fine.

**It never says "compliant" or "certified".** It says: "posture as of [date]:
N duties met, N need attention", backed by the ledger.

### 3.2 How it works — five parts

```
 REGISTERS (facts the client already keeps)          TIME (dates and clocks)
 ROPA · notices · consent · rights · breaches ·      respond-by · Rule 7 clocks ·
 processors · retention · AI systems · evidence ·    review dates · inform-by dates
 actions · organisation (contact, SDF status)
                      │                                         │
                      └──────────────┬──────────────────────────┘
                                     ▼
 1. CONTROLS ── one rule per DPDP duty, mechanical: Pass · Needs attention · Failing · Not applicable
                                     │      (AI never sets a status; it only explains and drafts)
                                     ▼
 2. RUNNER ──── every day at 06:00 IST, and at once when a register changes (Slice 13 job runner)
                                     │
                                     ▼
 3. LEDGER ──── one append-only row per result, each chained to the one before (SHA-256),
                with the evidence it relied on → anyone can verify nothing was changed later
                                     │
                                     ▼
 4. SURFACES ── Sentinel page · alerts + email digest · actions on the one actions list ·
                overview tile · Board pulse in the Exposure Brief · ledger-verified evidence pack ·
                the Assistant's "where do we stand?" · (later) Trust Center · AnixAI console
                                     │
                                     ▼
 5. APPLICABILITY ── decides how much of this each client needs (3.5), so small clients are never overloaded
```

**Statuses, in plain words:**
- **Pass:** the duty is met on today's facts.
- **Needs attention:** heading the wrong way; fix it soon. An unknown fact counts here, because unknown behaves as risk (D-026).
- **Failing:** the duty is not being met now. An action is opened on the one actions list (D-067).
- **Not applicable:** the duty doesn't apply to this client. It is recorded with the reason, for example "no children's data in the register".

### 3.3 The control library — v1 (23 controls)

"Data today" says whether the new app already holds the facts each test
needs: ✅ yes · 🟡 partly · ❌ needs a build. Penalty rows are the Act's
Schedule (s.33). Each one is a maximum, never a prediction (D-011).

| Code | The duty, in plain words | Provision | The test (mechanical) | Needs attention / Failing | Penalty row | Data today |
|---|---|---|---|---|---|---|
| **CONTACT-01** | People can find who answers their questions | s.8(9), R.9 | Organisation's public contact is set and its public page is live | — / no contact published | 7 (≤ ₹50 cr) | ✅ `organizations.public_contact_*`, `/p/[slug]` |
| **NOTICE-01** | A notice is published and current | s.5, R.3 | A published notice exists; it names every consent-based purpose in the ROPA; reviewed in the last 12 months* | Purpose missing or > 12 months* / none published | 7 | ✅ `privacy_notices`, ROPA |
| **NOTICE-02** | Notices in the languages you collect in | s.5(3) | A published notice per language the consent banner offers | Language missing / — | 7 | ✅ `consent_configs.languages`, notices |
| **BASIS-01** | Every processing activity has a lawful ground | s.4, s.6, s.7 | No live ROPA record left without a basis decided | Undecided > 30 days* / — | 7 | ✅ `ropa_records.lawful_basis` |
| **CONSENT-01** | Consent is actually collected where you rely on it | s.6 | Each consent-based record's purpose is in a published consent banner | Purpose not offered / no banner while consent is relied on | 7 | ✅ consent configs, ROPA |
| **CONSENT-02** | Withdrawal is as easy as giving | s.6(4), (6) | Published banner carries the withdrawal means; withdrawals are recorded | — / no withdrawal means | 7 | 🟡 records ✅; that systems actually stopped is outside TrustStack (connectors, F-53) |
| **RIGHTS-01** | Requests and grievances answered in time | s.11–14, R.14(3) | No open request past its respond-by date | Past TrustStack's 30-day target / past 90 days | 7 | ✅ `rights_requests` |
| **RIGHTS-02** | Access replies list who data was shared with | s.11(1)(b) | Every consent-based record that shares data names its recipients (D-139) | Recipients only in free text / — | 7 | ✅ ROPA + processor links |
| **BREACH-01** | Breach clocks kept | s.8(6), R.7 | For each open breach: people told without delay; Board told; the 72-hour report filed or extended | Clock running out (< 12 h) / clock passed | **2 (≤ ₹200 cr)** | ✅ `breach_incidents` (Rule 7 fields) |
| **SECURITY-01** | The seven R.6 safeguards in place | s.8(5), R.6(1)(a)–(g) | Every high-risk ROPA record confirms all seven, with evidence | Confirmed without evidence / a safeguard missing on a high-risk record | **1 (≤ ₹250 cr)** | ✅ `ropa_records.safeguards`, evidence |
| **LOGS-01** | Logs kept one year | R.6(1)(e), R.8(3) | The logging safeguard is confirmed and retention ≥ 1 year is recorded | Not recorded / — | 1 | 🟡 safeguard ✅; the period is not a field yet |
| **RETENTION-01** | Data erased when its purpose ends | s.8(7), R.8(1), Third Schedule | Every live record has a retention schedule; no schedule is past its end without an erasure recorded | No schedule / past end, nothing erased | 7 | ✅ `retention_schedules`, erasures |
| **RETENTION-02** | 48-hour notice before erasure | R.8(2) | No schedule past its inform-by date without the notice recorded | Inform-by in < 7 days / passed | 7 | 🟡 `inform_by` ✅; "notice sent" is not a field yet |
| **VENDOR-01** | Every processor under contract, with DPDP clauses | s.8(2), R.6(1)(f) | No processor linked to a record without a contract and clauses | Clauses unknown / no contract | 1 / 7 | ✅ `vendors`, `ropa.vendor_contract_gaps` |
| **VENDOR-02** | Processors reviewed | s.8(2) | Contract review date not passed; questionnaire reviewed in 12 months* | Due in < 30 days / passed | 7 | ✅ `contract_review_by`, `vendor_assessments` |
| **CHILD-01** | Children's data handled lawfully | s.9, R.10, R.12 | Every record with children's data has verifiable parental consent or an R.12 exemption; no tracking or targeted ads | Unknown / missing consent or tracking present | **3 (≤ ₹200 cr)** | ✅ ROPA child fields, `ai_systems.child_tracking` |
| **GUARDIAN-01** | Guardian consent for persons with disability | s.9(1), R.11 | Guardian consents carry the R.11 verification | Verification unrecorded / — | 3 | ✅ `consent_records.principal_kind`, `verification_method` |
| **XBORDER-01** | Transfers abroad known | s.16, R.15 | Every record or processor that sends data abroad is identified; none to a destination the Government restricts | Unknown / transfer to a restricted destination | 7 | ✅ ROPA + vendor `cross_border`; the restricted list is empty until notified |
| **SDF-01** | SDF duties met (only if notified) | s.10, R.13 | Within 12 months of notification: DPIA and audit done, report to the Board, algorithmic due diligence | Due in < 60 days / overdue | **4 (≤ ₹150 cr)** | 🟡 `sdf_notified_on` ✅; DPIA workflow ❌ (F-32) |
| **AI-01** | AI on personal data reviewed | s.8(1); R.13(3) for SDFs | Every AI system on personal data reviewed in 12 months* with human review set | Due / overdue or no human review | 7 (4 for SDFs) | ✅ `ai_systems.last_reviewed_on` |
| **EXEMPT-01** | Exemptions you rely on are documented | s.17 | A record claiming an exemption carries its reason and evidence | No evidence / — | 7 | ✅ ROPA basis + evidence |
| **EVIDENCE-01** | Proof is still fresh | s.8(1) (accountability) | No accepted evidence past its expiry | Expiring in < 30 days / expired | — | ❌ evidence expiry (Slice 13) |
| **REVIEW-01** | Readiness re-checked | s.8(1); R.13(1) for SDFs | A finalised assessment in the last 12 months*, and none of its triggers (new processor, AI system, breach, scope change) since | Trigger since / > 12 months* | — | ❌ reassessment (Slice 12) |

\* **TrustStack defaults, not the law.** Each client can change them, and
counsel reviews them (Q4 in 3.10). Everything else is the statute's own test.

**Compared with the old design:** all 17 old controls are kept. ACCURACY-01 is
folded into RIGHTS-01, because correction requests are its evidence. Seven are
new: CONTACT-01, RIGHTS-02, LOGS-01, RETENTION-02, AI-01, EVIDENCE-01 and
REVIEW-01. A later **RULECHANGE-01** (F-46) flags a law change the client
hasn't reviewed.

**Coverage today:** **17 of 23** controls run on data the app already holds
(✅). Four need a small field or the Slice 13 runner (🟡). Two need Slice 12 or
13 (❌).

### 3.4 One number or none? — no new score

Clients already see **two** headline figures: the DPDP Compass™ score
(readiness) and the exposure (₹). A third score would confuse them. Sentinel
therefore shows **counts and a status line**, such as "Today: 19 duties met, 3
need attention, 1 failing — the breach clock for BRH-2026-004 has passed". It
also feeds its findings into the **existing** exposure model, as facts the
model already reads. *(Q1)*

### 3.5 Applicability — how much Sentinel each client gets

The rule from the old design stands: **continuous monitoring is worth it when
compliance changes often and drifting is costly.** Nobody is pushed into it.

**Signals.** These come from data the new app already holds, so there are no new questions:

| Signal | Source in the new app |
|---|---|
| Children's data | ROPA `children_data = yes`; scope risk tags |
| SDF notified, or a Third Schedule class | `organizations.sdf_notified_on`, `third_schedule_class` |
| Sensitive sector (BFSI, health, edtech, public sector) | `organizations.industry_code` |
| Large volume | `data_principal_count_estimate` |
| AI on personal data | `ai_systems` |
| Cross-border | ROPA / vendor `cross_border` |
| Many processors | count of linked processors |
| A breach in the last 24 months | `breach_incidents` |
| Group with units | `parent_organization_id` (exists, D-040 era) |

**Tiers.** The result is computed mechanically, and the reasons are shown as "because you…":

| Tier | Who | What runs |
|---|---|---|
| **Essentials** — every client, included in the core | Everyone, because these are legal clocks that can hurt any fiduciary | **CONTACT-01, RIGHTS-01, BREACH-01, RETENTION-01, VENDOR-01, NOTICE-01**: on-page status and alerts |
| **Sentinel Lite** | Low signal: a small manufacturer, professional services | Essentials + the 2–4 controls their signals point to |
| **Sentinel** (recommended) | Medium signal: e-commerce, SaaS, mid-size anything | All applicable controls, daily runs, ledger, email digest, Board pulse |
| **Sentinel Critical** | High signal: children's data, SDF, BFSI, health, large volume | Everything, plus the ledger-verified evidence pack on demand and AnixAI console monitoring (managed assurance) |

**Examples:**
- **Mumbai University:** children's data possible, public sector, many processors, AI proctoring → *Critical*.
- **A 30-person retail shop:** → *Essentials*, with an honest note: "point-in-time is enough for you."

*(Q2)*

### 3.6 How it runs — and stays self-hostable

- **Runner:** Slice 13's job runner (a worker plus Postgres). It runs daily at 06:00 IST, plus **on change**: a register write enqueues the controls that read it. No Vercel-only cron and no external service, so it works in client-hosted installs (Slice 15).
- **Idempotent:** a control writes a ledger row only when its result **changes**, plus one daily "still passing" heartbeat per control. That keeps the ledger small and the proof continuous.
- **Alerts** come from changes in status, never from a run alone:
  - **Failing:** immediate in-app alert, an email to the DPDP owner, and an action on the one actions list.
  - **Needs attention:** in the daily digest.
  - **Back to Pass:** the alert and the action resolve automatically.
- **Email** goes through Slice 13's configurable sender (SMTP for client-hosted installs).

### 3.7 The ledger — proof nobody can quietly edit

- **One append-only table** (tenant table, RLS, no UPDATE or DELETE grant to anyone, D-019). Each row holds: control, status, the facts read (ids, not personal data), the evidence ids with their SHA-256, the time, the rule version, and `hash = SHA-256(previous hash + this row)`.
- **A `verify` function** walks the chain; the evidence pack prints the first and last hash and the verification result.
- **Never personal data:** codes and counts only (a breach code, not the person). This fits D-069 and the data-minimisation stance.
- **Retention:** kept for the licence period plus the client's retention rule (s.8(7)). It is exported on exit, which the licence terms cover (Slice 14).

### 3.8 What each person sees

| Who | Where | What |
|---|---|---|
| DPDP owner, admin | **Sentinel** page | One status line; failing, then needs attention, then passing; each with what to do, a link to fix it, the provision and the penalty row; a history per control |
| Action owners | The one **Actions** list | Failing controls become actions with source "Sentinel" |
| Executive sponsor, Board | Overview tile + **Exposure Brief** | "Posture as of [date]", with the trend over 30/90 days |
| Auditor, regulator inquiry (s.28) | **Evidence pack** (existing report, extended) | Posture + ledger verification + the evidence index |
| Anyone with the Assistant on | "Where do we stand?" | A drafted answer from the posture, with citations; the AI sets nothing |
| AnixAI consultant | **Console** (Slice 14) | Which clients are drifting, across all clients; drives the managed-assurance retainer |
| The client's customers (later, F-45) | **Trust Center** | "Evidence posture as of [date]"; never "compliant" |

### 3.9 Build stages — after Slices 12 and 13

| Stage | Ships | Needs | Size |
|---|---|---|---|
| **S1 Applicability** | The tier card on the overview, with "because you…"; a pure function in core | Data already held | Small; could ride in Slice 12 |
| **S2 Controls + ledger + Sentinel page** | The 17 ✅ controls, run on demand ("Check now") and on register change; the ledger with `verify` | No scheduler needed | Medium |
| **S3 Always-on** | Daily runs, alerts, email digest, actions from failing controls; EVIDENCE-01, LOGS-01, RETENTION-02 | Slice 13 (runner, email, evidence expiry, two small fields) | Medium |
| **S4 Board and proof** | Overview tile, Exposure Brief pulse, ledger-verified evidence pack, the Assistant's "where do we stand?" | S2–S3; Slice 11 gateway | Small–medium |
| **S5 Watch the law** | RULECHANGE-01: AnixAI publishes a change once; affected clients get a task; REVIEW-01 triggers a delta reassessment | Slice 12 + the console (Slice 14) | Medium |
| **S6 Trust Center** (F-45) | The public posture page | Months of S3 running | Later |

**Where it fits overall:** Step 6 will set the final order. My recommendation
is Slice 12 → Slice 13 → **Sentinel S1–S3 as one slice** → Slice 14 (console
and licensing, which shows Sentinel across clients and sells it as a module,
F-67) → S4–S5.

### 3.10 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | A separate "Sentinel score"? | **No.** Status counts and one status line; findings feed the existing exposure model (3.4) |
| Q2 | Essentials for every client, inside the core licence? | **Yes:** the six legal-clock controls for everyone; Lite, Sentinel and Critical sold as a module (F-67) |
| Q3 | Tier names: Essentials · Lite · Sentinel · Critical? | **Yes** (they match the old design and the deck) |
| Q4 | TrustStack defaults (marked *): notice review 12 months, basis undecided 30 days, processor and AI review 12 months, assessment 12 months; each changeable per client | **Confirm**; counsel reviews the wording |
| Q5 | Alerts: Failing = immediate email + action; Needs attention = daily digest; back to Pass = auto-resolve | **Confirm** |
| Q6 | Build order: Sentinel S1–S3 as one slice right after Slice 13 | **Confirm** (Step 6 finalises) |

**Also found while checking the data:** `organizations.parent_organization_id`
already exists and the organisation API returns it. **F-05 Multi-entity** is
therefore *partly built* (data model only, no group roll-up); the register is
updated.

#### Aniket's decisions (28 Oct 2026): "go with your recommendations"

| # | Decided | What it means for the build |
|---|---|---|
| Q1 | **No separate Sentinel score** | A status line and counts ("19 met, 3 need attention, 1 failing"); findings feed the existing exposure model |
| Q2 | **Essentials in the core licence** for every client | The six legal-clock controls (CONTACT-01, RIGHTS-01, BREACH-01, RETENTION-01, VENDOR-01, NOTICE-01) are always on; Lite, Sentinel and Critical are a module under feature selection (F-67) |
| Q3 | **Tier names: Essentials · Lite · Sentinel · Critical** | "Sentinel Plus" is noted as a softer alternative for the top tier if a buyer reacts to "Critical" |
| Q4 | **Defaults confirmed:** notice review 12 months, basis decided within 30 days, processor and AI review 12 months, assessment 12 months | Every screen labels them "TrustStack's default, not a legal deadline"; each client can change them (audited); counsel reviews the wording before launch |
| Q5 | **Alerts:** Failing → immediate email + an action; Needs attention → daily digest; back to Pass → closes automatically | **Failing emails for legal clocks (breach, rights, children) cannot be switched off**; users may choose a daily or weekly digest for the rest |
| Q6 | **Order A:** S1 (applicability card) rides in Slice 12 → Slice 13 → **Sentinel S2–S3 as one slice** → Slice 14 → S4–S5 | Step 6 sets dates. The Slice 12 prompt is **not changed yet**; S1 is added to it when Step 6 is approved |

**Step 3 approved, 28 Oct 2026.**

---

## Step 4 — Market research: where TrustStack can win

**Method (28 Oct 2026).**
- **Starting point:** the old app's competitive analysis (27 files, June–July 2026, about 45 players). It rested on data up to Aug 2025, so it was refreshed with web searches on 28 Oct 2026.
- **Caveat:** almost all of the sources are **vendor pages, vendor-written "top 10" lists and press releases**. Feature claims and prices are **unverified** until we see demos or quotes. Customer names come from the vendors' own announcements.

### 4.1 The market in six groups

| Group | Who (examples) | What they sell | Price signals (unverified) | What it means for us |
|---|---|---|---|---|
| **A. Consent-first India platforms** | **Consentin (Leegality)**: Union Bank of India, IIFL Finance · **Privy (IDfy)**: claims 50+ live deployments, ~500 m users, Axis Bank, HSBC, Airtel · Digital Anumati (launched 13 Jul 2026) · Consently (22 languages) · OneConsent · IndiaConsent · infrastructure players such as Protean, Perfios, Digio | Consent capture at scale, notices, withdrawal, cookies; several add retention, assessments, vendor risk and breach reporting; on-premises options. Several aim to **register as Consent Managers** when Rule 4 opens on **13 Nov 2026** | Free tiers; ₹9,999/month (Digital Anumati Growth); bank deals undisclosed | Banks are already buying here. **We should not fight on consent capture at bank scale**; we should connect to these platforms |
| **B. India DPDP suites** | **Redacto** (founded 2025, ₹12 cr seed; Privacy Engine, ConsentFlow, VendorShield, TrustCentre; SaaS, private cloud and on-premises; BFSI and health focus) · **GoTrust** (AI data discovery, 30+ connectors, DPO Copilot, on-premises) · Tsaaro · ComplyDP · Complynz · DPDP.ai · Consiva · Privacy Labs | All-in-one privacy operations: discovery, consent, rights requests, breach templates, vendor risk, a trust page, an AI copilot | Privacy Labs ₹49,990–₹2.5 L/yr; Complynz from ₹49,999/yr; ComplyDP ₹4 L one-time | **Our most direct competitors.** They lead with automation and discovery; none publicly shows evidence-capped scoring or a legal-duty control ledger |
| **C. GRC and continuous-monitoring tools** | **Sprinto** (India-founded; a DPDP framework page, "autonomous compliance operator", evidence pulled from integrations) · Scrut · Vanta and Drata (no DPDP-native content found) | Continuous control monitoring, mostly security controls (SOC 2 / ISO), with DPDP added as one more framework | Sprinto ~$6–20 k/yr (third-party) | They own the word "continuous". **Sentinel has to be clearly DPDP-native** (legal duties, clocks, Schedule penalties), not "SOC 2 with a DPDP label" |
| **D. Global privacy suites** | OneTrust · Securiti · TrustArc · BigID | Very broad, GDPR-shaped, strong discovery (Securiti, BigID) | OneTrust ₹20–80 L/yr; Securiti ₹15–75 L/yr (Indian guides); one module ~$25–50 k | Too costly and generic for most Indian buyers. We beat them on DPDP exactness, India focus and price |
| **E. Services firms** | Big-4 (teams of ~300–400 each on DPDP, per trade press) · law firms (Ikigai, others) · boutiques (Tsaaro, Arrka) · security firms (SISA, Seqrite) | Assessments, ROPA workshops, policies, sprints; **no platform of their own found** | Consulting day rates | They are **channel partners, not rivals**: they need a platform to deliver on (F-63 Partner console) |
| **F. Free scanners and checklists** | Many (CheckDPDP, Complynz scanner, Seqrite and Authbridge readiness quizzes) | A website scan or a quiz → a score → a sales lead | Free | Lead magnets. Confirms Aniket's call to skip a scanner (F-49) |

### 4.2 Table stakes — what every serious buyer now expects

Without these we don't make the shortlist. ✅ = TrustStack has it today.

| Expectation | TrustStack today |
|---|---|
| Notice + consent with withdrawal, in Indian languages | 🟡 built; 4 widget languages (F-07 brings more) |
| Rights requests and grievances with time limits | ✅ (Rules-correct, D-139) |
| Breach register with templates and clocks | ✅ (Rule 7, both clocks) |
| ROPA / data map | ✅ |
| Vendor / processor risk | ✅ |
| Dashboards and board reports | ✅ |
| An AI copilot | ✅ (guarded; off on the live site until A1) |
| On-premises / private-cloud option for banks and government | 🔲 Slice 15 — **competitors Redacto, GoTrust and Consentin already offer it** |
| Data discovery (scanning systems for personal data) | 🔲 parked (F-56) |
| Integrations / API | 🔲 parked (F-54, F-55) |

### 4.3 Where TrustStack is different — checked against what's built

| # | Differentiator | Built? | Why buyers care |
|---|---|---|---|
| 1 | **Evidence caps claims**: a "yes" without accepted proof can't score high | ✅ Slice 4 | Boards and regulators want proof, not self-assessment. **No competitor page we found describes this** |
| 2 | **Penalty exposure against the Act's Schedule, with a forecast to 13 May 2027** | ✅ Slice 9 | Turns DPDP into a board-level ₹ number and a deadline |
| 3 | **Legally exact clocks.** Rule 7's two clocks, Rule 14(3)'s 90 days, the s.11(1)(b) sharing list. Competitors still market a single "72-hour rule" | ✅ Slice 10 + D-139 | Credibility with counsel, banks and regulators |
| 4 | **1,429 industry questions in 10 sector packs**, chosen by scope triggers | ✅ Slice 3 | Specific to a university, a bank or a hospital, not a generic checklist |
| 5 | **Sentinel: DPDP duties as controls + a tamper-evident ledger** | 🔲 designed (Step 3) | "Continuous" that is DPDP-native and provable; Sprinto's is security-control-led |
| 6 | **Consultant-led + platform** (the managed-assurance ladder) | 🟡 consultant role ✅; engagement workspace F-60 | Big-4 have people but no platform; vendors have a platform but no people. **We are both** |
| 7 | **AI that only drafts, with citations checked and a reference set** | ✅ Slice 11 | A safe AI story for regulated buyers |
| 8 | **Price between the SME tools and OneTrust** | — | Mid-market and institutions are under-served |

### 4.4 Where we are behind — and what to do

| Gap | Who leads | Recommendation |
|---|---|---|
| Consent at bank scale (SDKs, millions of users, Consent Manager status) | Consentin, Privy | **Partner, don't compete.** Keep our widget for small and mid clients; **read consent from a registered Consent Manager** for large ones (an integration, F-54). Registering as a Consent Manager ourselves needs ₹2 cr net worth and strict conflict-of-interest rules (Rule 4, First Schedule); it isn't worth it now |
| Data discovery | GoTrust, Redacto, Securiti, BigID | **Partner** (F-56 stays parked); import discovery results into the ROPA |
| On-premises / private cloud | Redacto, GoTrust, Consentin | **Move Slice 15 up.** It's table stakes for banks and the public sector, and it's already your requirement |
| Trust page | Redacto (TrustCentre) | Sentinel S6 (F-45), backed by the ledger: stronger proof than a static page |
| Self-serve small-business tier | Privacy Labs, Digital Anumati, Complynz | **Later** (F-68). Don't race to ₹5,000/month; lead with value |
| Customer logos | Consentin and Privy (banks) | Mumbai University as the first production client; Step 7 covers the proof plan |

### 4.5 Where we choose to win — the proposed position

**One line:** *TrustStack is the DPDP assurance platform that proves it:
evidence-backed readiness, legally exact registers and continuous Sentinel
monitoring, delivered with AnixAI's experts, in your cloud or ours.*

| | Choice |
|---|---|
| **Who first** | Institutions and regulated mid-to-large organisations that must **prove** compliance to a board or regulator and lack a big in-house team: **universities and higher education** (MU), **NBFCs, co-operative and small-finance banks** (the banking go-to-market, Step 1 of that plan), **hospitals and health networks**, **public-sector bodies** |
| **How we sell** | Readiness assessment (DPDP Compass™) → 90-day sprint on the platform → licence + Sentinel → managed assurance (the proposal's ladder) |
| **Through whom** | Directly, plus **CA firms, law firms and Big-4 teams** as channel partners (F-63) |
| **What we don't do** | Compete on cheap cookie consent; build data discovery ourselves; register as a Consent Manager now |
| **The proof we lead with** | Evidence-capped score · ₹ exposure and 13 May 2027 forecast · Sentinel ledger · Rules-exact clocks |

### 4.6 Pricing signals for Step 6

| Market band | What buyers pay elsewhere (unverified) | Our proposal's band (Step 16 document) |
|---|---|---|
| Small business | ₹50 k – ₹3 L / yr (self-serve tools) | — (F-68 later) |
| Mid-size | ₹3 – 15 L / yr | Professional ₹8–15 L / yr |
| Enterprise | ₹15 – 80 L / yr (OneTrust, Securiti) | Enterprise ₹20–45 L; University / multi-entity ₹45–90 L |

**What this suggests:**
- The proposal's bands are **credible**: below the global suites and well above the cheap tools.
- They are only justified if Sentinel and the consultant layer are visible.
- Feature selection (F-67) lets a client start at Professional and add Sentinel later.

### 4.7 Timing

- **13 Nov 2026** (16 days away): Consent Manager registration opens (Rule 4). Expect a wave of consent-vendor marketing.
- **13 May 2027:** the main duties and penalties begin. Clients need about 5 months, so **Nov 2026 – Jan 2027 is the main buying window**.
- Most buyers are still early: trade press reports that most businesses are unprepared.

### 4.8 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Position TrustStack as **"the DPDP assurance platform that proves it"** for regulated institutions, not as a consent tool | **Yes** |
| Q2 | Consent strategy: our widget for small and mid clients; **integrate with registered Consent Managers** (e.g. Consentin, Privy) for large ones; **don't register** as a Consent Manager now | **Yes** |
| Q3 | Data discovery: **partner**, don't build (F-56 stays parked) | **Yes** |
| Q4 | **Move client-hosted deployment (Slice 15) earlier**, because banks and the public sector expect it and competitors offer it (Step 6 places it) | **Yes** |
| Q5 | First segments: universities, NBFCs and co-operative / small-finance banks, hospitals, public sector, plus CA and law-firm channel partners | **Yes** |

**Sources** (searched 28 Oct 2026; vendor-written unless marked):
- **Comparison lists and guides:**
  - [Seqrite — top DPDPA platforms 2026](https://www.seqrite.com/blog/top-dpdpa-compliance-platforms-india-2026/)
  - [dpdpactindia.in — consent tools](https://dpdpactindia.in/blog/best-dpdp-consent-management-tools/)
  - [ComplyDP — top 10 tools](https://www.complydp.com/articles/top-10-dpdp-compliance-tools-india-2026)
  - [Redacto — OneTrust alternatives](https://www.redacto.ai/en-in/blogs/onetrust-alternatives)
  - [itforsme — DPDP software](https://www.itforsme.in/best/dpdp-compliance-software-india)
  - [Digio — platform guide](https://www.digio.in/blog/dpdp-compliance-platform-complete-guide-for-indian-enterprises-2026/)
- **Prices:**
  - [Obtainer — OneTrust pricing](https://obtainer.ai/blog/onetrust-pricing)
  - [Privacy Labs pricing](https://theprivacylabs.com/pricing)
  - [ComplyDP pricing](https://www.complydp.com/pricing)
  - [Complynz — tools comparison](https://complynz.com/blog/best-dpdp-compliance-tools-software-india-2026)
  - [DEV — startup DPDP costs](https://dev.to/mr_manushukla/dpdp-compliance-costs-for-indian-startups-what-to-budget-before-13-may-2027-fi8)
- **Competitors:**
  - [Consentin (Leegality)](https://www.consent.in/)
  - [Union Bank selects Consentin (LatestLY)](https://www.latestly.com/agency-news/business-news-union-bank-of-india-selects-leegalitys-consentin-platform-for-dpdp-compliance-7515913.html)
  - [IDfy wins DPDP consent challenge (IDTechWire)](https://idtechwire.com/idfy-wins-indias-government-backed-dpdp-consent-challenge/)
  - [Redacto seed round (CIOL)](https://www.ciol.com/funding-acquistion-merger/redacto-raises-12-crore-to-build-indias-privacy-infrastructure-10607084)
  - [Redacto modules (Entrackr)](https://entrackr.com/snippets/redacto-raises-rs-12-cr-in-seed-round-led-by-peercapital-10606066)
  - [GoTrust DPO Copilot (CXOToday)](https://cxotoday.com/media-coverage/gotrust-launches-dpo-copilot-solution-to-simplify-dpdpa-and-global-privacy-compliance/)
  - [GoTrust data discovery (CXO Digital Pulse)](https://www.cxodigitalpulse.com/gotrust-enhances-data-discovery-smart-classification-with-ai-to-simplify-dpdpa-compliance-for-enterprises/)
  - [Sprinto DPDP](https://sprinto.com/frameworks/dpdp/)
  - [Digital Anumati and others (iqworks)](https://iqworks.ai/blog/consent-management-platforms)
  - [Consently 22 languages (OneConsent list)](https://oneconsent.ai/blog/top-consent-management-platforms-india-2026)
- **Consent Managers:**
  - [Consently — Nov 2026 deadline](https://www.consently.in/blog/november-2026-consent-manager-deadline-india)
  - [amlegals — Rule 4](https://amlegalsdpdpa.com/dpdpa-for-consent-managers)
  - The Rule 4 conditions (₹2 cr net worth etc.) were checked in the Gazette text (Rules, First Schedule Part A)
- **Services market:**
  - [Communications Today — Big-4 DPDP teams](https://www.communicationstoday.co.in/?p=424657)
  - [Business Standard — IT services and the DPDP Rules](https://www.business-standard.com/industry/news/indian-it-services-companies-may-see-minimal-impact-from-dpdp-rules-125111600477_1.html)

**Approved (Aniket, 28 Oct 2026):** "Step 4 approved with your recommendations on Q1–Q5":
the position *"the DPDP assurance platform that proves it"* for regulated institutions; our
widget for small and mid clients, **integration with registered Consent Managers** for large
ones, no registration of our own now; **partner** for data discovery; **client-hosted
deployment moves earlier** (Step 6); first segments are universities, NBFCs and co-operative /
small-finance banks, hospitals and the public sector, plus CA and law-firm channel partners.

---

## Step 5 — One platform for every industry: the core and the packs

**Inputs (28 Oct 2026):**
- `packages/core/src/{scope,packs,questions,triggers}.ts` on `origin/main`
- `docs/question_packs/` (10 industry files, 1,429 questions)
- D-013, D-029, D-031, D-040
- The Rules' **Third Schedule** (Rule 8) and **Fourth Schedule** (Rule 12), read in the Gazette text
- The ten industry marketing kits in `DPDP_revised/marketing material/`

### 5.1 The finding that matters most

**Today only the core pack and the University packs can be used.** The other
nine industry overlays are in the question bank as **draft**: BFSI, Healthcare,
EdTech, SaaS, Manufacturing, Retail / e-commerce, Professional services, Public
sector, General. The question generator refuses draft packs on purpose
(D-029.1), so no client is handed an unchecked 260-question assessment.

The six **cross-industry conditional packs** have **no questions written yet**:
children's data, vendors / processors, cloud and cross-border, AI, marketing
and tracking, SDF readiness.

**So a bank, NBFC or hospital, which Step 4 named as first targets, gets only
the 98 core questions today.** That is legally sound, but not the
industry-specific experience we sell. Packs are the main work standing between
"built for a university" and "built for every industry".

### 5.2 The model — five layers, one platform

Industry is **data, not code**. Everything an industry changes lives in a pack
file; the code is the same for every client.

```
 5. CLIENT SETTINGS     ticked modules (F-67) · TrustStack defaults (Step 3 Q4) · languages · units (multi-entity)
 4. INDUSTRY PACK       overlay questions · regulator references · ROPA starter records · words · Sentinel tier hints
 3. RISK PACKS          children · vendors · cloud and cross-border · AI · marketing and tracking · SDF readiness
                        (switched on by the client's scope answers, in ANY industry)
 2. LEGAL-CLASS SWITCH  set by the client's legal status under the Act and Rules, not by its industry label
 1. DPDP CORE           the law that applies to every Data Fiduciary: 98 questions on 16 domains, scoring,
                        registers, exposure, Sentinel controls, reports, AI, roles, audit
```

**Why layer 2 is separate from the industry label.** The Rules attach duties
to **legal classes**, not to sectors. A hospital, a school or an e-commerce
platform can sit under any label:

| Legal class | Source (Gazette) | What changes | In the app today |
|---|---|---|---|
| **Third Schedule class:** e-commerce ≥ 2 crore users · online gaming ≥ 50 lakh · social media ≥ 2 crore | R.8(1), Third Schedule | Erasure after 3 years of inactivity, with the 48-hour notice (R.8(2)) | ✅ `organizations.third_schedule_class` |
| **Fourth Schedule Part A class:** clinical / mental-health establishment or professional · allied health · educational institution · crèche / day care · child transport for these | R.12, Fourth Schedule Part A | Named exemptions from s.9(1) and s.9(3) for children's data, **only within the stated conditions** | ✅ ROPA `child_exemption` (per record) |
| **Fourth Schedule Part B purposes:** e.g. a duty under law, a s.7(b) benefit, an email account, real-time location for safety, age confirmation | R.12, Fourth Schedule Part B | Purpose-based exemptions, available to any industry | ✅ ROPA `child_exemption` |
| **Significant Data Fiduciary** (notified) | s.10, R.13 | Yearly DPIA and audit, a report to the Board, algorithmic due diligence, possible localisation | ✅ `sdf_notified_on` (never inferred, D-028) |
| **State / s.7(b) processing** | s.7(b), R.5, Second Schedule | Standards for benefits, subsidies and services | 🟡 ROPA basis `state_benefit`; no Second Schedule checklist yet |
| **Data Processor** (e.g. a SaaS vendor processing for others) | s.8(2) | Their clients' contracts drive their duties | 🟡 not a client-level flag |

### 5.3 What is core and what goes in a pack

| Capability | Core (same for all) | Pack (changes by industry) |
|---|---|---|
| Assessment | 98 questions, 16 domains, weights = 100, evidence caps, red flags, scoring | **Overlay questions** (~10–20, about one per domain), conditional pool, reference pool |
| Scope wizard | Questions, data principal types, systems, vendors, risk tags | **Default data principal types** (students / patients / customers / citizens) and typical systems (LMS / HIS / core banking / ERP) |
| ROPA | DPDP structure, completeness, risk floor | **10–20 starter records** for the sector (old app's templates, F-21) |
| Registers (rights, breach, consent, retention, processors, AI) | All rules and clocks | **Typical retention laws to check** (e.g. RBI KYC rules for banks; clinical-records rules for hospitals): references for counsel, **never applied automatically** |
| Exposure and reports | Model and Schedule | Sector words in report covers; examples |
| Sentinel | 23 controls, Essentials for everyone | **Tier hint** (e.g. BFSI and health start at Critical) and control emphasis |
| AI assistant | Gateway, guardrails, legal text | **Sector context** in the prompt (the pack's regulator references) |
| Regulators alongside DPDP | DPDP + CERT-In directions for everyone | **Sector overlay:** RBI / SEBI / IRDAI (BFSI) · clinical establishments, ABDM, ICMR (health) · UGC / AICTE (higher education) · state rules (public sector). These are labelled "also check — counsel to confirm" |
| Landing page (F-48) and marketing kit | Template | **The same pack file** supplies the industry page's content |

### 5.4 Where each pack stands

| Industry | Questions | Generator status | Marketing kit | Step 4 priority |
|---|---:|---|---|---|
| University / Higher education | 108 | ✅ **approved** (98 + 10 baseline, D-031) | ✅ | Live client (MU) |
| BFSI | 201 | draft | ✅ | **1** (NBFC, co-operative and small-finance banks) |
| Healthcare | 195 | draft | ✅ | **2** |
| Public sector | 121 | draft | ✅ | **3** |
| EdTech | 162 | draft | ✅ | 4 (children's data) |
| General organisation | 115 | draft | ✅ | 5 (the fallback for every other industry) |
| SaaS / Technology | 156 | draft (no priorities in the file) | ✅ | 6 |
| Retail / e-commerce | 128 | draft | ✅ | 7 (Third Schedule class) |
| Manufacturing | 121 | draft | ✅ | 8 |
| Professional services | 122 | draft | ✅ | 9 (also the channel partners' own firms) |

### 5.5 The pack factory — the same seven steps for every industry

Each new or upgraded pack goes through the same steps as the University pack (D-029):

1. **Overlap map against the core**: which questions duplicate core, which are unique, which are conditional (as `OVERLAP_UNIVERSITY_CORE.md`). *AI drafts the map; a person decides.*
2. **Baseline overlay**: about 10–20 questions, roughly one per domain; the rest go to the conditional or reference pools.
3. **Triggers mapped** to scope answers; an unmappable trigger shows as "Potentially applicable" (D-029.3).
4. **ROPA starter records**: 10–20 typical processing activities for the sector.
5. **Regulator references**: sector laws to check alongside DPDP, reviewed by **counsel**, never presented as DPDP duties.
6. **Seed tenant + tests**: one fictional client per industry (like MU and BML), tests that the generator picks exactly the approved questions, weights stay at 100.
7. **Aniket approves → published** from the console (F-62, Slice 14) as a new pack version. Finalised assessments never change (D-035).

**Effort:** the University pack took part of Slice 3. With the method now
proven, one pack is about **one stage (a few days)**, with counsel time for
step 5. The six cross-industry risk packs need **writing first**, from the
questions already in the ten files (most industries ask the same children,
vendor and AI questions).

### 5.6 New industries and groups

- **An industry without a pack** (telecom, logistics, hospitality, real estate, NGOs…) uses **General + the risk packs + the legal-class switches**. That already covers what the law asks. A sector pack adds depth later.
- **Groups with units in different industries** (a trust that runs a hospital and a college, a bank with an insurance arm) use **multi-entity (F-05)**: **each unit picks its own industry pack**, and the group sees a roll-up. This **refines D-040** ("one client, one tenant, one industry, one licence") to **one licence per organisation, one industry per unit**. D-040 is changed only when F-05 is built, with a decision entry.

### 5.7 Self-hosting and protection

Packs ship as **signed, versioned data bundles**. A client-hosted install
(Slice 15) receives only the packs its licence grants. The full bank stays
AnixAI's (the D-040 black box; D-071 enforces it in the database).

### 5.8 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Adopt the **five-layer model**, with legal-class switches kept separate from the industry label | **Yes** |
| Q2 | **Pack order:** BFSI → Healthcare → Public sector → EdTech → General → SaaS → Retail → Manufacturing → Professional services | **Yes** (matches Step 4's segments) |
| Q3 | **Write the six cross-industry risk packs first** (children, vendors, cloud and cross-border, AI, marketing, SDF readiness), because they apply in every industry | **Yes**, alongside BFSI |
| Q4 | Use the **seven-step pack factory**, with counsel reviewing every regulator reference | **Yes** |
| Q5 | **One industry per unit** under one organisation's licence (refines D-040 when F-05 is built) | **Yes** |
| Q6 | **One industry pack file** feeds the product, the industry landing page and the marketing kit | **Yes** |

**Approved (Aniket, 28 Oct 2026):** "Step 5 approved with your recommendations on Q1–Q6":
the five-layer model; pack order BFSI → Healthcare → Public sector → EdTech → General → SaaS →
Retail → Manufacturing → Professional services; the six risk packs written first, alongside BFSI;
the seven-step pack factory with counsel review; one industry per unit (refines D-040 when F-05
is built); one pack file feeds the product, the landing page and the marketing kit.

---

## Step 6 — The build sequence

**Built from every decision so far:**
- **Step 2:** the 68-row map; licence first; feature selection; the chatbot kept.
- **Step 3:** Sentinel build order.
- **Step 4:** position; Consent Manager integration; partners for discovery; client-hosted earlier; first segments.
- **Step 5:** packs first for BFSI and health; the pack factory.

**The rules applied, in order:**
1. **Dependencies first.**
2. **The legal clock:** most duties commence **13 May 2027**; clients need ~5 months, so the **buying window is Nov 2026 – Jan 2027**.
3. **Revenue:** each phase lets AnixAI sell something new.
4. **Every slice self-hostable** (Slice 15 rule).
5. **Every new screen passes the simplicity rubric.**

**Pace used for the dates.** Medium slices took 2–4 days and large ones about a
week (Slices 6–11 shipped 2–22 Oct 2026). Dates below are **targets**: each
slice still stops for your approval, and your review time, counsel and contract
work set the real pace.

### 6.1 The sequence at a glance

```
 NOW ──── Phase A: sell and launch (Nov–Dec 2026) ─────────────────── Phase B: deepen before 13 May 2027 ──────── Phase C: after 13 May 2027
 │ 12  Reassessment + Sentinel S1 (tier card)        2–6 Nov          B1 Packs II: Public sector, EdTech, General   Jan    Sentinel S5 law watch · S6 Trust Center
 │ 12.5 Packs I: 6 risk packs + BFSI + Healthcare    7–14 Nov         B2 Multi-entity (MU affiliated colleges)      Jan    Small-business tier + billing (F-68)
 │ 13  Hardening: job runner, email, evidence        15–24 Nov        B3 Sentinel S4: Board pulse, evidence pack     Jan    API + Consent Manager integration (F-55)*
 │      expiry, reminders, MFA, prod infra, retire old app            B4 Client polish: consent centre, languages,   Feb    Connectors (F-54)*, support copilot,
 │ 13.5 Sentinel S2–S3: controls, ledger, daily      25 Nov–3 Dec        calendar, share link, Word/PPT, heatmap            training, parked items by trigger
 │      runs, alerts                                                  B5 Packs III: SaaS, Retail, Manufacturing,     Feb
 │ 14  Console + licensing + feature selection       4–16 Dec            Professional services
 │      + pack publishing → PRODUCTION LAUNCH                         B6 AnixAI: engagement workspace, partner       Feb–Mar
 │ 15  Client-hosted deployment (one-click)          17 Dec–8 Jan        console (CA / law-firm channel)
 │                                                                    B7 Depth: DPIA, breach drill, cross-border,    Mar–Apr
 │ M   Parallel: industry landing pages + chatbot    Nov (own track)     vendor library + DPA drafts, 4 AI tasks
 └── * earlier if a large client needs it (trigger)
```

### 6.2 Phase A — sell and launch (Nov–Dec 2026)

| # | Slice | What ships | Features | Why now | Sellable after it |
|---|---|---|---|---|---|
| **12** | **Reassessment + Sentinel S1** | Full / delta / event-triggered reassessment, carry-forward, baseline vs current, trend, Reassessment Report; **the Sentinel tier card** ("because you…") | F-19, F-43 | The full prompt is ready; REVIEW-01 and Sentinel need it; the PRD's V1→V5 cycle | The 30/90-day re-check that proves a sprint worked |
| **12.5** | **Packs I** (new) | The pack factory run for the **six risk packs** + **BFSI** + **Healthcare**; ROPA starter records; the ROPA hint "other organisations only" (D-140 follow-up) | F-12, F-59, F-21 | Step 4's first segments get a real industry assessment; counsel can review in parallel | **BFSI and hospital readiness assessments** in the buying window |
| **13** | **Hardening + launch readiness** | Job runner, email sender, **evidence expiry**, reminders and escalations, MFA, failed-access logging, production infrastructure, UAT, **retire the old app** | F-04, F-15, F-18 | Sentinel and every clock-based alert depend on the runner and email | A platform fit for production |
| **13.5** | **Sentinel S2–S3** (new) | The 23 controls (17 at once), the ledger with `verify`, the Sentinel page, daily and on-change runs, alerts and digest, actions from failing controls; Essentials for every client | F-42, F-44 | The differentiator in the deck and the proposal; needs Slice 13 | "Continuous assurance" as a real feature |
| **14** | **Console + licensing → production launch** | The AnixAI console across clients; one licence per organisation (units under it); **feature selection** with the fee following the ticked modules; industry-pack approval and publishing; Sentinel across clients | F-08, F-09, F-62, F-67 | Licence-first priority (Step 2 Q1); launch | **Licences and modules** |
| **15** | **Client-hosted deployment** | One-click install in the client's premises or cloud: single tenant, Compose/Helm/Terraform, signed offline licence with its module list, signed pack bundles, bring-your-own AI provider or a private model | F-10 | Banks and the public sector expect it; competitors offer it (Step 4 Q4) | **On-premises deals** with banks and government |
| **M** | **Marketing track** (parallel, own session, own `apps/site`) | Industry landing pages from the pack files (BFSI, Health, University first); lead form with our own notice and consent; the **chatbot** on the guarded gateway | F-48, F-41, F-66 | The buying window is now; touches no app code | Inbound leads |

**Human items that set the pace in Phase A:**
- **A1:** the AI provider's DPA with zero retention. Without it the assistant and the public chatbot stay off on the live site.
- **Counsel:** reviews the BFSI and health regulator references, the Sentinel wording and the TrustStack defaults.
- **Production infrastructure choices** (Slice 13).
- **MU's licence contract** (Slice 14).
- **First talks with a Consent Manager partner** (Step 4 Q2).

### 6.3 Phase B — deepen before 13 May 2027 (Jan–Apr)

| # | Work | Features | Why |
|---|---|---|---|
| B1 | Packs II: Public sector, EdTech, General | F-59 | Step 5 order; General covers every industry without a pack |
| B2 | **Multi-entity:** group → units (MU's affiliated colleges), roll-up dashboard, one industry per unit | F-05 | MU's proposal path (affiliated-college pilot); the ₹45–90 L tier |
| B3 | Sentinel S4: overview tile, Board pulse in the Exposure Brief, ledger-verified evidence pack, the Assistant's "where do we stand?" | F-47 | Board visibility before the deadline |
| B4 | Client polish: consent preference centre and statistics, more widget and notice languages, compliance calendar, secure Board share link, Word/PowerPoint exports, risk heatmap and evidence dashboard | F-07, F-23, F-35, F-37, F-38, F-39 | The old app's strengths, rebuilt (Step 2) |
| B5 | Packs III: SaaS, Retail / e-commerce, Manufacturing, Professional services | F-59 | Rest of the pack order |
| B6 | **AnixAI side:** engagement workspace (service ladder, monthly cadence, advisory notes); **partner console** for CA and law firms | F-60, F-63 | Scales consultants; the channel from Step 4 Q5 |
| B7 | Depth: DPIA workflow, breach tabletop drill, cross-border view, vendor library + DPA clause drafts, four new AI tasks | F-28, F-29, F-32, F-34, F-40 | SDF clients and regulated buyers |

### 6.4 Phase C — after 13 May 2027

These come in on trigger or demand:
- Sentinel S5 (law and rule change watch, F-46) and S6 (Trust Center, F-45)
- Small-business tier with self-serve billing (F-68)
- Public API and **Consent Manager integration** (F-55; earlier if a large client needs it)
- Connectors (F-54)
- Support copilot (F-64), training records (F-65)
- The rest of the parked rows, each on its own trigger: DigiLocker, WhatsApp, re-consent, propagation, discovery partner, ISO mapping, benchmarking, redaction

### 6.5 What AnixAI can sell, and when

| From | What can be sold | On what |
|---|---|---|
| **Today** | University readiness assessment (98 + 10); any organisation on the 98 core questions | Slices 0–11 (live) |
| **Mid-Nov 2026** | BFSI and hospital readiness assessments with sector questions; 30/90-day re-checks | Slices 12, 12.5 |
| **Early Dec 2026** | Sprints with continuous Sentinel monitoring | Slices 13, 13.5 |
| **Mid-Dec 2026** | Licences (Everything, or ticked modules), Sentinel tiers, managed assurance | Slice 14, launch |
| **Jan 2027** | On-premises / private-cloud deals | Slice 15 |
| **Jan–Apr 2027** | Group / university multi-entity tier; channel partner deals | B2, B6 |

### 6.6 The client side and the AnixAI side, side by side

| Phase | Client side | AnixAI side |
|---|---|---|
| A | Reassessment, sector packs, Sentinel, alerts, a hardened platform, an on-premises option | Console, licences, module pricing, pack publishing, landing pages and leads |
| B | Multi-entity, Board pulse, polish, depth features | Engagement workspace, partner console, more packs |
| C | API, Consent Manager integration, self-serve small business tier | Support copilot, training, law-change publishing |

### 6.7 Decisions for Aniket

| # | Question | My recommendation |
|---|---|---|
| Q1 | Approve the **sequence and target dates**: 12 (+S1) → 12.5 Packs I → 13 → 13.5 Sentinel → 14 launch (mid-Dec) → 15 client-hosted (Jan) → Phase B → Phase C | **Yes** |
| Q2 | **Packs I as its own slice before Slice 13**, so BFSI and hospital assessments can be sold in November | **Yes** |
| Q3 | **Marketing track in parallel** in November, as a separate session on its own site; the chatbot goes live only after A1 | **Yes** |
| Q4 | **Production launch target mid-December 2026**; client-hosted in January 2027 | **Yes** |
| Q5 | After approval: **merge PR #43** (this analysis and the tracker go to `main`), then a docs PR that writes this sequence into `SLICES.md` (the canonical plan), adds S1 to the Slice 12 prompt, and adds stubs for 12.5, 13.5 and M | **Yes** |

**Approved (Aniket, 28 Oct 2026):** "Step 6 approved with your recommendations on Q1–Q5":
the sequence and target dates; Packs I as Slice 12.5 before Slice 13; the marketing track in
parallel (chatbot live only after A1); launch mid-December 2026, client-hosted January 2027;
merge PR #43 and write the sequence into `SLICES.md`, Slice 12 (+S1) and stubs for 12.5, 13.5 and M.

---

## Step 7 — The final pack

### 7.1 Executive summary (one page)

**What we set out to do.** Bring the old app (TrustStack v2.3), the new app
(revised TrustStack), the PRD, the commercial proposal and the deck together
into **one industry-agnostic platform** that is simple to use, legally exact
and easy to sell. Sentinel's continuous assurance is part of it.

**What we found (Steps 1–2):**
- **68 capabilities** in total: 15 kept as built in the new app, 19 merged (an old-app strength rebuilt in the new app), 19 new, 13 parked on a trigger, 2 dropped.
- **The new app is the stronger base:** evidence-capped scoring, 1,429 industry questions, a penalty-exposure model, Rules-exact registers, guarded AI.
- **The old app is ahead on reach and money:** 19 widget languages, billing, a chatbot, a Board share link, a vendor library, ROPA templates.
- **One legal gap in the live app** (s.11(1)(b), the access reply's sharing list) was **found, fixed and merged** (D-139/D-140).

**What we decided (Steps 3–6):**
- **Sentinel** = 23 DPDP duties tested daily, with a tamper-evident ledger.
  - No extra score: a status line instead.
  - **Essentials** (six legal clocks) for every client.
  - Lite / Sentinel / Critical sold as a module.
- **Position:** *the DPDP assurance platform that proves it*, for regulated institutions.
  - Partner with Consent Managers and discovery tools rather than compete.
  - Client-hosted comes earlier.
- **Industry model:** five layers, with industry as data.
  - Only the University pack is approved today.
  - BFSI and Healthcare come next, with the six risk packs, through a repeatable pack factory.
- **Build:** Slice 12 (+ the Sentinel tier card) → 12.5 Packs I → 13 Hardening → 13.5 Sentinel → **14 launch, mid-Dec 2026** → 15 client-hosted, Jan 2027 → Phase B before **13 May 2027** → Phase C after.

**What it gives AnixAI:**
- A sellable product in the buying window (Nov 2026 – Jan 2027).
- Prices between the cheap tools and OneTrust.
- Recurring revenue from licences, Sentinel tiers and managed assurance.
- A channel through CA and law firms.

### 7.2 The sales story

**One line:**
> **TrustStack — the DPDP assurance platform that proves it.**

**In thirty seconds:**
> Every Indian organisation must meet the DPDP Act and Rules by 13 May 2027, and
> must be able to show it. TrustStack assesses your readiness against the law
> and your industry, accepts a "yes" only with evidence, tells your Board what a
> gap could cost, and runs your notices, consent, rights, breaches, processors
> and retention by the Rules' own clocks. Then Sentinel checks every duty, every
> day, and keeps tamper-evident proof. AnixAI's experts guide you, on our cloud
> or yours.

**Three proof points to show in every demo:**
1. **The evidence cap:** the same answer scores differently with and without accepted proof.
2. **The ₹ exposure and the 13 May 2027 forecast** on one screen.
3. **Sentinel's status line and ledger:** "19 duties met, 1 failing — the breach clock for BRH-… has passed", with the verify result.

**What we never say:** "compliant", "certified", "guaranteed", or "Consent
Manager". We say: *readiness, evidence, posture as of [date]*, and *final legal
sign-off with your counsel*.

### 7.3 The top 10 must-win features

| # | Feature | Why it wins deals | Status | When |
|---|---|---|---|---|
| 1 | **DPDP Compass™, evidence-capped** (F-13, F-14) | Proof, not self-assessment; boards and regulators trust it | ✅ live | — |
| 2 | **Exposure Command Centre** (₹ vs the Schedule, 13 May 2027 forecast, what-if) (F-36) | Turns DPDP into a Board decision with a number and a date | ✅ live | — |
| 3 | **Sentinel™** — daily duties, alerts, ledger (F-42–F-47) | DPDP-native "continuous" with proof; the deck's promise | 🔲 designed | Slice 13.5 (Dec) |
| 4 | **Industry packs** (University ✅; BFSI, Healthcare next) (F-12, F-59) | "Built for my sector"; 1,429 questions | 🟡 1 of 10 approved | 12.5 (Nov) → B1, B5 |
| 5 | **Rules-exact registers** — breach (two clocks), rights (90 days, s.11 list), retention (48 h notice), consent, processors (F-25, F-27, F-30…) | Counsel and regulators see the law, not a generic template | ✅ live | — |
| 6 | **Guarded AI in plain language** — explain, draft, translate (Hindi, Marathi) (F-40) | Saves DPO time safely; drafts only, citations checked | ✅ built (off live until A1) | A1 contract |
| 7 | **Board-ready reports** (10 kinds) + Board pulse (F-37, F-47) | What sponsors and auditors actually read | ✅ / B3 | B3 (Jan) |
| 8 | **Client-hosted, one-click** (F-10) | Required by banks and government; competitors already offer it | 🔲 | Slice 15 (Jan) |
| 9 | **Pick your modules** — feature selection and licensing (F-67, F-09) | Flexible price; start small, add Sentinel | 🔲 | Slice 14 (Dec) |
| 10 | **Multi-entity group roll-up** (F-05) | Universities with colleges, banking groups; the ₹45–90 L tier | 🟡 data model only | B2 (Jan) |

**Next in line:** the engagement workspace and partner console (F-60, F-63),
which are AnixAI's own scale levers.

### 7.4 Value for each side

| For clients | For AnixAI |
|---|---|
| Knows exactly where it stands and what to fix first | Sells the assessment → sprint → licence → managed assurance ladder on one platform |
| Proof for the Board, auditors and a Board inquiry (s.28) | Recurring revenue: licence + Sentinel tier + retainer |
| Never misses a legal clock (Essentials) | One consultant serves more clients (console, engagement workspace) |
| Its own sector's questions and records | New industries by pack factory, not new code |
| Its cloud or ours | Wins bank and government deals that need on-premises |

### 7.5 Risks and how we handle them

| Risk | Effect | Mitigation |
|---|---|---|
| **A1 (AI provider DPA) not signed** | Assistant and chatbot stay off on the live site | Contract first; the product sells without AI; the fake provider keeps tests green |
| **Counsel review is slow** | Packs and Sentinel wording wait | Batch reviews per slice; label defaults as TrustStack's; ship legally safe wording first |
| **Pace slips** | Launch moves into January | Phase A is ordered by revenue; Slices 12.5 and 13.5 can shrink to their core (two packs, the 17 ready controls) |
| **Consent vendors win the banks first** | Smaller share of the consent budget | Don't compete; integrate with Consent Managers; sell assurance on top |
| **Dependence on one live client (MU)** | Thin proof for sales | Packs I opens BFSI and health in November; channel partners from Phase B |
| **Overclaiming** | Legal and reputational risk | The "never say" list (7.2); no score that reads as "% compliant"; caveats on every report (D-011) |

### 7.6 What changes in the repo now (Step 6 Q5)

1. ✅ **Done 28 Oct 2026: PR #43 merged** (`8a82ef9`): this analysis, the feature register, the tracker page and the checker script go to `main`. F-61's warning clears.
2. ✅ **Done 28 Oct 2026 (D-141):** a docs PR writes the approved sequence into `docs/SLICES.md` (the canonical plan). It adds **Sentinel S1** to the Slice 12 prompt, adds stubs for **Slice 12.5 (Packs I)**, **Slice 13.5 (Sentinel S2–S3)** and **Track M (marketing)**, and updates STATE.
3. **The tracker** keeps updating at the end of every prompt (PLAYBOOK §6.5).

**Signed off (Aniket, 28 Oct 2026):** "Step 7 approved. The consolidated analysis is closed."
From here the plan lives in `docs/SLICES.md` and the feature tracker; this file is the record of why.
