# TrustStack™ — Implementation Progress

**Last Updated:** June 2026 (post-Session 9 — M8 Breach Response complete, the **last** P1 module. **All 10 modules (M1–M10) are now built.** M5 (Session 6) + M7 (Session 7) + M6 (Session 8) + all P0 modules already shipped. **M5 + M7 SQL live; M6 `db/ropa.sql` and M8 `db/breach_incidents.sql` applied 2026-06-29 (P1.5 FIX2) — all module DB schema now live.** Platform is launch-ready.)  
**Platform:** `/Users/aniketmhala/Downloads/Anix/AI_Projects/DPDP/truststack-platform/`

---

## Phase 0 — P0 Modules (Must ship at launch)

| Module | Status | Session | Notes |
|---|---|---|---|
| M1: DPDP Compass™ Assessment | ✅ Complete | Session 1 | Auth + Dashboard + 45-question assessment + scoring + gap report. Tested end-to-end. |
| M1b: Industry-Specific Layers | ✅ Complete | Session 1b | Layer 1 (industry-aware gaps) + Layer 2 (industry question module, Section 9). All types pass. |
| M2: Consent Management | ✅ Complete | Session 3 | Widget (19 langs + RTL), 7 API routes, configure wizard, audit log, stats, **withdraw/preference-center**, **immutable config version snapshots**. All SQL run in Supabase. Tested end-to-end. |
| M3: Privacy Notice Builder | ✅ Complete | Session 4 | 8-step builder wizard, Claude notice generation + EN→HI/TA/TE/MR translation, immutable `privacy_notice_versions`, public hosted notice at `/public/[slug]`, 12-month staleness check. `type-check` + `next build` pass. ✅ SQL applied; publish → public-notice flow tested working (user-confirmed). |
| M4: Grievance Officer Portal | ✅ Complete | Session 2 | Grievance Officer CRUD, public complaint form, dashboard management, email notification via Resend. **P1.5 FIX1:** reference-number global-unique bug fixed — generator already org+year scoped; migration `db/fix_grievance_reference_unique.sql` swaps the global `UNIQUE` for a composite `(organization_id, reference_number)` index. ✅ applied in Supabase (2026-06-29) — live (tag `v1.5.1`). |
| M9: Board Dashboard | ✅ Complete | Session 5 + FIX3 | Board home (reused Compass gauge + module status + stats + priority actions + recent activity + compliance calendar), single aggregated `/api/dashboard/overview`, Claude board-report narrative + `@react-pdf` PDF, time-limited public share link. No new tables. **P1.5 FIX3:** now aggregates **M1–M8** — `collectComplianceCoverage()` adds read-time DSR/ROPA/Vendor/Breach stats to the overview + report; PDF gains a 6th "Compliance Coverage" page; overview gains a Compliance Coverage tile row. `type-check` ✅ / `npm audit` 0. |
| M10: TrustChat™ | ✅ Complete | Pre-existing | Live at `/api/chat` + `TrustChat.tsx` |

**🚀 P0 complete — launch readiness:** M1, M1b, M2, M3, M4, M9, M10 all ✅. All P0 SQL applied in Supabase (Mumbai). Remaining before go-live is QA + the authenticated click-through of M9 (see Session 5 notes). P1 modules (M5–M8) are post-launch.

---

## Phase 1 — P1 Modules (Ship within 30 days of first customer)

| Module | Status | Session | Notes |
|---|---|---|---|
| M5: DSR Management | ✅ Complete | Session 6 | Public portal (7 rights), email-OTP identity verification (`dsr_otps` table), DSR-YYYY-NNN reference, 30-day SLA tracker + overdue highlighting, manual fulfillment workflow, Section 15 nomination flow, DPO dashboard (list/filter/detail/stats), optional Claude fulfillment/denial drafting. `type-check` ✅; all routes verified in dev. **DB schema applied in Supabase ✅ — live.** |
| M6: ROPA Builder | ✅ Complete | Session 8 | Processing-activity inventory: CRUD + draft→active→archived workflow, **server-side DPO approval** (one-click Approve & Activate), **AI-assisted entry** (`/api/ropa/ai-suggest`, `claude-sonnet-4-6`, structured-JSON, defensively parsed), **industry templates** (`ROPA_INDUSTRY_TEMPLATES` + "Add from template"), **ROPA↔Consent read-time cross-ref** (no stored column; configured/missing badge), **PDF export** (`@react-pdf` register) + **CSV** (hand-rolled, no new deps), processor pre-fill from M7 vendors. Plain `dashboard/ropa/` (verified 307→login), no middleware changes. `type-check` ✅; `npm audit` = 0; all routes verified in dev (401 / 307). **DB schema ✅ applied in Supabase 2026-06-29 (P1.5 FIX2) — live.** |
| M7: Vendor DPA Manager | ✅ Complete | Session 7 | Vendor registry + 45-question DPDP questionnaire (Sections A–G) → automated risk score/tier → Claude DPA generator → DPA status workflow (pending/sent/signed/expired) with derived 30-day expiry alerts. Public signed-token questionnaire (admin client, no vendor login). 20-vendor pre-assessed India library ("Add from library"). `type-check` ✅; all routes verified in dev. **DB schema applied in Supabase ✅ — live.** |
| M8: Breach Response | ✅ Complete | Session 9 | Internal breach log: CRUD + open→contained→resolved workflow, per-org `BRH-YYYY-NNN`, **72-hour DPBI countdown DERIVED at read time** (client-safe `countdown.ts`, ticks client-side on the detail page — no cron), **Claude DPBI notification draft** (`claude-sonnet-4-6`, formal letter, follow-up contact pulled from active M4 Grievance Officer server-side, persisted), **"Mark as DPBI Notified"** + data-principal notification + post-mortem (all timestamps server-side), **secret-gated escalation runner** (`POST /api/breach/escalations/run`, `CRON_SECRET`, idempotent via `escalations_sent[]`, emails DPO via Resend — needs an external scheduler). Plain `dashboard/breach/` (307→login verified), no public routes/middleware change. `type-check` ✅; `npm audit` = 0; all routes verified in dev (401 / 307). **DB schema ✅ applied in Supabase 2026-06-29 (P1.5 FIX2) — live.** (Escalation emails still need `CRON_SECRET` + scheduler — optional.) |

---

## Phase 1.5 — Critical Fixes (pre-beta hardening)

| Fix | Status | Tag | Notes |
|---|---|---|---|
| FIX1 — M4 reference bug | ✅ Live | `v1.5.1` | Per-org composite unique index; SQL applied in Supabase. |
| FIX2 — M6/M8 SQL + cron | 🟡 SQL live | — | `ropa_entries` + `breach_incidents` applied 2026-06-29. **Pending (optional):** `CRON_SECRET` + Vercel Cron for M8 escalation emails. |
| FIX3 — M9 board M1–M8 | ✅ Live | `v1.5.3` | Board overview + report + PDF now aggregate DSR/ROPA/Vendor/Breach. |
| FIX4 — Production hardening | 🟡 Automated gates ✅ | `v1.5.4` | Automated/static checks + env-template fix done. **Interactive QA + mobile + Vercel + prod deploy pending manual sign-off (below).** |

### P1.5 FIX4 Sign-Off Checklist

