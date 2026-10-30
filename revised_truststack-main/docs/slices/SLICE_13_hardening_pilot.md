# SLICE 13 — Hardening and launch readiness (no pilot — D-067)

**STUB.** Promoted to a full prompt by the Sync Step of Slice 12.5 — Packs I (D-009, D-141).
Do not run a session from this file. If you are reading it as the current
slice, the previous Sync Step was skipped — go and do it first.

**Branch:** `slice/13-hardening-pilot` · **Est:** 2 sessions · **Week:** 21

## Intent
Security pass, performance, the three release gates, the 18-step UAT script with real Mumbai University stakeholders, and retirement of the old app. **There is no pilot (D-067):** this slice makes the platform launch-ready; the launch itself is the end of Slice 14, once licensing exists.

## DPDP anchoring (to be expanded)
The full production security baseline in spec Step L, and every acceptance criterion in Step P.

## Must not be lost when promoted
- (D-141) **Sentinel (Slice 13.5) builds on this slice:** a job runner that is a worker + Postgres
  (daily 06:00 IST and on-change queues; idempotent), never a Vercel-only cron, so client-hosted installs
  work (Slice 15); an email sender with an SMTP option; evidence expiry (EVIDENCE-01); a "notice sent"
  fact for Rule 8(2) and a log-retention period field (RETENTION-02, LOGS-01). Design:
  `docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` Step 3.
- Release rule: **no go-live with an open P0 or P1.**
- Automate the golden path in Playwright. The old app's manual QA sign-off was open ten weeks and blocked beta — do not repeat it (D-012).
- Decommission: archive `aniketmhala/dpdp`, move `app.truststack.co.in` here.
- No client is ever on both systems at once.
- (D-040, D-067) **The Anix-side console and licensing are Slice 14, not this
  slice** — and they are a launch blocker. Do not widen the hardening pass with
  them; do not launch without them.
- (D-067) **Launch blockers owned by this slice:** evidence expiry (D-049 — for
  answers AND ROPA records), MFA, failed-access logging, action and review
  reminders (Slice 6/7 loops), a paid production Supabase project with backups
  and a separate staging project (the dev project lapses 2026-11-02),
  `app.truststack.co.in`, DMARC to quarantine, a live e2e run from CI (not a
  laptop), and the pre-existing `pnpm audit` findings in `next`/`postcss` and
  Prisma tooling.
- (D-067) **Content blockers (not code, but no launch without them):** counsel
  review of the lawful-ground, Fourth Schedule and retention vocabularies
  (D-065); a DPDP-practitioner sign-off of the ROPA risk model 1.0.0; a legal
  citation on every published question (0 of 1,527 today); the Resend DPA and
  vendor-register entry (D-030).
- (Slice 11 close, 2026-10-22 — D-134.10, D-136) **The AI assistant before launch:** `AI_ENABLED`
  stays unset on the live site until A1 (the provider's DPA, zero data retention) and the client DPA's
  AI sub-processor clause are signed (SLICE_11 §6); counsel's A4 (sector) and A5 (retention, fallback
  models) sign-offs. **Hindi and Marathi wording rules** for translations — 1a's wording rules match
  English only — written with a native-speaker reviewer. **Reading the contents of uploaded evidence**
  needs an extraction sandbox first (SLICE_11 §3). **Decommission:** the old app's AI routes
  (`src/app/api/privacy-notice/{generate,translate}`, `src/app/api/dsr/draft`, `src/lib/breach/notification.ts`)
  are replaced by Slice 11's drafts — retire them with the old app.

