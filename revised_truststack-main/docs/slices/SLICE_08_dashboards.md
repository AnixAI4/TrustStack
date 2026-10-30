# SLICE 8 — Dashboards

**Branch:** `slice/08-dashboards` · **Est:** 1–2 sessions · **Week:** 12 ·
**Ships:** the view leadership actually reads — one overview of where the
organisation stands (readiness score, 16-domain scorecard, evidence
confidence), what is being done about it (gaps and actions from BOTH the
assessment and the ROPA register, by owner and by due date), and how complete
its processing register is — every number read from what the engine and the
database already derived, none recomputed in the browser.

> Promoted 2026-10-03 by the Slice 7 Sync Step; **re-checked 2026-10-03
> against `main` at `714749c`** (Slice 7 merged). Every path, route, symbol,
> count key, spec heading, e2e prefix and tenant id named below exists there.
> If anything has drifted since, the code wins.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-011, D-020, D-038,
   D-040, D-046, D-050, D-052, D-053, D-054, D-055, D-057, D-058, D-060,
   D-061, D-062, D-065, D-066, D-067**), this file, and `docs/spec/04_AI_Dashboards_Security_Steps_J-L.md`
   §Step K (dashboards) and `03_*.md` §"ROPA Dashboard Metrics" (frozen —
   cite, never edit).
2. Confirm Slice 7 is merged and verified live (STATE).
3. `git checkout main && git pull && git checkout -b slice/08-dashboards`.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green.
   Docker running. Baseline to match (Slice 7 final, from zero locally): core
   **752**, web unit **315**, RLS **307**, e2e **189**. **Stop any `pnpm dev`
   first** (pitfall 9).
