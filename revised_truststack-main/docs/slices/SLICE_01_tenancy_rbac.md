# SLICE 1 — Tenancy, identity and RBAC

**Branch:** `slice/01-tenancy-rbac` · **Est:** 2 sessions · **Ships:** ten roles,
permission-guarded APIs, user invitations, an organisation switcher, and proof
that no role and no tenant can reach past its boundary.

> Re-synced 2026-09-14 by the Slice 0B Sync Step against the code on
> `slice/00b-walking-skeleton` (PR #1). Paths, helpers and envelope below are real.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, `docs/DECISIONS.md` (esp. D-015…D-019), this file.
2. Confirm CI (`app.yml` + `docs.yml`) is green on `main`. PR #1 is merged and
   `main` auto-deploys to https://revised-truststack-web.vercel.app (Vercel root
   `apps/web`). Gate 9 for this slice = CI green + that deploy updated; a new
   server-only env var (e.g. `ACTIVE_ORG_COOKIE_SECRET`) must be added in Vercel
   → Settings → Environment Variables by Aniket before merge.
3. `git checkout main && git pull && git checkout -b slice/01-tenancy-rbac`
4. `pnpm install && pnpm typecheck && pnpm test:unit && pnpm test:rls` — green
   before writing code. (`test:rls` and `test:e2e` use the hosted dev project via
   `.env.local`; run `pnpm db:seed` first if the seed users are missing.)

## 1. DPDP anchoring

This slice *is* a DPDP control, not plumbing:

- **Rule 6(b)** — access control over computer resources holding personal data.
  RBAC is the mechanism.
- **Rule 6(c)** — visibility of access "through appropriate logs, monitoring and
  review". Every role change, invite and organisation switch is audited.
- **Domain D11 Security safeguards (weight 10 — the heaviest)** — questions
  `S1.2` "role-based access controls implemented", `S1.3` "access logs
  maintained", `S1.6` "privileged access reviewed periodically". We must be able
  to answer our own questions at maturity 4–5, with evidence.
- **Domain D01 Governance** — `G1.4` accountability of process owners maps onto
  Department Owner scoping.

## 2. Goal

A consultant signs in, sees the organisations they are assigned to, switches
between them, and invites a client user with a role. What each user can see and
do is decided by the backend and by RLS — never by the UI.

## 3. Scope

**In:** `roles`, `permissions`, `role_permissions`; the ten spec roles;
`organization_users.role_id` + `department_id`; active-organisation context;
one composable guard chain; invite + accept flow; org switcher; the `/auth/*`
APIs; audit logging on all of it; generated Supabase DB types.

**Out:** departments as a managed entity (Slice 2 — `department_id` is a nullable
column here, nothing more), scope wizard, questions, anything scored, MFA.

## 4. What exists (from Slice 0B) — build on it, don't duplicate it

