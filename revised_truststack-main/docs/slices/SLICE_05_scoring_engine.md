# SLICE 5 — Full 16-domain scoring engine

**Branch:** `slice/05-scoring-engine` · **Est:** 2 sessions · **Week:** 7–8 ·
**Ships:** every question answerable; all sixteen domain scores; the overall
DPDP Compass Readiness Score with red-flag caps, maturity band, evidence
confidence and critical/high gap counts; the workbook parity gate in CI; and a
**finalised, immutable score snapshot**.

> Promoted 2026-09-18 by the Slice 4 Sync Step, against the code on
> `slice/04-keystone-evidence-scoring`. Paths, shapes and helpers below are real.
> The workbook facts in §4 were read from the `.xlsx` formulas, not from memory.
> Re-verified 2026-09-20 after D-046/D-047/D-048 (parity numbers recomputed from
> the workbook's cached values; paths checked against `main` @ `b9b22e4`+).

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. **D-007, D-029, D-035, D-036,
   D-038, D-039, D-041, D-043, D-044, D-045, D-046, D-047, D-048**),
   `docs/QUESTION_FORMAT.md`, this file.
2. Confirm Slice 4 is merged and verified live (STATE — it is, `6829f93`, live
   e2e 126/126). The two scoring questions it raised are SETTLED by Aniket: red
   flags at adjusted **≤ 2** (D-046) and the two-run parity gate (D-048).
3. `git checkout main && git pull && git checkout -b slice/05-scoring-engine`.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green.
   Docker running (`pnpm db:types`, and the local stack below).