5. **Develop against a local Supabase stack**, exactly as Slice 7 did:
   `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
   export its `DB_URL`/`API_URL`/keys as `DIRECT_URL`, `DATABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET` (`.github/workflows/app.yml`). For `pnpm dev`
   against it, drop a gitignored `apps/web/.env.development.local` with those
   values (it beats the `.env.local` symlink, which points at hosted) and
   **delete it again** before the session ends. There is no `psql` on the
   laptop: `docker exec -i supabase_db_truststack psql -U postgres -d postgres`.
6. **The hosted project is provisioned until 2026-11-02** (STATE). If sign-in
   returns "fetch failed", it has lapsed — fall back to the local stack.
7. The platform is sold per client, per industry (D-040). Nothing here may be
   University-specific; every view must work for Bharat Manufacturing's EMPTY
   state (no assessment answers, no ROPA records) as well as MU's.
8. **Do not merge your own PR.** Open it, let CI run, leave the merge to Aniket.

## 1. DPDP anchoring

Rule 6(c) asks for monitoring and review of the safeguards in place; s.8(1)
makes the Data Fiduciary accountable regardless of who does the work. A
dashboard is how a Board or a Registrar exercises that accountability: what
is the position, what is outstanding, who owns it, what is late. It is a
READINESS view (D-011) — never "compliant", never "certified".

## 2. Goal

1. **An executive overview** (`/dashboard`): the DPDP Compass Readiness Score
   with its coverage line and band, evidence confidence, red flags, and the
   headline counts of open gaps, overdue actions and ROPA completeness.
2. **A 16-domain scorecard** that keeps Scoped Out, all-N/A and scored domains
   visibly distinct (D-038), with the applicable-weight denominator (D-050).
3. **A gap/action dashboard across BOTH parents** — a LAUNCH REQUIREMENT
   (D-067): a client must never need two pages to see everything they owe.
   Assessment gaps and ROPA gaps (D-060, D-062): by severity, by owner (a person — Unassigned is a real
   bucket), by due window (30/60/90, overdue), each item labelled by source.
4. **A ROPA dashboard** — the spec's ten metrics (§5), all already counted by
   `GET …/ropa` or derivable from its rows without new arithmetic rules.
5. **The question-bank browser becomes a black box** (D-040, carried since
   Slice 3).
6. **The assessment page collapses by domain** (carried since Slice 5).

## 3. Scope

**In:** the overview; the scorecard; the gap/action and owner-wise views; the
ROPA dashboard; the black-box bank; collapsing the assessment page; RBAC so an
executive sees everything and can change nothing.

**Out:** PDF/DOCX reports and the worker (Slice 9); trend lines across
assessments (Slice 12 — there is one baseline today); reminders and emails
(Slice 13); AI summaries (Slice 11); any new derived number. If a tile needs a
figure no endpoint returns, the figure belongs in `packages/core` or SQL with a
mirror test — not in a component.

## 4. Decide explicitly (record each in DECISIONS)

1. **Which score the overview shows.** `LatestScore` (`app/dashboard/latest-score.tsx`)
   today shows the LIVE score of "the newest assessment with answers, else the
   newest". Once an assessment is finalised, a Board wants the FROZEN snapshot
   (`GET …/score` returns it when finalised — read `lib/assessments/score.ts`).
   Recommended: show the latest FINALISED snapshot when one exists, labelled
   with its date, and the live score of the assessment in progress beside it,
   labelled as provisional. Never mix the two in one number.
2. **One aggregate endpoint, or the existing ones.** PRD US-10 wants under 3 s
   on the MVP dataset. The overview needs the score, the assessment gaps, the
   ROPA register's counts and its gaps — four requests today, each with its
   own permission. Recommended: ONE `GET /organizations/{id}/dashboard` that
   calls the EXISTING server readers (`lib/assessments/score.ts`,
   `lib/gaps/shape.ts` `readGaps`, `lib/ropa/shape.ts` `readAllRecords` /
   `readRopaGaps`) and returns their outputs side by side, omitting any section
   the caller lacks the permission for. It adds no arithmetic of its own.
3. **The black-box bank (D-040).** `/dashboard/questions` and
   `GET /question-packs` list all 20 packs to everyone with `question.read`.
   A client should see only the packs THEIR assessment was generated from
   (`assessments.pack_codes`); Anix staff keep the full view. Gate the full
   view on a NEW permission (e.g. `question.read_bank`) granted to
   `super_admin` and `consultant` — a matrix change, so core + a migration in
   one PR (D-020), and `tests/unit/rbac-matrix.test.ts` must pass. Never a
   role-code check in a handler.
4. **Owner-wise across both parents.** `gap_actions.owner_user_id` is the
   owner for both kinds (D-060). Decide how a ROPA action and an assessment
   action are labelled side by side (recommended: source + context — the
   question's domain for one, the record code and rule for the other — as
   `app/dashboard/ropa/gaps/ropa-gaps.tsx` already does for the roadmap).
5. **Charts.** No chart library is installed. A new npm dependency is a stack
   change (CLAUDE.md) and needs its own entry. Recommended: plain SVG/CSS bars
   and stat tiles — the data is a handful of counts. **Load the `dataviz`
   skill before writing any chart, tile or palette.**
6. **Collapsing the assessment page.** It renders an answer panel for all 124
   questions (STATE, Slice 5 loops). Decide: collapse by domain with the
   domain tile as the header, open on demand — and keep every existing test id
   the e2e suite relies on reachable.

## 5. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Live score + snapshot | `GET …/assessments/{id}/score` → `lib/assessments/score.ts` | `domains[]` carry `code`, `state` (`scored` · `scoped_out` · `not_applicable`), `score`, `weight`, `evidenceConfidence`, coverage; finalised → the snapshot, never recomputed (D-052) |
| Score tile | `app/dashboard/latest-score.tsx`, `…/[assessmentId]/score-panel.tsx`, `domain-score-tile.tsx` | Coverage line `X / 93 applicable weighted points` already rendered on the score panel |
| Assessment gaps | `GET …/assessments/{id}/gaps` → `{ frozen, stale, counts, gaps[].actions[], members }` | `counts` = open gaps by severity + `supersededCount` |
| ROPA register | `GET …/ropa` → `counts: { total, archived, approved, belowUsable, highRisk, children, reviewOverdue, byBand }`, `records[]` (summary rows) | `records[]` carry `childrenData`, `aiProcessing`, `riskRating`, `completenessBand`, `nextReviewAt` |
| ROPA gaps | `GET …/ropa/gaps` → `{ counts, stale, generated, gaps[]: { recordCode, label, severity, priority, state, actions[] } }` | Actions have `gapId: null`, `ropaGapId` set. FIFTEEN rules since D-065 — incl. `child_consent_missing`, `child_tracking` (Critical), `processor_contract_missing` (High) |
| ROPA lookup | `GET …/ropa/lookup?principal=` · `?systemId=` · `?vendorId=` (D-066) | Read-only; a "records touching X" tile can call it rather than re-derive anything |
| ROPA structure | each record's `lawfulBasis`, children's duties, `retentionTrigger`, `safeguards`, `vendorContractGaps` (D-065) | Dashboard counts like "records with no lawful ground" or "processors without a contract" read these stored fields |
| Roadmap maths | `roadmapWindow`, `isOverdue`, `ROADMAP_WINDOW_LABEL` in `packages/core/src/gaps.ts` | Reuse — the only date arithmetic the browser may do |
| Roadmap UI | `app/dashboard/assessments/[assessmentId]/gaps/roadmap.tsx` — takes `RoadmapGap[]` since Slice 7 | Works for both parents; the ROPA page passes `domainName: "ROPA-001 · No owner"` |
| Action editor | `…/gaps/action-editor.tsx` — takes an optional `actionUrl` since Slice 7 | Same editor for both parents |
| ROPA labels | `ROPA_POSITIONING`, `BAND_STYLE`, `RISK_STYLE` in `lib/client/ropa.ts`; `ROPA_BANDS`, `ROPA_RISK_LABEL` in core | Completeness is NOT the readiness score — label it |
| Permissions | executive_sponsor = read-only work + `report.download`, `ai.use`, `audit.read_summary` | Holds `score.read`, `gap.read`, `ropa.read`, NOT `gap.write` / `ropa.write` |
| Today in India | `todayInIndia()` in `lib/client/gaps.ts` (browser) and `lib/ropa/shape.ts` (server) | D-055 — never `new Date().toISOString().slice(0,10)` |

## 6. Data model

Probably none, beyond §4.4.3's permission (a migration that inserts one
permission and its role grants, with `rbac-matrix.test.ts` green). If you find
yourself adding a table, stop: a dashboard reads, it does not store.

## 7. Core logic — `packages/core`

Only what more than one view needs and the browser must not invent: e.g.
grouping actions by owner across both parents, or bucketing them by
`roadmapWindow`. Pure functions over the API's shapes, with tests. Nothing
that recomputes a score, a severity, a completeness or a risk rating.

## 8. API

All `withApi`, nested under `/organizations/[id]/` (D-035), each with a
route-sweep probe in **both** directions:
- `GET …/dashboard` (§4.4.2) — sections omitted, never errored, when a
  permission is missing; Bharat Manufacturing's empty state returns empty
  sections, not 404s.
- `GET /question-packs` and `…/[code]/questions` filtered for clients (§4.4.3).

## 9. UI

- `/dashboard` becomes the executive overview. Plain language (D-040); no
  question code, pack code or trigger expression; **never the word
  "compliant"** (a test already pins this for the ROPA pages — extend it).
- Readiness score and ROPA completeness on DIFFERENT tiles with different
  labels: one is the DPDP Compass Readiness Score, the other "how complete the
  processing register is". They are never added, averaged or charted together.
- Red flags and gaps on different tiles (D-046 vs D-054).
- Every tile states its source and, where it applies, that it is provisional,
  frozen, or stale.

## 10. Tests

| Test | Where | Assertion |
|---|---|---|
| no recomputation | unit | the dashboard route imports no scoring, completeness or risk function — it calls the readers |
| black box | rls + e2e | a client role sees only its assessment's packs; a consultant sees all 20 |
| matrix | unit | the new permission is in core AND the migration (`rbac-matrix.test.ts`) |
| read-only executive | e2e | the Dean sees every tile and no Save, Generate, Approve, Reopen, Attach or Import control anywhere — on the overview, the gap register AND the ROPA pages |
| both parents | e2e | an overdue ROPA action and an overdue assessment action both appear in the owner-wise and roadmap views, labelled by source |
| empty state | e2e | Bharat Manufacturing's overview renders with no assessment answers and no ROPA records |
| < 3 s | e2e | the overview's API call for MU returns inside budget against the local stack |
| gate 5 | route sweep | every new route, both directions |

## 11. Seed data

Nothing new is needed: MU has a scored baseline, one gap and action, ten ROPA
records; BML is the empty state. ROPA gaps are generated on request (D-062) —
an e2e test that needs them generates them on records IT creates.

## 12. Definition of Done

The 10 gates, plus: the §4 decisions recorded; no number on any dashboard
that the engine or the database did not produce; the black-box bank; an
executive who can read everything and change nothing.

## 13. Sync step

Update `STATE.md`; append `DECISIONS.md`; **promote `SLICE_09`** (reports)
against the real snapshot, gap and ROPA shapes — its ROPA summary and evidence
index read `GET …/ropa` and `GET …/ropa/export`'s column order; stub-check
`SLICE_10`. Already decided — do not re-decide: the readiness score and ROPA
completeness are separate models (D-061, pitfall 2 below); ROPA actions live
on the shared table and are shown on the register page (D-062).

## 14. Known pitfalls

1. **Never recompute in the UI.** Every number is the engine's or the
   database's. The browser may bucket a STORED date with core's
   `roadmapWindow` and count rows it was given — nothing else.
2. **Two scoring models exist** (Slice 7). Completeness /100 and the risk
   rating describe the REGISTER; the DPDP Compass Readiness Score describes
   the ASSESSMENT. Never on one tile, never summed, never on one axis. A full
   register does not raise the readiness score (D-035).
3. **`gap_actions.gap_id` is NULL for every ROPA action** (D-060, D-062).
   Anything that joins actions to `assessment_gaps` silently drops them; read
   `ropa_gap_id` too. `lib/gaps/shape.ts` `readGaps` reads by `gap_id IN (…)`
   on purpose — it is the assessment register, not "all actions".
4. **The seeded ROPA review dates are 2026-10-03.** From 2026-10-04 (India)
   every seeded record's review is overdue: `counts.reviewOverdue` is 10 on a
   fresh MU and `review_overdue` gaps open on generation. A test that asserts a
   date-dependent count on seeded data fails on a calendar day, not on a code
   change — assert on records the test creates, with explicit dates.
5. **The ROPA gap codes changed once already** (D-065: `children_unreviewed`
   became `child_consent_missing` + `child_tracking`). Key any tile on the
   gap's `severity` and `label` from the API, not on a hard-coded list of codes.
6. **ROPA gaps are not seeded and can be stale.** `GET …/ropa/gaps` says
   `generated: false` until someone generates, and `stale: true` after the
   register changes. A dashboard shows both states honestly. (On HOSTED, MU's
   66 ROPA gaps were generated by the live e2e run of 2026-10-03; a fresh
   seed — local or CI — has none.)
7. **PostgREST caps a response at 1,000 rows.** `readAllRecords` pages; a
   dashboard query over actions or records must too (pitfall 19 of Slice 7).
8. **"Owner-wise" is a person** (`owner_user_id`), never `owner_role` (the
   question's authored text). Unassigned is a real bucket and usually the
   biggest one.
9. **`next dev` and `next build` share `apps/web/.next`.** Stop the dev server
   before `pnpm build` or `pnpm test:e2e`; Playwright reuses an existing server
   on port 3100 locally, so a dev server left on that port is what the suite
   tests.
10. From Slice 6: **floating point at a boundary** — none of this slice's
   numbers are computed, so none should meet a boundary; if one does, it is in
   the wrong place.
11. From Slice 6: **CHECK constraints are evaluated in name order**; a
    trigger refuses before a CHECK does. Assert the code the user actually
    gets (Slice 7 hit this twice: `TS404` before an FK, `TS422` before a CHECK).
12. **Each e2e spec file needs its OWN name prefix** per table.
    Taken (assessments): `E2E keystone%`, `E2E evidence UI%`, `E2E UI %`,
    `E2E API assessment%`, `E2E scoring API%`, `E2E scoring UI%`,
    `E2E gap register API%`, `E2E gap register UI%`. Taken (ropa_records):
    `E2E ROPA API%`, `E2E ROPA UI%`. Disposable tenant ids `…a003` to `…a007`
    are taken. Only `muItSecurity` and `muLegal` may join a disposable tenant.
13. **The hosted dev database is not quiet** (pitfall 14 of Slice 7): manual
    tests leave assessments, actions and ROPA records behind. Assert on rows
    the test creates.
14. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; seed
    counts in `app.yml` (now ending `…/1/1/10/10/1/0`); `service_role` only in
    `lib/supabase/admin.ts`; `git add <paths>`; the live e2e needs
    `--workers=1` and rarely completes cleanly from a laptop — record what
    happened, CI on `main` is authoritative; verify live after merge.
