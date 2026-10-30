# SLICE 3 — Question bank and dynamic assessment generation

**Branch:** `slice/03-question-bank` · **Est:** 2 sessions · **Week:** 4–5 ·
**Ships:** the 16-domain model with weights, the question bank (98 core + 1,428
industry questions) as versioned reference data, trigger evaluation over the
Slice 2 scope, and an assessment whose question set is **snapshotted** — editing
the bank never changes an existing assessment.

> Promoted 2026-09-15 by the Slice 2 Sync Step, against the code on
> `slice/02-scope-wizard`. Paths, helpers and conventions below are real.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. D-006, D-007, D-013, D-014,
   D-020, D-023, D-026, D-027, **D-028, D-029, D-030**), `docs/QUESTION_FORMAT.md`, this file.
2. Slice 2 is **merged and verified live** (`main` @ `260efab`, live e2e 71/71,
   2026-09-16). Nothing blocks this slice; STATE's 🔴 list is paperwork plus the
   one confirmation named in 5.1 below.
3. Confirm CI green on `main`. `git checkout main && git pull && git checkout -b slice/03-question-bank`.
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green. Docker running (`pnpm db:types`).
5. **Aniket's decisions are recorded in D-029 — build to them:**
   1. **Baseline = 108 questions (98 core + 10 University overlay), never ~205.**
      First task: produce `docs/question_packs/OVERLAP_UNIVERSITY_CORE.md`
      classifying each of the 107 `UNI-*` questions as **exact overlap** (don't
      duplicate) · **partial overlap** (merge wording / overlay variant) ·
      **unique** · **conditional** (triggered or assessor-visible) ·
      **future/advanced** (backlog), with the closest core question and a one-line
      reason; reconcile Excel `MU_Overlay` U1–U10; propose the 10 overlay
      questions. **Stop and get Aniket's confirmation of the 10 before seeding the
      University overlay.** The remaining University questions stay in the bank as a
      conditional/reference pool, not in the baseline.
   2. **First domain code is primary and the only scoring domain**; the rest are
      `secondary_domain_codes` for reporting and gap linkage.
   3. **Uncapturable conditions → `potentially_applicable`.** Shown; assessor answers
      or marks N/A **with a required reason**; N/A is excluded from the scoring
      denominator (Slice 5). Captured conditions show/hide automatically.
   Seed the core pack and non-University overlays first if useful.
6. **Thresholds are D-028** — pass `DEFAULT_RISK_TRIGGER_CONFIG` through; never
   re-hard-code 3 or 1,00,000.

## 1. DPDP anchoring

- The **16-domain model** is the whole product: every question maps to one
  primary domain, domain weights total **exactly 100** (`Config` sheet, D-006).
- Each question should carry a `legal_control_basis` — what makes the assessment
  defensible to counsel. **All 1,428 industry questions and the 98 core
  questions lack a real one** (core has a placeholder sentence). Optional at seed,
  required before GA (D-013). Store `null`, never the placeholder.
- Snapshot immutability underpins Rule-backed evidence of *what was assessed when*.

## 2. Goal

A consultant opens Mumbai University, sees the question packs the scope selects
(Slice 2 preview), clicks **Generate assessment**, and gets a draft assessment
whose questions — text, domain, weight, version — are frozen copies. Editing a
question in the bank afterwards changes nothing in that assessment.

## 3. Scope

**In:** `dpdp_domains`; `question_packs`; `questions` + `question_versions`;
Markdown + Excel parsers in `packages/core`; a generator that emits the seed as
a migration (or seed JSON — decide, record); trigger conditions over scope
facts; `assessments` + `assessment_questions` (snapshot); APIs; a read-only
question-bank browser; generate-assessment UI; seed an MU draft assessment.

**Out:** responses, maturity/evidence scoring (Slices 4–5), gaps (6), question
authoring UI (admin editing is `admin.question.update`, super_admin only — a
later slice), counsel's legal citations (content work, not code).

## 4. What exists — build on it

