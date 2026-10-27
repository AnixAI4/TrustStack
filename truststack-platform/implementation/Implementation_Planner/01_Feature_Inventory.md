# TrustStack™ — Complete Feature Inventory
## All 35 Features | Status, Roles, Phase

**Last Updated:** June 2026  
**Basis:** 30-company competitive analysis + DPDP Act 2023 + DPDP Rules 2025 + MVP Spec

---

## Status Legend
- ✅ **Full** — Built, tested, live in production
- ⚠️ **Partial** — Code complete but pending SQL, bug fix, or capability gap
- 🔲 **Not Yet** — Not built

## Role Legend
- **Admin** — Organization administrator (full access)
- **DPO** — Data Protection Officer (full compliance access)
- **Viewer** — Read-only dashboard access
- **Board** — Read-only Board Dashboard + reports only
- **Data Principal** — External user (member of public exercising DPDP rights)
- **Vendor** — External third-party vendor (questionnaire only)
- **Expert** — Anix AI DPO-as-a-Service advisor (P3)
- **Developer** — External developer using API (P3/P4)

---

## PHASE P0 — Foundation (Built)

| # | Feature / Module | What It Does | Roles | Status | Notes |
|---|---|---|---|---|---|
| 1 | **M10: TrustChat™** | Claude-powered DPDP chatbot. 11-question health check on landing page. Answers DPDP questions in natural language with section references. Escalation path to advisory. | All, Public | ✅ Full | On landing + inside dashboard. Knowledge base: DPDP Act + Rules. |
| 2 | **M1: DPDP Compass™ Assessment** | 45-question structured assessment covering all DPDP obligations. Weighted scoring → Compass Score 0-100. Maturity Level 1-5. AI gap report with prioritized remediation. Save-and-resume. | Admin, DPO | ✅ Full | Includes section-by-section questionnaire, auto-save debounce, results page with gauge. |
| 3 | **M1b: Industry-Specific Assessment Layers** | Layer 1: Industry-aware gap recommendations (fintech→RBI refs, healthtech→DISHA, edtech→parental consent). Layer 2: Section 9 with 8 industry-specific questions for fintech/healthtech/edtech. Layer 3: benchmarking (deferred — needs 20+ assessments). | Admin, DPO | ✅ Full | `bfsi` normalizes to `fintech`. FIN1-8, HLT1-8, EDT1-8 question IDs. |
| 4 | **M4: Grievance Officer Portal** | Appoint grievance officer (audit trail — deactivate old, insert new). Public complaint form at `/public/grievance/[slug]`. Dashboard: complaint list, filter/search/paginate, detail + status workflow. Email notification via Resend. | Admin, DPO, Data Principal (public) | ⚠️ Partial | Has global-unique reference bug (FIX1 in P1.5). DPBI escalation tracking is manual log only. |
| 5 | **M2: Consent Management** | Consent widget (vanilla JS, 19 languages + RTL). 4-step configure wizard (purposes, languages, position, preview). Consent audit log with CSV export. Stats (consent rate, withdrawals). Immutable version snapshots per DPDP §6(5). Withdraw/preference center (floating button). Public consent APIs with CORS. | Admin, DPO, Data Principal (widget) | ✅ Full | 22-language target: 19 built, 3 deferred (ks/sat/mni need professional localization). WhatsApp channel placeholder in schema, not wired. |
| 6 | **M3: Privacy Notice Builder** | 8-step wizard (company → data categories → purposes → sharing → retention → rights → languages → preview). Claude notice generation (English). Claude translation (EN→HI/TA/TE/MR). Immutable versions. Public hosted notice at `/public/[slug]`. 12-month staleness alert. Canonical URL + org logo. | Admin, DPO, Public (view) | ✅ Full | Download = `window.print()` (no PDF lib needed). Grievance Officer captured server-side. |
| 7 | **M9: Board Dashboard** | Effective Compass Score gauge (+ module bonuses, capped +20). Module status grid. Priority actions from real gaps. Compliance calendar. Claude board report (5-page PDF via @react-pdf). 7-day public share link (stateless HMAC token). | Admin, DPO, Board, Viewer | ⚠️ Partial | Only aggregates M1–M4 data. M5–M8 not yet included (FIX3 in P1.5). |

---

## PHASE P1 — Compliance Depth (Built, pending SQL)