| Concern | Where | Notes |
|---|---|---|
| Schema | `packages/db/prisma/schema.prisma` | Prisma 7, `prisma-client` generator → `packages/db/src/generated/` (gitignored) |
| Migrations | `packages/db/prisma/migrations/<ts>_<name>/migration.sql` | Generate DDL with `pnpm --filter @truststack/db exec prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script`, then **hand-append** grants + RLS. Apply: `pnpm db:migrate` (uses `DIRECT_URL` :5432) |
| RLS helpers | `app.current_user_id()`, `app.current_user_organization_ids()` | `SECURITY DEFINER`, `search_path=''`, schema `app` (not exposed by PostgREST). Use them in every new tenant policy (D-019) |
| Grants pattern | end of 0B migration | `REVOKE ALL … FROM anon, authenticated;` then grant only what the policies cover |
| Tables | `organizations`, `users`, `organization_users` (`status` ∈ active/invited/suspended), `audit_logs` (append-only: SELECT+INSERT only) | `users` policy is **self-only** today |
| Domain logic | `packages/core/src/{types,membership}.ts` | `assertActiveMembership(memberships, userId, organizationId?)` throws `TenantAccessDeniedError` (`code = "TENANT_ACCESS_DENIED"`) |
| Envelope | `apps/web/lib/api/envelope.ts` | `ok(data, request)` / `fail(status, code, message, request, details)`; `ApiErrorCode` union — extend it, don't bypass it |
| Request client | `apps/web/lib/supabase/server.ts` | `createSupabaseForRequest(request)` → anon key + caller JWT (Bearer header first, else cookie). **All request-path DB access goes through this** (D-015) |
| Service role | `apps/web/lib/supabase/admin.ts` | Only permitted reference; `tools/check_service_role.mjs` enforces it. Unused so far |
| Session guard | `apps/web/middleware.ts` | `PROTECTED_PREFIXES = ["/dashboard"]`; add new page prefixes here. API routes self-authenticate (401 envelope, no redirect) |
| Audit | `apps/web/lib/audit/record.ts` | `recordAuditEvents(supabase, events)` inserts **as the user**; RLS requires caller is an active member of `organization_id` and `user_id = app.current_user_id()` |
| Existing API | `app/api/v1/health`, `app/api/v1/organizations/me` | `/me` inlines authenticate → resolve user → membership → read. It accepts `?organizationId=` — Slice 1 replaces that with the active-org cookie |
| Seed | `packages/db/prisma/seed.ts` + `seed-data.ts` | Fixed UUIDs (`0b000000-…`), idempotent upserts, Auth users via admin API, password from `SEED_USER_PASSWORD`. Tests import `@truststack/db/seed-data` |
| Tests | `packages/core/src/*.test.ts`; `apps/web/tests/unit`; `apps/web/tests/rls` (Vitest, `asUser(sub, sql)` helper: `set_config('request.jwt.claims')` + `SET LOCAL ROLE authenticated`, rolled back); `apps/web/e2e/api` + `e2e/ui` (Playwright, `accessTokenFor(email)` in `e2e/helpers.ts`) |
| CI | `.github/workflows/app.yml` | Ephemeral local Supabase; migrate → seed ×2 (asserts row counts — **update the expected `2/2/2/2`**) → RLS-coverage check → RLS → build → bundle secret scan → Playwright |

## 5. Data model

New migration `…_tenancy_rbac`:

- `roles` — `id`, `code` unique, `name`, `description`, `is_platform_role`
- `permissions` — `id`, `code` unique (`assessment.read`, `evidence.review`,
  `report.download`, `admin.question.update`, `audit.read`, `organization.users.invite`,
  `organization.users.update`, …), `description`
- `role_permissions` — `(role_id, permission_id)` composite pk
- `organization_users` — add `role_id → roles` (not null after backfill; seed
  existing two members as `organization_admin`), `department_id uuid null`,
  `invited_by → users null`, `invited_at`, `joined_at`
- `organization_invites` — `id`, `organization_id`, `email citext`, `role_id`,
  `token_hash` (**sha-256 of the raw token; the raw token never touches the DB**),
  `invited_by`, `expires_at` (default now()+7d), `accepted_at null`, `created_at`;
  partial unique `(organization_id, email) where accepted_at is null`