| Concern | Where | Notes |
|---|---|---|
| Scope answers + tags | `organization_scopes` (`risk_tags` derived), `organizations.industry_code` | Read through `apps/web/lib/scope/risk.ts` → `loadScopeState()` / `preview()` |
| Pack selection | `packages/core/src/scope.ts` → `selectQuestionPacks({ industryCode, riskTags, aiUsageTypes })` | Core → overlay → conditional; overlay codes in `INDUSTRIES` (`UNIVERSITY_HIGHER_ED_V1`, `SAAS_TECH_OVERLAY_V1`, `BFSI_OVERLAY_V1`, …) |
| Registers | `systems.system_type`, `data_principal_types.code`, `vendors.vendor_role` | Trigger facts, e.g. `systemTypes contains "lms"`, `dataPrincipalCodes contains "parent_guardian"`. Several of D-029's backlog fields are already derivable here (lms · payment · cctv · biometric · ai system types; `ai_usage_types` proctoring; `includes_children`) — map those before proposing new wizard fields |
| Scale + vendor tiers | `packages/core/src/scope.ts` → `assessScopeProfile()` (D-028) | `processingScale` (normal/elevated/large_scale), `vendorDependency` (none/limited/vendor_dependent/complex_ecosystem), `enhancedReview.triggers`, `LARGE_SCALE_NOTICE`. Usable as trigger facts; `significantDataFiduciaryInferred` is always `false` and must stay that way |
| Stale scope | `preview().stale` | Refuse to generate from a stale scope (`409 CONFLICT`, "save the scope first") |
| Permissions | `question.read` (all roles), `admin.question.update` (super_admin), `assessment.read`, `assessment.write` (consultant, org admin, dpdp owner) | Matrix changes = core + migration + both matrix tests |
| Guard | `lib/api/guard.ts` `withApi` | `tenant: "fromParam"` needs `{id}` in the path. Routes keyed by `{assessmentId}` alone need a new mode (see §7) |
| Reference-data pattern | D-020: `roles`, `industries` — SELECT-only grants, written by migration, matched by a unit test against core | Question bank is reference data too |
| Tenant-table pattern | D-027: composite FKs, RLS write policies, `app.audit_scope_change` triggers | `assessments` / `assessment_questions` are tenant tables |
| Existing parser | `tools/question_inventory.py` — header-name mapping, domain from heading or `Domain` column, `CODE` regex | Port its logic to TypeScript in core, with a test per authored layout (10 files, see `docs/QUESTION_FORMAT.md` §Column aliases) |
| Excel | `docs/source/TrustStack_DPDP_Compass_Excel_MVP_Validated_Step12.xlsx` | `Config` rows D01–D16 (weights total 100); `Question_Bank` 98 rows (its `Domain Weight` column is **stale, totals 104 — never read it**); `Responses` = score oracle for Slice 5 |
| Domain codes | inventory tool | `D01 GOV · D02 INV · D03 ROPA · D04 PURPOSE · D05 NOTICE · D06 CONSENT · D07 RIGHTS · D08 GRIEVANCE · D09 RETENTION · D10 ACCURACY · D11 SECURITY · D12 BREACH · D13 VENDOR · D14 CHILD · D15 CROSSBORDER · D16 SDF_AI` |
| CI | `app.yml` seed-count string (`…/10/10/11/4/5/8/2` today); `docs.yml` validates `docs/question_packs/*.csv` and **rejects the placeholder legal basis** | Do not write core as `docs/question_packs/*.csv` with the placeholder — that check will fail |
| Tests | `tests/rls/db.ts` `inTransaction` (savepoints, claims cleared for `asAdmin`); `e2e/helpers.ts` token cache; route sweep `PROBES` | Every new route needs a probe |

## 5. Data model

Migration `…_question_bank`:

- **`dpdp_domains`** (reference): `code` pk (`GOV`…), `domain_id` unique (`D01`…),
  `name`, `weight numeric(5,2)`, `default_applicability`, `default_owner`,
  `sort_order`. CHECK `weight > 0`; **CI gate: active weights sum to exactly 100**
  (SQL assertion in `app.yml` + a core unit test `DOMAIN_WEIGHT_TOTAL_INVALID`).
- **`question_packs`** (reference): `code` pk, `tier` (`core|overlay|conditional`),
  `industry_code → industries null`, `name`, `version`, `status` (`draft|approved|retired`), `source_file`.
- **`questions`** (reference, one row per stable `question_code`): `code` unique,
  `pack_code`, `current_version`.
- **`question_versions`** (reference, immutable): `(question_code, version)` pk,
  `text`, `domain_code → dpdp_domains`, `secondary_domain_codes text[]`,
  `applicability` (`mandatory|conditional|potentially_applicable`), `source_tag` (`core|university|edtech|bfsi|…`), `na_rule` (text: when N/A is allowed),
  `trigger_condition jsonb null`, `trigger_text` (as authored), `risk_tags text[]`,
  `evidence_guidance`, `risk_if_weak`, `suggested_owner`, `priority` (`P0–P3` **null
  when not authored — never invent**), `criticality` (core only), `legal_control_basis null`,
  `recommended_fix null`, `status`, `created_at`. No UPDATE grant to anyone but tooling.
