# SLICE 7 — ROPA / Processing Activity Register

**Branch:** `slice/07-ropa` · **Est:** 2 sessions · **Week:** 11 ·
**Ships:** a register of what personal data the organisation processes, for
whom, why, where and with whom — each record scored for completeness out of
100, rated for risk, importable from the spreadsheet the client already has,
and feeding the same remediation roadmap as the assessment.

> Promoted 2026-10-02 by the Slice 6 Sync Step, and re-checked the same day
> against `main` @ `6ba76b2` after Slice 6 merged: every path, function and
> count named below exists there. The workbook facts in §4 were read from the
> `.xlsx` cells, not from memory.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-008, D-011, D-020,
   D-023, D-026, D-027, D-034, D-035, D-039, D-040, D-042, D-043, D-044,
   D-053, D-056, D-057, D-058, D-059, D-060**), this file, and
   `docs/spec/03_Assessment_Templates_ROPA_Steps_G-I.md` §Step I (frozen —
   cite it, never edit it).
2. Confirm Slice 6 is merged and verified live (STATE).
3. `git checkout main && git pull && git checkout -b slice/07-ropa`.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green.
   Docker running. The baseline to match: core **605**, web unit **207**, RLS
   **248**, e2e **157**. **Stop any `pnpm dev` first** — `next dev` and
   `next build` share `apps/web/.next`, and a dev server left running makes
   local builds and e2e fail in ways that look like code bugs (pitfall 15).