**✅ Verified by automated/static checks (this session):**
- `npm audit` → **0 vulnerabilities**
- `npm run type-check` → **0 errors**
- `npm run build` → **succeeds** (all routes compile, incl. new board coverage)
- Secret-leak scan: no `ANTHROPIC_API_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `RESEND_API_KEY` / `CRON_SECRET` literals in `src/` (only `process.env.*`)
- No `'use client'` in any `src/app/api/` route
- No server secret exposed via a `NEXT_PUBLIC_*` name
- CORS `OPTIONS` handlers present on all 8 cross-origin public routes (consent config/record/withdraw, dsr submit/otp verify+resend, vendor questionnaire submit, privacy-notice `[slug]`). `grievance/submit` is same-origin (our hosted form) so correctly needs none.
- Auth (`src/middleware.ts`): `/dashboard/*` → 307 `/login` when unauthenticated; public API routes whitelisted; other `/api/*` self-enforce `getUser → 401` in-handler.
- **Fix applied:** `.env.example` rewritten to accurately document all 7 vars the code reads (was missing the required Supabase keys + mislabelled `RESEND_API_KEY` as optional; removed dead ConvertKit/PostHog placeholders).
- Env manifest confirmed: code reads exactly `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`. The prompt's `HMAC_SECRET` does **not** exist — signing (board share + vendor token) reuses `SUPABASE_SERVICE_ROLE_KEY`.

**⬜ Pending MANUAL sign-off (needs a running app / browser / Vercel — cannot be done from code):**
- Interactive golden-path click-through of M1–M10 (Task 1) — incl. the FIX1 two-org `GRV-2026-001` check and a live board-report PDF showing M5–M8.
- Mobile responsiveness at 390×844 (Task 2) — sidebar hamburger, no horizontal scroll, forms usable.
- Vercel env vars set in **Production + Preview** (Task 4) — all 6 required + optional `CRON_SECRET`.
- Production deploy verification (Task 6) — `/login` loads, unauth routes 307, public widget CORS present.
- `truststack.in` domain: **pending Resend verification** — emails still send from `noreply@anixai.io` (documented, not a blocker).

---

## Infrastructure

| Item | Status | Notes |
|---|---|---|
| Supabase project (Mumbai) | ✅ Complete | Region: ap-south-1. Original Sydney project deleted — data residency requirement for DPDP. |
| Environment variables | ✅ Complete | All 3 Supabase keys + Anthropic key in `.env.local` |
| Supabase SDK | ✅ Complete | `@supabase/supabase-js 2.108.2` + `@supabase/ssr 0.12.0` |
| Supabase client files | ✅ Complete | `client.ts`, `server.ts`, `admin.ts` |
| resend installed | ✅ Complete | v6.14.0 |
| Next.js middleware (auth) | ✅ Complete | `src/middleware.ts` — protects all `/dashboard/*` routes |
| Auth pages | ✅ Complete | login, signup, create-organization |
| Dashboard shell | ✅ Complete | Sidebar + Topbar + layout |
| Constants file | ✅ Complete | `src/lib/constants.ts` |
| DPDP types | ✅ Complete | `src/types/dpdp.ts` |
| Assessment questions (45) | ✅ Complete | `src/lib/assessment-questions.ts` |
| Tailwind brand colors | ✅ Complete | `truststack.*` colors added |
| Supabase DB schema (M1) | ✅ Complete | All 5 tables created with RLS |
| RLS fixes | ✅ Complete | 3 additional policies applied after M1 testing (see Key Decisions) |
| Supabase DB schema (M4) | ✅ Complete | `grievance_officers` + `grievance_complaints` tables + RLS policies applied |
| Supabase DB schema (M2) | ✅ Complete | 3 core tables (`consent_configs`, `consent_purposes`, `consent_records`) + RLS run in Supabase |
| Supabase DB schema (M2 snapshots) | ✅ Complete | `consent_config_versions` (immutable) + RLS + current-version backfill — `db/consent_config_versions.sql` run |
| Supabase DB schema (M3) | ✅ Complete | `privacy_notices` + `privacy_notice_versions` + RLS (`db/privacy_notices.sql`) **and** `organizations.logo_url` (`db/add_org_logo_url.sql`) — both run in Supabase |
| Supabase DB schema (M5) | ✅ Complete | `dsr_requests` + `dsr_nominations` + `dsr_otps` (+ RLS; `dsr_otps` RLS-on/no-policies = service-role only) — `db/dsr_requests.sql` applied in Supabase (Session 7) |
| Supabase DB schema (M7) | ✅ Complete | `vendors` + `vendor_questionnaire_responses` (+ RLS, org-members policies) — `db/vendors.sql` applied in Supabase (Session 7). No per-org reference number, so the M4/M5 global-unique pitfall does not apply. |
| Supabase DB schema (M6) | ✅ Complete | `ropa_entries` (+ RLS org-members policy, org-scoped indexes org+status / org+created_at desc) — `db/ropa.sql` **applied in Supabase 2026-06-29 (P1.5 FIX2).** Internal-only (no public routes); no per-org reference number. |
| Supabase DB schema (M8) | ✅ Complete | `breach_incidents` (+ RLS org-members policy; **composite per-org `(organization_id, reference_number)` unique index** — NOT global; `escalations_sent text[]`; indexes org+status / org+created_at desc / org+dpbi_notification_due_at / org+dpbi_notified) — `db/breach_incidents.sql` **applied in Supabase 2026-06-29 (P1.5 FIX2).** Internal-only (no public routes). |
| CRON_SECRET (M8) | 🔲 Optional | Gates `POST /api/breach/escalations/run`. Not set in `.env.local` yet → the escalation runner denies all callers (401) until configured + an external scheduler (Vercel Cron / GitHub Action / Supabase pg_cron, ~every 15 min) is wired. Documented in `.env.example`. |
| SQL migrations folder | ✅ New | `db/` added this session — migration SQL kept on record, run manually in Supabase SQL Editor |
| RESEND_API_KEY | ✅ Set | `re_8yhUMg...` in `.env.local`. Sending from `noreply@anixai.io` (anixai.io verified). Change to `noreply@truststack.in` once truststack.in is verified in Resend. |
| Navbar Login/Signup | ✅ Complete | Login + Sign Up Free buttons added to desktop nav and mobile drawer in `src/components/layout/Navbar.tsx` |
| Middleware public routes | ✅ Updated | `/api/consent/withdraw` added to `PUBLIC_API_ROUTES` in `src/middleware.ts` (ready for M2) |
| PDF library | ✅ Complete | `@react-pdf/renderer@4.5.1` installed (M9). `serverExternalPackages: ['@react-pdf/renderer']` in `next.config.ts`. (Added **zero** vulnerabilities — the audit warnings seen during install were pre-existing, see below.) |
| Security: npm audit | ✅ 0 vulns | Session 5 cleanup (7 → 0): **removed unused `ai`** (Vercel SDK — not imported; chat uses `@anthropic-ai/sdk`) cleared `@ai-sdk/*` + `jsondiffpatch`; **bumped Next 15.1.0 → 15.5.19** cleared the critical advisories; **`overrides: { next: { postcss: ^8.5.15 } }`** in `package.json` bumped Next's bundled postcss 8.4.31 → 8.5.15. `npm audit` = 0, `type-check` = 0 errors, app boots + CSS compiles. NOT done via `audit fix --force` (would have force-upgraded `ai` 4→6). |

---

## What's Live

| Item | Status | Path |
|---|---|---|
| Landing page | ✅ Live | `src/app/page.tsx` |
| TrustChat™ widget | ✅ Live | `src/components/chatbot/TrustChat.tsx` |
| TrustChat™ API | ✅ Live | `src/app/api/chat/route.ts` |
| Health Check API | ✅ Live | `src/app/api/health-check/route.ts` |
| Privacy Policy | ✅ Live | `src/app/privacy-policy/page.tsx` |
| Terms of Service | ✅ Live | `src/app/terms/page.tsx` |
| Cookie Policy | ✅ Live | `src/app/cookie-policy/page.tsx` |
| Cookie Consent Banner | ✅ Live | `src/components/ui/CookieConsent.tsx` |
| Dark/Light theme toggle | ✅ Live | `src/components/ui/ThemeToggle.tsx` |
| Login / Signup | ✅ Live | `src/app/(auth)/login/` + `signup/` |
| Create Organization | ✅ Live | `src/app/(auth)/create-organization/` |
| Dashboard shell | ✅ Live | `src/app/dashboard/layout.tsx` |
| Overview page | ✅ Live | `src/app/dashboard/overview/page.tsx` |
| DPDP Compass Assessment | ✅ Live | `src/app/dashboard/assessment/` |
| Assessment Results | ✅ Live | `src/app/dashboard/assessment/results/[id]/` |
| Industry Section 9 (Fintech / Healthtech / EdTech) | ✅ Live | `src/app/dashboard/assessment/[id]/page.tsx` |
| Industry-aware gap recommendations | ✅ Live | `src/lib/ai/gap-generator.ts` |
| Org profile pre-fill (Q1/Q2/Q3) | ✅ Live | `src/app/dashboard/assessment/[id]/page.tsx` |
| GET /api/organizations/me | ✅ Live | `src/app/api/organizations/me/route.ts` |
| Navbar Login / Sign Up | ✅ Live | `src/components/layout/Navbar.tsx` — desktop + mobile |
| Grievance Officer Portal | ✅ Live | `src/app/dashboard/grievance/page.tsx` — auto-refresh every 30s + on tab focus |
| Grievance Complaints List | ✅ Live | `src/app/dashboard/grievance/complaints/page.tsx` |
| Grievance Complaint Detail | ✅ Live | `src/app/dashboard/grievance/complaints/[id]/page.tsx` |
| Public Grievance Form | ✅ Live | `src/app/public/grievance/[slug]/page.tsx` — no auth required |
| POST /api/grievance/submit | ✅ Live | Public, no auth — generates GRV-YYYY-NNN, emails officer via Resend |
| GET /api/grievance/officer | ✅ Live | `src/app/api/grievance/officer/route.ts` |
| GET+PATCH /api/grievance/complaints/[id] | ✅ Live | `src/app/api/grievance/complaints/[id]/route.ts` |
| Consent Management home | ✅ Live | `src/app/dashboard/consent/page.tsx` — status banner (version + View history), stats, embed, purposes |
| Consent Configure wizard | ✅ Live | `src/app/dashboard/consent/configure/page.tsx` — 4 steps |
| Consent Audit Log | ✅ Live | `src/app/dashboard/consent/audit/page.tsx` — Version column + CSV export |
| Consent Version History | ✅ Live | `src/app/dashboard/consent/versions/page.tsx` — immutable snapshots |
| Consent Widget (public JS) | ✅ Live | `public/consent-widget.js` — 19 langs + RTL, floating Privacy-choices button + withdraw |
| Public consent APIs | ✅ Live | `/api/consent/config`, `/record`, `/withdraw` — admin client + CORS + OPTIONS |
| Auth consent APIs | ✅ Live | `/api/consent/manage`, `/audit`, `/stats`, `/versions` |
| Privacy Notice home | ✅ Live | `src/app/dashboard/privacy-notice/page.tsx` — status banner (Published/Draft/Not Created), public link, version history, 12-month staleness warning |
| Privacy Notice Builder wizard | ✅ Live | `src/app/dashboard/privacy-notice/builder/page.tsx` → `NoticeBuilder.tsx` — 8 steps |
| Public Privacy Notice | ✅ Live | `src/app/public/[slug]/page.tsx` — no auth, org logo + canonical URL, language toggle, sticky TOC, print-to-PDF, mailto officer |
| Privacy Notice APIs (auth) | ✅ Live | `/api/privacy-notice` (GET), `/save`, `/generate` (Claude), `/translate` (Claude), `/publish` |
| Privacy Notice API (public) | ✅ Live | `GET /api/privacy-notice/[slug]` — admin client + CORS + OPTIONS |
| Board Dashboard (overview home) | ✅ Live | `src/app/dashboard/overview/page.tsx` — greeting + Compass gauge (effective score) + trend, module status, stats, priority actions, recent activity, compliance calendar; empty state = onboarding + live 30-day plan |
| Board Reports page | ✅ Live | `src/app/dashboard/reports/page.tsx` — date range, Generate, PDF download, share-link, HTML preview |
| Public shared board report | ✅ Live | `src/app/public/board-report/[token]/page.tsx` — no auth, signed time-limited token, admin-client aggregate, expired/invalid view |
| GET /api/dashboard/overview | ✅ Live | Aggregated M1–M4 payload (`src/lib/dashboard/aggregate.ts`) |
| GET /api/dashboard/compass-score | ✅ Live | Current score + last 6 assessments (trend) |
| POST /api/dashboard/report/generate | ✅ Live | Claude `claude-sonnet-4-6` exec summary + HTML preview + structured report |
| POST /api/dashboard/report/pdf | ✅ Live | `@react-pdf/renderer` 5-page PDF, `application/pdf` stream |
| POST /api/dashboard/report/share | ✅ Live | Mints 7-day signed public share URL (no table) |
| DSR Management home | ✅ Built | `src/app/dashboard/dsr/page.tsx` — portal link, overdue alert, stats, recent requests, 30s auto-refresh |
| DSR Requests list | ✅ Built | `src/app/dashboard/dsr/requests/page.tsx` — status tabs + right-type filter + search + pagination |
| DSR Request detail | ✅ Built | `src/app/dashboard/dsr/requests/[id]/page.tsx` — identity banner, nominee panel, fulfillment workflow + AI draft |
| Public DSR Portal | ✅ Built | `src/app/public/dsr/[slug]/page.tsx` — no auth, 7 rights, email-OTP verification |
| POST /api/dsr/submit | ✅ Built | Public, admin client — `DSR-YYYY-NNN`, 30-day due date, issues + emails OTP |
| POST /api/dsr/otp/{verify,resend} | ✅ Built | Public, admin client — hashed OTP, 10-min TTL, ≤5 attempts |
| GET /api/dsr/requests, /stats | ✅ Built | Auth — list/filter/search/paginate + accurate overdue/SLA aggregate |
| GET+PATCH /api/dsr/requests/[id] | ✅ Built | Auth — detail (+ linked nomination) + status workflow |
| POST /api/dsr/draft | ✅ Built | Auth — optional Claude `claude-sonnet-4-6` fulfillment/denial draft |

> M5 rows are ✅ **LIVE** — `db/dsr_requests.sql` applied in Supabase (Session 7).

| Vendor DPA Manager home | ✅ Built | `src/app/dashboard/vendors/page.tsx` — stats, expiry alert, Add Vendor + Add-from-library, recent vendors, 30s auto-refresh |
| Vendor Registry list | ✅ Built | `src/app/dashboard/vendors/list/page.tsx` — status/risk/type filters + search + pagination |
| Vendor Detail | ✅ Built | `src/app/dashboard/vendors/[id]/page.tsx` — info, risk + questionnaire responses, DPA workflow, AI DPA generator, send-questionnaire, edit/delete |
| Public Vendor Questionnaire | ✅ Built | `src/app/public/vendor-questionnaire/[token]/page.tsx` — no login, signed-token, 45-Q sectioned wizard |
| GET+POST /api/vendors | ✅ Built | Auth — list/filter/search/paginate + create (manual or library) |
| GET+PATCH+DELETE /api/vendors/[id] | ✅ Built | Auth — vendor + questionnaire responses; DPA workflow; delete |
| GET /api/vendors/stats | ✅ Built | Auth — total/signed/awaiting/expiring_soon/expired/high_risk (expiry derived) |
| POST /api/vendors/[id]/dpa | ✅ Built | Auth — Claude `claude-sonnet-4-6` generates a DPDP DPA (Markdown) |
| POST /api/vendors/[id]/send-questionnaire | ✅ Built | Auth — mints signed token, emails vendor via Resend, returns link |
| POST /api/vendors/questionnaire/submit | ✅ Built | **Public**, admin client + CORS/OPTIONS — token-verified, upserts answers, recomputes risk |

> M7 rows are ✅ **LIVE** — `db/vendors.sql` applied in Supabase (Session 7). (Verified in dev: type-check ✅, routes 401/204/400/401/307/200 as expected, npm audit = 0.)

| Breach Response home | ✅ Built | `src/app/dashboard/breach/page.tsx` — log-breach modal, overdue/awaiting alert, live countdown cards for active incidents, stats, recent incidents, 30s + visibilitychange refresh |
| Breach Register | ✅ Built | `src/app/dashboard/breach/list/page.tsx` — status tabs + nature filter + search + pagination (the chronological audit log) |
| Breach Incident detail | ✅ Built | `src/app/dashboard/breach/[id]/page.tsx` — live 72h countdown banner, DPBI draft gen + copy/download, Mark-DPBI-Notified, data-principal notification, status workflow, post-mortem |
| GET+POST /api/breach | ✅ Built | Auth — list/filter(status,nature)/search/paginate + log incident (per-org `BRH-YYYY-NNN`, `dpbi_notification_due_at` = discovered+72h, `logged_by` server-side) |
| GET+PATCH /api/breach/[id] | ✅ Built | Auth — detail + workflow (validated open→contained→resolved, `mark_dpbi_notified`/`principals_notified` server-side timestamps, post-mortem) |
| GET /api/breach/stats | ✅ Built | Auth — total/open/awaiting_dpbi/overdue_dpbi(derived)/due_soon/resolved/dpbi_notified/by_nature |
| POST /api/breach/[id]/dpbi-draft | ✅ Built | Auth — Claude `claude-sonnet-4-6` DPBI letter (Rule 7); officer pulled server-side; persisted to `dpbi_notification_draft` |
| POST /api/breach/escalations/run | ✅ Built | **No session** — `CRON_SECRET`-gated (x-cron-secret or Bearer), admin client, idempotent via `escalations_sent[]`, emails DPO via Resend. **Needs an external scheduler.** |

> M8 rows are ✅ **LIVE** — `db/breach_incidents.sql` applied in Supabase 2026-06-29 (P1.5 FIX2). (Verified in dev: type-check ✅, npm audit = 0, all `/api/breach/*` → 401, escalations/run without/with-wrong secret → 401, `/dashboard/breach/*` → 307→/login.) Escalation alert emails remain opt-in (`CRON_SECRET` + scheduler).

---

## Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| June 2026 | Supabase in Mumbai (ap-south-1) | DPDP data residency — personal data must stay in India. Original Sydney project deleted. |
| June 2026 | Dashboard at `/dashboard/*` (plain folder, not route group) | Route groups don't add URL segments — would collide with landing page at `/` |
| June 2026 | Org creation via API route, not browser client | Browser JWT unreliable immediately post-signup. Server-side cookie auth is always reliable. Admin client used for the insert. |
| June 2026 | RLS policy on `organization_members` must NOT self-reference | Any subquery on `organization_members` inside its own RLS policy causes infinite recursion in Postgres. Simple `user_id = auth.uid()` only. |
| June 2026 | Q38 scoring is inverted | "No breach" = full points (good). "Yes = breach occurred" = 0 pts. Different from all other questions. |
| June 2026 | Partial answers downgrade gap priority by 1 level | Partial compliance is meaningfully better than none — gap urgency reflects this. |
| June 2026 | Industry-specific assessment in 3 layers | Generic 45Q base is correct. Industry layers add differentiation without breaking base. Layer 1 (gap recommendations) < 2hrs. Layer 2 (industry questions) = 1 session. Layer 3 (benchmarking) = after data exists. |
| June 2026 | Compass Score normalizes by answered questions, not fixed 112 | Avoids penalizing partial completion. When all 45 answered, totalMax ≈ 112. When industry questions added, totalMax auto-scales. |
| June 2026 | Grievance Officer edit creates new record, deactivates old | Preserves full audit trail in `grievance_officers` table. `active=false` on previous row. |
| June 2026 | Resend email from `noreply@anixai.io` not `noreply@truststack.in` | `truststack.in` not yet verified in Resend. `anixai.io` is verified. Change when truststack.in is set up. |
| June 2026 | Grievance dashboard auto-refreshes via 30s poll + Page Visibility API | Prevents stale complaint count when officer switches back from the public form tab to dashboard. |
| June 2026 | `/api/consent/withdraw` added to middleware PUBLIC_API_ROUTES | Added proactively in Session 2 so M2 session doesn't need to touch middleware. |
| June 2026 | M2 prompt fixed — removed (dashboard) route group, aligned API paths to /api/consent/ | Original M2 prompt used `/api/v1/consent/` and `src/app/(dashboard)/` — both wrong. Fixed before M2 session. |
| June 2026 | M2 public routes use admin client + CORS + OPTIONS | Widget calls them with no user session (RLS would block) and from a different origin (client site). Service role bypasses RLS; CORS allows cross-origin. |
| June 2026 | Widget derives API base from `script.src`, not `window.location` | `window.location.hostname` is empty on `file://` test pages — broke localhost detection. `script.src` is always the fully-resolved widget URL. |
| June 2026 | Consent rate = % accepting ≥1 NON-required purpose | Naive "any accepted purpose" was always ~100% (`essential` is required, always accepted). New metric ignores required purposes so "Reject All" correctly counts as not-consented. `stats/route.ts` reads required keys from `consent_purposes`. |
| June 2026 | Immutable config version snapshots (`consent_config_versions`) | DPDP §6(5) — must reconstruct exactly what a data principal agreed to. Each `consent_record` stamps `config_version`; snapshots store that version's full content. Same pattern as M3's `privacy_notice_versions`. Backfill can only capture the current version (older content was overwritten). |
| June 2026 | Widget honors explicit `data-lang`; only auto-detect is gated | A site owner writing `data-lang="hi"` clearly wants Hindi — don't gate on the org's supported-languages list. Auto-detection still respects that list. |
| June 2026 | 19 of 22 widget languages translated; ks/sat/mni → English fallback | Specialized scripts (Perso-Arabic Kashmiri, Ol Chiki Santali, Meitei Manipuri) can't be responsibly machine-translated for legal consent text — defer to professional localization. |
| June 2026 | M3 prompt fixed pre-emptively — `(dashboard)` route group → `dashboard` | Same route-group bug as M2 would bypass the auth middleware. Also added implementation-notes block (dev port 3011, public-route handling, version-snapshot reference, `db/` migrations). |
| June 2026 | M3 added a `save` route + `GET /api/privacy-notice` not in original prompt | The prompt listed generate/translate/publish/[slug], but publish takes a `version_id` — a version must be created first. `save` writes the immutable `privacy_notice_versions` snapshot (draft); the index GET feeds the dashboard home + version history. |
| June 2026 | Grievance Officer captured server-side on save/generate, not trusted from client | The notice's officer name/email/phone (DPDP §14) are read from the live `grievance_officers` record in the API, guaranteeing the `NOT NULL` snapshot fields are authoritative. No officer → 400, and the builder blocks at Step 6. |
| June 2026 | Public notice reads use the admin client + explicit `published = true` filter | No user session exists on `/public/[slug]`; service role bypasses RLS reliably (matches M2 public-route decision). The `published = true` filter ensures drafts never leak even though RLS also guards it. |
| June 2026 | Dependency-free Markdown renderer (`src/lib/markdown.ts`) | No `react-markdown`/`marked` in the project (TrustChat hand-rolls its own). HTML is escaped before formatting to prevent injection via free-text fields; heading ids power the public-page TOC. "Download as PDF" uses `window.print()` + print CSS (no `@react-pdf` dependency added). |
| June 2026 | Model `claude-sonnet-4-6` for generation + translation | Matches MASTER_CONTEXT + the existing `chat/route.ts`; same SDK call shape (`anthropic.messages.create`). |
| June 2026 | Fixed pre-existing `/login` build blocker (out of M3 scope) | `useSearchParams()` without a `<Suspense>` boundary failed `next build` (prerender). Wrapped the form in `<Suspense>` so the whole app builds; unrelated to M3 but blocked shipping it. |
| June 2026 | M9 prompt pre-synced for Session 5 | Same `(dashboard)` route-group bug as M2/M3 → fixed to plain `dashboard/` (overview + reports). Added an implementation-notes block: dev port 3011 (+ never `next build` while `next dev` runs), `claude-sonnet-4-6` + `@anthropic-ai/sdk` pattern, `npm install @react-pdf/renderer` first, reuse `assessment/CompassScoreGauge.tsx`, real M1–M4 data sources (tables + existing API routes), Layer-3 benchmarking optional until 20+ assessments. |
| June 2026 | M9 reuses `assessment/CompassScoreGauge` (no board duplicate) | Implementation note #6 — the existing gauge already color-codes the exact maturity bands and counts up on load. The overview wraps it and adds a trend label below; no `board/CompassScoreGauge.tsx` created. |
| June 2026 | M9 headline = "effective score" (Step 5); trend = raw delta | `effective_score` = assessment score + module-completion bonuses (capped +20, max 100) so finishing a module visibly raises the gauge (motivation loop). Raw `compass_score` is kept (parity with M1) and feeds the trend vs the previous assessment. The maturity badge derives from the effective score. Returned as separate fields in `OverviewResponse`. |
| June 2026 | M9 PDF route takes structured `{ report }`, not `{ report_html }` | @react-pdf renders its own primitives, not arbitrary HTML. The reports page posts the structured `report` returned by `/generate`, so the PDF layout is authoritative and no second Claude call is needed. (Documented deviation from the prompt's body shape.) |
| June 2026 | M9 share link = stateless signed token + public page (no new table) | "Time-limited link, no login" = HMAC-SHA256 token (secret = service-role key) embedding `{org, period, expiry=7d}`, verified by `/public/board-report/[token]` which re-aggregates via the admin client. No table (M9 creates none). Public view uses the deterministic summary (no Claude per view). Matches the M2/M3/M4 admin-client public-read pattern. |
| June 2026 | M9 Layer 3 benchmarking skipped | Per MASTER_CONTEXT §12 / implementation note #8 — "vs. the average [industry] company" is meaningless under 20+ assessments. The query is trivial to add later in the results page. |
| June 2026 | Security cleanup: remove `ai` + bump Next + postcss override (not `audit fix --force`) | The 7 audit warnings were **not** from `@react-pdf/renderer` (it added zero) — they were pre-existing: unused `ai` SDK tree, Next 15.1.0 (critical), and Next's bundled postcss. `audit fix --force` would have force-upgraded `ai` 4→6 (pointless, it's unused) — so instead: removed `ai`, bumped Next within its major (15.1.0→15.5.19), and scoped a postcss override under `next`. Result: 0 vulns, no breaking changes, type-check + dev boot + CSS pipeline all verified. |
| June 2026 (M7) | Vendor `risk_score` is the INVERSE of the Compass Score (higher = riskier) | Each questionnaire question declares its risky answer (`riskyAnswer`) or per-option `risk`; the scorer normalises by answered weight (mirrors compass-scorer) so partial completion isn't penalised. Tiers: ≤25 low / ≤50 medium / ≤75 high / else critical. |
| June 2026 (M7) | DPA expiry alerts are DERIVED at read time, never auto-flipped | `effectiveDpaStatus` shows a lapsed signed DPA as "expired" and `isExpiringSoon(…,30)` drives the dashboard alert (the "30 days before expiry" criterion). No cron; `dpa_status='expired'` is still settable manually. Same philosophy as M5's derived `isOverdue`. |
| June 2026 (M7) | Public vendor questionnaire = stateless signed token + admin client (no vendor login, no token table) | Mirrors the M9 board share-token + the M2/M5 public-route admin-client pattern. Only `/api/vendors/questionnaire/` is whitelisted in middleware; submit recomputes risk server-side and never returns the internal score/tier to the vendor. |
| June 2026 (M7) | DPA export = Markdown + `window.print` (reuses `src/lib/markdown.ts`); India library expanded 10→20 | No `@react-pdf` dependency added for M7 (SDK call isolated in the route). The spec listed 10 pre-assessed vendors but described 20 — seeded the 10 verbatim + 10 clearly-marked India-resident SaaS vendors (validate before customer use), as a per-org "Add from library" action (not bulk-inserted). |
| June 2026 | M6 ROPA prompt pre-synced for Session 8 | Added an implementation-notes block to `P1_M6_ROPA_Builder.md`: plain `dashboard/ropa/` (no public routes), reuse M7/M5 CRUD+status, structured-JSON AI-assist (`claude-sonnet-4-6`), `ROPA_INDUSTRY_TEMPLATES` library, ROPA↔Consent read-time cross-ref, server-side DPO approval, `@react-pdf` PDF + hand-rolled CSV (no new deps), `db/ropa.sql`, activate `ropa` sidebar, dev port 3011. M8 prompt still needs the same pre-sync. |
| June 2026 (M6) | ROPA↔Consent cross-reference is a READ-TIME join, never a stored column | `src/lib/ropa/consent.ts` token-overlaps each consent-based activity's purposes/category-labels against the org's `consent_purposes` (M2) → configured/missing/not-applicable. Computed inline in the list/detail/stats routes (one `consent_purposes` fetch per request) — a separate `/consent-coverage` endpoint would be redundant, so it was not built. |
| June 2026 (M6) | DPO approval is server-side; `approve:true` does approve + activate atomically | `PATCH /api/ropa/[id]` stamps `dpo_approved`, `dpo_approved_at`, `last_reviewed_at` and flips `status='active'` in one action — the client never sends those flags. Plain status moves are validated against a draft→active→archived matrix; activating requires prior DPO sign-off. There is no separate DPO entity (the authenticated dashboard user acts as DPO; M4 §14 officer is unrelated). |
| June 2026 (M6) | AI-assist returns STRUCTURED JSON, parsed defensively | `/api/ropa/ai-suggest` (`claude-sonnet-4-6`) is told to emit ONLY a JSON object; the route strips stray fences, slices the `{…}`, and `sanitizeRopaSuggestion()` filters categories/subjects/legal-basis to valid enums and drops unknown keys before the form pre-fills. Prompt builder + sanitizer live in client-safe `src/lib/ropa/ai.ts` (no SDK import). |
| June 2026 (M6) | Templates are a per-org "Add from template" library, not a bulk insert | `ROPA_INDUSTRY_TEMPLATES` (fintech/healthtech/edtech/ecommerce/hrtech + `DEFAULT_ROPA_TEMPLATE`) keyed by industry; `getRopaTemplates()` normalises bfsi→fintech and falls back to default (mirrors `getIndustryPurposes`). Picker reads the org industry from `/api/organizations/me` and POSTs chosen activities as `ropa_entries`. Export = `@react-pdf` register PDF + hand-rolled RFC-4180 CSV (UTF-8 BOM) — zero new deps, `npm audit` stays 0. |

---

## Build Order (updated)

```
✅ Session 1:  M1 Compass Assessment (complete)
               → Sets up: Auth, Dashboard shell, 45Q assessment, scoring, gap report

✅ Session 1b: M1b Industry-Specific Layers (complete)
               → Layer 1: industry-aware gap recommendations (gap-generator.ts only)
               → Layer 2: Fintech + Healthtech + EdTech question modules (Section 9)
               → Prompt: implementation/Prompt_Library/P0_M1b_Industry_Layers.md

✅ Session 2:  M4 Grievance Officer Portal (complete)
               → Creates: grievance_officers, grievance_complaints tables
               → Also: Navbar Login/Signup, auto-refresh, Resend email fix, M2 prompt sync
               → Prompt: implementation/Prompt_Library/P0_M4_Grievance_Officer_Portal.md

✅ Session 3:  M2 Consent Management (complete + enhanced)
               → Tables: consent_configs, consent_records, consent_purposes, consent_config_versions
               → Widget: public/consent-widget.js (vanilla JS, 19 langs + RTL, floating withdraw button)
               → Enhancements: consent-rate metric fix, withdraw/preference-center, immutable version snapshots
               → SQL: db/consent_config_versions.sql (run in Supabase)
               → Prompt: implementation/Prompt_Library/P0_M2_Consent_Management.md

✅ Session 4:  M3 Privacy Notice Builder (complete)
               → Tables: privacy_notices, privacy_notice_versions (immutable) — db/privacy_notices.sql
               → 8-step builder wizard + Claude generation/translation + public hosted notice
               → Depends on M4 (pulls Grievance Officer data into notice) — complete
               → Prompt: implementation/Prompt_Library/P0_M3_Privacy_Notice_Builder.md

✅ Session 5:  M9 Board Dashboard (complete)
               → No new tables — aggregates M1–M4 via src/lib/dashboard/aggregate.ts
               → Board overview home + reports page + Claude narrative + @react-pdf 5-page PDF + signed public share link
               → Layer 3 benchmarking deferred (needs 20+ assessments — note #8)
               → Prompt: implementation/Prompt_Library/P0_M9_Board_Dashboard.md

🎯 ALL P0 MODULES COMPLETE — TrustStack is launch-ready.

✅ Session 6:  M5 DSR Management (complete) — first P1 module
               → Tables: dsr_requests, dsr_nominations, dsr_otps (db/dsr_requests.sql — run manually)
               → Public 7-rights portal + email-OTP identity verification + 30-day SLA tracker
               → DPO dashboard (list/filter/detail/stats) + Section 15 nomination + optional Claude drafting
               → Reuses the M4 grievance pattern; grievance/§14 links out to M4
               → Prompt: implementation/Prompt_Library/P1_M5_DSR_Management.md

✅ Session 7:  M7 Vendor DPA Manager (complete) — second P1 module
               → Tables: vendors, vendor_questionnaire_responses (db/vendors.sql — run manually)
               → Vendor registry + 45-Q DPDP questionnaire (Sections A–G) + automated risk score/tier
               → Claude DPA generator (Markdown) + DPA status workflow + derived 30-day expiry alerts
               → Public signed-token questionnaire (admin client, no vendor login) + 20-vendor India library
               → Reuses the M5 DSR + M4 grievance patterns; mirrors M9 share-token for the public link
               → Prompt: implementation/Prompt_Library/P1_M7_Vendor_DPA_Manager.md

✅ Session 8:  M6 ROPA Builder (complete) — third P1 module
               → Table: ropa_entries (db/ropa.sql — run manually)
               → CRUD + draft→active→archived workflow + server-side DPO approval (one-click approve+activate)
               → AI-assisted entry (claude-sonnet-4-6, structured JSON, client-safe prompt builder + defensive sanitizer)
               → ROPA_INDUSTRY_TEMPLATES library + "Add from template"; ROPA↔Consent read-time cross-ref (no stored column)
               → PDF register (@react-pdf) + hand-rolled CSV (no new deps); processor pre-fill from M7 vendors
               → Plain dashboard/ropa/ (no public routes, no middleware change); activate ropa sidebar
               → Prompt: implementation/Prompt_Library/P1_M6_ROPA_Builder.md

✅ Session 9:  M8 Breach Response (complete) — last P1 module
               → Table: breach_incidents (db/breach_incidents.sql — run manually; per-org composite reference index, escalations_sent[])
               → CRUD + open→contained→resolved workflow + 72-hour DPBI countdown DERIVED at read time (client-safe countdown.ts, ticks client-side, no cron)
               → Claude DPBI notification draft (claude-sonnet-4-6, formal letter, officer pulled server-side, persisted) + Mark-DPBI-Notified + data-principal notification + post-mortem (server-side timestamps)
               → Secret-gated escalation runner (POST /api/breach/escalations/run, CRON_SECRET, idempotent escalations_sent[], Resend DPO email; needs an external scheduler)
               → Plain dashboard/breach/ (no public routes, no middleware change); activate breach sidebar
               → Prompt: implementation/Prompt_Library/P1_M8_Breach_Response.md

🎉 ALL MODULES COMPLETE — M1–M10 built. Remaining: apply M6 + M8 SQL in Supabase, then full QA click-through.

📋 Planning Phase — Session 10: Implementation planning for all P1.5 + P2 + P3 + P4 modules complete.
               → All 35 modules designed (P0: 7 ✅, P1: 4 ✅, P1.5: 4 🔲, P2: 10 🔲, P3: 6 🔲, P4: 5 🔲)
               → All prompt files created in implementation/Prompt_Library/
               → Implementation_Planner/ folder: 10 planning docs (00–05, 06–10, 12)
               → Next: execute P1.5 FIX1–FIX4 (tag v1.5.1 → v1.5.4) then P2 (v2.1.0 → v2.10.0)
```

---

## Session Notes

### Session 1 — M1 Compass Assessment ✅ COMPLETE + TESTED

**Files created:**
- `src/lib/constants.ts`, `src/lib/assessment-questions.ts`, `src/types/dpdp.ts`
- `src/middleware.ts`
- `src/lib/ai/compass-scorer.ts`, `src/lib/ai/gap-generator.ts`
- `tailwind.config.ts` (updated — added truststack colors)
- `src/app/(auth)/layout.tsx`, `login/page.tsx`, `signup/page.tsx`, `create-organization/page.tsx`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/organizations/create/route.ts` (server-side, admin client — fixes RLS issues)
- `src/components/dashboard/Sidebar.tsx`, `Topbar.tsx`
- `src/app/dashboard/layout.tsx`, `page.tsx`, `overview/page.tsx`
- `src/components/modules/assessment/` — 5 components
- `src/app/api/assessment/` — 4 routes
- `src/app/dashboard/assessment/` — list, new, [id], results/[id] pages

**Issues fixed during testing:**
1. Supabase project region changed from Sydney → Mumbai (data residency for DPDP)
2. RLS infinite recursion on `organization_members` — fixed by removing self-referencing subquery
3. Missing INSERT policies on `organizations` and `organization_members` — added
4. Browser client JWT unreliable post-signup — org creation moved to server-side API route

**SQL applied in Supabase (Mumbai project):**
- Full M1 schema (5 tables + RLS policies) from Step 3 of P0_M1 prompt
- 3 additional RLS fix policies (see Key Decisions above)

### Session 1b — Industry-Specific Layers ✅ COMPLETE

**Files modified:**
- `src/types/dpdp.ts` — Extended `AssessmentSection` to include `industry_fintech`, `industry_healthtech`, `industry_edtech`
- `src/lib/constants.ts` — Added `INDUSTRY_SECTION_LABELS` export; added industry sections to `ASSESSMENT_SECTION_LABELS`
- `src/lib/assessment-questions.ts` — Added `FINTECH_QUESTIONS` (FIN1–FIN8), `HEALTHTECH_QUESTIONS` (HLT1–HLT8), `EDTECH_QUESTIONS` (EDT1–EDT8), and `getIndustryQuestions(industry)` function
- `src/lib/ai/gap-generator.ts` — Added `INDUSTRY_GAP_OVERRIDES` map (fintech, healthtech, edtech), added GAP_MAP entries for all 24 industry question IDs, updated `generateGaps()` to accept `industry: string | null`, added `forcePriority` support for EdTech Q9/Q19
- `src/lib/ai/compass-scorer.ts` — Imports all three industry question arrays; scoring loop iterates over ALL_QUESTIONS so industry answers contribute to Compass Score
- `src/app/api/assessment/save-answer/route.ts` — Updated question lookup to search all question arrays (accepts FIN1–FIN8, HLT1–HLT8, EDT1–EDT8)
- `src/app/api/assessment/submit/route.ts` — Fetches org industry from DB; passes to `generateGaps()`
- `src/app/dashboard/assessment/[id]/page.tsx` — Fetches org industry on mount (parallel with answers); builds `effectiveSections` dynamically; shows Section 9 with industry-specific questions for fintech/healthtech/edtech; other industries see no Section 9

**New files:**
- `src/app/api/organizations/me/route.ts` — GET endpoint returning current user's org (used by assessment page to determine industry)

**Key decisions:**
- `bfsi` industry normalizes to `fintech` for override lookups — same RBI/DPDP obligations apply
- EdTech Q9 (children's data) and Q19 (parental consent) use `forcePriority: 'p0'` — partial answers do NOT downgrade these; they remain P0 always
- Industry questions auto-save via the existing debounced save-answer route (no changes to save logic needed)
- `npm run type-check` passes with zero errors

### Session 2 — M4 Grievance Officer Portal ✅ COMPLETE

**Files created:**
- `src/lib/constants.ts` — Added `COMPLAINT_TYPES`, `GRIEVANCE_LANGUAGES`; enabled `grievance` in `SIDEBAR_MODULES`
- `src/components/modules/grievance/ComplaintStatusBadge.tsx`
- `src/components/modules/grievance/GrievanceOfficerCard.tsx`
- `src/components/modules/grievance/GrievanceOfficerForm.tsx`
- `src/components/modules/grievance/ComplaintsTable.tsx`
- `src/components/modules/grievance/ComplaintDetail.tsx`
- `src/components/modules/grievance/PublicComplaintForm.tsx`
- `src/app/api/grievance/officer/route.ts` — GET + POST (deactivates old officer on update)
- `src/app/api/grievance/submit/route.ts` — Public POST, no auth, generates GRV-YYYY-NNN, Resend email
- `src/app/api/grievance/complaints/route.ts` — Authenticated GET with filter + search + pagination
- `src/app/api/grievance/complaints/[id]/route.ts` — Authenticated GET + PATCH
- `src/app/dashboard/grievance/page.tsx` — Officer card + stats + recent complaints
- `src/app/dashboard/grievance/complaints/page.tsx` — Full complaints list with filter/search/pagination
- `src/app/dashboard/grievance/complaints/[id]/page.tsx` — Complaint detail + status update
- `src/app/public/grievance/[slug]/page.tsx` — Public form (no auth), server component, shows officer contact info

**Key decisions:**
- Officer "edit" deactivates the previous officer and inserts a new record (audit trail preserved)
- Public submit endpoint dynamically imports Resend to avoid crashing when `RESEND_API_KEY` is absent
- Email failure is silently swallowed — submission always returns `reference_number`
- `/public/grievance/*` is not in middleware's `PROTECTED_PREFIXES` — works without auth
- `npm run type-check` passes with zero errors

**Pre-launch step required:**
- ✅ SQL run in Supabase — `grievance_officers` and `grievance_complaints` tables created with RLS
- ✅ `RESEND_API_KEY` added to `.env.local`

**Post-M4 fixes (same session):**
- Navbar: Added Login + Sign Up Free buttons to desktop nav and mobile drawer
- Grievance dashboard: Added 30s polling + `visibilitychange` auto-refresh so complaint count updates when switching back from public form tab
- Resend email: Changed `from` from `noreply@truststack.in` (unverified) → `noreply@anixai.io` (verified). Added proper error logging — was silently swallowing failures before.
- Middleware: Added `/api/consent/withdraw` to `PUBLIC_API_ROUTES` proactively for M2
- M2 prompt (`P0_M2_Consent_Management.md`) fixed:
  - `src/app/(dashboard)/consent/` → `src/app/dashboard/consent/` (route group bug would have bypassed auth)
  - `/api/v1/consent/...` → `/api/consent/...` (aligned with MASTER_CONTEXT canonical paths)
  - Added Step 4 (middleware update), Step 6 (activate sidebar)
  - Added M4 to prerequisites
- `MASTER_CONTEXT.md` updated with full M4 section under "What Is Already Built"
- `progress.md` (this file) fully synced

### Session 3 — M2 Consent Management ✅ COMPLETE

**Files created:**
- `src/types/dpdp.ts` — Extended `ConsentPurpose` (added multilingual fields, organization_id), removed `purposes` JSONB from `ConsentConfig`, added `ConsentRecord`, `ConsentChannel`, `ConsentStats`
- `src/lib/constants.ts` — Activated consent in `SIDEBAR_MODULES` (`available: true`), added `DEFAULT_PURPOSES` and `CONSENT_TRANSLATIONS` exports
- `src/app/api/consent/config/route.ts` — Public GET, returns widget config + purposes, 5-min Cache-Control
- `src/app/api/consent/record/route.ts` — Public POST, hashes identifier + IP (SHA-256 with org salt), records consent event
- `src/app/api/consent/withdraw/route.ts` — Public POST, marks consent records as withdrawn for hashed identifier
- `src/app/api/consent/manage/route.ts` — Auth GET (returns config + purposes), Auth POST (upserts config, deletes + re-inserts purposes, bumps widget_version)
- `src/app/api/consent/audit/route.ts` — Auth GET, paginated consent_records with channel + date filters
- `src/app/api/consent/stats/route.ts` — Auth GET, returns total/consent_rate/withdrawals/by_channel for current month
- `src/app/dashboard/consent/page.tsx` — Home: status banner, ConsentStatsCard, EmbedCodeSnippet, purpose list, CTA when unconfigured
- `src/app/dashboard/consent/configure/page.tsx` — 4-step wizard: Purposes → Languages → Customize → Preview & Save
- `src/app/dashboard/consent/audit/page.tsx` — Audit log page with AuditTable and privacy note
- `src/components/modules/consent/EmbedCodeSnippet.tsx` — Script tag snippet with copy button
- `src/components/modules/consent/ConsentStatsCard.tsx` — 4-card stats grid (total, rate, withdrawals, web)
- `src/components/modules/consent/PurposeEditor.tsx` — Add/edit/remove purposes with inline form, multilingual names, DPDP basis selector
- `src/components/modules/consent/WidgetPreview.tsx` — Live preview of consent banner (all 3 positions), click to expand purposes
- `src/components/modules/consent/AuditTable.tsx` — Paginated table, date/channel filters, CSV export
- `public/consent-widget.js` — Vanilla JS widget (IIFE, no deps), bottom-bar/corner/modal positions, multilingual (EN/HI/TA/TE), localStorage for remembered consent, silent error handling

**Key decisions:**
- `consent_purposes` table is source of truth; `consent_configs.purposes` JSONB column intentionally unused (avoids duplication)
- Manage POST deletes old purposes and re-inserts (simple, avoids complex merge logic)
- Widget generates a random UUID per browser and stores in localStorage as data principal identifier
- Widget fails silently on all network errors — consent UX must not block the host page
- `npm run type-check` passes with zero errors

**Pre-launch step:**
- ✅ M2 core SQL run in Supabase (`consent_configs`, `consent_purposes`, `consent_records` + RLS)
- ✅ `consent_config_versions` SQL run (`db/consent_config_versions.sql`) — immutable snapshots + RLS + current-version backfill

**Enhancements (same session — beyond original M2 scope):**
- **19-language widget** — added bn, kn, ml, pa, or, as, ur, sa, ne, ko, mai, doi, sd on top of en/hi/ta/te/mr/gu, generated into BOTH `public/consent-widget.js` and `CONSENT_TRANSLATIONS`. RTL (`dir="rtl"`) for ur/sd. Kashmiri (ks), Santali (sat), Manipuri (mni) deferred → English fallback (specialized scripts need professional localization).
- **detectLang hardened** — explicit `data-lang` always honored when a translation exists; only auto-detection is gated by the org's supported list.
- **Withdraw / preference-center** — floating "Privacy choices" button appears after consent; re-opens the banner with prior choices pre-filled + a Withdraw button (`/api/consent/withdraw`, clears localStorage, confirmation toast). Added `WD`/`CONF` translation maps + `renderFloatingButton`/`openManage`/`withdrawConsent`/`showConfirmation` in the widget.
- **Consent-rate metric fixed** in `stats/route.ts` — now % accepting ≥1 non-required purpose (was always ~100%).
- **Config version snapshots** — `consent_config_versions` table + `db/consent_config_versions.sql`; `manage/route.ts` writes a snapshot per save (best-effort); new `versions/route.ts`, `VersionHistory.tsx`, `versions/page.tsx`; AuditTable + CSV gained a Version column; status banner links to "View history".
- New types: `ConsentConfigVersion`, `ConsentConfigVersionPurpose`. `tsc --noEmit` passes clean.

**Testing (end-to-end, this session):**
- All 19 widget languages render correctly (Node VM harness against the real widget) + RTL verified; first-time banner, floating button, re-open and withdraw flows all pass.
- Audit log, stats (baseline 10/70%/0/10), withdraw API (incl. idempotency + edge cases), version bump (v2→v3→v4) and snapshot backfill all verified against live Supabase data.

### Session 4 — M3 Privacy Notice Builder ✅ COMPLETE

**Foundation / lib:**
- `src/lib/ai/notice-generator.ts` — `NOTICE_GENERATION_PROMPT` (exact, from prompt Step 5), `buildNoticeUserPrompt()` (assembles wizard data + authoritative org/officer), `buildTranslationSystemPrompt()`, `validateNotice()` (Step 7 compliance checks — shared by the builder UI and the publish route)
- `src/lib/markdown.ts` — dependency-free Markdown → sanitized HTML (`renderMarkdown`) + `extractHeadings` for the public-page TOC. HTML-escapes before formatting (XSS-safe for public rendering of free-text fields)
- `src/lib/constants.ts` — added `DATA_CATEGORIES` (+ `DATA_CATEGORY_GROUPS`), `THIRD_PARTY_CATEGORIES`, `NOTICE_LANGUAGES` (en/hi/ta/te/mr + content column map), `INDUSTRY_PURPOSES` + `getIndustryPurposes()` (bfsi→fintech, default fallback); flipped `privacy-notice` `SIDEBAR_MODULES` entry to `available: true`
- `src/types/dpdp.ts` — added `PrivacyNotice`, `PrivacyNoticeVersion`, and builder shapes (`NoticeCompanyDetails`, `NoticePurposeMapping`, `NoticeRetentionRule`, `NoticeSharing`, `NoticeBuilderData`)

**API routes (`/api/privacy-notice/`):**
- `route.ts` — Auth GET: org's notice + current version + full version history (returns `available:false` if tables not created yet)
- `save/route.ts` — Auth POST: ensure notice row, write a new immutable version snapshot (officer details captured server-side); returns `version.id`
- `generate/route.ts` — Auth POST: Claude (`claude-sonnet-4-6`) generates the English notice from wizard data + server-side org/officer; 400 if no officer
- `translate/route.ts` — Auth POST: Claude translates EN → target language (preserves Markdown)
- `publish/route.ts` — Auth POST `{version_id}`: server-side `validateNotice` gate, stamps `published_at`, sets `current_version_id`, flips `published=true`
- `[slug]/route.ts` — **Public** GET: admin client + `published=true` filter + CORS + OPTIONS

**Components (`src/components/modules/privacy-notice/`):**
- `NoticeBuilder.tsx` — 8-step wizard shell + generate/translate/save/publish orchestration + live compliance checklist
- `DataCategorySelector.tsx` (grouped checkbox grid + "Other"), `PurposeMapper.tsx` (per-category purpose + DPDP basis, industry-prefilled), `LanguageSelector.tsx` (EN locked), `NoticePreview.tsx` (language tabs + rendered Markdown), `VersionHistory.tsx`, `PublicNoticeView.tsx` (client: language toggle, sticky TOC, print-to-PDF, mailto officer)

**Pages:**
- `src/app/dashboard/privacy-notice/page.tsx` — home (status, public link, version history, 12-month staleness warning)
- `src/app/dashboard/privacy-notice/builder/page.tsx` — renders `NoticeBuilder`
- `src/app/public/[slug]/page.tsx` — public hosted notice (server component, admin client, `generateMetadata`)

**Middleware:** added `/api/privacy-notice/` to `PUBLIC_API_ROUTES` (public `[slug]` read; action sub-routes still self-enforce auth in-handler).

**Key decisions:** see Key Decisions Log (Session-4 rows) — `save` route added, server-side officer capture, admin-client public reads, dependency-free Markdown renderer, `claude-sonnet-4-6`.

**Verification:**
- `npm run type-check` ✅ passes (zero errors)
- `npm run build` (`next build`) ✅ succeeds — all M3 routes compile; fixed a **pre-existing** `/login` `useSearchParams`/Suspense blocker that was failing the build (unrelated to M3)
- ✅ **User-tested end-to-end**: both SQL files applied; a notice was published and the public page verified working. (Translation / multi-version history / RLS isolation were not separately reported but share the same wiring.)

**Follow-ups (same session, post-build):**
- Public page now renders an optional **org logo** (`organizations.logo_url`) beside the name — new migration `db/add_org_logo_url.sql`; wired through `[slug]` API + public page + `PublicNoticeView`; render-verified via a throwaway harness (logo `<img>` + alt confirmed in SSR HTML)
- Public page metadata now emits a **canonical URL** (`alternates.canonical = NEXT_PUBLIC_APP_URL/public/[slug]`)
- `type-check` + `next build` re-run clean after both additions

**Pre-launch step (done):**
- ✅ Both SQL files run in Supabase (`db/privacy_notices.sql` + `db/add_org_logo_url.sql`); first notice published and the public page verified.

### Session 5 — M9 Board Dashboard ✅ COMPLETE

**Last P0 module. TrustStack is now launch-ready (M1, M1b, M2, M3, M4, M9, M10 all ✅).** No new tables — M9 reads M1–M4 only.

**Dependency:** `@react-pdf/renderer@4.5.1` installed (first module to use it) + `serverExternalPackages: ['@react-pdf/renderer']` added to `next.config.ts`.

**Types (`src/types/dpdp.ts`):** `OverviewResponse` (+ `OverviewModuleStatus`, `TopAction`/`TopActionPriority`, `RecentActivityItem`/`ActivityType`, `OverviewStats`), `CompassScoreHistory`/`CompassScorePoint`, `BoardReportData` (+ `BoardReportModuleRow`/`BoardReportGapItem`/`BoardReportTimelineItem`).

**Lib (`src/lib/dashboard/`):**
- `aggregate.ts` — shared collector over M1–M4; `getOverviewData()` and `getReportFacts()`; pure helpers `computeEffectiveScore()` (Step 5), `maturityFromScore()`, `moduleToUrl()`. Degrades gracefully if a table is missing (null → "not set up"), so the dashboard never 500s.
- `report-content.ts` — `buildBoardReportPrompt()` (Step 6 prompt, exact), `buildReportHtml()` (HTML preview, XSS-escaped), `deterministicSummary()` (generate-route fallback + public view).
- `share-token.ts` — stateless HMAC-SHA256 signed token (secret = service-role key), 7-day expiry, timing-safe verify. No table.

**API routes (`src/app/api/dashboard/`):**
- `overview/route.ts` — GET (auth): one aggregated payload for the home.
- `compass-score/route.ts` — GET (auth): current + last 6 completed assessments.
- `report/generate/route.ts` — POST (auth): Claude `claude-sonnet-4-6` 3-sentence exec summary (deterministic fallback on failure) + HTML preview + structured report.
- `report/pdf/route.ts` — POST (auth) `{ report }`: streams `application/pdf` (`runtime = 'nodejs'`).
- `report/share/route.ts` — POST (auth): mints the public share URL.

**Components (`src/components/modules/board/`):** `ModuleStatusGrid`, `StatsRow`, `PriorityActionsCard`, `RecentActivityFeed`, `ComplianceCalendar`, and `BoardReportPDF.tsx` (server-only `@react-pdf` document — 5 pages + fixed footer; exports `renderBoardReportPdf()`). **Reused** `assessment/CompassScoreGauge.tsx` — no board duplicate created (note #6).

**Pages:**
- `src/app/dashboard/overview/page.tsx` — **replaced the M1 placeholder.** Greeting + Compass gauge (effective score) + trend, module status grid, 4 stat cards, priority actions (from real gaps), recent activity, compliance calendar. Empty state = onboarding actions + live 30-day plan (Step 7).
- `src/app/dashboard/reports/page.tsx` — date-range selector (defaults last 30 days), Generate, Download PDF, Share link (copies to clipboard), HTML preview.
- `src/app/public/board-report/[token]/page.tsx` — public (no auth), verifies token → admin-client aggregate → deterministic summary → rendered report; invalid/expired view.

**Sidebar:** added `reports` entry (`Board Reports`, `FileBarChart`) to `SIDEBAR_MODULES`; registered `FileBarChart` in `Sidebar.tsx` ICON_MAP.

**Key decisions:** see Key Decisions Log (Session-5 rows) — gauge reuse, effective-score headline + raw-delta trend, structured-`{report}` PDF body, signed-token share link, Layer-3 deferred.

**Verification:**
- `npm run type-check` ✅ zero errors.
- `@react-pdf/renderer` `renderToBuffer` ✅ produces a valid `%PDF-` buffer in this React-19 / Node-24 env (isolated test, incl. StyleSheet + percentage-width view).
- Dev server (`npm run dev -- --port 3011`) — all new routes compiled clean, no errors in log:
  - `GET /api/dashboard/overview` + `/compass-score` → **401** (auth-gated)
  - `POST /api/dashboard/report/{generate,pdf,share}` → **401**
  - `/dashboard/overview` + `/dashboard/reports` → **307 → /login**
  - `GET /public/board-report/<invalid>` → **200** "Link unavailable" (full public module graph renders)
- ⏳ **Authenticated click-through** (gauge count-up animation, real-data board, in-browser PDF download with all 5 pages, share-link open) left for user verification — same as prior modules.

**Pre-launch step required:** none new (M9 creates no tables/SQL). Optional: `truststack.in` Resend domain (carried over from M4).

**Post-M9 maintenance (same session):** cleared `npm audit` 7 → **0** — removed unused `ai` SDK, bumped Next `15.1.0 → 15.5.19`, added `overrides.next.postcss ^8.5.15`. type-check + dev boot + CSS pipeline re-verified. (The audit warnings were never from `@react-pdf/renderer`.)

### Session 6 — M5 DSR Management ✅ COMPLETE

**First P1 module. Structurally a twin of M4 Grievance — public submission → reference → DPO dashboard → status workflow → email — with one genuinely new capability: email-OTP identity verification.**

**Stack baseline:** Next `15.5.19`, `@react-pdf/renderer 4.5.1`, `npm audit` = 0 (unchanged — M5 added no dependencies; reuses `@anthropic-ai/sdk` + Resend already installed).

**DB (run in Supabase SQL Editor — ⏳ pending manual run):** `db/dsr_requests.sql` —
- `dsr_requests` (Step-3 schema verbatim) + RLS (`org members manage` + public `WITH CHECK (true)` insert).
- `dsr_nominations` (Section 15) + RLS — correlated to the requestor by `data_principal_hash` (sha256 `org:email`).
- `dsr_otps` (**new, M5-only**) — short-lived hashed OTP material; **RLS ON with NO policies**, so only the service-role admin client (the public OTP routes) can touch it.

**Constants (`src/lib/constants.ts`):** added `DSR_RIGHT_TYPES` (the 6 actionable rights — grievance/§14 intentionally excluded, links to M4) + `DSR_STATUS_LABELS`; flipped the `dsr` `SIDEBAR_MODULES` entry to `available: true` (icon `Users`, already registered in `Sidebar.tsx`).

**Types (`src/types/dpdp.ts`):** `DsrRightType`, `DsrStatus`, `DsrVerificationMethod`, `DsrRequest`, `DsrNomination`, `DsrStats`.

**Middleware:** added `/api/dsr/submit` + `/api/dsr/otp/` to `PUBLIC_API_ROUTES` (auth routes self-enforce in-handler).

**Lib (`src/lib/dsr/`):**
- `otp.ts` — **server-only**: `generateOtp` (crypto `randomInt`), `hashOtp` (sha256, request-id-salted), `hashDataPrincipal`, `otpExpiryIso`, `maskEmail`, `sendOtpEmail` (Resend, dynamic import, `noreply@anixai.io`).
- `sla.ts` — **client-safe** pure date math: `DSR_SLA_DAYS=30`, `dueDateFrom`, `daysRemaining`, `isOpen`/`isClosed`/`isOverdue`. Shared by components + the stats route.
- `draft.ts` — **client-safe** Claude prompt builders (no SDK import), mirroring `notice-generator.ts`.

**API routes (`/api/dsr/`):**
- `submit/route.ts` — **public**, admin client + CORS/OPTIONS. Generates `DSR-YYYY-NNN`, sets `due_date` = +30d, inserts request as `identity_pending`, writes a `dsr_nominations` row for `nominate`, then issues + emails an OTP. Always returns the reference + `otp_sent` (email failure is non-fatal).
- `otp/verify/route.ts` — **public**, admin client. Validates the hashed code (10-min TTL, ≤5 attempts), consumes it, flips `requestor_identity_verified=true` + `status='received'` + `verification_method='email_otp'`. On success, emails the org's active Grievance Officer (DPDP §14 contact / DPO) — best-effort, never blocks verification.
- `otp/resend/route.ts` — **public**, admin client. Invalidates outstanding codes, issues + emails a fresh one.
- `requests/route.ts` — auth GET, filter (status + right_type) + search + paginate.
- `requests/[id]/route.ts` — auth GET (+ linked nomination via the hashed principal) + PATCH (status / fulfillment_notes / denial_reason / assigned_to; stamps `fulfilled_at`).
- `stats/route.ts` — auth GET, accurate aggregate (total / open / identity_pending / **overdue derived** / fulfilled_this_month / by_right_type).
- `draft/route.ts` — auth POST, **optional** Claude `claude-sonnet-4-6` fulfillment/denial draft (mirrors `chat/route.ts`).

**Components (`src/components/modules/dsr/`):** `DsrStatusBadge`, `SlaIndicator` (green→amber→red countdown + overdue/closed), `DsrRequestsTable` (overdue rows tinted, identity-verified shield), `DsrRequestDetail` (identity banner, data-category chips, nominee panel, status workflow + AI-draft buttons), `PublicDsrForm` (4-step: select right → details → OTP → confirmation).

**Pages:**
- `src/app/public/dsr/[slug]/page.tsx` — public portal (server component, admin-client org load, `generateMetadata` + canonical).
- `src/app/dashboard/dsr/page.tsx` — home: portal link (copy + view), overdue alert, stats, recent requests, 30s poll + visibilitychange auto-refresh (M4 pattern).
- `src/app/dashboard/dsr/requests/page.tsx` — full list (status tabs + right-type select + search + pagination).
- `src/app/dashboard/dsr/requests/[id]/page.tsx` — detail wrapper.

**Key decisions:**
- **Email required on the DSR form** (phone optional) — email OTP is the only verification method built, and access/erasure need reliable identity. The DB column stays nullable per the given schema; the requirement is enforced in the form + submit route.
- **`dsr_otps` is a dedicated table with RLS-enabled / no-policies** (service-role-only) rather than columns on `dsr_requests` — keeps OTP hashes out of every request SELECT and supports clean resend/attempt-limiting.
- **Overdue is derived, not stored** — no cron to flip `status='overdue'`; `isOverdue()` = open && past `due_date`, applied in the table/stats/badge. The `'overdue'` enum value is kept for completeness.
- **Grievance (§14) links out to M4** — it's not a `dsr_requests.right_type`; the portal shows a 7th card linking to `/public/grievance/[slug]`.
- **Public submit uses the admin client** (matches M2/M3 public-route decision) — bypasses RLS reliably with no session; the `WITH CHECK (true)` insert policy is belt-and-suspenders.
- **Reference numbers are unique PER ORG, not globally** (fixed during M5 testing). `reference_number` was originally `UNIQUE` (global), but the generator counts per-org (`DSR-YYYY-NNN` restarts at 001 each org) — so a second org's first request would collide. Schema now uses a composite `unique (organization_id, reference_number)` index (`dsr_requests_org_reference_uniq`). Ripple: the public OTP routes (`otp/verify`, `otp/resend`) now accept `org_slug` and scope the reference lookup by org (a bare reference is no longer globally unique). **M4 grievance had the identical latent bug — fixed in P1.5 FIX1** (`db/fix_grievance_reference_unique.sql`; M4's generator was already org+year scoped, so only the schema constraint needed swapping). ✅ applied in Supabase, live.

**Verification:**
- `npm run type-check` ✅ zero errors.
- Dev server (`npm run dev -- --port 3011`) — all routes compiled clean, no errors:
  - `GET /api/dsr/{requests,stats}` + `GET /api/dsr/requests/[id]` + `POST /api/dsr/draft` → **401** (auth-gated).
  - `POST /api/dsr/submit` → **400** on each validation branch (right_type / email / details / nominee), **404** "Organization not found" for a fake slug (confirms admin client reaches Supabase), `OPTIONS` → **204** (CORS preflight).
  - `POST /api/dsr/otp/{verify,resend}` → **400** on missing fields.
  - `/dashboard/dsr` + `/dashboard/dsr/requests` → **307 → /login**.
  - `GET /public/dsr/<invalid>` → **404** (notFound).
- ⏳ **Authenticated + DB-backed click-through** (real submit → OTP email → verify → DPO workflow, SLA/overdue UI, AI draft) left for user verification after the SQL is applied — same as prior modules.

**Pre-launch step required:** run `db/dsr_requests.sql` in the Supabase SQL Editor (3 tables + RLS). `RESEND_API_KEY` already set (OTP + officer emails send from `noreply@anixai.io`).
- **If the schema was applied BEFORE the per-org-reference fix** (global `unique` already created), also run this one-time migration to switch to per-org uniqueness:
  ```sql
  alter table public.dsr_requests drop constraint if exists dsr_requests_reference_number_key;
  create unique index if not exists dsr_requests_org_reference_uniq
    on public.dsr_requests (organization_id, reference_number);
  ```

**Optional follow-up (out of M5 scope, per prompt note #8):** light up the M5 tile on the M9 board (`ModuleStatusGrid.tsx` + `aggregate.ts` currently read M1–M4 only).

### Session 7 — M7 Vendor DPA Manager ✅ COMPLETE

**Second P1 module. A CRUD + status + dashboard twin of M5 DSR / M4 Grievance, plus three genuinely new pieces: a 45-question weighted risk questionnaire, a Claude DPA generator, and a signed-token PUBLIC questionnaire (no vendor login).**

**Stack baseline:** unchanged — Next `15.5.19`, `@anthropic-ai/sdk 0.36.3` (`claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1` (not used by M7 — DPA export is Markdown + `window.print`), Resend `6.14.0`, `npm audit` = **0** (M7 added no dependencies).

**DB (run in Supabase SQL Editor — ⏳ pending manual run):** `db/vendors.sql` — `vendors` + `vendor_questionnaire_responses` + RLS (standard org-members policies querying `organization_members`; public submit uses the service-role admin client). Unique index on `(vendor_id, question_id)` for answer upserts. **No per-org reference number**, so the M4/M5 global-unique pitfall does not apply.

**Constants (`src/lib/constants.ts`):** added `VENDOR_TYPES`, `VENDOR_DPA_STATUS_LABELS`, `VENDOR_RISK_TIERS`, `DPA_EXPIRY_WARNING_DAYS` (30), and `INDIA_VENDOR_PREASSESSMENTS` (the spec's 10 + 10 more = **20**, clearly marked; library only, not bulk-inserted). Flipped the `vendors` `SIDEBAR_MODULES` entry to `available: true` (icon `Building2`, already registered). Added a type-only `import type { VendorType, VendorRiskTier }` at the top.

**Types (`src/types/dpdp.ts`):** `VendorType`, `VendorDpaStatus`, `VendorRiskTier`, `Vendor`, `VendorQuestionnaireResponse`, `VendorStats`.

**Middleware:** added `/api/vendors/questionnaire/` to `PUBLIC_API_ROUTES` (only the questionnaire sub-tree is public; the rest of `/api/vendors/*` self-enforces auth).

**Lib (`src/lib/vendors/`):**
- `questionnaire.ts` — **client-safe** 45-question bank (Sections A–G: Company/Data-Handling/Security/Sub-processors/Residency/Incident/DPDP), each scorable question carries a `weight` + `riskyAnswer`/option `risk`. (The spec's cited `09_Vanta analysis` isn't in the repo — questionnaire is self-contained.)
- `risk.ts` — **client-safe** `computeVendorRisk()` → `risk_score` (0–100, higher = riskier — inverse of Compass) + `risk_tier` (≤25 low / ≤50 medium / ≤75 high / else critical), normalised by answered weight (mirrors compass-scorer). `scoreForTier()` seeds a score for library adds.
- `status.ts` — **client-safe** DERIVED expiry helpers `daysUntilExpiry`/`isExpired`/`isExpiringSoon(…,30)`/`effectiveDpaStatus`/`dpaNeedsAttention` (analog of `dsr/sla.ts`; no cron, read-time only).
- `dpa.ts` — **client-safe** Claude prompt builders (no SDK import).
- `token.ts` — **server-only** HMAC-SHA256 signed questionnaire token (copied from M9 `share-token.ts`), 30-day TTL.
- `email.ts` — **server-only** `sendQuestionnaireEmail` via Resend (dynamic import, `noreply@anixai.io`).

**API routes (`/api/vendors/`):** `route.ts` (auth GET list + POST create/library), `[id]/route.ts` (auth GET+PATCH+DELETE), `stats/route.ts` (auth aggregate, expiry derived), `[id]/dpa/route.ts` (auth Claude `claude-sonnet-4-6` DPA gen), `[id]/send-questionnaire/route.ts` (auth — token + Resend, flips pending→sent), `questionnaire/submit/route.ts` (**public**, admin client + CORS/OPTIONS — token-verified, upserts answers, recomputes risk, infers India residency from E1).

**Components (`src/components/modules/vendors/`):** `VendorStatusBadge`, `VendorRiskBadge`, `DpaExpiryIndicator`, `VendorsTable` (attention-tinted rows), `VendorFormModal` (add/edit), `VendorLibraryPicker` (Add-from-library), `DpaPreview` (Markdown + copy/download/print), `VendorDetail` (DPA workflow + AI gen + send-questionnaire + responses), `PublicVendorQuestionnaire` (sectioned wizard).

**Pages:** `dashboard/vendors/page.tsx` (home), `.../vendors/list/page.tsx` (registry), `.../vendors/[id]/page.tsx` (detail), `public/vendor-questionnaire/[token]/page.tsx` (public, server component, admin-client token load).

**Key decisions:**
- **Risk is the INVERSE of the Compass Score** — higher vendor `risk_score` = more residual risk. The questionnaire encodes which answer is risky per question (`riskyAnswer`) or per select-option (`risk`); the scorer normalises by answered weight so partial completion isn't penalised on the denominator.
- **DPA expiry is DERIVED, never auto-flipped** — `effectiveDpaStatus` shows a lapsed signed DPA as "expired" and `isExpiringSoon(…,30)` drives the dashboard alert. `dpa_status='expired'` can still be set manually. No cron.
- **Public questionnaire = stateless signed token + admin client** (no vendor login, no token table) — mirrors M9 share-token + M2/M5 public-route admin-client pattern. Only `/api/vendors/questionnaire/` is whitelisted in middleware. Submit recomputes risk server-side and never returns the internal score/tier to the vendor.
- **DPA export = Markdown + `window.print`** (reuses `src/lib/markdown.ts`) — no `@react-pdf` dependency added (same call as M3's print-to-PDF). The Claude SDK call lives only in the route; the prompt builder is client-safe.
- **Pre-assessed India library is a constant, added per-org on demand** (note #10). Spec listed 10 but described 20 → seeded the 10 verbatim + 10 more clearly-marked India-resident SaaS vendors (validate before customer use).
- **`dpa_document_url`** holds a link to an externally-hosted signed copy; the AI-generated DPA text is returned to the client for review/print and is not persisted (schema has no DPA-body column).

**Verification:**
- `npm run type-check` ✅ zero errors.
- Dev server (`next dev --port 3011`) — all vendor routes compiled clean, no log errors:
  - `GET /api/vendors`, `/stats`, `/[id]` + `POST /[id]/dpa`, `/[id]/send-questionnaire` → **401** (auth-gated).
  - `OPTIONS /api/vendors/questionnaire/submit` → **204**; `POST` with no token → **400**, bad/unsigned token → **401**.
  - `/dashboard/vendors`, `/vendors/list`, `/vendors/[id]` → **307 → /login**.
  - `GET /public/vendor-questionnaire/<bad-token>` → **200** ("Link unavailable").
  - `npm audit` = **0**.
- ⏳ **Authenticated + DB-backed click-through** (add vendor → send questionnaire email → vendor submits → risk auto-scores → generate DPA → sign/expire workflow + expiry alerts) left for user verification after the SQL is applied — same as prior modules.

**Pre-launch step required:** run `db/vendors.sql` in the Supabase SQL Editor (2 tables + RLS). `RESEND_API_KEY` already set (questionnaire emails send from `noreply@anixai.io`).

**Optional follow-up (out of M7 scope, per prompt note #13):** light up the M7 tile on the M9 board (`ModuleStatusGrid.tsx` + `aggregate.ts` currently read M1–M4 only — M5 and M7 are both not yet surfaced there).

### Session 8 — M6 ROPA Builder ✅ COMPLETE

**Third P1 module. A CRUD + status + dashboard twin of M7 Vendor / M5 DSR, with four reused-pattern pieces: an industry-template library, a structured-JSON AI-assist, a read-time ROPA↔Consent cross-reference, and server-side DPO approval. INTERNAL only — no public routes, middleware untouched.**

**Stack baseline:** unchanged — Next `15.5.19`, `@anthropic-ai/sdk 0.36.3` (`claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1`, Resend `6.14.0`, `npm audit` = **0** (M6 added no dependencies — CSV is hand-rolled).

**DB (run in Supabase SQL Editor — ⏳ pending manual run):** `db/ropa.sql` — `ropa_entries` (Step-3 schema, arrays defaulted `'{}'`) + RLS (standard `org members manage ropa` policy) + org-scoped indexes (`organization_id, created_at desc` and `organization_id, status`). No per-org reference number, so the M4/M5 global-unique pitfall does not apply. Internal-only → no public policy.

**Constants (`src/lib/constants.ts`):** added `ROPA_SUBJECT_TYPES` (customers/employees/children/vendors/website_visitors), `ROPA_STATUS_LABELS`, `ROPA_INDUSTRY_TEMPLATES` (fintech/healthtech/edtech/ecommerce/hrtech) + `DEFAULT_ROPA_TEMPLATE` + `getRopaTemplates()` (bfsi→fintech, default fallback; mirrors `getIndustryPurposes`) + co-located `RopaTemplateActivity` interface; flipped the `ropa` `SIDEBAR_MODULES` entry to `available: true` (icon `Database`, already registered). Reuses `DPDP_BASES`, `DATA_CATEGORIES`/`DATA_CATEGORY_GROUPS`. Added `RopaSubjectType` to the top type-only import.

**Types (`src/types/dpdp.ts`):** `RopaStatus`, `RopaSubjectType`, `RopaEntry`, `RopaConsentCoverage`, `RopaStats`, `RopaAiSuggestion`.

**Lib (`src/lib/ropa/`):**
- `ai.ts` — **client-safe** (no SDK): `ROPA_AI_SYSTEM_PROMPT`, `buildRopaSuggestPrompt()` (enumerates allowed category keys / subject types / legal-basis ids), `sanitizeRopaSuggestion()` (filters enums, drops unknown keys, caps lengths).
- `consent.ts` — **client-safe** pure matcher: `computeConsentCoverage()` / `buildCoverageMap()`, token-overlapping each consent-based activity's purposes + category labels against the org's M2 `consent_purposes`. `CONSENT_LEGAL_BASIS = 'consent_s6'`.

**API routes (`/api/ropa/`):** `route.ts` (auth GET list/filter[status,subject_type]/search/paginate + inline coverage map + POST create/template), `[id]/route.ts` (auth GET+coverage / PATCH edit + DPO-approval + validated draft→active→archived transitions / DELETE), `stats/route.ts` (auth aggregate + consent gap counts), `ai-suggest/route.ts` (auth Claude `claude-sonnet-4-6`, structured JSON, defensively parsed), `export/pdf/route.ts` (auth, `@react-pdf` register, `runtime='nodejs'`), `export/csv/route.ts` (auth, hand-rolled RFC-4180 CSV + UTF-8 BOM). Coverage is served inline by list/detail/stats — a separate `/consent-coverage` route would be redundant, so it was not built.

**Components (`src/components/modules/ropa/`):** `RopaStatusBadge`, `RopaConsentBadge` (configured/missing/N-A), `RopaTable`, `RopaEntryForm` (create/edit + AI-assist panel + vendor processor-chip cross-link), `RopaTemplatePicker` (reads org industry from `/api/organizations/me`), `RopaEntryDetail` (approval workflow + status quick-actions + field display + edit/delete), `RopaReportPDF.tsx` (server-only `@react-pdf` register, `renderRopaReportPdf()`).

**Pages:** `dashboard/ropa/page.tsx` (home — stats, consent-gap alert, exports, 30s + visibilitychange refresh), `.../ropa/list/page.tsx` (status tabs + subject-type select + search + pagination), `.../ropa/[id]/page.tsx` (detail; refreshes coverage after edits). Plain `dashboard/ropa/` folder.

**Key decisions:** see Key Decisions Log (M6 rows) — read-time consent cross-ref (no stored column), server-side `approve:true` = approve+activate atomically, structured-JSON AI-assist parsed defensively, per-org "Add from template" library + `@react-pdf` PDF / hand-rolled CSV (zero new deps).

**Verification:**
- `npm run type-check` ✅ zero errors (fixed two `Set<string>` typings — `DPDP_BASES` ids infer as a literal union).
- `npm audit` = **0**; `package.json` / lock unchanged (no new deps).
- Dev server (`npm run dev -- --port 3011`) — all routes compiled clean:
  - `GET /api/ropa`, `/stats`, `/[id]`, `/export/{pdf,csv}` + `POST /api/ropa`, `/ai-suggest` → **401** (auth-gated; the 401 on `export/pdf` confirms the `@react-pdf` import graph loads without error).
  - `/dashboard/ropa` + `/list` + `/[id]` → **307 → `/login?redirectTo=…`** (confirms the plain `dashboard/` folder, not a route group).
- ⏳ **Authenticated + DB-backed click-through** (template add → AI-assist fill → DPO approve+activate → consent badge configured/missing → PDF/CSV export) left for user verification after the SQL is applied — same as prior modules.

**Pre-launch step required:** run `db/ropa.sql` in the Supabase SQL Editor (1 table + RLS + 2 indexes). No new env vars (reuses `ANTHROPIC_API_KEY` for AI-assist).

**Optional follow-up (out of M6 scope, per prompt note #13):** light up the M6 tile on the M9 board (`ModuleStatusGrid.tsx` + `aggregate.ts` read M1–M4 only — M5, M6, M7 are all not yet surfaced there).

### Session 9 — M8 Breach Response ✅ COMPLETE

**The last P1 module — all 10 modules (M1–M10) are now built. TrustStack's most unique feature: a 72-hour DPBI-specific breach workflow no competitor has. A CRUD + status + dashboard twin of M5 DSR / M6 ROPA / M7 Vendor, with: a per-org sequential reference (M5), a Claude notification draft (M7 DPA), a DERIVED 72-hour countdown (M5 SLA / M7 expiry), and secret-gated email escalations. INTERNAL only — no public routes, middleware untouched.**

**Stack baseline:** unchanged — Next `15.5.19`, `@anthropic-ai/sdk 0.36.3` (`claude-sonnet-4-6`), `@react-pdf/renderer 4.5.1` (not used by M8), Resend `6.14.0`, `npm audit` = **0** (M8 added no dependencies). New optional env var: `CRON_SECRET`.

**DB (run in Supabase SQL Editor — ⏳ pending manual run):** `db/breach_incidents.sql` — `breach_incidents` + RLS (standard org-members policy) + **composite per-org `(organization_id, reference_number)` unique index** (NOT global — the M4/M5 pitfall, fixed up-front) + `escalations_sent text[]` + org-scoped indexes (org+status, org+created_at desc, org+dpbi_notification_due_at, org+dpbi_notified). Internal-only → no public policy.

**Constants (`src/lib/constants.ts`):** `BREACH_NATURE_TYPES` (6), `BREACH_STATUS_LABELS` (open/contained/resolved), `DPBI_DEADLINE_HOURS=72`, `BREACH_ESCALATION_HOURS=[48,24,12,6,2]`; flipped the `breach` `SIDEBAR_MODULES` entry to `available:true` (`AlertTriangle` already registered). Reuses `DATA_CATEGORIES` for affected categories. Added `BreachNature` to the top type-only import.

**Types (`src/types/dpdp.ts`):** `BreachNature`, `BreachStatus` (open/contained/resolved — DPBI-notified is a separate boolean, deliberately not a status), `BreachUrgency`, `BreachIncident`, `BreachStats`.

**Lib (`src/lib/breach/`):**
- `countdown.ts` — **client-safe** pure date math (analog of `dsr/sla.ts` + `vendors/status.ts`): `dueAtFrom`, `hoursRemaining`, `minutesRemaining`, `isOverdue`, `urgencyLevel` (normal/warning/critical/overdue), `formatCountdown`, `needsDpbiNotification`. DERIVED at read time, no cron.
- `notification.ts` — **client-safe** Claude prompt builders (no SDK): `DPBI_SYSTEM_PROMPT` + `buildDpbiUserPrompt()` (exact Rule 7 prompt; formal LETTER, not JSON). `DpbiContact` injected server-side.
- `escalation.ts` — **server-only** `sendBreachEscalationEmail` via Resend (dynamic import, `noreply@anixai.io`).

**API routes (`/api/breach/`):** `route.ts` (auth GET list/filter[status,nature]/search/paginate + POST log — per-org `BRH-YYYY-NNN`, `dpbi_notification_due_at`=discovered+72h, `logged_by` server-side), `[id]/route.ts` (auth GET + PATCH: validated open→contained→resolved with `resolved_at` stamping, `mark_dpbi_notified`/`principals_notified` server-side timestamps, post-mortem), `stats/route.ts` (auth aggregate, derived overdue/due_soon), `[id]/dpbi-draft/route.ts` (auth Claude `claude-sonnet-4-6`, officer pulled server-side, persisted), `escalations/run/route.ts` (**no session**, `CRON_SECRET`-gated, admin client, idempotent).

**Components (`src/components/modules/breach/`):** `BreachStatusBadge`, `BreachCountdown` (pill for the table + live ticking `banner` for the detail — `setInterval(1000)`), `BreachTable` (the register; overdue rows tinted), `BreachDetail` (live countdown + DPBI draft gen/copy/download + mark-notified + principal notification + status workflow + post-mortem), `BreachLogModal` (log-incident form, mirrors `RopaEntryForm`; datetime-local → ISO conversion client-side).

**Pages (`src/app/dashboard/breach/`):** `page.tsx` (home — stats, alert, live active-incident countdowns, recent, 30s+visibilitychange refresh, log modal → detail), `list/page.tsx` (register — tabs + nature filter + search + pagination), `[id]/page.tsx` (detail wrapper). Plain `dashboard/breach/` folder (verified 307→/login).

**Key decisions:**
- **72-hour countdown is DERIVED at read time, no cron** — `dpbi_notification_due_at` is stamped on create (discovered+72h) for indexed scans; `countdown.ts` re-derives remaining time + urgency; the detail banner ticks client-side (`setInterval`) so it's minute-accurate with zero polling. Nothing flips status automatically. (Same philosophy as M5 `isOverdue` / M7 `effectiveDpaStatus`.)
- **Reference per org, not global (fixed up-front)** — the Step-3 SQL's global `UNIQUE` on `reference_number` was dropped in favour of a composite `(organization_id, reference_number)` unique index; the generator counts the org's incidents for the year (`BRH-YYYY-NNN` restarts at 001 each org). Avoided the latent M4 bug before it shipped.
- **DPBI-notified is a BOOLEAN, not a status** — kept lifecycle `status` as `open|contained|resolved` and drove the "DPBI notified" state off `dpbi_notified`; the schema's overlapping `'dpbi_notified'` status value is unused (note 7). All workflow timestamps (`dpbi_notified_at`, `principals_notified_at`, `resolved_at`) are stamped server-side in the PATCH handler.
- **DPBI draft = formal LETTER (not JSON)** — prompt builder is client-safe (no SDK), the `@anthropic-ai/sdk` call (`claude-sonnet-4-6`) lives in `[id]/dpbi-draft`; the "Contact person for DPBI follow-up" (Rule 7 field 7) is pulled from the org's active `grievance_officers` row SERVER-SIDE (like M3's notice officer), never the client; the returned draft is persisted to `dpbi_notification_draft` so it re-loads. 400 if no Grievance Officer is appointed.
- **Escalation emails need a SCHEDULER — built honestly** — the countdown is derived, but the alert emails genuinely need an external trigger. `POST /api/breach/escalations/run` is idempotent, gated by `CRON_SECRET` (header `x-cron-secret` or `Authorization: Bearer`), uses the admin client (no session), finds open + un-notified breaches whose remaining time crossed an un-alerted threshold, emails the org's DPO (active Grievance Officer) via Resend, and records the crossed thresholds in `escalations_sent[]` (union per run → one email even if several thresholds lapsed between runs; un-sent if there's no DPO yet or the email fails, so it retries). **Emails do NOT auto-send** — wiring Vercel Cron (`vercel.json`) / a GitHub Action / Supabase `pg_cron` (~every 15 min) to hit the endpoint is a documented deployment step, like applying the SQL.
- **No new dependencies** — DPBI draft download is a client-side text Blob; `npm audit` stays **0**.

**Verification:**
- `npm run type-check` ✅ zero errors.
- `npm audit` = **0**; `package.json` / lock unchanged.
- Dev server (`npm run dev -- --port 3011`) — all routes compiled clean:
  - `GET /api/breach`, `/stats`, `/[id]` + `POST /api/breach`, `/[id]/dpbi-draft` → **401** (auth-gated).
  - `POST /api/breach/escalations/run` with no secret → **401**, with a wrong secret → **401** (correctly denied).
  - `/dashboard/breach`, `/breach/list`, `/breach/[id]` → **307 → `/login?redirectTo=…`** (confirms the plain `dashboard/` folder, not a route group).
- ⏳ **Authenticated + DB-backed click-through** (log incident → live countdown → generate DPBI draft → mark notified → resolve + post-mortem; escalation email via a real scheduler) left for user verification after the SQL is applied — same as prior modules.

**Pre-launch step required:** run `db/breach_incidents.sql` in the Supabase SQL Editor (1 table + RLS + composite reference index + 4 indexes). To enable escalation alerts: set `CRON_SECRET` in `.env.local` (+ production env) and point a scheduler at `POST /api/breach/escalations/run`. `ANTHROPIC_API_KEY` (DPBI draft) + `RESEND_API_KEY` (escalation emails) already set.

**Optional follow-up (out of M8 scope, per prompt note #13):** light up the M5/M6/M7/M8 tiles on the M9 board (`ModuleStatusGrid.tsx` + `aggregate.ts` read M1–M4 only).