RLS:
- `roles`, `permissions`, `role_permissions` are **global reference data** — no
  `organization_id`. Enable RLS with a `SELECT TO authenticated USING (true)`
  policy and grant SELECT only. (CI's RLS-coverage check requires a policy.)
- `organization_invites` — members with `organization.users.invite` may read their
  org's invites. Permission-aware policies need a helper:
  `app.has_permission(organization_id uuid, permission_code text) returns boolean`
  (`SECURITY DEFINER`, same pattern as the 0B helpers).
- `users` — add `users_select_co_member`: `id IN (select ou.user_id from
  public.organization_users ou where ou.organization_id in (select app.current_user_organization_ids()))`
  so the Users list can show names/emails. Keep `users_select_self`.
- Writes (invite, role change, accept) — **no broad INSERT/UPDATE grants.** Use
  `public` `SECURITY DEFINER` functions granted to `authenticated` that check
  permission via `app.has_permission` inside, e.g.
  `public.accept_organization_invite(raw_token text)` — the invitee is *not yet a
  member*, so plain RLS cannot let them read the invite or insert the membership.
  Alternative is `admin.ts`; if chosen, record why in DECISIONS.

Ten roles (`docs/spec/01_*.md` §Module 1): `super_admin`, `consultant`,
`organization_admin`, `executive_sponsor`, `dpdp_owner`, `department_owner`,
`legal_user`, `it_security_user`, `procurement_user`, `auditor_reviewer`.

Seed `role_permissions` from the permissions matrix in `docs/spec/02_*.md`
§"API Permissions Matrix". Roles and permissions are **global**, not per-tenant;
`organization_users` is what makes them tenant-scoped. Seed them in the
migration (reference data that must exist in every environment) or in the seed
with fixed ids — pick one, record it.

Update `packages/core/src/types.ts` (`OrganizationUser` gains `roleId`,
`departmentId`, …) and the Prisma schema together.

## 6. Core logic — `packages/core`

Pure functions, no I/O, exhaustively unit-tested (CI greps core for framework
imports):
- `ROLE_CODES` const + `RoleCode` type; `PERMISSION_CODES` + `PermissionCode`
- `can(permissions: ReadonlySet<string>, required: PermissionCode): boolean`
- `resolveEffectivePermissions(roleCode, overrides?): Set<PermissionCode>` — the
  matrix lives in core as data, and the migration/seed is checked against it by a test
- `isMemberOf(memberships, organizationId): boolean` (reuse `assertActiveMembership`)
- `assertNotSelfDemotion(actor, target, newRole, orgAdminCount)` — the last
  `organization_admin` of an org may not remove or demote themselves.
- `hashInviteToken(raw)` must NOT live in core if it needs `node:crypto`; keep
  core runtime-agnostic — put hashing in `apps/web/lib/`.

## 7. API

All under `apps/web/app/api/v1/`:

`GET /auth/me` · `GET /auth/me/organizations` · `POST /auth/switch-organization`
· `GET /auth/me/permissions` · `POST /organizations/[id]/users/invite` ·
`GET /organizations/[id]/users` · `POST /invites/accept` ·
`PATCH /organizations/[id]/users/[userId]` (role change).
Keep `GET /organizations/me`, now resolved from the active-org cookie.

**One guard chain, used by every route** — create `apps/web/lib/api/guard.ts`:

```ts
export const GET = withApi(
  { auth: "required", tenant: "active" | "fromParam", permission: "organization.users.invite", body: schema },
  async ({ request, supabase, user, organizationId, permissions, body }) => { … },
);
```
authenticate (`createSupabaseForRequest` + `auth.getUser(accessToken)`) → resolve
app user → resolve active organisation → `assertActiveMembership` → load
permissions → `can()` → Zod-validate → execute → audit. Refactor
`organizations/me` onto it and delete its inline chain. `health` is the only
declared-public route. Add `FORBIDDEN` and `CONFLICT` to `ApiErrorCode`.

Active organisation travels in a signed, httpOnly, `SameSite=Lax` cookie set by
`switch-organization` (HMAC with a new server-only secret, e.g.
`ACTIVE_ORG_COOKIE_SECRET` — add the *name* to `.env.example`), and is
re-verified against membership on every request — never trusted as a
client-supplied value. No valid cookie → first active membership (current 0B
behaviour).

## 8. UI

Organisation switcher in the dashboard header (hidden when the user has one org) ·
`/dashboard/users` — list with role badges and status · Invite modal (email +
role) · `/invites/accept?token=…` page · a `<Can permission="...">` wrapper fed by
`/auth/me/permissions`. Plain folders only — CI fails on `app/(group)/` dirs.
`/invites` is reachable signed-out (it redirects to `/login?next=…` itself), so do
not add it to `PROTECTED_PREFIXES` blindly.

The UI hides what a user cannot do; the backend *enforces* it. Never the reverse.

## 9. Tests

| Test | Where | Assertion |
|---|---|---|
| unit | `packages/core` | `can()` truth table across all ten roles |
| unit | `packages/core` | last `organization_admin` cannot demote or remove themselves |
| unit | `apps/web/tests/unit` | role/permission matrix in core == seeded rows |
| api | `e2e/api` | switching to a non-member org → `403 TENANT_ACCESS_DENIED` |
| api | `e2e/api` | tampered active-org cookie → ignored/403, never another tenant |
| api | `e2e/api` | `department_owner` calling an admin route → `403 FORBIDDEN` |
| api | `e2e/api` | expired invite token → rejected; DB holds only `token_hash` |
| api | `e2e/api` | invite email already a member → `409 CONFLICT`, no duplicate row |
| **gate 5** | `e2e/api/route-sweep.spec.ts` | enumerate every `app/api/v1/**/route.ts` from the filesystem; for each, Org A actor + Org B id → never Org B data; a route not listed in the sweep's table fails the test |
| **gate 5 (rls)** | `tests/rls` | Org A JWT reading `organization_users`, `organization_invites`, `users` → only Org A rows (extend `cross-tenant.test.ts`) |
| guard | `tests/unit` or lint | every route file exports handlers wrapped in `withApi` (static check) |
| audit | `e2e/api` or `tests/rls` | invite, accept, role change, org switch each write an `audit_logs` row |
| e2e | `e2e/ui` | consultant switches org and the dashboard organisation name changes |

The route-sweep test is the important one: a route added later without a guard
must fail CI.

## 10. Seed data

Extend `packages/db/prisma/seed-data.ts` (keep fixed UUIDs, keep idempotent).
Mumbai University gains: an Executive Sponsor (Dean), a DPDP Programme Owner
(Registrar — the existing `dpdp.owner@mumbai-university.example.com` becomes this,
role `dpdp_owner`), an IT/Security user, a Legal user, and an **Anix AI Consultant
with access to both seeded organisations** — the consultant is what makes the org
switcher and cross-tenant tests meaningful. Give BML an `organization_admin`.
Update the expected counts in `app.yml`'s "Seed is idempotent" step.

## 11. Definition of Done

The 10 gates. Plus: all ten roles seeded with permissions; no route bypasses the
guard chain; the route-sweep test enumerates every `/api/v1` route; Supabase DB
types generated and used by the request-path queries.

## 12. Sync step

Update `STATE.md`; append `DECISIONS.md` (signed-cookie scheme, invite token
scheme, security-definer RPC vs service role for writes, whether permissions are
cached per request, where role/permission reference data is seeded); update
`CLAUDE.md` if a new convention emerged; **promote `SLICE_02_scope_wizard.md` to a
full prompt**; stub-check `SLICE_03`. Commit, push, PR.

## 13. Known pitfalls

1. **RLS recursion.** A policy *on* `organization_users` that queries
   `organization_users` recurses. Use the `app.*` security-definer helpers.
   Policies on *other* tables may query it freely.
2. **Supabase default grants.** New public tables are granted ALL to `anon` and
   `authenticated`. Every migration revokes and re-grants explicitly (D-019).
3. **Invitee is not yet a member.** RLS hides the invite and blocks the membership
   insert and the audit row. Accept via a security-definer function; write the
   audit row *after* the membership exists, or inside the function.
4. **Never global-unique a per-org value.** Any reference number is
   `unique(organization_id, reference_number)`. The old app shipped this bug (M4).
5. **Store the invite token hashed.** A raw token in the DB is a credential at rest.
6. **Permission checks belong in the backend.** Hiding a button is not access control.
7. **Active org from the cookie is a claim, not a fact** — re-verify membership
   every request.
8. **Playwright `getByRole("alert")`** also matches Next's
   `#__next-route-announcer__`. Use `data-testid` for asserted error text.
9. **Verify against the live deploy** before the Sync Step:
   `PLAYWRIGHT_BASE_URL=https://revised-truststack-web.vercel.app pnpm test:e2e`
   (after merge). Previews on `*-git-*` URLs sit behind Vercel login; use the
   production domain.
10. Carried from 0B: plain `app/dashboard/…` folders; `service_role` only in
   `lib/supabase/admin.ts`; runtime pooled `:6543` vs migrations direct `:5432`;
   `git add <paths>`; never `next build` while `next dev` runs.
