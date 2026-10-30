# SLICE 6 — Gap register and remediation actions

**Branch:** `slice/06-gaps-actions` · **Est:** 1–2 sessions · **Week:** 9–10 ·
**Ships:** a gap for every weak answer, an owner-assigned action for every gap,
a status workflow that cannot be closed on a promise, and the 30/60/90-day
roadmap the report (Slice 9) and the engagement are sold on.

> Promoted 2026-09-20 by the Slice 5 Sync Step, against the code on
> `slice/05-scoring-engine`. Paths, shapes and helper names below are real.
> The workbook facts in §4 were read from the `.xlsx` formulas, not from memory.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-027, D-029, D-035,
   D-038, D-039, D-041, D-042, D-043, D-044, D-046, D-051, D-052, D-053**),
   `docs/QUESTION_FORMAT.md`, this file.
2. Confirm Slice 5 is merged and verified live (STATE).
3. `git checkout main && git pull && git checkout -b slice/06-gaps-actions`.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green.
   Docker running.
5. **Develop against a local Supabase stack**, not the hosted project — it is
   what CI runs, and an applied hosted migration cannot be edited:
   `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
   then export its `DB_URL`/`API_URL`/keys as `DIRECT_URL`, `DATABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET` (`.github/workflows/app.yml`). Environment beats
   `.env.local` everywhere. Apply to hosted with `pnpm db:migrate` **only when
   the migration is final** — and then do not touch the file again, not even a
   comment: the checksum is recorded, and an edit afterwards is drift.
6. The platform is sold per client, per industry (D-040). Nothing here may be
   University-specific.

## 1. DPDP anchoring

A score tells a Data Fiduciary where it stands; a gap register tells it what to
do, who does it and by when. That is what Rule 6's "reasonable security
safeguards" and the Act's accountability duty actually demand in practice — a
documented, owned, dated remediation plan. It is also the deliverable the
₹9.75–12L engagement sells, and the input to the 90-day sprint clients need
before **13 May 2027**.

A gap must never be closable on a promise. Closing one is exactly where an
assessment becomes theatre, so closing requires the same stored-artefact
discipline as the score itself (D-039).

## 2. Goal

1. **A gap for every weak answer**, derived — never hand-written — from the
   STORED `assessment_responses.adjusted_score`.
2. **An action per gap**: owner, priority, due date, status.
3. **A workflow that holds**: Open → In Progress → Blocked → Closed, with
   Closed requiring evidence or a reviewer's approval.
4. **The roadmap view**: 30/60/90 days, by domain and by owner.

## 3. Scope

**In:** the gap and action tables; generation from a scored assessment; the
status workflow; assignment; a gap register UI and a roadmap view; extending
`evidence_links` to actions (§6).

**Out:** the report PDF (Slice 9 — this slice is the data behind it);
dashboards beyond the assessment page (8); reassessment deltas (12); email
reminders and SLA escalation (13); any AI-suggested remediation (11 — and the
AI may never close a gap, D-011).

## 4. The workbook, precisely (read from the formulas)

### 4.1 What generates a gap — and it is NOT `≤ 2`
`Gap_Action_Tracker!D` is
`IF(Responses!$J2="", "N/A", IF(Responses!$J2<=3, "Yes", "No"))`.

So the workbook opens a gap at **adjusted ≤ 3**, not the `≤ 2` this file's old
stub guessed and not the `≤ 2` red-flag threshold (D-046). The two thresholds
are different things and both are deliberate:

| Threshold | What it means |
|---|---|
| adjusted **≤ 2** | a RED FLAG — caps the whole assessment's score (D-046) |
| adjusted **≤ 3** | a GAP — there is remediation work to do |

**Decide and record** whether TrustStack keeps `≤ 3`. Recommended: yes. A
domain scoring 3/5 is "Implementing", not done, and a register that stayed
silent about it would make the 90-day plan look shorter than it is.

**The oracle cannot police this choice** (checked 2026-09-20 from the committed
fixture): every one of the 98 sample answers is adjusted **2 or below** — 10 at
0, 52 at 1, 36 at 2, under the spec's cap and under the workbook's naive rule
alike. So all 98 open a gap either way, and no parity number moves whichever
threshold is chosen. Like D-038, this slice must bring its own tests: assert
the boundary directly (adjusted 3 opens a gap, adjusted 4 does not), because
the workbook sample contains no answer above 2 to catch it.

### 4.2 Severity and priority are already built
`Responses!K` (severity) and `Responses!L` (priority) are **already in
`packages/core/src/engine.ts`** as `questionSeverity()` and in SQL as
`app.question_severity()`, mirrored by `apps/web/tests/unit/scoring-engine.test.ts`:

`≥5 no_gap · ≥4 improvement · ≥3 low · ≥2 medium · ≥1 high · else critical`

The workbook's priority mapping (`Responses!L`) is
`Critical→P0 · High→P1 · Medium→P2 · Low→P3 · Improvement→P3 · else "Monitor"`.
**Add it to `engine.ts` next to `questionSeverity`, and mirror it in SQL** —
do not invent a second severity ladder, and do not recompute severity from the
claim. Severity comes from the stored adjusted score (D-044).

Under the spec's cap an **unevidenced claim of 5 is adjusted 1 → high → P1**,
not critical: critical needs a claim of 0 (D-045, and the engine test pins it).

### 4.3 The rest of a row
`Due Days` is **30 for every row** — a flat 30 days is not a roadmap, so
deriving the due date from priority is this slice's call (see §4.4).
`Client Owner` is the question's `suggested_owner`, already snapshotted on
`assessment_questions`. `Anix AI Role` is "Engagement Partner / PMO" on every
row. `Root Cause` and `Gap / Finding` are authored text ("Review and remediate:
<the question>"), and `Recommended Fix` comes from the question bank — it is
already extracted into `core-pack.json` as `recommendedFix`, but **it is not
carried onto `assessment_questions`**, so either snapshot it in this slice's
migration or join the version row by `(question_code, question_version)`.

### 4.4 Decide explicitly (record each in DECISIONS)
1. **The gap threshold.** `≤ 3` (see §4.1). Say which, and why.
2. **Due dates.** The workbook's flat 30 days, or derived from priority
   (P0 30 / P1 60 / P2 90 / P3 next cycle)? A 30/60/90 roadmap needs the
   latter. Whichever: the due date is stored, not computed at read time, or
   every report of the same assessment shows different dates.
3. **What closing requires.** Recommended: an `evidence_links` row (§6) OR a
   reviewer with `gap.write` who did not do the work — the same separation of
   duties as evidence review (D-043). Decide whether a Closed action may be
   reopened, and whether closing is allowed at all on a `finalised` assessment.
4. **Regeneration.** An answer changes after gaps are generated — does its gap
   update, close, or stay? Recommended: gaps are derived data and regenerate
   from the current answers, EXCEPT that an action carrying human work (owner,
   notes, status beyond Open, evidence) is never silently discarded. Getting
   this wrong loses a client's remediation notes.
5. **Whose gaps.** A gap belongs to an assessment. A FINALISED assessment's
   gaps must not move, for the same reason its score must not (D-052) — but
   remediation continues after finalising, which is the whole point. Decide:
   do actions live past their assessment, or does the 90-day sprint belong to
   the reassessment (Slice 12)? This is the one genuinely open design question
   in this slice.

## 5. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Answers | `assessment_responses` — `adjusted_score` is DERIVED and CHECK-capped (D-044) | Never recompute severity from the claim |
| Severity | `questionSeverity()` in `packages/core/src/engine.ts`; `app.question_severity()` in `…20260920000000_scoring_engine/migration.sql` | Both exist and are mirror-tested. Add the priority mapping beside them |
| Scored domains | `app.assessment_domain_results(org, assessment)` returns `questions`-level counts; `scoreDomain()` returns `questions[]` with `{questionCode, adjusted, severity}` | The gap generator wants exactly that list |
| Red flags | `RED_FLAGS` / `app.red_flags()`; fired ones stored on the snapshot as `red_flags jsonb` | A red flag is not a gap — it is a cap. Report both, never merge them |
| Snapshot | `assessment_score_snapshots` + `assessment_domain_scores`, immutable (D-052) | A finalised assessment's gaps should be as stable as its score |
| Question text, owner, priority | `assessment_questions` — `question_text`, `suggested_owner`, `priority`, `domain_code`, `domain_weight` | `recommended_fix` is NOT here yet (§4.3) |
| Evidence | `evidence`, `evidence_links` (polymorphic), `app.evidence_link_before_insert()` validates `assessment_response` ONLY | Widen it, do not build a second evidence table (§6) |
| Unlink | `DELETE …/evidence/[id]/links/[responseId]`, `evidence.unlink` in `apps/web/lib/evidence/routes.ts` | The pattern to copy for a gap action's evidence |
| Permissions | `gap.read`, `gap.write` — already in the matrix; `gap.write` is CONTRIBUTOR + PROGRAMME | No migration needed unless you add one (D-020) |
| Guards | `withApi` in `lib/api/guard.ts`; `requireAssessment` in `lib/assessments/routes.ts` | Every new route nests under `/organizations/[id]/` (D-035) and needs a sweep probe |
| Oracle | `Gap_Action_Tracker`, 98 rows | `tools/extract_core_pack.py` already reads this workbook and emits two fixtures — extend it if you want a third |

## 6. Data model

Migration `…_gaps_actions`:
- **`assessment_gaps`** (tenant): `id`, `organization_id`, `assessment_id`
  (composite FK), `question_code`, `domain_code`, `severity`, `priority`,
  `adjusted_score` (the value at generation — a gap records what it was opened
  for), `finding`, `recommended_fix`, `generated_at`. UNIQUE
  `(organization_id, assessment_id, question_code)`.
- **`gap_actions`** (tenant): `id`, `organization_id`, `gap_id` (composite FK),
  `title`, `owner_user_id`, `owner_role`, `status`, `due_date`, `closed_at`,
  `closed_by`, `notes`. CHECK the status vocabulary; a `closed` row needs
  `closed_at` and `closed_by` (the D-043 shape).
- **Widen `evidence_links`**: add `gap_action` to
  `evidence_links_entity_type_check`, and teach
  `app.evidence_link_before_insert()` to validate that target too — today it
  looks up `assessment_responses` unconditionally and would raise `TS404` for
  anything else. The object-exists rule (D-039) and the locked-assessment rule
  come with it for free. **FOUR triggers on `evidence_links` assume the target
  is a response and all four must be widened** — `app.evidence_link_before_insert`
  and `app.evidence_link_after_insert` (Slice 4),
  `app.evidence_link_before_delete` and `app.evidence_link_after_delete`
  (Slice 5). The two AFTER triggers re-derive `assessment_responses` and must
  not fire at all for a gap action; the two BEFORE triggers look the response up
  and would raise `TS404` for anything else. Verified against the migrations on
  2026-10-02 — count them again before you start, do not trust this number.
- Generation goes through **one SECURITY DEFINER RPC**, like
  `public.set_assessment_questions` and `public.finalise_assessment`: it
  re-checks `gap.write`, derives every row in SQL from the stored adjusted
  scores, and audits once with a count — not one row per gap.
- RLS: read for members with `gap.read`, write on `gap.write`; audit by the
  existing `app.audit_scope_change('gap')` trigger; no free text in the log
  (notes and findings stay out).

## 7. Core logic — `packages/core`

- `questionPriority(severity) → "P0"|"P1"|"P2"|"P3"|"Monitor"` beside
  `questionSeverity` in `engine.ts`, with the SQL mirror.
- `GAP_THRESHOLD` (§4.4.1) and `opensGap(adjusted)`.
- `GAP_ACTION_STATUSES` and the legal transitions as data, so the API and the
  database enforce the same graph.
- `dueDate(priority, from)` if §4.4.2 goes that way — pure, no `Date.now()`
  inside; pass the clock in, or the tests are time-dependent.
- A gap is generated from `ScoredQuestion` (already exported), so the generator
  is a pure function over the engine's own output.

## 8. API

All `withApi`, nested under `/organizations/[id]/assessments/[assessmentId]/`
unless noted, each with a route-sweep probe in **both** directions:
- `POST …/gaps/generate` (`gap.write`) — the RPC; returns counts by severity.
- `GET …/gaps` (`gap.read`) — the register, with its actions.
- `PATCH …/gaps/[gapId]/actions/[actionId]` (`gap.write`) — owner, status, due
  date, notes.
- `POST …/organizations/[id]/evidence/[evidenceId]/link` — already exists;
  widen its `linkBody` to accept a gap action as the target.
- `GET …/roadmap` (`gap.read`) — grouped by due window and owner, or derive it
  client-side from `GET …/gaps` and skip the route.

## 9. UI

- A gap register on the assessment page: filter by severity, domain, owner,
  status; each row in plain language (D-040 — no question codes, no pack codes,
  no trigger expressions).
- An action editor: assign an owner from the organisation's members, set a due
  date, move status, attach evidence, add notes.
- A roadmap view: 30/60/90 columns, counts by severity, overdue highlighted.
- The overall panel gains "N gaps, M critical" linking into the register.
- **Red flags stay separate from gaps** in the UI: one caps the score, the
  other is work to do.

## 10. Tests

| Test | Where | Assertion |
|---|---|---|
| threshold | core | adjusted 3 opens a gap, 4 does not (§4.4.1) |
| severity ↔ priority | core | the full 6-row table, and `Monitor` for no_gap |
| unevidenced claim of 5 | core | adjusted 1 → high → P1, NOT critical |
| generation is derived | rls | gaps come from the stored `adjusted_score`; a forged severity is refused |
| SQL ↔ TS | unit | the priority mapping and the threshold, parsed from the migration |
| regeneration | rls + e2e | §4.4.4's rule — human work on an action survives it |
| closing | rls | Closed needs evidence or an approving reviewer; the wrong user is refused |
| evidence on an action | rls + e2e | `evidence_links` accepts `gap_action`; the object-exists rule still applies; **unlinking a gap action does NOT re-derive a response's score** |
| finalised | rls | §4.4.5's rule, whichever way it goes |
| scoped out | core + e2e | a Scoped Out domain produces NO gaps — its questions were never asked (D-038) |
| null priority | core | 234 questions have `priority = null`; a gap must still sort and must not become P0 |
| gate 5 | route sweep | every new route, both directions |
| e2e | api + ui | score → generate → assign → attach evidence → close, on both tenants |

## 11. Seed data

MU's baseline has ONE answer, so it generates at most one gap — enough to prove
the journey and honest about the state of the data. Do NOT seed a full gap
register; do not finalise MU's baseline (D-052). Update `SEED_COUNTS` and the
`app.yml` count string, which currently ends `…/1/124/1/1/1/0/0`.

## 12. Definition of Done

The 10 gates, plus: gaps derived and never hand-written; the §4.4 decisions
recorded; closing that cannot be faked; the roadmap legible to a client who has
never seen the engine.

## 13. Sync step

Update `STATE.md`; append `DECISIONS.md` (§4.4's five decisions, the gap/action
shape, the `evidence_links` widening); **promote `SLICE_07`** against the real
gap and action shapes; stub-check `SLICE_08`. Already decided — do not
re-decide: severity from the stored adjusted score (D-044), red flags at ≤ 2
(D-046), the empty-domain rule (D-038), no cap override (D-039), snapshot
immutability (D-052), two engines held together by a mirror test (D-053).

## 14. Known pitfalls

1. **The gap threshold is NOT the red-flag threshold.** `≤ 3` opens a gap;
   `≤ 2` caps the score. Merging them silently drops 26 gaps on the MU sample.
2. **Severity is read, never recomputed.** `assessment_responses.adjusted_score`
   is the source; recomputing from the claim reintroduces exactly the bug the
   cap exists to prevent.
3. **`evidence_links` has FOUR triggers that assume a response** — before and
   after insert (Slice 4), before and after delete (Slice 5). Widening the
   vocabulary without widening all four gives a gap action that cannot be
   linked, or one whose linking or unlinking silently rewrites some answer's
   score. Count them in the migrations yourself; this list has already been
   wrong once.
4. **A Scoped Out domain has no gaps**, and that is not the same as having none
   outstanding. Keep the three D-038 states distinct in the register too.
5. **`priority` is null on 234 bank questions** and is shown as "—", never
   guessed (`QUESTION_FORMAT.md`). Gap priority comes from SEVERITY, which is
   always present, so use that — but a null question priority must not sort as
   P0 or crash the generator.
6. From Slice 5: **an applied migration is frozen, including its comments.**
   The checksum is recorded in `_prisma_migrations`; editing the file
   afterwards is drift. Finish the file, then apply.
7. From Slice 5: **each e2e spec file needs its OWN assessment-name prefix,**
   and its own evidence file name if it detaches anything — cleanup that finds
   artefacts through `evidence_links` misses any it just unlinked. Taken:
   `E2E keystone%`, `E2E evidence UI%`, `E2E UI %`, `E2E API assessment%`,
   `E2E scoring API%`, `E2E scoring UI%` — and
   `apps/web/tests/unit/e2e-name-prefixes.test.ts` now fails CI if a new one is
   a prefix of an existing one on the same table, so you do not have to notice.
8. From Slice 5: **a disposable e2e tenant may only add `muItSecurity` and
   `muLegal`.** Every other seeded MU user is asserted to be
   single-organisation by `tenancy.spec.ts` or the route sweep, and adding one
   to a second tenant breaks those specs — intermittently, because spec files
   run in parallel.
9. From Slice 5: **`/login` redirects an authenticated visitor to
   `/dashboard`,** so a UI spec that switches user must sign out first — and
   must decide that from where `goto` landed, not by probing for the Sign out
   button, which races the render.
10. From Slice 4: a review always needs two people (D-043); evidence cleanup
    needs `removeEvidence()`; MU's seeded baseline is `in_progress`.
11. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; seed counts
    in `app.yml`; PostgREST caps a response at 1,000 rows (page explicitly);
    `service_role` only in `lib/supabase/admin.ts`; `git add <paths>`; verify
    live after merge; do not push to `main` while the merge build runs.