- **`assessments`** (tenant): `id`, `organization_id`, `name`, `assessment_type`
  (`baseline|reassessment`), `status` (`draft|in_progress|submitted|finalised`),
  `industry_code` + `risk_tags` + `pack_codes` **snapshotted**, `scope_derived_at`,
  `created_by`, timestamps. `UNIQUE (organization_id, id)`.
- **`assessment_questions`** (tenant, snapshot): `organization_id`, `assessment_id`
  (composite FK), `question_code`, `question_version`, and **copies** of `text`,
  `domain_code`, `domain_weight`, `applicability`, `priority`, `evidence_guidance`,
  `suggested_owner`, `pack_code`, `sort_order`; `included_reason` (`core`,
  `overlay`, `trigger:<expr>`, `potentially_applicable`). `UNIQUE (assessment_id, question_code)`.
  **No UPDATE/DELETE grant** — the snapshot is append-only; regeneration of a
  draft deletes and re-inserts via an RPC (D-023) that refuses unless `status = 'draft'`.
- RLS: reference tables SELECT to authenticated (like `roles`); tenant tables per D-027
  with `assessment.read` / `assessment.write`. Audit via trigger.

## 6. Core logic — `packages/core`

- `DPDP_DOMAINS` (16, weights from `Config`) + `assertDomainWeightsTotal(domains)`
  throwing `DOMAIN_WEIGHT_TOTAL_INVALID` (spec error code). Test with the stale
  104 set to prove it fails.
- `parseQuestionMarkdown(markdown, { industryCode, fileName })` → canonical records
  (`docs/QUESTION_FORMAT.md` §Canonical record). Header-name mapping, `Type` split
  into applicability + risk tags, trigger text extraction, backticks stripped,
  multi-domain `A / B` per Aniket's rule. Fixture per authored layout; a test
  that parsing all ten real files yields **1,428 records, 1,428 unique codes,
  16/16 domains each** (same invariants as the Python tool — then retire the tool
  or keep it as a cross-check, decide).
- Core pack from Excel: parse in a **tooling script** (`packages/db/tools/` or
  `tools/`), not in core (no xlsx dependency in core). Emit a committed JSON under
  `packages/db/question-bank/` with `legal_control_basis: null` where the cell
  is the placeholder.
- `ScopeFacts` built from Slice 2: `{ industryCode, riskTags, aiUsageTypes,
  systemTypes, dataPrincipalCodes, vendorRoles, answers, processingScale,
  vendorDependency }` — the last two from `assessScopeProfile()` (D-028), so a
  trigger can say "large-scale only" without re-deriving thresholds.
- `TriggerCondition` = spec §Dynamic Rule Examples JSON:
  `{ field, operator: "equals"|"contains"|"in"|"exists", value } | { all: [...] } | { any: [...] }`.
  `evaluateTrigger(condition, facts): boolean`; unknown field → throws (catch in
  the mapper, never at runtime on a client).
- `mapTriggerText(text): TriggerCondition | null` — a reviewed lookup table from
  authored phrases ("LMS used" → `systemTypes contains lms`), not NLP. Unmapped →
  `null` → `potentially_applicable` (D-029.3). Test coverage report:
  how many triggers mapped vs unresolved, printed by the generator.
- `generateAssessmentQuestions(bank, packCodes, facts)` → ordered snapshot rows with
  `included_reason`. Deterministic (domain sort order, then code). No duplicates
  across packs; University overlay limited to the 10 confirmed questions (D-029.1).

## 7. API

All `withApi`, all in the route sweep:

`GET /dpdp-domains` · `GET /question-packs` · `GET /question-packs/[code]/questions`
(`question.read`) · `POST /organizations/[id]/assessments` (`assessment.write`;
body `{ name }`; 409 if scope unsaved/stale; snapshots scope + generates questions) ·
`GET /organizations/[id]/assessments` · `GET /organizations/[id]/assessments/[assessmentId]`
· `GET /organizations/[id]/assessments/[assessmentId]/questions` (`assessment.read`) ·
`POST /organizations/[id]/assessments/[assessmentId]/generate-questions` (draft only).

