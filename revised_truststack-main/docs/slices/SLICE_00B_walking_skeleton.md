# SLICE 0B — Walking skeleton

**Branch:** `slice/00b-walking-skeleton` · **Est:** 1 session · **Ships:** a
deployed, authenticated, multi-tenant application with one real table.

---

## 0. Session bootstrap

1. Read `docs/STATE.md`, then `docs/DECISIONS.md`, then this file end to end.
2. Confirm the 🔴 blockers in STATE.md are cleared — the Supabase project exists
   and `.env.local` is populated. **If not, stop and tell Aniket.** Do not
   scaffold against a fake database.
3. `git checkout main && git pull && git checkout -b slice/00b-walking-skeleton`

---

## 1. DPDP anchoring

No DPDP feature ships here, and that is deliberate — this slice builds the
container every later control lives in. It is anchored anyway:

- **Rule 6(b)** *"appropriate measures to control access to the computer
  resources"* — auth + RLS from the first commit.
- **Rule 6(c)** *"visibility on the accessing of such personal data, through
  appropriate logs"* — the `audit_logs` table exists from day one.
- **Tenant isolation** is the product's own security promise. We do not sell a
  privacy platform that leaks between clients, so gate 5 exists from slice one.

Serves no scored domain yet. It is the precondition for all sixteen.

## 2. Goal

A user signs in with Supabase Auth, lands on a page that reads their organisation's
name from Postgres through an authenticated `/api/v1` route, and cannot see any
other organisation's row — proven by an automated test. It runs in CI and is
deployed. Thin, but every layer is real.

## 3. Scope

**In:** monorepo · Prisma + first migration · RLS on `organizations` · Supabase
Auth email sign-in · `GET /api/v1/health` · `GET /api/v1/organizations/me` ·
one page · seed (2 orgs, 2 users) · Vitest + Playwright + CI · Vercel deploy.

**Out — do not build:** roles/permissions (Slice 1), invites, org switcher,
scope wizard, questions, scoring, evidence, ROPA, dashboards, the worker, AI,
any UI beyond the one page. Resist scope creep; the point is a proven pipe.

## 4. Prerequisites

```bash
node --version            # ≥ 20
test -f .env.local && grep -c SUPABASE .env.local   # ≥ 3
```
Supabase project must be **ap-south-1** — confirm in the dashboard, and record
the project ref in STATE.md.

## 5. Data model

First migration. Small, but shaped for the merge-ready spine (D-008).

- `organizations` — `id uuid pk`, `name`, `legal_name`, `organization_type`,
  `industry_code`, `parent_organization_id uuid null → organizations(id)`,
  `consultant_assisted bool`, `created_at`, `updated_at`, `deleted_at null`
- `users` — `id uuid pk`, `auth_provider_user_id text unique not null`,
  `email citext unique`, `full_name`, `created_at`, `updated_at`
- `organization_users` — `id uuid pk`, `organization_id → organizations`,
  `user_id → users`, `status`, `created_at`; `unique(organization_id, user_id)`
- `audit_logs` — `id uuid pk`, `organization_id`, `user_id null`, `event_type`,
  `entity_type`, `entity_id null`, `description`, `ip_address null`,
  `user_agent null`, `metadata jsonb`, `created_at`; index `(organization_id, created_at desc)`

**RLS on all four.** Read policy shape:
```sql
organization_id in (
  select ou.organization_id from organization_users ou
  join users u on u.id = ou.user_id
  where u.auth_provider_user_id = auth.jwt()->>'sub'
    and ou.status = 'active'
)
```
Enable RLS *and* add the policy in the same migration — an enabled table with no
policy denies everything and looks like a bug.

## 6. Core logic

`packages/core` exists with its build wired, exporting only what is real now:
domain types for the four tables, and `assertActiveMembership()`. No framework
imports — that constraint is the whole point (D-004). One trivial unit test
proves the package builds and is importable from both `apps/web` and tests.

## 7. API