| # | Feature / Module | What It Does | Roles | Status | Notes |
|---|---|---|---|---|---|
| 8 | **M5: DSR Management** | Public portal for all 7 DPDP rights (access/correction/completeness/erasure/restrict/nominate + grievance links to M4). Email-OTP identity verification (10-min TTL, 5-attempt cap). 30-day SLA tracker. Section 15 Nomination flow. DPO workflow (list/filter/detail/assign). Optional Claude fulfillment draft. | Admin, DPO, Data Principal (public) | ✅ Full | DB applied in Supabase ✅. Aadhaar OTP deferred (P2 — M16). |
| 9 | **M7: Vendor DPA Manager** | Vendor registry. 45-question DPDP questionnaire (Sections A–G) sent via signed token. Automated risk score + tier (inverse of Compass — higher = riskier). Claude DPA generator (Markdown). DPA status workflow (pending/sent/signed/expired). Derived 30-day expiry alerts. 20-vendor India pre-assessed library. | Admin, DPO, Vendor (external questionnaire) | ✅ Full | DB applied in Supabase ✅. India library: 20 vendors. Spec calls for 50+ (P3). |
| 10 | **M6: ROPA Builder** | Processing activity CRUD. draft→active→archived workflow. Server-side DPO approval (one-click approve + activate). AI-assisted entry (Claude, structured JSON, defensively parsed). Industry templates (fintech/healthtech/edtech/ecommerce/hrtech). ROPA↔Consent read-time cross-reference. PDF export (@react-pdf) + CSV (RFC-4180). | Admin, DPO | ⚠️ Partial | **DB NOT YET APPLIED — run `db/ropa.sql` in Supabase** (FIX2 in P1.5). |
| 11 | **M8: Breach Response** | Internal breach log. open→contained→resolved workflow. Per-org BRH-YYYY-NNN reference. 72-hour DPBI countdown DERIVED at read time (ticks client-side — no cron). Claude DPBI notification draft (formal letter, Rule 7 compliant, officer pulled server-side). Mark-DPBI-Notified + data-principal notification (server-side timestamps). Secret-gated escalation runner (CRON_SECRET, idempotent via escalations_sent[]). | Admin, DPO | ⚠️ Partial | **DB NOT YET APPLIED — run `db/breach_incidents.sql` in Supabase** (FIX2). **CRON_SECRET not set — escalation emails not firing** (FIX4). |

---

## PHASE P1.5 — Critical Fixes (Must complete before first paying customer)

| # | Feature / Fix | What It Does | Roles | Status | Priority |
|---|---|---|---|---|---|
| 12 | **FIX1: M4 Global-Unique Reference Bug** | GRV reference numbers use global UNIQUE — second org's first complaint collides. Fix to composite (organization_id, reference_number) unique index. Ripple: public lookup must accept org_slug. | Admin, DPO | 🔲 Not Yet | BLOCKER |
| 13 | **FIX2: Apply M6 + M8 SQL in Supabase** | Run `db/ropa.sql` and `db/breach_incidents.sql` in Supabase SQL Editor. Without this, ROPA Builder and Breach Response are non-functional. | DevOps | 🔲 Pending | BLOCKER |
| 14 | **FIX3: M9 Board Dashboard — M5–M8 Aggregation** | Extend `aggregate.ts` and `ModuleStatusGrid` to include DSR stats, vendor stats, ROPA stats, and breach stats. Board Dashboard currently shows incomplete compliance picture without M5–M8. | Admin, DPO, Board | 🔲 Not Yet | HIGH |
| 15 | **FIX4: Production Hardening** | Set CRON_SECRET in Vercel env. Configure Vercel Cron (every 15 min) to hit `/api/breach/escalations/run`. Verify truststack.in domain in Resend. Full authenticated click-through QA of all 10 modules. Mobile responsiveness check. | DevOps, QA | 🔲 Not Yet | HIGH |

---

## PHASE P2 — Commercialization (M11–M19)