The spec paths are `/assessments/{assessmentId}`. **Decide:** nest under
`/organizations/[id]/…` (works with today's guard), or add a guard mode
`tenant: { from: "entity", table: "assessments", param: "assessmentId" }` that
reads the row's `organization_id` **as the caller** (RLS) and then runs
`assertActiveMembership`. Record the choice; either way Org A with Org B's
`assessmentId` must get 403/404 and no data.

## 8. UI

- `/dashboard/questions` — read-only bank browser: pack list, questions grouped by
  domain, version, applicability, priority (shows "—" when not authored).
- Scope wizard step 7 gains **Generate assessment** (`<Can permission="assessment.write">`),
  disabled while `stale`.
- `/dashboard/assessments` list + `/dashboard/assessments/[assessmentId]` questions
  grouped by the 16 domains with weight, count and included reason.

## 9. Tests

| Test | Where | Assertion |
|---|---|---|
| unit | core | domain weights total exactly 100; the stale 104 set throws `DOMAIN_WEIGHT_TOTAL_INVALID` |
| unit | core | parser: one fixture per authored layout; all ten real files → 1,428 / 1,428 unique / 16 domains each |
| unit | core | `Type` split; priority `null` when absent (SaaS 156, process packs 78); placeholder legal basis → `null` |
| unit | core | `evaluateTrigger` truth table incl. `all`/`any`; `mapTriggerText` known phrases |
| unit | core | generator: deterministic, no duplicate codes, overlay-vs-core rule, unresolved triggers included |
| unit | web | migration/seed reference data == core (domains, packs, question counts) |
| rls | tests/rls | reference tables SELECT-only; `assessments`/`assessment_questions` Org A ≠ Org B; snapshot has no UPDATE/DELETE grant |
| **snapshot** | rls or api | generate for MU → change a `question_versions` text as tooling / add a v2 → existing `assessment_questions.text` unchanged |
| **gate 5** | route sweep | every new route; Org A + Org B `assessmentId` → no data |
| api | e2e/api | generate from stale scope → 409; department owner generate → 403; MU generation includes `UNIVERSITY_AI_PROCTORING_V1` questions |
| audit | rls/api | assessment create/generate audited |
| e2e | e2e/ui | consultant generates MU baseline from the wizard and sees 16 domain groups |

## 10. Seed data

Question bank = reference data in every environment (migration or seed JSON per
§3). MU gains a **draft baseline assessment** "Mumbai University DPDP Compass
Baseline" generated from its seeded scope (fixed id, idempotent). BML gets none
(so empty-state UI is exercised). Update `SEED_COUNTS` and the `app.yml` count string.

## 11. Definition of Done

The 10 gates. Plus: weights total 100 in CI; all 1,526 questions parse with no
duplicates; unresolved-trigger count reported; snapshot immutability tested;
the confirmed 10 University overlay questions recorded in DECISIONS; baseline MU assessment = 108 questions plus triggered/potentially-applicable ones, each labelled.

## 12. Sync step

Update `STATE.md` (question counts per pack, unresolved triggers, the overlap
outcome); append `DECISIONS.md` (overlap rule, multi-domain rule, unresolved
triggers, bank-as-migration vs seed, assessment route shape, parser location);
update `docs/QUESTION_FORMAT.md` where reality differs; **promote
`SLICE_04_keystone_evidence_scoring.md`** against the real `assessment_questions`
shape; stub-check `SLICE_05`. Commit, push, PR.

## 13. Known pitfalls

1. **`Question_Bank.Domain Weight` is stale (totals 104).** Read weights from
   `Config` only (D-006). A test must fail on 104.
2. **Never invent content.** Missing priority → `null`; placeholder legal basis →
   `null`. The report and gap engine must handle nulls later.
3. **Question codes are forever.** A meaning change is a new code or a new version,
   never an in-place edit (`docs/QUESTION_FORMAT.md` §Adding or changing).
4. **Snapshot, don't reference.** `assessment_questions` copies text/weight/domain;
   joining live `question_versions` at read time would let a bank edit rewrite history.
5. **Unknown is risk.** An uncapturable condition shows the question as
   Potentially Applicable; it never hides it (D-026, D-029).
6. **Composite FKs** for `assessment_questions → assessments` (D-027); reference
   FKs (`question_code`, `domain_code`) are plain — they are global.
7. **New route ⇒ new sweep probe**; **migration ⇒ `pnpm db:types`**; **seed counts in `app.yml`**.
8. `docs.yml` rejects the placeholder legal basis in `docs/question_packs/*.csv` —
   don't route the core pack through that folder as CSV with placeholders.
9. From Slice 2: API UUID validation rejects non-RFC fixture ids (variant nibble
   must be 8–b); RLS `asAdmin` clears claims; e2e tokens are cached — specs run in
   parallel against one DB, so mutate BML or clean up by name prefix.
10. Carried: plain `app/dashboard/…` folders; `service_role` only in
    `lib/supabase/admin.ts` + documented callers; `git add <paths>`; verify live after merge.