5. **Develop against a local Supabase stack**, not the hosted project — it is
   what CI runs, and an applied hosted migration cannot be edited:
   `npx -y supabase@2.117.0 start -x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`,
   then export its `DB_URL`/`API_URL`/keys as `DIRECT_URL`, `DATABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, plus CI's `SEED_USER_PASSWORD` and
   `ACTIVE_ORG_COOKIE_SECRET` (`.github/workflows/app.yml`). Environment beats
   `.env.local` everywhere (dotenv and `@next/env` never override). Apply to the
   hosted project with `pnpm db:migrate` only when the migration is final.
6. The platform is sold per client, per industry (D-040). Nothing here may be
   University-specific; the scoring model is the same 16 domains for everyone.

## 1. DPDP anchoring

The sixteen domains ARE the Act and Rules as an operating model. Red flags
encode the obligations whose absence makes everything else moot — no DPDP owner,
no inventory, no ROPA, no security safeguards, no breach readiness, no processor
governance, unreviewed children's data. A score that let those be averaged away
would be a readiness score in name only. And a finalised score is evidence of
what was assessed and when: it must never move after the fact (D-035).

## 2. Goal

1. **Answer anything.** Lift Slice 4's one-domain limit
   (`ANSWERABLE_DOMAINS` in `apps/web/lib/client/assessments.ts`).
2. **Score everything.** All 16 domains; the overall score over the applicable
   weight (D-038); red-flag caps (lowest wins); maturity band; evidence
   confidence; critical and high counts.
3. **Prove parity** with the workbook's 98 sample responses, as a CI gate
   (D-007), in TWO runs (D-048): with the workbook's naive rule plugged in the
   engine reproduces **24.7014 · 23.9% · 10 critical · 57 high** exactly; with the
   spec's cap it gives **25.3014 · 23.9% · 10 · 52**.
4. **Finalise.** `in_progress → finalised` freezes an immutable score snapshot.

## 3. Scope

**In:** the engine in `packages/core`; the same engine in SQL for the snapshot
(§6); a score snapshot table; finalise; the parity fixture and gate; the red-flag
table; an overall score panel and a 16-row scorecard on the assessment page; the
decision on evidence freshness (§4.4); **unlinking evidence from an answer**
(STATE open loop: `evidence_links` has no user DELETE, so a wrong link cannot be
undone — needed before all 16 domains open. Audited by the existing trigger;
refused on submitted/finalised; the response's level re-derives on delete).

**Out:** gaps and actions (Slice 6 — this slice only COUNTS critical/high);
dashboards beyond the assessment page (8); reports (9); reassessment deltas (12);
any cap override (D-039 — do not build it).

## 4. The workbook, precisely (read from the formulas)

### 4.1 Adjusted score — the workbook is naive, the spec governs (D-045, D-047)
`Responses!J = IF(Evidence Current = "No", MIN(claimed, evidence, 3), MIN(claimed, evidence))`.
That is the naive rule. **Keep the spec's cap table** (`EVIDENCE_CAP`, E0→1, E1→2,
E2→2, …). Do not "fix" the engine towards the workbook.
**The sample DOES exercise the difference** (D-047): `CB1.1`–`CB1.5` are claim 2 +
E1 → 1 in the workbook, 2 under the cap. That moves the raw score 24.7014 →
25.3014 and high gaps 57 → 52. Build the engine so the cap rule is a parameter of
the aggregation (the SQL keeps the spec's rule only), so the parity test can run
the naive rule to prove aggregation parity (D-048). The naive rule lives in the
test fixture only — never exported for product use.

**The sample, as it actually is** (checked 2026-09-20): 98 rows — 76
`Applicable` + 22 `Conditional` (**both count as applicable**), 0 `Not
Applicable`, 0 stale (`Evidence Current` = Yes on every row). Extend
`tools/extract_core_pack.py` to emit `Question ID`, `Domain ID`, `Applicability`,
`Maturity`, `Evidence Level`, `Evidence Current` as a committed JSON fixture, and
keep its `--check` (the docs workflow runs it) covering that file too.

### 4.2 Domain score and maturity band (`Domain_Scoring`)
- `Applicable Questions` = count where applicability ≠ Not Applicable.
- `Avg Adjusted` = sum(adjusted, non-N/A) / applicable count; `Domain Score = (avg/5) × weight`;
  `Domain % = score / weight`. Already `domainScore()` in `packages/core/src/scoring.ts`.
- Band on Domain % (and on the overall score / 100):
  `≤0.20` Level 0 – Not Started · `≤0.40` Level 1 – Aware · `≤0.60` Level 2 – Defined ·
  `≤0.75` Level 3 – Implementing · `≤0.90` Level 4 – Operational · else Level 5 – Continuous Assurance.
- Domain evidence confidence = (sum evidence level, non-N/A / applicable count) / 5.
- Domain status: any Critical → "Critical"; else any High → "High Risk";
  else Domain % < 0.61 → "Needs Work"; else "On Track".

### 4.3 Overall (`Dashboard`)
- Raw = Σ domain scores. **Score cap** = the MIN of these red flags (100 if none):

  | Trigger | Cap |
  |---|---:|
  | `G1.2` adjusted ≤ 2 (no evidenced DPDP owner) | 60 |
  | any `D02` INV question adjusted ≤ 2 | 55 |
  | any `D03` ROPA question adjusted ≤ 2 | 60 |
  | any `D11` SECURITY question adjusted ≤ 2 | 60 |
  | any `D12` BREACH question adjusted ≤ 2 | 65 |
  | any `D13` VENDOR question adjusted ≤ 2 | 70 |
  | any `D14` CHILD question adjusted ≤ 2 | 50 |

  **Threshold `≤ 2`, not the workbook's `< 2`** — Aniket, D-046. In a red-flag
  area anything short of E3 evidence (or a claim ≤ 2) caps the assessment. On the
  98 samples the cap is 50 either way (`CHILD`); `≤ 2` also fires `SECURITY`.

  Final = MIN(raw, cap). **Several flags → the lowest cap wins.** Note the
  keystone question is itself a red flag: Slice 4's journey (claim 5, E0 → 1)
  would cap a whole assessment at 60.
- **Evidence confidence (overall) = AVERAGE of the 16 domain confidences** —
  unweighted, per domain, NOT per question. Parity depends on this.
- Critical / High = counts of question severity (below). Severity from adjusted:
  `≥5` No Gap · `≥4` Improvement · `≥3` Low · `≥2` Medium · `≥1` High · else Critical.
  Under the spec's cap an adjusted 0 needs a claim of 0 — an unevidenced claim of
  5 is **High**, not Critical. Slice 6 builds gaps on this; here only count.

### 4.4 Decide explicitly (record each in DECISIONS)
1. ~~Red-flag threshold~~ — **SETTLED, D-046: `≤ 2`** (Aniket, 2026-09-20).
   Test it at the boundary: adjusted 2 fires, adjusted 3 does not.
2. **Evidence freshness.** The sample has no stale rows, so parity is unaffected
   either way. **Recommended: defer to Slice 13** (no expiry is modelled anywhere
   yet) and record it. The workbook caps a stale answer at 3. Slice 4 has no
   freshness field. Either add `evidence.valid_until` / an "evidence current"
   verdict at review and apply `min(…, 3)` in `app.adjusted_score`, or defer to
   Slice 13 — but say which. If added: the cap stays a row invariant (the CHECK in
   D-044 must be widened in the same migration, and the SQL/TS parity test too).
3. **Empty domains and overall evidence confidence (D-038).** A domain with no
   applicable question leaves the weight denominator — and must also leave the
   16-domain confidence AVERAGE, or it drags confidence to 0. Workbook: D=0 → 0.
   Parity is unaffected (all 16 answered there).

## 5. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Answers | `assessment_responses` — `id`, `organization_id`, `assessment_id`, `question_code`, `applicability_decision` (`applicable`/`not_applicable`), `na_reason`, `claimed_maturity`, `evidence_level`, `adjusted_score`, `notes`, `answered_by`, `answered_at` | UNIQUE `(organization_id, assessment_id, question_code)`; composite FK to the snapshot row. `evidence_level` + `adjusted_score` are **derived by trigger**, CHECK-capped, no user grant (D-044) |
| Evidence | `evidence` (+ `evidence_links`, polymorphic) | Level = strongest reviewed linked artefact; `pending` ⇔ no level; `rejected` ⇒ E0; no self-review (D-043) |
| Core | `packages/core/src/scoring.ts` | `EVIDENCE_CAP`, `adjustedScore`, `domainScore` (null = not scored), `evidenceConfidence`, `summariseDomainScore` (`provisional`, `outstandingCount`), `responseEvidenceLevel`, review-status rules. Extend here |
| SQL cap | `app.evidence_cap()`, `app.adjusted_score()` in `…/20260918200000_evidence_scoring/migration.sql` | `tests/unit/evidence-cap.test.ts` parses the SQL — copy that pattern for every SQL mirror you add |
| Status | `app.assessment_response_after_insert` moves `draft → in_progress`; `app.assessment_guard_status` refuses a return to draft | `submitted`/`finalised` lock answers, links and reviews (triggers raise `TS409`) |
| Score API | `GET …/assessments/[assessmentId]/score?domain=GOV` (`score.read`) in `apps/web/lib/assessments/responses.ts` | One domain. Reads the SNAPSHOT weight. Widen to all 16 + overall |
| Answer UI | `app/dashboard/assessments/[assessmentId]/{answer-panel,domain-score-tile}.tsx` | `AnswerPanel` is generic already — only `ANSWERABLE_DOMAINS` limits it |
| Permissions | `score.read`, `score.calculate`, `assessment.finalise` — already in the matrix | `assessment.finalise`: `PROGRAMME` roles + org admin + super admin |
| Oracle | `docs/source/*.xlsx` → `Responses` (98 rows: `Question ID`, `Applicability`, `Maturity`, `Evidence Level`, `Evidence Current`) | `tools/extract_core_pack.py` already reads this workbook (`--check` in CI) — extend it to emit the 98 samples as a committed JSON fixture |
| e2e | `e2e/helpers.ts` → `createE2eTenant({… extraMembers})`, `removeEvidence()` | Two people for any review (D-043) |

## 6. Data model

Migration `…_scoring_engine`:
- **`assessment_score_snapshots`** (tenant): `id`, `organization_id`,
  `assessment_id` (composite FK, UNIQUE — one finalised snapshot per assessment),
  `calculated_at`, `calculated_by`, `raw_score`, `score_cap`, `final_score`,
  `applicable_weight` (the D-038 denominator, e.g. 93), `evidence_confidence`,
  `maturity_level`, `critical_count`, `high_count`, `red_flags jsonb`
  (which fired, each cap), `engine_version`.
- **`assessment_domain_scores`** (tenant): one row per domain per snapshot —
  `domain_code`, `weight` (from the question snapshot), `state`
  (`scored` · `scoped_out` · `all_not_applicable`), `applicable_count`,
  `not_applicable_count`, `avg_adjusted`, `score`, `evidence_confidence`,
  `maturity_level`, `critical_count`, `high_count`.
- **Written only by `public.finalise_assessment(org, assessment)`** — SECURITY
  DEFINER, re-checks `assessment.finalise`, refuses unless `in_progress` and
  **zero outstanding questions** (D-041), computes the snapshot IN SQL from the
  stored adjusted scores, sets `finalised`, audits once. Users: SELECT only.
- **Why compute in SQL, not pass numbers in:** an RPC that stores numbers the
  caller computed stores numbers the caller can forge. Mirror the formulas in SQL
  and parity-test SQL against `packages/core` (as `evidence-cap.test.ts` does),
  and run the workbook fixture through BOTH.
- Immutability: no UPDATE/DELETE grant on either table; a finalised assessment
  already refuses re-review, re-answer and re-link (Slice 4). Add: its snapshot
  rows cannot change even as tooling (trigger), and the live `GET …/score` of a
  finalised assessment returns the SNAPSHOT, not a recomputation.

## 7. Core logic — `packages/core`

- `maturityBand(percent)`, `questionSeverity(adjusted)`, `RED_FLAGS` (the table in
  §4.3 as data), `applyRedFlags(domainResults) → { cap, fired[] }` (lowest wins),
  `overallScore(domains) → { raw, cap, final, applicableWeight, coverage }`,
  `overallEvidenceConfidence(domains)` (mean over SCORED domains — §4.4.3).
- A domain returns one of three states (D-038): `scored`, `scoped_out`,
  `all_not_applicable`. Neither empty state scores zero; both leave the weight
  denominator; the report names which and why (Scoped Out cites the scope fact,
  all-N/A cites the per-question reasons).
- `engineVersion` constant, stored on each snapshot.

## 8. API

All `withApi`, nested under `/organizations/[id]/assessments/[assessmentId]/`,
each with a route-sweep probe (both directions):
- `GET …/score` — all 16 domains + overall. For `finalised`, the stored snapshot.
  Keep `?domain=` working (the Slice 4 tile and its tests use it). Note today the
  query schema DEFAULTS `domain` to `GOV` (`lib/assessments/responses.ts`); drop
  the default so an absent `domain` means "everything".
- `DELETE …/evidence/[evidenceId]/links/[responseId]` (or equivalent) —
  `evidence.write`; the unlink above. Needs a sweep probe.
- `POST …/finalise` (`assessment.finalise`) — the RPC; 409 with the outstanding
  count if any question is unanswered.

## 9. UI

- Answering opens for all 16 domains (delete `ANSWERABLE_DOMAINS`, keep the tile).
- An overall panel: final score / applicable weight, coverage line (D-038 wording),
  maturity band, evidence confidence, critical/high counts, and each red flag that
  fired, named in plain language (D-040 — no codes).
- A 16-row scorecard: weight, score, band, confidence, state.
- **Finalise** behind `<Can permission="assessment.finalise">`, disabled with the
  outstanding count while anything is unanswered.

## 10. Tests

| Test | Where | Assertion |
|---|---|---|
| **parity (a)** | core + CI | the 98 samples with the workbook's naive rule → **24.7014** (4 dp), **23.9%**, **10** critical, **57** high — aggregation parity (D-048) |
| **parity (b)** | core + CI | the same 98 with the spec's cap → **25.3014**, **23.9%**, **10**, **52** — the product's numbers |
| red-flag cap on the sample | core | **50** (`CHILD`), under both rules |
| parity (SQL) | rls | the same fixture through the SQL engine (spec's cap only) gives **25.3014 · 23.9% · 10 · 52** |
| unlink | rls + e2e | unlinking re-derives the level and adjusted score; refused when locked; audited; cross-tenant refused |
| red-flag boundary | core | adjusted **2** fires, adjusted **3** does not (D-046) |
| red flags | core | each of the 7 fires alone at its cap; two together → the lower; none → 100 |
| red flag × cap | core | claim 5 + E0 on `G1.2` → adjusted 1 → cap 60 (the keystone is a red flag) |
| empty domains | core + e2e | Scoped Out VENDOR → denominator 93, not renormalised, not zero; all-N/A domain → same, distinct state |
| confidence | core | overall = mean of SCORED domain confidences; an empty domain does not drag it |
| primary only | core | a question with a secondary domain moves exactly one domain score (D-029.2) |
| snapshot | core | a rebalance of `dpdp_domains` does not change an existing assessment's score |
| finalise | rls | refused with outstanding questions; refused without `assessment.finalise`; one audit row |
| immutable | rls | snapshot rows cannot be updated or deleted, even as tooling; a finalised score never changes when evidence is later touched |
| SQL ↔ TS | unit | every SQL mirror (bands, severities, red flags) equals core — parse the migration |
| gate 5 | route sweep | `GET …/score` and `POST …/finalise`, both directions |
| e2e | api + ui | answer across domains → finalise → the snapshot is shown and cannot move |
| per-industry | e2e/api | the same scoring on the disposable `general` tenant (reuse `e2e/api/evidence.spec.ts`'s pattern) |

## 11. Seed data

MU's baseline stays `in_progress` with its one answer (`G1.2`: claim 5, E3 →
adjusted 3). Do NOT finalise it in the seed — finalising requires every question
answered, and a half-answered finalised baseline would be a lie. If the UI needs a
finalised example, seed a SEPARATE small assessment (all answered) and say so.
Update `SEED_COUNTS` and the `app.yml` count string, which now ends
`…/1/124/1/1/1` (assessments/questions/responses/evidence/links).

## 12. Definition of Done

The 10 gates, plus: the parity gate in CI; the red-flag table tested exhaustively;
a finalised snapshot that cannot move; the three D-038 states distinct in the UI;
the §4.4 decisions recorded.

## 13. Sync step

Update `STATE.md`; append `DECISIONS.md` (§4.4's three decisions, the snapshot
shape, SQL-vs-app computation); **promote `SLICE_06`** against the real response
and snapshot shapes; stub-check `SLICE_07`. Already decided — do not re-decide:
the cap table (D-045), red flags at ≤ 2 (D-046), the two-run parity gate (D-048),
no cap override (D-039), the empty-domain rule (D-038), answering freezes the
question set (D-041).

## 14. Known pitfalls

1. **The workbook formula is naive (D-045), and its sample is NOT claim =
   evidence everywhere (D-047).** Five `CB1.x` rows separate the two rules; that
   is why the parity numbers differ by cap rule. The Slice 4 cap tests must stay
   green alongside parity.
2. **Overall evidence confidence is a mean of DOMAIN confidences**, not of
   questions. Averaging questions gives a different number and fails parity.
3. **Finalise must refuse outstanding questions**, or a client answers only its
   strong questions (D-041).
4. **Never pass computed scores into the snapshot RPC** — compute in SQL (§6).
5. **Do not join the live bank to score** — the weight is the snapshot's (D-035).
6. From Slice 4: **each e2e spec file needs its OWN assessment-name prefix.**
   Cleanups delete by `name LIKE 'prefix%'`; `E2E keystone%` (api/evidence),
   `E2E evidence UI%` (ui/evidence), `E2E UI %` (ui/assessments) and
   `E2E API assessment%` (api/assessments) are taken. A shared prefix lets one
   file's teardown delete another's assessment mid-run.
7. From Slice 4: **evidence cleanup needs `removeEvidence()`** — users cannot
   delete evidence, and Storage refuses direct row deletes unless
   `storage.allow_delete_query` is set (the helper does it).
8. From Slice 4: **a review always needs two people** (D-043). A disposable
   tenant needs `extraMembers`.
9. From Slice 4: MU's seeded baseline is `in_progress`. A test that needs to
   regenerate it must delete its answers and reset it to draft inside a
   rolled-back transaction (see `tests/rls/question-bank.test.ts`).
10. Carried: new route ⇒ sweep probe; migration ⇒ `pnpm db:types`; seed counts in
    `app.yml`; spec files run in parallel against one DB; PostgREST caps a
    response at 1,000 rows (page explicitly); `service_role` only in
    `lib/supabase/admin.ts`; `git add <paths>`; verify live after merge; do not
    push to `main` while the merge build runs.