| # | Feature / Module | What It Does | Roles | Status | Why Now |
|---|---|---|---|---|---|
| 16 | **M11: Multi-User & Team Management** | Invite team members via email. Role assignment (admin/DPO/viewer/board). User list management. Activity log per user. Seat limits enforced per subscription tier. | Admin | 🔲 Not Yet | Without this, only one person per org can use the platform. Revenue blocker. |
| 17 | **M12: Billing & Subscription Engine** | Razorpay subscription integration. All 5 tiers (Micro/Starter/Growth/Business/Enterprise). Trial management (configurable days in DB — not hardcoded). Upgrade/downgrade flow. Invoice generation. Dunning management. Payment gateway abstraction layer (interface → swap/add gateways without business logic changes). | Admin | 🔲 Not Yet | Revenue blocker. Cannot charge without this. |
| 18 | **M13: Pay-as-You-Go (PAYG) Credits Engine** | Credit wallet per org. Usage metering per feature key (consent/assessment/DSR/vendor/breach/report/ROPA). Credit consumption on each feature call. Wallet top-up via Razorpay order. Usage dashboard (feature-by-feature breakdown). Auto-suggest subscription when PAYG spend approaches tier price. | Admin | 🔲 Not Yet | Revenue blocker for PAYG customers. |
| 19 | **M14: 30-Day Onboarding Wizard** | Guided onboarding (productized Deloitte 7-phase in 30 days). Day-by-day checklist. Progress tracker with completion %. Module-by-module quick wins. Pre-filled demo data option. "Your first 30 days" plan generated from Compass Score gaps. | Admin, DPO | 🔲 Not Yet | Activation driver. Without guided onboarding, users churn before seeing value. |
| 20 | **M15: WhatsApp Consent Module** | WhatsApp Business API integration (Meta BSP partner: Gupshup/Kaleyra). DPDP-compliant consent message templates. Opt-in/opt-out tracking. STOP command withdrawal handling. WhatsApp consent audit trail (tied to phone number). Unified consent record (same `consent_records` table, channel='whatsapp'). | Admin, DPO, Data Principal | 🔲 Not Yet | India-unique differentiator. No competitor has this. |
| 21 | **M16: Aadhaar OTP Integration** | Leegality API integration. Aadhaar OTP for: (a) parental consent for children's data, (b) high-assurance DSR identity verification, (c) DPA eSign for vendors. Consent record with verification_method='aadhaar'. | Admin, DPO, Data Principal | 🔲 Not Yet | India-unique differentiator. Requires Leegality API partner. |
| 22 | **M17: DPDP Trust Center** | Public compliance profile page at `/public/trust/[slug]`. Shows: Compass Score badge, module completion status, last verified date, public privacy notice link, consent withdrawal portal link, Grievance Officer contact. B2B buyers can verify DPDP compliance before procurement. TrustStack™ Verified badge embed code. | Admin, Public, B2B Buyers | 🔲 Not Yet | Growth + moat. Equivalent of Vanta Trust Center for DPDP. Drives organic discovery. |
| 23 | **M18: Alert Center** | Real-time alert feed inside dashboard. Alert types: consent withdrawal rate spike (>20%), DSR SLA at-risk (within 5 days of due), breach 72h approaching, DPA expiry in 30 days, DPDP rule update notification. Email digest (configurable: immediate/daily/weekly). | Admin, DPO, Board | 🔲 Not Yet | DPO real-time monitoring. Continuous compliance vs. point-in-time. |
| 24 | **M19: Consent Re-Consent Campaign** | When consent widget config version changes materially, identify users who consented under old version. Generate re-consent campaign: email/WhatsApp notification with new consent choices. Track re-consent rate. Auto-move non-responders to 'withdrawn' after configurable days. | Admin, DPO | 🔲 Not Yet | DPDP §6(5) compliance. Version snapshots already exist (M2) — this is the workflow layer on top. |

---

## PHASE P3 — Scale & Enterprise (M20–M25)