Under `apps/web/app/api/v1/`:

- `GET /health` — public. `{ status, version, timestamp }`.
- `GET /organizations/me` — authenticated. Resolves the caller via
  `auth_provider_user_id`, returns their active organisation. `401` when
  unauthenticated; `403` `TENANT_ACCESS_DENIED` when not a member.

Both use the spec's envelope (`docs/spec/02_*.md`):
`{ success, data, meta: { requestId, timestamp } }` and
`{ success: false, error: { code, message, details } }`.

Requests use the **anon** key plus the user's JWT so RLS applies. The
`service_role` client is constructed in exactly one server-only module and is
used by nothing in this slice.

## 8. UI

- `/login` — email sign-in via Supabase Auth. Errors shown, never swallowed.
- `/dashboard` — protected. Renders the organisation name from
  `/api/v1/organizations/me`, and the signed-in email. Loading and error states.
- Unauthenticated `/dashboard` → `307` to `/login`. Put dashboard pages in a
  **plain `app/dashboard/` folder, not a `(dashboard)` route group** — a route
  group drops the URL segment and silently bypasses the middleware. That exact
  bug shipped four times in the old app (D-012).

## 9. Tests

| Test | Assertion |
|---|---|
| unit | `packages/core` imports and its one function behaves |
| api | `GET /api/v1/health` → 200 |
| api | `GET /api/v1/organizations/me` unauthenticated → 401 |
| **api — gate 5** | user of Org A requesting Org B's id → **403/404, never Org B data** |
| **rls — gate 5** | same query with Org A's JWT direct to Postgres → **0 rows** |
| e2e | sign in → `/dashboard` shows the org name |
| e2e | `/dashboard` while signed out → 307 → `/login` |

The two gate-5 tests are the ones that matter. Both layers, independently.

## 10. Seed data

Two organisations — **Mumbai University** (`university`, consultant-assisted;
grows every slice) and **Bharat Manufacturing Ltd** (exists only so cross-tenant
tests have something real to fail against) — plus one user each, and an
`audit_logs` row per seeded sign-in. Idempotent: re-running must not duplicate.

## 11. Definition of Done

The 10 gates in `CLAUDE.md`. Specifically: migration + RLS on all four tables;
`packages/core` framework-free; unit + API + **both** cross-tenant tests + e2e
green; one page on real data; seed committed; audit rows written; CI green;
deployed to Vercel preview with the URL in STATE.md; Sync Step done; pushed.

## 12. Sync step

1. `docs/STATE.md` — mark 0B ✅, files created, Supabase project ref, preview
   URL, next branch `slice/01-tenancy-rbac`, any new blocker.
2. `docs/DECISIONS.md` — append anything non-obvious (auth session strategy,
   Prisma vs Supabase client boundary, monorepo tool).
3. `CLAUDE.md` — add exact versions once installed; add a pitfall if one was hit.
4. **Promote `SLICE_01_tenancy_rbac.md`** — it is already full, so re-sync it
   against the code that now exists: real file paths, the actual RLS helper, the
   real API envelope. This is the Sync Step's main job.
5. Stub-check `SLICE_02`. Commit, push, open the PR.

## 13. Known pitfalls

1. **Route groups bypass middleware.** `app/dashboard/`, never `app/(dashboard)/`.
2. **`service_role` bypasses RLS entirely.** One server-only module, never
   `NEXT_PUBLIC_*`. A secret-scan CI step guards this.
3. **Connection pooling.** Prisma runtime → pooled `:6543`; migrations →
   direct `:5432`. Wrong one exhausts connections under serverless.
4. **RLS enabled with no policy denies everything** and reads as a broken query.
5. **Region.** Confirm `ap-south-1` in the dashboard, not from memory (D-003).
6. **Do not run `next build` while `next dev` is running** — shared `.next/`
   corrupts the dev manifest. (Carried from the old app.)
7. **`git add <paths>`.** Never `git add .` — `.env.local` must never be staged.
