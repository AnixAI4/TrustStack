# SLICE 2 — Organisation profile and scope wizard

**Branch:** `slice/02-scope-wizard` · **Est:** 1–2 sessions · **Week:** 3–4 ·
**Ships:** the organisation profile, the client's processing environment
(departments, systems, vendors, Data Principal types), scope answers, and the
**derived** risk tags and question-pack preview that Slice 3 will consume.

> Promoted 2026-09-14 by the Slice 1 Sync Step, against the code on
> `slice/01-tenancy-rbac`. Paths, helpers and conventions below are real.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. D-019…D-024), this file.
2. **Slice 1 must be merged and verified live first** (STATE 🔴 items 1–2). If
   not, stop and tell Aniket — do not stack Slice 2 on an unmerged branch.
3. Confirm CI (`app.yml` + `docs.yml`) is green on `main`.
4. `git checkout main && git pull && git checkout -b slice/02-scope-wizard`
5. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` green
   before writing code. Docker must be running for `pnpm db:types`.
6. **Ask Aniket one question up front** (STATE open loop): may the DPDP Programme
   Owner edit scope? The spec matrix gives them Organisations = Read. If yes, add
   a `scope.write` permission (core + migration + both matrix tests); if no, scope
   writes need `organization.update` (consultant, org admin, super admin).

## 1. DPDP anchoring

- **Principle (spec Step H):** applicability is driven by *actual processing*,
  not industry alone. The scope wizard is the client's first data-discovery exercise.
- **D02 Inventory** — `DI1.3` collection points, `DI1.4` system register.
- **D13 Vendor / Data Processor** — the vendor register starts here.
- **Rules 10–11 (children, from 13 May 2027)** — whether under-18 data is processed
  is the single most consequential scope answer for a university.
- **Rule 15 / s.16 (cross-border)** — "data location unknown" is itself a finding.

## 2. Goal

A consultant opens Mumbai University, fills in the profile and a short wizard,
registers departments, systems and vendors, and sees the risk tags and question
packs the assessment will use — all derived in `packages/core`, never hand-set.

## 3. Scope

**In:** `industries` reference table; organisation profile fields; `departments`,
`systems`, `vendors`, `data_principal_types`; one `organization_scopes` row per
organisation with the wizard answers and derived `risk_tags`; FK
`organization_users.department_id → departments`; the APIs and UI below; audit;
seed for both tenants.

**Out:** questions and pack contents (Slice 3 — the preview returns pack *codes*
only), ROPA records (Slice 7 — but get system/vendor/department shapes right,
they become ROPA FK targets), `data_categories` (Slice 7), assessments.

## 4. What exists (from Slices 0B + 1) — build on it, don't duplicate it

| Concern | Where | Notes |
|---|---|---|
| Guard chain | `apps/web/lib/api/guard.ts` | `export const GET = withApi({ auth: "required", tenant: "fromParam", permission: "organization.read", body, query }, async ({ supabase, organizationId, user, permissions, audit, body }) => …)`. Throw `ApiError(status, code, msg)`; `rpcError()` maps `TSxxx` SQLSTATEs |
| Static route check | `tests/unit/route-guard.test.ts` | Every `route.ts` handler must be `export const X = withApi(`; only `health` may be `auth: "public"` |
| **Route sweep** | `e2e/api/route-sweep.spec.ts` | **Add a probe to `PROBES` for every new route + method** or CI fails. Actor = MU Org Admin aimed at Org B; response must contain no `ORG_B_MARKERS` |
| Permissions | `packages/core/src/rbac.ts` | `organization.read` (all roles), `organization.update` (consultant, org admin, super admin). Matrix change = core + new migration + `rbac-matrix` & `rbac` tests |
| RLS helpers | `app.current_user_id()`, `app.current_user_organization_ids()`, **`app.has_permission(org_id, code)`**, `app.can_grant_role(org_id, role_id)` | All `SECURITY DEFINER`, `search_path=''`, schema `app` |
| Writes | D-023 | Plain tenant CRUD may use RLS **write** policies with `app.has_permission(organization_id, 'organization.update')` in `WITH CHECK`. RPCs only for trust-boundary/atomic writes |
| citext under `search_path=''` | Slice 1 migration comment | Bare `=` on citext silently becomes case-sensitive text compare inside definer functions — use `lower(x::text)` |
| Types | `pnpm db:types` → `apps/web/lib/supabase/database.types.ts` | Run after the migration and commit; CI fails if stale (D-024) |
| Grants | D-019, D-024 | `REVOKE ALL … FROM anon, authenticated` on every new table; CI fails if `anon` has any grant in `public` |
| Audit | `ctx.audit([...])` (as the user, RLS) or inside an RPC/trigger | Every profile/scope/register write is a sensitive action (gate 8) |
| Seed | `packages/db/prisma/seed-data.ts` (`SEED_ORGS`, `SEED_USERS[].memberships[]`, `SEED_COUNTS`), `seed.ts` | Fixed UUIDs `0b000000-…`; update the count string in `app.yml` "Seed is idempotent" (`2/9/10/2/10/28/189` today) |
| RLS test harness | `tests/rls/db.ts` | `inTransaction(client, async (tx) => { tx.asAdmin(sql) ; tx.as({sub,email}, sql) })` — always rolled back, savepoint per call |
| e2e helpers | `e2e/helpers.ts` | `accessTokenFor(email)`, `bearer(token)`, `withDb(fn)` (assertions only), `activeOrgCookieFrom()` |
| UI | `app/dashboard/layout.tsx` (switcher + nav), `lib/client/permissions.tsx` (`PermissionsProvider`, `usePermissions`, `<Can>`), `lib/client/api.ts` (`apiFetch`) | Active org id comes from `usePermissions().value.organizationId` |
| Industry codes | `organizations.industry_code` text | **Mismatch to fix:** seed has `education.higher`; packs use `university`; spec says `other`, packs say `general` |

## 5. Data model

New migration `…_scope_wizard`. Every tenant table: `organization_id`, RLS,
policy, explicit grants.

- **`industries`** (global reference, SELECT-only like `roles`): `code` pk-unique,
  `name`, `overlay_pack_code`. Rows: the ten codes in `docs/QUESTION_FORMAT.md`
  (`university`, `edtech`, `bfsi`, `healthcare`, `saas`, `manufacturing`,
  `retail_ecommerce`, `professional_services`, `public_sector`, `general`). Pick
  `general` over the spec's `other` (packs are source of truth, D-013); record it.
  Migrate `organizations.industry_code` values (`education.higher` → `university`)
  and add an FK to `industries(code)`.
- **`organizations`** gains `website`, `headquarters_city`, `employee_count int`,
  `data_principal_count_estimate int` (spec `02_*.md` §organizations).
- **`departments`** — `id`, `organization_id`, `name`, `head_user_id → users null`,
  timestamps. `unique(organization_id, lower(name))`.
- **`systems`** — `name`, `system_type` (erp/sis/lms/hrms/payroll/crm/website/
  mobile_app/payment/email_sms/ai/other), `hosting_model`
  (on_premise/cloud/saas/unknown), `data_location` (india/outside_india/unknown),
  `owner_department_id`, `processes_children_data` tri-state.
- **`vendors`** — `name`, `service`, `vendor_role` (data_processor/independent/
  unknown), `contract_exists` tri, `dpdp_clauses` tri, `cross_border` tri,
  `sub_processors_known` tri.
- **`vendor_systems`** — `(organization_id, vendor_id, system_id)` link.
- **`data_principal_types`** — `code` (applicant/student/parent_guardian/faculty/
  employee/alumni/customer/patient/visitor/research_participant/other), `label`,
  `includes_children` tri, `estimated_count int null`.
- **`organization_scopes`** — one row per org (`organization_id` unique):
  `children_data` tri, `ai_usage_types text[]` (proctoring/chatbot/analytics/
  scoring/recommendation/none), `marketing_tracking` tri, `cross_border` tri,
  `multi_location` bool, `public_facing_portal` tri, `sensitive_documents` tri,
  `risk_tags text[]` (derived), `derived_at`, `updated_by`.
- `organization_users.department_id` → FK `departments`.

**Tri-state** = `yes | no | unknown` (a Postgres enum or CHECK), **never** a
nullable boolean: `unknown` is a first-class answer (spec Step G).

**Pitfall — cross-tenant foreign keys.** A plain FK lets Org A's system point at
Org B's department. Give each parent `unique (organization_id, id)` and use
**composite FKs** `(organization_id, owner_department_id) → departments(organization_id, id)`.
Same for `vendor_systems` and `organization_users.department_id`. Test it in RLS.

## 6. Core logic — `packages/core`

`packages/core/src/scope.ts`, pure, exhaustively tested:
- `TRI_STATES`, `RISK_TAGS` (the ten from spec `03_*.md` §Secondary Risk Tags),
  `QUESTION_PACK_CODES`.
- `deriveRiskTags(input: { scope, systems, vendors, dataPrincipalTypes, dataPrincipalCountEstimate }): RiskTag[]`
  - `children_data` ⇐ scope.children_data ∈ {yes, unknown} OR any DP type/system
    `includes_children`/`processes_children_data` ∈ {yes, unknown}
  - `ai_processing` ⇐ any `ai_usage_types` other than `none`, or any `system_type = ai`
  - `cloud_saas_processing` ⇐ any system hosted `cloud|saas`
  - `cross_border_unknown` ⇐ scope.cross_border = unknown OR any system
    `data_location = unknown` OR any vendor `cross_border = unknown`
  - `high_vendor_dependency` ⇐ ≥ N data-processor vendors (pick N, record it)
  - `marketing_tracking`, `public_facing_portal`, `sensitive_documents` ⇐ yes|unknown
  - `multi_location` ⇐ true; `large_scale_processing` ⇐ estimate ≥ threshold (record it)
  - Output sorted, de-duplicated — deterministic for snapshotting later.
- `selectQuestionPacks(industryCode, riskTags): string[]` — `CORE_DPDP_V1`, the
  industry overlay (or `general` when an industry has none), then conditional
  packs (`CHILDREN_DATA_V1`, `VENDOR_PROCESSOR_V1`, `CLOUD_CROSSBORDER_V1`,
  `AI_RISK_V1`, `MARKETING_TRACKING_V1`, `SDF_READINESS_V1`) per spec §Question Packs.
  University + `ai_processing` + `proctoring` → also `AI_PROCTORING_UNIVERSITY_V1`
  (spec §Dynamic Rule Examples).

Required tests (from the stub — must not be lost):
- university + under-18 students + AI proctoring ⇒ **exactly**
  `["ai_processing", "children_data"]` when nothing else is set;
- `unknown` behaves as risk, not as "no", for every tri-state input;
- empty scope ⇒ no tags; `selectQuestionPacks` always includes `CORE_DPDP_V1`.

## 7. API

All under `apps/web/app/api/v1/`, all `withApi`, all added to the route sweep:

`GET /industries` (auth required, tenant none) ·
`GET|PATCH /organizations/[id]` (profile; read = `organization.read`, write = `organization.update`) ·
`GET|PUT /organizations/[id]/scope` (PUT re-derives `risk_tags` with core and stores them) ·
`POST /organizations/[id]/scope/preview-assessment` (returns tags + pack codes; no writes) ·
`GET|POST /organizations/[id]/departments`, `PATCH|DELETE …/departments/[departmentId]` ·
same shape for `systems`, `vendors`, `data-principal-types`.

- Child ids in the path (`[departmentId]`) must be verified to belong to
  `organizationId` — query with **both** `.eq("organization_id", organizationId).eq("id", …)`;
  RLS is the second lock, not the first.
- Any write to departments/systems/vendors/DP types marks scope stale: re-derive
  tags on save of scope, and have the preview always derive fresh.
- Deleting a department referenced by a system or member → `409 CONFLICT`.
- Route sweep probes for `[id]` routes expect `403 TENANT_ACCESS_DENIED`; for
  child routes also try **Org A's `[id]` with an Org B child id** → `404 NOT_FOUND`,
  never Org B data.

## 8. UI

- `/dashboard/organization` — profile form (`<Can permission="organization.update">`
  for edit; read-only otherwise).
- `/dashboard/scope` — wizard: 1 Industry & profile → 2 Data Principals →
  3 Departments → 4 Systems → 5 Vendors → 6 Risk questions (tri-state radios with
  an explicit **Unknown**) → 7 Preview (tags + packs, each tag with the reason it
  fired). Save per step; resumable.
- Add both to the dashboard nav. Plain folders only.
- Loading, empty and error states on every step; `data-testid` for asserted text (pitfall 8).

## 9. Tests

| Test | Where | Assertion |
|---|---|---|
| unit | `packages/core` | `deriveRiskTags` table-driven, incl. the university example, unknown-as-risk, determinism |
| unit | `packages/core` | `selectQuestionPacks` core always present; overlay fallback to `general` |
| unit | `tests/unit` | `industries` rows in the migration == the ten codes in core |
| **gate 5 (rls)** | `tests/rls` | Org A JWT reads 0 Org B rows from every new table; cannot INSERT/UPDATE into Org B; **composite FK rejects Org A system → Org B department** |
| rls | `tests/rls` | a role without `organization.update` cannot write scope tables (RLS `WITH CHECK`) |
| **gate 5 (api)** | `e2e/api/route-sweep.spec.ts` | every new route has a probe; child-id-from-Org-B → 404 |
| api | `e2e/api` | PUT scope stores the derived tags; client-sent `risk_tags` are ignored |
| api | `e2e/api` | `department_owner` PATCH profile → `403 FORBIDDEN` |
| audit | `e2e/api` or `tests/rls` | profile update, scope save, register create/update/delete each write `audit_logs` |
| e2e | `e2e/ui` | consultant completes the MU wizard; preview shows `children_data` and `ai_processing` |

## 10. Seed data

Mumbai University (fixed UUIDs, idempotent): profile (website, Mumbai,
~`data_principal_count_estimate` 500 000); departments Admissions, Examinations,
Academic Affairs (LMS), HR, IT, Hostel, Library, Finance; systems Admission
portal (saas, india), Student ERP/SIS (on_premise), LMS (saas, **unknown**
location), Examination system, HRMS, Payroll, Website, Payment gateway, AI
proctoring (ai, saas, **unknown** location, children **yes**); vendors LMS
provider, payment gateway, AI proctoring vendor (processor, contract yes, DPDP
clauses **unknown**, cross-border **unknown**); DP types applicants, students
(includes children **yes**), parents/guardians, faculty, employees, alumni.
Set `muDepartmentOwner` → Examinations department. BML: a minimal scope
(manufacturing, HRMS + ERP, no children) so cross-tenant tests have rows.
Update `SEED_COUNTS` and the `app.yml` count string.

## 11. Definition of Done

The 10 gates. Plus: risk tags only ever written by core-derived code; every
new table has composite tenant FKs where it references another tenant table;
route sweep covers every new route; `database.types.ts` regenerated; industry
codes consistent between seed, `industries` and packs.

## 12. Sync step

Update `STATE.md`; append `DECISIONS.md` (tri-state representation, `general` vs
`other`, thresholds for `high_vendor_dependency` and `large_scale_processing`,
RLS write policies vs RPCs for registers, audit-by-trigger vs API if chosen,
the DPDP-owner scope permission answer); update `CLAUDE.md` if a convention
emerged (composite tenant FKs are a candidate); **promote `SLICE_03_question_bank.md`
to a full prompt** against the real `deriveRiskTags`/`selectQuestionPacks`
signatures; stub-check `SLICE_04`. Commit, push, PR.

## 13. Known pitfalls

1. **Cross-tenant FKs** — plain FKs across tenant tables allow Org A rows to
   reference Org B rows. Composite `(organization_id, id)` FKs.
2. **`unknown` is not `no`.** A nullable boolean collapses them. Tri-state, and a
   test per input proving unknown fires the tag.
3. **Derived, never hand-set.** Ignore client-supplied `risk_tags`; the DB column
   is written only from `deriveRiskTags` output.
4. **Child ids in paths** — verify the child belongs to the path's organisation in
   the query, not just via RLS.
5. **Never global-unique a per-org value** — department/system/vendor names are
   `unique(organization_id, lower(name))`.
6. **New route ⇒ new sweep probe.** The sweep fails CI otherwise — that is the point.
7. **`pnpm db:types` after the migration**, commit the file; CI checks staleness.
8. From Slice 1: citext `=` inside `search_path=''` functions is case-sensitive;
   Playwright — wait for `toHaveURL` after sign-in/sign-out before `goto`; read a
   response body **before** disposing its request context. Specs run in
   parallel against one DB: never leave shared seed rows changed, and pin any
   state an RLS test depends on inside its own transaction.
9. Carried from 0B: plain `app/dashboard/…` folders; `service_role` only in
   `lib/supabase/admin.ts` (+ its documented callers); `git add <paths>`; never
   `next build` while `next dev` runs; verify against the live deploy after merge.