| # | Feature / Module | What It Does | Roles | Status | Why |
|---|---|---|---|---|---|
| 25 | **M20: Sector Packs** | BFSI Pack: DPDP + RBI DPSS + SEBI CSCRF + IRDAI overlays, KYC/credit bureau data types, NBFC consent flows, RBI audit-ready evidence. Healthtech Pack: DPDP + DISHA overlay, patient consent, clinical vs. data consent separation, ABDM integration. EdTech Enhanced: parental Aadhaar consent, proctoring biometric flows. E-commerce Pack: Consumer Protection Act overlay. | Admin, DPO | 🔲 Not Yet | Sector-specific upsell. Justifies higher pricing. "TrustStack for Banks" positioning. |
| 26 | **M21: TrustStack Academy™** | DPDP training modules for roles: DPO, HR, Marketing, Engineering, Board. E-learning with quiz. Completion tracking + certificates. India-specific scenarios. Auto-update when DPDP Rules change. "TrustStack-Certified DPO" credential. | All org roles | 🔲 Not Yet | Stickiness + revenue (₹5K–25K/trainee). DSCI competition. |
| 27 | **M22: TrustStack™ Compliance Badge** | Verified badge for orgs with Compass Score >75. Public verification page at `trust.anixai.io/[company]`. Badge embed (website, email signature, sales deck). Quarterly re-verification. Optional DSCI co-branding. B2B procurement auto-fill from Verified status. | Admin, Public | 🔲 Not Yet | Trust signal. Drives new customer acquisition via existing customers' websites. |
| 28 | **M23: DPO-as-a-Service Platform** | In-platform advisory queue (DPO submits questions, advisor responds). Expert assignment per org. Monthly advisory call scheduling. DPBI correspondence log. 1 advisor : 20–30 org model (platform does 80%, advisor does 20%). Secure messaging between org + advisor. | Admin, DPO, Expert Advisor | 🔲 Not Yet | ₹3–6L/year add-on revenue. 4x revenue per expert vs. manual model. |
| 29 | **M24: India SaaS DSR Connectors** | Auto-fulfill DSR requests across India SaaS: Zoho CRM, Freshdesk, Razorpay, CleverTap, MoEngage, Exotel. When erasure request received → system triggers deletion/export across connected apps. Response compiled automatically. Reduces manual DPO fulfillment from hours to minutes. | Admin, DPO | 🔲 Not Yet | Transforms DSR from workflow to automation. DataGrail equivalent for India. |
| 30 | **M25: DPDP Compliance API** | REST API for consent verify, DSR submit, breach log, assessment score query. SDKs: Node.js + Python. Webhooks for compliance events. Developer sandbox + API docs. Rate limits per tier. "Stripe for DPDP compliance" positioning. | Developers, Enterprise | 🔲 Not Yet | New revenue stream. Embeds TrustStack in every Indian SaaS product. |

---

## PHASE P4 — Innovation & Future Moat (M26–M30)

| # | Feature / Module | What It Does | Roles | Status | Why |
|---|---|---|---|---|---|
| 31 | **M26: DPDP + AI Governance Module** | AI system inventory. Training data consent check (is AI model trained on consent-backed data?). Right-to-erasure impact on AI models (machine unlearning assessment). AI vendor assessment. Automated assessment against India AI Policy. | Admin, DPO, CTO | 🔲 Not Yet | First mover before Digital India Act formalizes AI governance. |
| 32 | **M27: Real-Time Consent Signal Propagation** | When consent withdrawn → signal propagates in real-time to connected India channels: WhatsApp Business, Exotel SMS, Gupshup, CleverTap, MoEngage. Audit trail shows propagation completion per system. Reduces breach risk from continued processing post-withdrawal. | Admin, DPO | 🔲 Not Yet | Ketch equivalent for India. DPDP §6(4) immediate withdrawal effect. |
| 33 | **M28: ISO 27701 Pathway Module** | Map TrustStack features to ISO 27701 controls. Show gap between current compliance state and certification readiness. Guided 8-week certification pathway. Upsell: "You're at Level 4. ISO 27701 is 8 weeks away." | Admin, DPO, CISO | 🔲 Not Yet | Enterprise upsell. Brings international credibility alongside India DPDP. |
| 34 | **M29: Automated Data Discovery** | Scan databases and cloud stores for India-specific personal data patterns: Aadhaar (12-digit Verhoeff), PAN (AAAAA0000A), Indian mobile (10-digit), IFSC, UPI ID. Auto-suggest ROPA entries from discovered data. Hindi-language document classification. Confidence scoring. | Admin, DPO, Data Engineer | 🔲 Not Yet | BigID equivalent for India. Eliminates manual ROPA population. |
| 35 | **M30: Privacy-as-Code SDK** | DPDP annotations for code: `@dpdp.consent_required`, `@dpdp.sensitive_data`, `@dpdp.children_data`. GitHub Action for privacy checks before PR merge. Jira plugin for DPDP review on new features. ROPA auto-generates from code annotations. DSR fulfillment via code hooks. | Developers | 🔲 Not Yet | Transcend equivalent for India. Embeds compliance in engineering culture. |

---

## Summary Counts

| Phase | Features | Built | Partial | Not Yet |
|---|---|---|---|---|
| P0 | 7 | 5 | 2 | 0 |
| P1 | 4 | 2 | 2 | 0 |
| P1.5 | 4 | 0 | 0 | 4 |
| P2 | 9 | 0 | 0 | 9 |
| P3 | 6 | 0 | 0 | 6 |
| P4 | 5 | 0 | 0 | 5 |
| **Total** | **35** | **7** | **4** | **24** |
