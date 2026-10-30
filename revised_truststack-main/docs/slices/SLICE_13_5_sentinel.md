# SLICE 13.5 — Sentinel™ S2–S3: continuous compliance assurance

**STUB.** Promoted to a full prompt by the Sync Step of Slice 13 (D-009, D-141).
Do not run a session from this file.

**Branch:** `slice/13-5-sentinel` · **Est:** 2 sessions · **Target:** 7–14 Dec 2026 (moved by Slice 12.3)

## Intent
The approved design in `docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` **Step 3** (decisions Q1–Q6,
28 Oct 2026): DPDP duties as controls, tested daily and on change, with a tamper-evident ledger.

## DPDP anchoring (to be expanded)
The 23-control library in Step 3 §3.3 — each control's provision checked in the Gazette text (Act
s.4–17 and the Schedule; Rules 3–15). Rule numbers: rights R.14, SDF R.13, cross-border R.15,
contact R.9, one-year logs R.6(1)(e) and R.8(3).

## Must not be lost when promoted
- **No Sentinel score** — a status line and counts; findings feed the existing exposure model (Q1).
- **Essentials for every client** (CONTACT-01, RIGHTS-01, BREACH-01, RETENTION-01, VENDOR-01,
  NOTICE-01); Lite / Sentinel / Critical as a module under feature selection (Q2, F-67).
- Statuses: Pass · Needs attention · Failing · Not applicable; unknown = Needs attention (D-026).
  **The AI never sets a status.**
- TrustStack defaults labelled as such and changeable per client, audited (Q4).
- Alerts: Failing → immediate email + an action on the one actions list (source "Sentinel");
  Needs attention → daily digest; back to Pass → auto-resolve; **legal-clock Failing emails cannot be
  switched off** (Q5).
- Ledger: append-only tenant table, RLS, no UPDATE/DELETE grant; SHA-256 chain; ids and counts only,
  never personal data; a `verify` function.
- Runs on Slice 13's worker + Postgres runner — self-hostable (Slice 15).
- Never "compliant" or "certified": "posture as of [date]".