5. **Develop against a local Supabase stack**, not the hosted project:
   `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
   then export its `DB_URL`/`API_URL`/keys as `DIRECT_URL`, `DATABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET` (`.github/workflows/app.yml`). Environment beats
   `.env.local` everywhere. To iterate on a migration locally, recreate the
   stack (`supabase stop --no-backup`, then `start`) — it takes about a minute
   and proves the chain applies from zero. Apply to hosted with
   `pnpm db:migrate` **only when the migration is final**, then do not touch
   the file again, not even a comment.
6. **The hosted project is provisioned until 2026-11-02** (STATE). If sign-in
   returns "fetch failed", it has lapsed — fall back to the local stack.
7. The platform is sold per client, per industry (D-040). Nothing here may be
   University-specific: the ten MU records are SEED DATA, not the model.
8. **Do not merge your own PR.** Open it, let CI run, and leave the merge to
   Aniket — merging deploys to production. (GitHub auto-merge is switched off
   for this repository, so it cannot be queued either.)

## 1. DPDP anchoring

The Act never says "ROPA". What it does require — a notice that itemises the
personal data and its purpose (s.5, Rule 3), processing limited to that
purpose, erasure when the purpose is served (s.8(7), Rule 8), reasonable
security safeguards (Rule 6), and accountability for every Data Processor
engaged (s.8(2)) — cannot be shown without knowing what is processed, where,
and by whom. The register is how an organisation knows.

**Positioning, verbatim from the spec:** "ROPA / Processing Activity Register
… a practical DPDP readiness artifact. It should not be overclaimed as a
statutory GDPR-style ROPA requirement." Every screen, export and report says
*readiness*, never *statutory record* (D-011).

## 2. Goal

1. **A register**: one record per processing activity, owned by a department.
2. **A completeness score /100** per record, on the spec's thirteen areas.
3. **A risk rating** per record that rises with children's data, AI, vendors,
   unknown location and missing retention.
4. **Import** from Excel/CSV with column mapping, where a bad row is shown for
   correction and never fails the whole file; **export** of the register.
5. **ROPA-driven gaps** feeding the existing action workflow and roadmap.

## 3. Scope

**In:** the record tables and their links to departments, systems and vendors;
completeness; risk; a lifecycle; import and export; ROPA gaps; evidence on a
record; a register UI and a record form.

**Out:** AI-drafted records (Slice 11 — and the AI may never approve one);
the executive ROPA dashboard (8); the PDF summary (9); suggesting records from
the scope wizard or from weak inventory answers (a later slice — the spec
rates the second "Medium"); API import from an ERP/LMS (the spec says Future);
reassessment of records (12).

## 4. The workbook, precisely (read from the cells)

### 4.1 What is there
`ROPA_Register` has **10 records** (`ROPA-001`…`ROPA-010`) and **24 columns**:

`ROPA ID · Processing Activity · Department / Owner · Data Principal Type ·
Personal Data Categories · Purpose · DPDP Basis / Legal Review · Collection
Source · System(s) · Processor / Vendor · Sharing / Disclosure · Retention
Rule · Security Safeguards · Notice Linked · Consent Linked · Rights Workflow ·
Grievance Linked · Children Data? · Cross-Border? · AI / Automated? ·
Evidence · Risk Rating · Last Reviewed · Next Review`

Every cell is **typed text** — there is not one formula on the sheet (checked
across all of it). `Risk Rating` is entered by hand: **2 Critical · 5 High ·
3 Medium**. The three yes/no columns are not yes/no: `Children Data?` holds
`Yes / Needs review` (2), `Possible under-18 / Needs review` (1), `Possible`
(5) and `No` (2); `Cross-Border?` holds `Unknown` (8), `Likely / Unknown` (1)
and `Possible` (1); `AI / Automated?` holds `No` (8), `Yes` (1) and `Possible
analytics` (1). An importer that expects booleans rejects most of the sheet.

### 4.2 What that means
- **There is no completeness score in the workbook.** The thirteen weights
  come from the spec only (§4.3). So, unlike Slices 5 and 6, **this slice has
  no oracle at all** — every rule needs its own tests, and "matches the
  workbook" is not a claim available to it.
- **The workbook's risk rating is an opinion, not a derivation.** If the slice
  derives risk (§4.4.3), the ten seeded ratings are a sanity check on the
  rules, not a parity gate — say which ones disagree and why.
- **Systems, vendors and Data Principal types are free text** ("Admission
  portal, ERP"; "Portal vendor, cloud provider, SMS/email vendor"). MU's
  seeded registers (Slice 2: 9 systems, 3 vendors, 6 Data Principal types)
  will not match them one for one. See §4.4.6.
- The spec's "Core ROPA Fields" tables list about fifty fields; the workbook
  has 24. The workbook is what a client can actually fill in.

### 4.3 The completeness weights (spec Step I — the only source)

| Area | Weight | | Area | Weight |
|---|---:|---|---|---:|
| Processing activity identity | 8 | | Vendors/processors involved | 8 |
| Department and owner | 8 | | Notice/consent linkage | 8 |
| Data Principal type | 8 | | Retention and erasure | 8 |
| Personal data categories | 10 | | Security safeguards | 8 |
| Purpose and DPDP basis note | 10 | | Risk rating and review date | 6 |
| Collection source | 6 | | Evidence linkage | 4 |
| Systems involved | 8 | | **Total** | **100** |

Bands: 0–30 Incomplete · 31–60 Basic · 61–80 Usable · 81–100 Strong.

**This total must be exactly 100 and a test must fail if it is not** — the
same invariant as the domain weights (D-006, D-036), on a different table.

### 4.4 Decide explicitly (record each in DECISIONS)

1. **Which fields.** Recommended: the workbook's 24, plus the few the spec
   marks Required that a completeness area needs (description, status,
   version). The other ~25 spec fields are a backlog, not a migration.
2. **What "complete" means for each of the thirteen areas.** Non-blank text?
   A real link? Is `Unknown` complete? Recommended: **`Unknown` and "To be
   legally reviewed" are NOT complete** — they are honest, and they are also
   exactly the gap (D-026: unknown behaves as risk, never as an answer). Write
   the rule per area as data, so the UI can say which area is missing.
3. **Risk: derived, entered, or both.** Recommended: a derived FLOOR from the
   spec's ten risk factors, which an assessor may RAISE but never lower — the
   same direction as the evidence cap (D-039). Whichever: the rating shown is
   stored, with the factors that produced it, so a report can say why.
4. **Stored or computed.** A score that reports and exports quote must not
   change between two reads of the same record. Recommended: derived by the
   database on write (the D-044 pattern) and CHECKed, with core holding the
   same rule and a mirror test (D-053).
5. **The lifecycle.** The spec lists nine statuses. Recommended for the pilot:
   `draft → in_review → approved → archived`, with `approved` needing a
   reviewer who is not the record's owner — the D-043 / D-056 separation of
   duties. Decide what an edit to an approved record does (reopen it?).
6. **Free text versus links.** Recommended: keep the imported text AND offer
   links to the Slice 2 registers through join tables with composite FKs
   (`ropa_systems`, `ropa_vendors`). A record whose systems are text only is
   legal — and counts as less complete than one that is linked? Decide.
7. **Where a ROPA gap's action shows up.** D-060 settled the tables (own gap
   table, shared `gap_actions`). But the roadmap lives on an ASSESSMENT page
   and a ROPA register belongs to the ORGANISATION. Decide where a client
   sees ROPA actions — and note `gap_actions` rows will then exist with no
   assessment behind them.
8. **The import parser.** `packages/core` must stay dependency-free, so `.xlsx`
   parsing cannot live there (D-034 hit this for the core pack and used a
   Python tool at build time — not an option for a user's upload). A new npm
   dependency is a **stack change and needs its own decision entry**: which
   library, where it runs (server route — the file is untrusted input), the
   size limit, and that **formula cells are read as values, never evaluated**.
   CSV-only is a legitimate MVP answer; say so if chosen.
9. **`data_categories`.** Slice 2 deferred it here. A controlled vocabulary,
   free text, or both? The workbook's column is free text.

## 5. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Departments, systems, vendors, Data Principal types | Slice 2 tables, each with `UNIQUE (organization_id, id)` | Composite FKs from the new tables (D-027) |
| Scope answers and risk tags | `organization_scopes`; `deriveRiskTags` in `packages/core/src/scope.ts` | Children, AI, cross-border and vendor signals already exist at ORGANISATION level — a record's risk is its own |
| Plain CRUD pattern | `apps/web/lib/scope/registers.ts` + `…/{departments,systems,vendors}` routes | RLS write policies, not RPCs (D-023); validate references BEFORE insert and compensate (D-027.4) |
| Permissions | `ropa.read`, `ropa.write` — already in the matrix; `ropa.write` is CONTRIBUTOR + PROGRAMME | A new permission (e.g. approving a record) is a matrix change and a migration (D-020) |
| Audit | `app.audit_scope_change('<prefix>')`, **latest body in `…20261002000000_gaps_actions/migration.sql`** | If you add metadata keys, `CREATE OR REPLACE` from THAT body, not Slice 4's |
| Gap actions | `gap_actions`, `app.gap_action_before_update()`, `closureDecision()` in `packages/core/src/gaps.ts` | D-060: add a nullable `ropa_gap_id`; **do not build a second action table** |
| Roadmap | `roadmapWindow()`, `isOverdue()` in core; `…/gaps/roadmap.tsx` | Buckets by stored due date; needs no change to accept ROPA actions |
| Evidence | `evidence_links` accepts `assessment_response` and `gap_action` | A THIRD type here — see §6 |
| Bulk-write audit | `public.set_assessment_questions`, `public.generate_assessment_gaps` | One row per import carrying a count, never one per record |
| Workbook extraction | `tools/extract_core_pack.py` — already opens this workbook and emits two committed fixtures, `--check`ed in `docs.yml` | Extend it to emit the ten ROPA rows as a third fixture |
| The `ROPA` domain's score | `assessment_questions` where `domain_code = 'ROPA'` (weight 6) | Scored from QUESTIONS only (D-035). See pitfall 1 |

## 6. Data model

Migration `…_ropa`:
- **`ropa_records`** (tenant): the fields decided in §4.4.1, `department_id`
  (composite FK), `owner_user_id`, `status`, `version`, `completeness_score`,
  `completeness_band`, `risk_rating`, `risk_factors`, `last_reviewed_at`,
  `next_review_at`, `created_by`. A human-readable `record_code` unique per
  organisation (`ROPA-001`) — not the primary key.
- **`ropa_systems`**, **`ropa_vendors`** (tenant join tables, composite FKs on
  both sides) if §4.4.6 goes that way.
- **`ropa_gaps`** (tenant, derived, SELECT-only to users — the
  `assessment_gaps` grant shape) and **`gap_actions.ropa_gap_id`** (D-060):
  make `gap_id` nullable, add the composite FK, and a CHECK that exactly one
  of the two parents is set. `app.gap_has_human_work`, `gap_action_after_delete`
  and the freeze are keyed on `gap_id` today — read them before changing it.
- **Widen `evidence_links` to a third type.** Follow Slice 6's shape exactly:
  a branch in `app.evidence_link_before_insert`, the same early return in the
  two AFTER triggers (a ROPA record has no score to re-derive), and a rule in
  `app.evidence_link_before_delete`. **Copy the function bodies from the
  Slice 6 migration**, which is where the `gap_action` branches live — copying
  Slice 4's or 5's would silently drop them. The CHECK
  `evidence_links_entity_type_check` is dropped and re-added, as Slice 6 did.
- RLS: read for members with `ropa.read`, write on `ropa.write`; audit by
  trigger; no free text in the log.

## 7. Core logic — `packages/core`

- A new `ropa.ts`. **Do not reuse `engine.ts`**: its weights, bands, red flags
  and severities belong to the assessment, and a ROPA record is not a domain.
- `ROPA_COMPLETENESS_AREAS` (thirteen, weights totalling 100, asserted) and
  `ropaCompleteness(record) → { score, band, missing[] }` — `missing` names the
  areas, so the UI and the gap generator read the same list.
- `ROPA_BANDS` (the spec's four; boundaries inclusive of the LOWER band, as
  `maturityBand` is — decide and test 30, 60 and 80 explicitly). **Keep the
  score an integer.** The thirteen weights are whole numbers, so completeness
  is an exact sum; do not introduce a fraction and then compare it with a
  boundary. Slice 5 did exactly that and a live score banded one level above
  its own finalised snapshot (pitfall 16).
- `ropaRisk(record) → { rating, factors[] }` per §4.4.3.
- The ROPA gap rules as data: condition → gap, from the spec's table of twelve.
- Import: `mapColumns(headers)` by header NAME with aliases (the
  `packages/core/src/questions.ts` `HEADERS` pattern), and `validateRow(row)`
  returning errors per field. Pure functions over already-parsed rows — the
  parser itself is outside core (§4.4.8).

## 8. API

All `withApi`, nested under `/organizations/[id]/` (D-035 — the spec's flat
`/ropa/{ropaId}` is not used), each with a route-sweep probe in **both**
directions (Org B's path → 403; Org A's path with an Org B id → 404):
- `GET · POST …/ropa` (`ropa.read` / `ropa.write`)
- `GET · PATCH · DELETE …/ropa/[ropaId]` — DELETE archives; it never removes.
- `POST …/ropa/import` — returns `{ imported, rejected: [{ row, errors }] }`.
  A rejected row never fails the file; an import of zero valid rows is a 422.
- `GET …/ropa/export` — CSV at least. A file leaving the system is audited.
- ROPA gap generation, and where its actions are read (§4.4.7).

## 9. UI

- `/dashboard/ropa`: the register — completeness band, risk, owner, next
  review; filters; the count of records below "Usable".
- A record form, grouped the way the completeness areas are, showing which
  areas are missing and what each is worth.
- Import: upload → confirm the column mapping → see rejected rows with the
  reason beside each → import the rest.
- Plain language (D-040). And **never the word "compliant"**: a record is
  "Strong" on completeness, which is a statement about the register, not
  about the processing.

## 10. Tests

| Test | Where | Assertion |
|---|---|---|
| weights total 100 | core + unit (SQL mirror) | exactly 100; a change that breaks it fails |
| each area, alone | core | a record complete in ONE area scores that area's weight |
| `Unknown` is not complete | core | per §4.4.2 |
| band boundaries | core | 30, 31, 60, 61, 80, 81 |
| risk rises | core | each of the spec's factors, alone and together; never lowered by an assessor |
| the ten MU records | core | every one parses, scores and rates; say which hand ratings the rules disagree with |
| derived, not sent | rls | a client cannot write `completeness_score` or the derived risk |
| import | unit + e2e | a file with 8 good rows and 2 bad imports 8 and reports 2, with reasons |
| formula cells | unit | a cell containing `=HYPERLINK(...)` is imported as text, never evaluated |
| ROPA gaps | rls | derived, SELECT-only; one action per gap in the SHARED table |
| actions | rls | a ROPA action obeys D-056's closing rule unchanged |
| evidence | rls | the third link type; **the two earlier types still behave** — re-run Slice 6's score-does-not-move test |
| approval | rls | the owner cannot approve their own record |
| does not touch the score | rls + e2e | adding ten ROPA records leaves the `ROPA` DOMAIN score exactly where it was |
| gate 5 | route sweep | every new route, both directions |
| e2e | api + ui | create → complete → review → approve; import; on both tenants |

## 11. Seed data

The ten workbook records, for Mumbai University, extracted to a committed
fixture by `tools/extract_core_pack.py` and loaded by the seeder. Idempotent.
Bharat Manufacturing gets none (the empty state). Update `SEED_COUNTS` and the
`app.yml` count string, which currently ends `…/1/1/1/0/0/1/1`.

## 12. Definition of Done

The 10 gates, plus: completeness and risk derived and stored; the §4.4
decisions recorded; an import that reports bad rows instead of failing; ROPA
actions on the shared workflow; and a register a Registrar could read without
having seen the spec.

## 13. Sync step

Update `STATE.md`; append `DECISIONS.md` (§4.4's nine decisions, the record
shape, the third evidence link type); **promote `SLICE_08`** against the real
ROPA, gap and action shapes; stub-check `SLICE_09`. Already decided — do not
re-decide: ROPA gaps get their own table and share `gap_actions` (D-060); the
closing rule (D-056); the `ROPA` domain is scored from questions only (D-035);
no cap or approval override by the AI (D-011, D-039).

## 14. Known pitfalls

1. **A full register does not raise the readiness score.** The `ROPA` domain
   (D03, weight 6) is scored from answered, evidenced QUESTIONS like every
   other domain. Never wire `ropa_records` into `app.assessment_domain_results`.
   A ROPA export is, however, excellent EVIDENCE for those questions — that is
   the legitimate route, and it goes through a reviewer.
2. **Two scoring models now exist.** Completeness /100 is not the DPDP Compass
   Readiness Score and must never be shown next to it without its own label.
3. **There is no oracle.** Nothing in the workbook computes completeness or
   risk. Do not write "matches the workbook" anywhere.
4. **`evidence_links` has FOUR trigger functions and they now carry Slice 6's
   branches.** `apps/web/tests/unit/gap-register.test.ts` counts them from the
   migrations. Redefine them from the Slice 6 bodies.
5. **Three functions were last defined in the Slice 6 migration**, not where
   you would look first: `app.audit_scope_change`, `public.finalise_assessment`
   and the four evidence-link functions. `CREATE OR REPLACE` from the latest.
6. **`gap_actions.gap_id` is assumed non-null in several places** —
   `apps/web/lib/gaps/shape.ts` (`readGaps`, `readGapForAction`),
   `app.gap_has_human_work`, the client type `GapAction.gapId`. Making it
   nullable is a change to all of them.
7. **An import is a user upload: untrusted input.** Size-limit it, parse it on
   the server, never evaluate a formula, never follow a link inside it, and
   never echo a cell back into HTML unescaped.
8. From Slice 6: **a finalised assessment's gaps are frozen by trigger**, and
   the generator is refused too. Anything that writes `assessment_gaps` for a
   finalised assessment fails with `TS409` — by design (D-058).
9. From Slice 6: **dates are calendar dates in `Asia/Kolkata`.** `Next Review`
   is a `date`, compared against India's today — not `now()::date`, which is
   UTC and a day behind until 05:30.
10. From Slice 6: **CHECK constraints are evaluated in name order**, so a test
    asserting WHICH constraint refused a row must make only that one fail.
11. From Slice 5: **an applied migration is frozen, including its comments.**
12. From Slice 5: **each e2e spec file needs its OWN name prefix** and its own
    evidence file name. Taken (assessments): `E2E keystone%`, `E2E evidence
    UI%`, `E2E UI %`, `E2E API assessment%`, `E2E scoring API%`, `E2E scoring
    UI%`, `E2E gap register API%`, `E2E gap register UI%`. Disposable tenant
    ids `…a003` to `…a006` are taken. `e2e-name-prefixes.test.ts` enforces the
    prefixes; it keys on the TABLE, so a ROPA spec cleaning `ropa_records` by
    name is checked too only if it uses the same `DELETE … WHERE name LIKE`
    shape.
13. From Slice 5: **a disposable e2e tenant may only add `muItSecurity` and
    `muLegal`.**
14. **The hosted dev database is not quiet.** Mumbai University holds four
    assessments there, two of them FINALISED with 124 frozen gaps each
    ("Slice 5 finalise test", "Manual Slice 6 test"). A test that asserts a
    tenant-wide count — "no snapshot exists", "MU has one gap" — passes in CI
    and fails on hosted. Assert on the rows the test created.
15. **`next dev` and `next build` share `apps/web/.next`.** With a dev server
    running in the checkout, on 2026-10-02 a build failed, `/api/v1/health`
    returned 500 from a half-written build, and six unrelated e2e tests failed
    at sign-in. Stop the dev server before `pnpm build` or `pnpm test:e2e`.
16. From Slice 6: **floating point at a boundary.** `packages/core` summed
    sixteen domain scores to 20.000000000000004 and banded it above the 0.20
    line; SQL, on exact numerics, did not. `exactProportion()` in `engine.ts`
    is the fix there. For ROPA, avoid the problem instead: integer weights,
    integer score, integer boundaries — in TypeScript and in SQL alike.
17. From Slice 6: **Vercel previews sit behind Vercel Authentication.** A
    script cannot reach a preview URL (it gets a 401 from Vercel, not from the
    app). To exercise a branch with a script, run it locally against the
    hosted database — the same data the preview shows.
18. From Slice 6: **a full live e2e run rarely completes cleanly from a
    laptop** — 157 tests, two networks, and a `serial` spec skips the rest of
    its file on one `read ETIMEDOUT`. A timeout is not a code signal. Record
    what actually happened (runs, counts, which specs were re-run alone); do
    not re-run until green and call that a clean run. CI on `main` is the
    authoritative signal.
19. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; seed counts
    in `app.yml`; PostgREST caps a response at 1,000 rows (an import of 2,000
    records must page on read); `service_role` only in `lib/supabase/admin.ts`;
    `git add <paths>`; the live e2e needs `--workers=1`; verify live after
    merge; do not push to `main` while the merge build runs.
