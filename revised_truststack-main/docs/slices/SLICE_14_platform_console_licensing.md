# SLICE 14 — Platform console, licensing, and the production launch

**STUB.** Promoted to a full prompt by the Sync Step of Slice 13.5 — Sentinel (D-009, D-141). **Target: 15–23 Dec 2026** (moved by Slice 12.3, multi-level assessment Step 7).
Do not run a session from this file. If you are reading it as the current
slice, the previous Sync Step was skipped — go and do it first.

**Branch:** `slice/14-platform-console-licensing` · **Est:** 2 sessions · **Week:** 22–23

## Intent
Make TrustStack sellable to every client from day one, then **launch it**. An
Anix-side console that sees every client, and a licence per client organisation
that decides what that client may use. **There is no pilot (D-067):** the
production launch is the end of this slice, and Mumbai University is its first
production client.

## DPDP anchoring (to be expanded)
The console handles every client's organisational data at once, so it is the
most sensitive screen in the product: Rule 6 safeguards and Rule 6(c) logging
apply with full force, and **tenant isolation must survive a user who can see
across tenants**.

## Must not be lost when promoted
- (D-141, analysis Steps 2 and 6) **Feature selection (F-67):** the client's admin ticks modules on one
  visual screen and sees the fee change; or "Everything" at a fixed fee (the default). A small core is
  always on (scope, assessment, evidence, gaps, ROPA, dashboard, core reports, users, audit, **Sentinel
  Essentials**). Unticking removes a tool, never a duty: the screen says what the law still requires and
  records the client's confirmation. On at once; off at the period end; data kept read-only, never
  deleted. Enforced server-side in the API guard; for client-hosted installs the module list is in the
  signed offline licence (Slice 15).
- (D-141) One licence per **organisation**; one industry per **unit** when multi-entity ships (refines
  D-040 then, with its own decision entry). Licence first; the small-business tier with self-serve
  billing (F-68) is Phase C.
- (D-141) The console shows **Sentinel posture across clients** (managed assurance) and publishes
  approved **industry packs** as signed, versioned bundles (F-62).
- **The operating model (D-040):** one client = one tenant = one industry = one
  licence. The client's admin manages it, alone or with an Anix consultant. To
  the client the platform is a black box.
- **Decide the licence shape before promoting this slice** — it is a commercial
  decision, not code. What does a licence grant (the industry? seats?
  assessments per year? modules)? What happens at expiry — read-only, or locked?
  Who issues it? May an organisation hold more than one industry?
- **`super_admin` has no cross-tenant power today, by design** (Slice 1). A
  console that sees across tenants is a deliberate, narrow exception: its own
  permission, its own audited routes, and a route sweep that proves an ordinary
  admin still cannot reach another tenant through it.
- **Industry-pack approval belongs here.** Only `CORE_DPDP_V1` and the University
  packs are `approved` today (D-032); the other nine overlays each need the same
  overlap exercise University had (`OVERLAP_UNIVERSITY_CORE.md`). The console is
  where Anix approves a pack once that is done.
- **Question content editing** (`admin.question.update`, super_admin only) has
  sat unused in the permission matrix since Slice 1. If it is built here, a
  published question version stays immutable: an edit is a new version (D-033,
  D-034), and no finalised assessment may change.
- A licence **gates access**; it must never change a finalised score, a report
  or an evidence record. Expiry is read-only at worst, never deletion — clients
  have retention obligations of their own.
- Licence checks belong in the `withApi` guard chain, after tenancy and before
  permission, so every route inherits them — not in individual handlers.
