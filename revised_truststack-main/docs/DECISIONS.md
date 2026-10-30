# Decision log

Append-only. One entry per choice that is expensive to reverse or that a cold
session might otherwise re-litigate. Newest at the bottom.

Format: **ID · date · decision · why · consequence.**

---

### D-001 · 2026-09-07 · Build in a new repo, not inside the old app
`aniketmhala/dpdp` → `truststack-platform/` stays where it is. This repo is new.

**Why:** what changes is the *foundation* — evidence-capped scoring, question
versioning, immutable snapshots, RLS-first tenancy. A strangler-fig approach only
works when the old core is sound and you replace the edges; here the core is the
thing being replaced.

**Consequence:** no inherited schema debt. Costs a later port (D-002).

---

### D-002 · 2026-09-07 · Port six modules from the old app in Slice 10, then decommission it
Notice, Consent, Rights/DSR, Grievance, Vendor, Breach are ported to the new
schema. Retention Register and AI Risk Register are built new.

**Why:** the old app is **pre-beta with no production tenants** — its own
`implementation/PENDING.md` lists unsigned beta blockers. So there is no data or
auth migration, only a code port. Its six modules map almost 1:1 onto PRD Epic E9.

**Consequence:** the old app is FROZEN from 2026-09-07 (bug fixes only; no FIX4
beta sign-off, no M11+). A frozen source is easy to port from; a moving one is not.

---

### D-003 · 2026-09-07 · Supabase, not bare Postgres
Supabase Postgres + Auth + Storage + RLS + pgvector, region **Mumbai ap-south-1**.

**Why:** Supabase *is* Postgres, so there is no data-layer lock-in (`pg_dump`
moves us to RDS any day). It collapses four vendors the spec requires — signed-URL
object storage, auth, RLS, pgvector for RAG — into one, in-region, which also
supports the data-residency story for an Indian privacy product.

**Consequence:** RLS is defence in depth, never the only lock. `service_role`
never reaches the browser. Use the pooled port at runtime, direct for migrations.

---

### D-004 · 2026-09-07 · `packages/core` + Next.js route handlers, not a separate NestJS service
Domain logic (scoring, question selection, ROPA completeness, gap generation)
lives in a framework-free `packages/core`. HTTP is Next.js handlers under
`/api/v1`. A separate worker handles reports, imports and AI jobs.

**Why:** the spec (Step D) calls for NestJS, and its stated benefit — reusable,
testable domain logic — is delivered by `packages/core` alone. Three deploy
targets would roughly halve slice velocity against a 13 May 2027 deadline.

**Consequence:** if a standalone API is ever needed, `packages/core` lifts into
NestJS unchanged and re-exposes the same `/api/v1` contract. Reversible by design.

---

### D-005 · 2026-09-07 · Vertical slices, never layers
Each slice ships migration + RLS + core logic + tests + API + UI + seed +
audit + CI + deploy for one thin capability. Never "all frontend, then backend."

**Why:** integration risk surfaces in week 1, not week 10. Something is demoable
from week 3.

**Consequence:** the 10-gate Slice Contract in `CLAUDE.md` is binding.

---

### D-006 · 2026-09-07 · `Config` sheet weights are authoritative; `Question_Bank` weights are stale
Domain weights come from the Excel `Config` sheet (total **100**). The
`Question_Bank` sheet's `Domain Weight` column is pre-correction and totals
**104** (D01=8, D04=8, D09=7, D16=5).

**Why:** Step 12 validation corrected the weights in `Config` only. Seeding from
the wrong column silently corrupts every score — and 104 is exactly the
`DOMAIN_WEIGHT_TOTAL_INVALID` case the spec's own test list names.

**Consequence:** the seeder reads `Config`; a CI gate asserts the total is 100.

---

### D-007 · 2026-09-07 · The Excel workbook is the scoring engine's test oracle
The engine must reproduce 24.7015/100, 23.9% evidence confidence, 10 critical and
57 high gaps from the workbook's 98 sample responses.

**Why:** the workbook is a *working* implementation, hand-verified
(`D02: (0.857/5)×8 = 1.3714`; all 16 domains sum to 24.7015). It converts the
riskiest part of the build from "implement and hope" into "port and assert".

**Consequence:** parity is a CI gate from Slice 5. But the sample never exercises
the evidence cap (claimed always equals evidence level), so Slice 4 adds explicit
cap tests. E1 and E2 both cap at 2 — a naive "use the numeric level" implementation
passes every existing test and is wrong.

---

### D-008 · 2026-09-07 · Merge-ready spine from the first migration
Include from day one, even where unused: `users.auth_provider_user_id`;
`organizations.parent_organization_id`; storage paths keyed by `organization_id`;
polymorphic `evidence_links(linked_entity_type, linked_entity_id)`;
entitlement/subscription tables modelled.

**Why:** each is minutes now and weeks later. `parent_organization_id` carries
affiliated colleges (MU overlay U2, pricing Option C). `auth_provider_user_id`
stops identity being welded to Supabase Auth UUIDs. `evidence_links` lets the six
ported modules attach evidence with no schema change.

**Consequence:** some columns sit unused for months. Accepted.

---

### D-009 · 2026-09-07 · Just-in-time slice prompts
Only the next slice is a full prompt. Later slices stay one-line stubs until
promoted by the Sync Step.

**Why:** the old app wrote 35 prompt files and built 10 modules — prompts for a
codebase that did not exist. Its M6 prompt needed re-syncing "after Session 7"
because reality had moved. Authoring at the end of the prior session, against
code that exists, removes that whole failure class.

**Consequence:** `docs/SLICES.md` is the plan; detail arrives one slice ahead.

---

### D-010 · 2026-09-07 · One status file, and CI enforces freshness
`docs/STATE.md` replaces the old app's `progress.md` + `PENDING.md` +
`tracker-data.json`.

**Why:** three files holding the same facts drifted — commit `e86850c` had to
"dedupe stale qa-pass tracker entry". One fact, one home.

**Consequence:** CI fails if `src/` changes without `STATE.md` changing.

---

### D-011 · 2026-09-07 · Legal caveats are code, not documentation
The report caveat, `legalReviewRequired` / `requiresHumanReview` flags, and the
AI guardrails are enforced in output schemas and tests.

Report caveat, verbatim:

> This report is a DPDP readiness and assessment output based on information,
> responses and evidence made available during the assessment. It is not a final
> legal opinion, statutory certification or guarantee of compliance. Final legal
> interpretation, policy approval and contractual sign-off should be reviewed by
> authorised legal counsel.

**Why:** "we do not certify compliance" is a commercial and legal asset. Left to
documentation discipline it erodes; enforced in a schema it cannot.

**Consequence:** never describe TrustStack as a statutory Consent Manager unless
formally registered with the Data Protection Board.

---

### D-012 · 2026-09-07 · Recurring pitfalls become automated checks, never prose
Any bug that appears twice is turned into a test or lint rule in the same slice.

**Why:** the old app documented a route-group auth bug and then shipped it in
M2, M3, M5 *and* M7. A note in a prompt is a hope; a test is a guarantee.

**Consequence:** the "Known pitfalls" section of a slice prompt should shrink
over time as items graduate into CI.

---

### D-013 · 2026-09-14 · Authored Markdown is the source of truth for industry questions
The nine files in `docs/question_packs/industry/` are canonical. The Slice 3
seeder parses their tables by **header name** and normalises the differing column
layouts into one record (`docs/QUESTION_FORMAT.md`). Nobody re-keys them into CSV.

**Why:** 1,307 questions already authored with richer fields (risk-if-weak,
evidence, owner, priority) than the CSV schema proposed in Slice 0A. Forcing a
conversion would cost days and create two copies that drift (D-010 again).

**Consequence:** the canonical field model is the one proposed in
`01_University_*.md` §16. `legal_control_basis` becomes optional at seed time and
required before general availability. `tools/question_inventory.py` guards
uniqueness and domain coverage in CI until the real seeder exists.

---

### D-014 · 2026-09-14 · Overlays add to the 16-domain score; overlap with core is resolved in Slice 3
Industry and process questions contribute to the same 16 weighted domains — never
a separate score — and domain weights stay at 100 regardless of how many overlay
questions a domain gains.

**Why:** stated in the authored files themselves (Professional Services §9: "map
into the 16-domain DPDP Compass score, not create a separate score") and in the
PRD rule that overlays "add questions and process views, not change the total score".

**Open, deliberately not decided here:** the University file (107) overlaps the
core pack (98) — e.g. `UNI-GOV-001` ≈ `G1.2`. Loading both gives ~205 questions,
against the "108 questions" quoted in the PRD, the pitch deck and the ₹9.75–12L
proposal. Slice 3 must present Aniket with an overlap map and a recommendation
(de-duplicate, or mark overlay questions as replacing their core equivalent)
before seeding. The Excel `MU_Overlay` U1–U10 are reconciled into the University
pack at the same time.

---

### D-015 · 2026-09-14 · Supabase client (user JWT) on the request path; Prisma is privileged tooling
Every user-initiated read or write goes through `@supabase/ssr` / `supabase-js`
with the **anon key plus the caller's JWT**, so it runs as `authenticated` under
RLS. Prisma owns the schema and migrations, the seed, and (from Slice 9) worker
jobs — it connects as `postgres` and **bypasses RLS**.

**Why:** gate 5 demands two independent locks. Prisma on the request path would
make RLS decorative unless every request opened a transaction and set
`request.jwt.claims` + `SET ROLE` by hand — easy to forget once, and a single
miss is a cross-tenant leak. The Supabase client gets RLS by construction.

**Consequence:** request-path queries are PostgREST-shaped and untyped until
Supabase types are generated (candidate for Slice 1). `@truststack/db/client` is
never imported by `apps/web` runtime code. The web app's only service-role client
is `apps/web/lib/supabase/admin.ts` (unused in 0B); `packages/db/prisma/seed.ts`
also uses the service role, to create Auth users — tooling, not runtime. Revisit
only with an ADR if Prisma-with-RLS (per-request claims transaction) is needed.

---

### D-016 · 2026-09-14 · Auth: email + password, cookie sessions via `@supabase/ssr`, Bearer for API clients
Sign-in is a Server Action calling `signInWithPassword`; the session lives in
Supabase's httpOnly cookies, refreshed by `middleware.ts` which calls
`auth.getUser()` (re-validates the JWT with Supabase Auth — never trust cookie
contents). `/api/v1/*` accepts `Authorization: Bearer <jwt>` first, falling back
to the cookie. Sign-in and sign-out write `audit_logs` rows **as the user**,
through the `audit_logs_insert_member_as_self` RLS policy.

**Why:** password sign-in is the only email method an e2e test can drive without
a mail catcher; magic links/OTP can be added later without schema change. Bearer
support makes the API testable and usable by non-browser clients. Auditing via
the user's JWT means no service-role key is needed to write the log, and a forged
row fails at the database.

**Consequence:** Supabase `mailer_autoconfirm` is off, so seeded users are created
confirmed via the admin API. Invites (Slice 1) must decide the confirmation flow.
MFA is not in scope until Slice 13's security pass.

---

### D-017 · 2026-09-14 · pnpm workspaces, no Turborepo; `packages/core` built by `tsc` to `dist`
`apps/web`, `packages/core`, `packages/db`. `apps/web`'s `build` script builds core
first. `@truststack/db` exposes `./seed-data` (TS source, for tests) and `./client`.

**Why:** three packages do not need a task graph or remote cache. Building core
to `dist` (rather than importing TS source) proves it compiles on its own, which
is what keeps it framework-free and liftable into NestJS (D-004).

**Consequence:** add Turborepo when the worker lands (Slice 9) if build times hurt.
pnpm does not run `pre*` scripts, so ordering is explicit in `build`.

---

### D-018 · 2026-09-14 · CI integration tests run on an ephemeral local Supabase, not the hosted project
`app.yml` starts Supabase in Docker (db, auth, rest, gateway only), applies
migrations to an empty database, seeds twice, asserts RLS + a policy on every
public table, then runs the RLS, API and e2e suites. Locally the same suites run
against the hosted dev project (`nywwsdcnqivefednqezw`, ap-south-1).

**Why:** CI needs no Supabase secrets in GitHub; every run proves the migration
chain applies from zero (the old app's DB and repo drifted precisely because
nothing checked this); and parallel PRs cannot trample shared data.

**Consequence:** the Supabase CLI version is pinned in `app.yml` and
`supabase/config.toml` pins Postgres 17 to match the hosted project. The
`SEED_USER_PASSWORD` in `app.yml` is deliberately public — it guards example.com
users in a container that lives for one job.

---

### D-019 · 2026-09-14 · RLS through `security definer` helpers in schema `app`; Supabase default grants revoked
Tenant policies call `app.current_user_organization_ids()` / `app.current_user_id()`
rather than inlining the membership join. Every migration that creates a tenant
table `REVOKE ALL … FROM anon, authenticated` and then grants only what its
policies are written for.

**Why:** a policy on `organization_users` that queries `organization_users`
recurses; the helper avoids that and gives one definition of "my organisations".
`app` is not exposed by PostgREST, so the helpers cannot be called as RPC.
Supabase's default privileges grant `anon` and `authenticated` ALL on new public
tables — RLS still filters rows, but `anon` could otherwise attempt writes and
`authenticated` could `DELETE` from an append-only log if a permissive policy
were ever added.

**Consequence:** `anon` has no table access at all (tested). `audit_logs` has no
UPDATE/DELETE grant (tested). The inline policy shape in the Slice 0B prompt is
implemented by the helper, not copied.

---

### D-020 · 2026-09-14 · Role/permission matrix is data in `packages/core`, inserted by the migration
`packages/core/src/rbac.ts` holds the ten roles, 28 permission codes and
`ROLE_PERMISSIONS`. The `tenancy_rbac` migration inserts exactly those rows (the
SQL was generated from core). Two tests fail on drift: `tests/unit/rbac-matrix.test.ts`
parses the migration; `tests/rls/rbac.test.ts` reads the live database.

**Why:** reference data must exist in every environment, including a fresh CI
database, so it belongs in the migration, not the seed. Keeping core as the
readable source means the UI, the API and the SQL helper all answer "can X do Y"
the same way.

**How the spec matrix was read** (`docs/spec/02_*.md` §API Permissions Matrix):
- "Assigned" = contributor *actions*; *which records* (department/question
  ownership) is enforced from Slice 2–4.
- Consultant "Users: Limited" = read + invite, never role changes.
- `legal_user`, `it_security_user`, `procurement_user` are **not in the matrix**;
  modelled as Department Owners for their area. Revisit if counsel or MU disagree.
- Leads hold `audit.read_summary`/`audit.read_own` alongside `audit.read`, so they
  can grant roles carrying them (escalation check is a strict subset test).
- `super_admin` is a platform role: never grantable by invite, and it grants
  **no** cross-tenant access — it acts only inside organisations it is a member of.
  A platform console is out of scope until Slice 13.

**Consequence:** changing the matrix = edit core + a new migration, in one PR.

---

### D-021 · 2026-09-14 · Active organisation = HMAC-signed httpOnly cookie, re-verified every request
`POST /auth/switch-organization` sets `ts_active_org = base64url({u,o}).HMAC-SHA256`
(key `ACTIVE_ORG_COOKIE_SECRET`, ≥32 chars, server-only), `HttpOnly`,
`SameSite=Lax`, `Secure` in production, 30 days. The payload binds the
organisation **to the user id**, so a cookie replayed by another user is void.

**Why:** the spec wants an active-organisation context; a query param (0B) let
the client choose the tenant. Signing stops forgery; binding stops replay; the
guard still re-checks membership on every request because a valid cookie for an
organisation you have since left must grant nothing (pitfall 7).

**Consequence:** a cookie that fails any check is **ignored** (fall back to first
active membership), never a 403 — the tenant-scoped routes that take an explicit
`{id}` are what return `TENANT_ACCESS_DENIED`. Bearer API clients send the same
cookie. No secret configured → switching returns 500 and cookies are ignored, so
**the secret must exist in Vercel before merge.**

---

### D-022 · 2026-09-14 · Invite tokens: 256-bit, SHA-256 at rest, link shown once; possession confirms the email
`crypto.randomBytes(32)` base64url. Only the hex SHA-256 reaches the database
(a CHECK constraint rejects anything else). 7-day expiry, single use, one open
invite per `(organization_id, email)`. `POST /organizations/{id}/users/invite`
returns the link **once** to the inviter; no email is sent yet.

Acceptance: signed in → the RPC runs as the caller and requires their JWT email
to match. Signed out → the invitee chooses a password; the server creates their
Auth user **already confirmed** via the service role, signs them in, then runs
the same RPC as them. This resolves the D-016 open question.

**Why:** a raw token at rest is a credential. With `mailer_autoconfirm` off,
`signUp` would send a Supabase confirmation email the invitee must also click —
two emails, one of them from infrastructure we do not control, for a
consultant-led pilot. Holding an unexpired, single-use invite link is the proof
of email control.

**Risk accepted, for now:** because the link is shared out of band, whoever holds
it can create the account for that email. Fixed when invite emails are delivered
directly to the mailbox (see STATE open loops). `lib/invites/lookup.ts` is the
second service-role user; it touches one invite row keyed by the token hash and
creates one Auth user.

---

### D-023 · 2026-09-14 · Membership writes go through SECURITY DEFINER RPCs, not the service role; permissions are not cached
`public.create_organization_invite`, `public.accept_organization_invite`,
`public.update_organization_member` are the **only** write paths; `authenticated`
has no INSERT/UPDATE grant on `organization_users`, `organization_invites` or the
reference tables. Each RPC re-checks `app.has_permission`, tenancy and
`app.can_grant_role` (no escalation), enforces the last-admin rule under a row
lock, and writes its own `audit_logs` row in the same transaction. Errors are
custom SQLSTATEs (`TS401/403/404/409/410/422`) mapped to the envelope by
`rpcError()` in `lib/api/guard.ts`.

Permissions are loaded from the database **once per request** (one embedded
PostgREST query with the memberships) and never cached across requests or put
in JWT custom claims.

**Why:** the invitee is not yet a member, so plain RLS can neither show them the
invite nor let them insert a membership (pitfall 3). The service role would
bypass RLS for the whole operation; the RPC runs as the caller, keeps
`auth.jwt()` meaningful, and makes the database the second lock (D-003). Not
caching means a role change or suspension applies on the very next call — the
e2e test asserts it.

**Consequence:** simple tenant-owned CRUD tables (Slice 2+) do not need RPCs —
RLS write policies using `app.has_permission` are enough. Use an RPC when a
write crosses a trust boundary, needs a row lock, or must audit atomically.

---

### D-024 · 2026-09-14 · Generated Supabase types are committed and CI-checked; anon may hold no grant on any public table
`pnpm db:types` (`tools/gen_db_types.mjs`, Supabase CLI via Docker) writes
`apps/web/lib/supabase/database.types.ts`; every request-path client is
`SupabaseClient<Database>`. CI regenerates from the freshly migrated local stack
and fails if the file is stale. CI also fails if `anon` holds any privilege on any
`public` table.

**Why:** untyped PostgREST queries were a 0B open loop. Generating the types
surfaced a real exposure: `prisma migrate deploy` creates `public._prisma_migrations`
itself, so the 0B migration never revoked Supabase's default grants on it —
anyone with the public anon key could read and **rewrite migration history**
through PostgREST. Closed in the Slice 1 migration; the grant check stops the
next Prisma-created or hand-created table repeating it (D-012).

**Consequence:** run `pnpm db:types` after every migration and commit the result.

---

### D-025 · 2026-09-15 · Invite links are emailed via Resend and never shown to the inviter
Supersedes the "link shown once to the inviter" part of D-022 and closes its
accepted risk. `POST /organizations/{id}/users/invite` creates the invite, then
`lib/invites/deliver.ts` emails the link through `lib/email/send.ts` (Resend
HTTP API, no SDK). The response carries `delivery: "sent" | "suppressed" |
"logged"` and **no link or token**. `POST /organizations/{id}/invites/{inviteId}/resend`
calls the new `public.reissue_organization_invite` RPC: new token hash, fresh
7-day expiry, old link dead immediately, audited.

**Provider:** Resend, domain `notify.truststack.co.in` (GoDaddy DNS; SPF, DKIM,
DMARC `p=none` verified 2026-09-15), **region Tokyo (`ap-northeast-1`)**. The
root domain's GoDaddy mailbox records are untouched. Env: `RESEND_API_KEY`
(sending-only, domain-restricted), `INVITE_EMAIL_FROM`.

**Why:** with the link handed to the inviter, whoever held it could create the
invited person's account and act under their name in the audit log. Mailbox
delivery is the industry-standard proof of email control. Resend over Amazon SES
Mumbai for speed of setup, at the cost of processing outside India (below).

**Rules in code:**
- **Reserved test domains are never sent** (`example.com/.net/.org`, `.test`,
  `.example`, `.invalid`, `.localhost`): result `suppressed`, audited. Seed and
  e2e users live there, so tests — including against the live site — send nothing
  and cannot damage sender reputation.
- **Fail loud:** a production build without `RESEND_API_KEY`/`INVITE_EMAIL_FROM`
  throws; the API returns `502 EMAIL_DELIVERY_FAILED`, the invite stays pending,
  `organization.invite.email_failed` is audited, the admin can Resend. Only
  `next dev` logs-and-continues (recipient + subject, never the body).
- **Links are built from `VERCEL_PROJECT_PRODUCTION_URL` in production**, never
  the request `Host` header, so a forged Host cannot mail out a link to another server.
- Audit stores the provider message id, never the email body. Idempotency key
  per token prevents double sends on retry.
- e2e tests stand in for the mailbox with `giveInviteKnownToken()` (setup-only DB write).

**Consequences:** Resend is a Data Processor for invitee name + email, processed
in **Japan** — cross-border under DPDP s.16; DPA and vendor-register entry are
Aniket's (STATE). Moving to SES Mumbai later = replace `lib/email/send.ts` only.
Email is still only as strong as the mailbox — MFA in Slice 13.

---

### D-026 · 2026-09-15 · Scope wizard: `scope.write` for the DPDP Programme Owner; derived tags; vocabulary choices
**Aniket's decision (2026-09-15):** the DPDP Programme Owner may edit the scope.
New permission `scope.write` → `super_admin`, `consultant`, `organization_admin`,
`dpdp_owner`. It covers the scope answers, industry, Data Principal scale and the
four registers (departments, systems, vendors, Data Principal types). The
organisation **profile** (name, legal name, website, city, employees) stays
`organization.update` — the DPDP owner cannot rename the organisation. Because one
RLS UPDATE policy on `organizations` admits either permission, a BEFORE UPDATE
trigger (`app.guard_organization_update`) enforces which column group each may change.

**Derived, never hand-set:** `organization_scopes.risk_tags` is written only from
`deriveRiskTags()` output; `PUT …/scope` has no tags field (Zod strips it).
`explainRiskTags()` returns reasons so the preview shows why each tag fired.

**Vocabulary choices:**
- Tri-state = `text` + CHECK (`yes|no|unknown`), not a nullable boolean and not a
  Postgres enum (enums are awkward to extend in migrations). `unknown` fires the
  tag for every tri-state input (tested one by one).
- `cross_border_unknown` fires on **unknown** location/transfer only; a *known*
  transfer outside India is assessed by questions, not flagged as unknown.
- Industry codes follow the packs (D-013): `general`, not the spec's `other`;
  seed `education.higher` migrated to `university`. Unknown industry → `general`.
- Overlay pack codes as authored: `UNIVERSITY_HIGHER_ED_V1`, `SAAS_TECH_OVERLAY_V1`,
  `GENERAL_ORGANISATION_V1`, …; BFSI's file names none, so the spec's
  `BFSI_OVERLAY_V1` is used. University AI proctoring pack =
  `UNIVERSITY_AI_PROCTORING_V1` (file), not the spec's `AI_PROCTORING_UNIVERSITY_V1`.
- **Thresholds are judgement calls, pending Aniket/counsel:** `high_vendor_dependency`
  at ≥ 3 Data Processors; `large_scale_processing` at ≥ 1,00,000 Data Principals
  (larger of the org estimate and the Data Principal type sum). SDF thresholds are
  for the Central Government to notify; revisit when they are.
- `departments.head_user_id` from the prompt was dropped: a user is not a tenant
  row, so no composite FK could stop a head from another organisation. Add it with
  a membership check when a feature needs it.

**Consequence:** Slice 3 reads `organization_scopes` (answers + tags) and the
registers to evaluate triggers; `selectQuestionPacks()` is the pack list it starts from.

---

### D-027 · 2026-09-15 · Tenant-table conventions: composite FKs, RLS write policies, audit by trigger
For tenant tables that reference other tenant tables:

1. **Composite foreign keys.** Parent gets `UNIQUE (organization_id, id)`; child
   references `(organization_id, x_id)`. The database itself refuses an Org A row
   pointing at an Org B row — even for the privileged role (RLS-tested). Deletes
   are `RESTRICT`: a composite `SET NULL` would null `organization_id` too.
2. **Plain CRUD uses RLS write policies**, not RPCs (per D-023):
   SELECT for members, INSERT/UPDATE/DELETE `WITH CHECK app.has_permission(organization_id, '<perm>')`.
   The API still checks the permission and filters child routes by **both** ids first.
3. **Audit by trigger** (`app.audit_scope_change`, SECURITY DEFINER): every user
   INSERT/UPDATE/DELETE writes `audit_logs` in the same transaction —
   `scope.<table>.<op>`, the actor from the JWT, changed column **names** only. No
   JWT (seed, migrations, worker) → not audited (tooling, not a user action). A
   no-op update is not an event. A route cannot forget to audit.
4. PostgREST has no multi-statement transactions: a create with side writes
   validates references **before** inserting and compensates (deletes the row) if
   the side write fails.

**Why:** Slice 1's RPC-per-write would triple the SQL for four CRUD registers
without adding safety. Composite FKs close the cross-tenant-reference hole that
RLS alone does not (RLS checks the row, not what it points at).

**Consequence:** reuse this pattern for ROPA (Slice 7) and the workflow modules
(Slice 10). Add the new tables to `app.audit_scope_change` triggers (rename the
function when it outgrows "scope").

---

### D-028 · 2026-09-15 · Risk thresholds approved for V1 — configurable, tiered, internal, never statutory
**Aniket's decision (2026-09-15)**, superseding the "pending" note in D-026:

| Trigger | Tiers | V1 trigger point |
|---|---|---|
| Vendor dependency (Data Processors) | 0 none · 1–2 limited · 3–9 **vendor-dependent** · 10+ complex ecosystem | `vendorDependentThreshold = 3` |
| Processing scale (Data Principals) | < 10,000 normal · 10,000–99,999 elevated · **1,00,000+ large-scale** | `largeScaleProcessingThreshold = 100000` |

Implemented as `RiskTriggerConfig` / `DEFAULT_RISK_TRIGGER_CONFIG` in
`packages/core/src/scope.ts`; `deriveRiskTags`, `explainRiskTags` and
`assessScopeProfile` accept a config, so a threshold changes in one place (a
per-tenant or admin-editable config is a later step, not V1).

**Rules:**
- These are **TrustStack internal risk triggers**, not DPDP definitions. They add
  deeper questions (vendor governance, processor contracts, breach escalation;
  governance, evidence, security, ROPA, AI, leadership reporting).
- **The platform never infers Significant Data Fiduciary status.** SDF is for the
  Central Government to notify and carries its own obligations (DPIA, audit,
  algorithmic due diligence). `ScopeProfile.significantDataFiduciaryInferred` is
  typed `false`. The `SDF_READINESS_V1` pack name is internal; the UI says it is not a classification.
- Approved wording, shown whenever the large-scale trigger applies (`LARGE_SCALE_NOTICE`):
  > Based on the number of individuals involved, this assessment treats the organisation as large-scale for internal DPDP readiness review. This is a TrustStack risk trigger and not a statutory classification.
- **Enhanced review regardless of scale** (`assessScopeProfile().enhancedReview`):
  children's data, sensitive documents, biometric systems, AI profiling/scoring/
  proctoring, high vendor dependency, unknown cross-border processing. Aniket also
  listed health data, financial data and breach-prone systems separately — today
  health and financial are one answer (`sensitiveDocuments`) and breach-prone
  systems are not captured; both are wizard-field backlog for Slice 3.

---

### D-029 · 2026-09-15 · Question bank rules for Slice 3 (Aniket's answers to the three open questions)
1. **Baseline stays 108 questions, never ~205.** 98 core + 10 University / Higher
   Education overlay questions. The 107 University questions are an **industry /
   reference pool**, not stacked on the core. Slice 3 classifies every one of the
   107 as: **exact overlap** (do not duplicate) · **partial overlap** (merge wording
   or keep as an overlay variant) · **unique** (overlay candidate) · **conditional**
   (triggered or assessor-visible) · **future/advanced** (backlog). The 10 overlay
   questions are chosen from that classification (reconciling Excel `MU_Overlay`
   U1–U10) and confirmed by Aniket before seeding.
2. **Primary domain = first code, and only it scores.** A secondary domain is kept
   as a tag for cross-reference, dashboards and gap linkage — a gap may *appear* in
   the secondary domain's view but never adds to its score. Keeps the 100-point
   model free of double counting.
3. **Conditions the wizard cannot capture → "Potentially Applicable".** Shown, not
   hidden. The assessor answers normally or marks **Not Applicable with a mandatory
   reason**; N/A questions are **excluded from the scoring denominator**. Conditions
   the wizard does capture show/hide automatically. (Supersedes the
   `conditional_unresolved` wording proposed in SLICE_03 §0.5.3.)

**Every question record carries:** unique id, primary domain, secondary domain
tags, source tag (Core / University / EdTech / BFSI / …), trigger condition,
scoring weight, evidence expectation, N/A rule.

**Wizard-field backlog** (Aniket's list): placements, alumni management, hostel
operations, transport, LMS usage, proctoring, minor learners, payment gateway,
biometric attendance, CCTV, AI tools, cross-border cloud, third-party call centre,
high-volume marketing, customer-support recordings — plus health vs financial data
and breach-prone systems (D-028). Several are already derivable from Slice 2
registers (`system_type` lms/payment/cctv/biometric/ai; `ai_usage_types` proctoring;
`includes_children`); Slice 3 maps those first and lists the rest as new fields.

---

### D-030 · 2026-09-15 · Resend vendor record, and what may be emailed
Vendor-register entry (Aniket, 2026-09-15): **Resend (Plus Five Five, Inc.)** —
email delivery / transactional email; TrustStack role: Data Processor
(sub-processor depending on client context); purpose: invitations, platform
alerts, future contact-form notifications; data: name, email, organisation,
email metadata, delivery logs; Data Principals: platform users, client contacts,
prospects; **cross-border: yes**; risk: medium by default, high if sensitive data
enters an email body; DPA available — retain a copy as vendor evidence; review the
subprocessor list periodically.

**Location, precisely:** our sending region is Tokyo (`ap-northeast-1`, D-025),
**and** Resend's DPA states its primary processing operations are in the United
States. Record both; either way it is a cross-border transfer.

**Rule:** email carries notifications only — never assessment evidence, uploaded
files, ROPA exports, scores or raw personal data beyond the recipient's own
details. Allowed V1 notifications: invitation, assessment assigned, action due,
report ready (content = a link into the app). A future public contact form needs a
DPDP-compliant notice beside it (Rule 3: itemised data, purpose, withdrawal,
rights and complaint routes) and minimal fields.

**Consequence:** today's invite email already complies (name, organisation, role,
link). Every future email template is reviewed against this rule.

---

### D-031 · 2026-09-18 · The University overlap, settled: baseline = 98 core + 10, and the other 98 stay in the bank
**Aniket's confirmation (2026-09-18)** of the ten questions proposed in
`docs/question_packs/OVERLAP_UNIVERSITY_CORE.md` §4, closing D-014's open
question and executing D-029.1:

`UNI-SEC-002` · `UNI-ACC-001` · `UNI-AI-003` · `UNI-VEN-007` · `UNI-RET-002` ·
`UNI-RGT-003` · `UNI-INV-004` · `UNI-ROPA-004` · `UNI-CHILD-003` · `UNI-NOT-007`
— one per domain, five `unique` and five `conditional`.

All 108 University questions are classified in that file against all 98 core
questions: **28 exact overlap · 38 partial overlap · 16 unique · 25 conditional
· 1 backlog.** 66 of 108 (61%) are already covered by core, which is the
evidence for the baseline: stacking the packs would have duplicated most of the
assessment and produced ~205 questions against the 108 quoted in the PRD, the
pitch deck and the ₹9.75–12L proposal.

**Nothing is deleted.** The 108 are split across four packs:

| Pack | Tier | Questions | What it does |
|---|---|---:|---|
| `UNIVERSITY_HIGHER_ED_V1` | overlay | 10 | Every University assessment |
| `UNIVERSITY_AI_PROCTORING_V1` | conditional | 1 | Only when the scope reports proctoring |
| `UNIVERSITY_CONDITIONAL_V1` | conditional | 19 | Every University assessment; each question's own trigger then decides |
| `UNIVERSITY_REFERENCE_V1` | reference | 78 | In the bank and browsable, never generated |

**`MU_Overlay` U3 resolved (Aniket, option 1):** "Are standard DPDP templates
available for affiliated colleges?" had no equivalent among the 107, so it was
**authored into the Markdown as `UNI-GOV-009`** (D-013 — the Markdown is the
source of truth) and assigned to the conditional pool. The University file is
now **108** questions and the bank **1,527**.

**Consequence:** `packages/core/src/packs.ts` holds the ten codes, and both a
core unit test and a docs-workflow gate fail if that list stops being ten.
Changing the baseline needs a new decision entry.

---

### D-032 · 2026-09-18 · A new pack tier, `reference`, and the other nine overlays stay `draft`
Two additions to the three-tier taxonomy in `docs/QUESTION_FORMAT.md`:

1. **Tier `reference`.** A pack that is in the bank, browsable and never
   generated. The generator refuses it regardless of status. It is how 78
   University questions stay visible without being asked.
2. **The nine other industry overlays are seeded `status = 'draft'`**, and the
   generator refuses a pack that is not `approved`.

**Why:** only University has been through D-031's overlap exercise. EdTech's 162
questions on top of core would hand an EdTech client a 260-question assessment —
exactly the defect D-029.1 was raised to prevent. Draft is the honest state:
authored, browsable, not yet fit to generate.

**Consequence:** each remaining industry owes the same overlap map before it is
sold. Until then a non-University organisation gets the core pack only, which is
a complete DPDP readiness assessment, not a broken one. Only `CORE_DPDP_V1` and
the four University packs are `approved` today.

---

### D-033 · 2026-09-18 · Applicability is resolved when the bank is LOADED, not per assessment
A question's stored `applicability` is the EFFECTIVE one. `conditional` means the
condition is both authored and machine-evaluable; a condition with no reviewed
mapping is stored as `potentially_applicable`, with no expression at all.

**Why:** whether a condition can be evaluated depends on the question and our
mapping table — not on any one organisation. Deciding it per assessment would
recompute the same answer for every tenant and let the bank hold a `conditional`
row that nothing could ever evaluate. A CHECK constraint surfaced this:
`question_versions_conditional_is_evaluable` refuses a conditional row without
both `trigger_text` and `trigger_condition`, and
`question_versions_unevaluable_has_no_expression` refuses a Potentially
Applicable row that carries one.

**`mapTriggerText` is a reviewed lookup table of 46 phrases, never NLP.** An
unrecognised phrase returns null. Of the 110 distinct authored trigger phrases,
about 30 map today; the rest are D-029's wizard-field backlog, and the generator
reports them by name on every run.

**Also settled here:** `Mandatory if X` and `Mandatory where X` resolve to
**conditional**, not mandatory. A question that applies only when X holds is not
mandatory for everyone, and `Config`'s own D13 default applicability agrees. This
is why the core pack's `V1.1`–`V1.6` are conditional on "vendors exist" — and
why an organisation with no Data Processors gets 92 of the 98 core questions.

---

### D-034 · 2026-09-18 · Domains and packs by migration; questions by seeder from the authored source
`dpdp_domains` and `question_packs` are inserted by the migration and mirrored
by a unit test (D-020). `questions` and `question_versions` are written by the
**seeder**: the 98 core questions from `packages/db/question-bank/core-pack.json`,
and the 1,429 industry questions parsed from the authored Markdown **on every
seed run**.

**Why not put the questions in the migration too?** The bank is ~600KB of prose
that will churn through counsel review — every content revision would become a
new, unreviewable migration, and schema history would fill up with wording
changes. Domains and packs are small, stable and bear invariants (the 100-point
total, the FK targets), so they belong in the migration.

**Why parse the Markdown at seed time rather than commit a generated JSON?**
There is then no second copy to go stale (D-010 again). The Excel core pack is
the exception — parsing .xlsx needs a dependency `packages/core` must not have —
so `tools/extract_core_pack.py` produces a committed JSON and
`--check` fails CI if it drifts from the workbook.

**At runtime the API reads the bank from the DATABASE**, never from the
Markdown: a serverless request has no repo checkout, and a question set must
come from what was actually seeded.

**Consequence:** a fresh environment needs `pnpm db:migrate` **and** `pnpm
db:seed` before an assessment can be generated. `seedQuestionBank()` refuses to
run if the migration's reference data is missing, and refuses to rewrite a
question version whose status is no longer `draft`.

---

### D-035 · 2026-09-18 · Assessment routes nest under `/organizations/{id}/`, and the snapshot has one write path
**Routes.** The spec's paths are flat (`/assessments/{assessmentId}`). They are
nested instead: `GET·POST /organizations/{id}/assessments`,
`GET /organizations/{id}/assessments/{assessmentId}` and its `/questions` and
`/generate-questions`.

**Why:** the flat path would need a new guard mode that reads a row's
`organization_id` before it knows which tenant to check — resolving the tenant
from data the caller supplied. Nesting works with today's `tenant: "fromParam"`
chain, keeps tenancy visible in the URL, and lets every query filter by BOTH
ids, so an Org B id under an Org A path is a plain 404 rather than a 403 that
confirms the row exists. The flat path remains available later as an alias.

**One write path.** `assessment_questions` grants users `SELECT` and nothing
else — no INSERT, no UPDATE, no DELETE. Rows arrive only through
`public.set_assessment_questions(organization_id, assessment_id, rows)`, a
SECURITY DEFINER function that re-checks `assessment.write`, refuses anything
but a `draft`, deletes and re-inserts, and writes **one** audit row
(`assessment.questions.generated`) with the question count — not one row per
question. A finalised assessment cannot even be deleted.

**Why a function rather than RLS write policies (against D-023's default):**
plain CRUD does use policies, but this is not CRUD. The draft-only rule and the
delete-then-insert have to be atomic, and PostgREST has no multi-statement
transaction. The Slice 2 compensation pattern (D-027.4) still applies at the
route: a create whose generation fails deletes the assessment row it just made.

**Audit trigger, generalised:** `app.audit_scope_change()` gained an optional
event-type prefix argument (`TG_ARGV[0]`, default `scope`). Existing triggers
pass nothing and keep emitting `scope.<table>.<op>` unchanged; `assessments`
passes `assessment`. D-027 anticipated renaming the function when it outgrew
"scope"; one argument was cheaper than re-pointing seven triggers, and an RLS
test asserts the Slice 2 prefixes are untouched.

---

### D-036 · 2026-09-18 · The 100-point total is the database's invariant, not only the application's
A CHECK cannot span rows, so `dpdp_domains` carries a **DEFERRABLE INITIALLY
DEFERRED constraint trigger** that raises `DOMAIN_WEIGHT_TOTAL_INVALID` unless
the active weights total exactly 100. The migration asserts it once at apply
time as well, `packages/core` has `assertDomainWeightsTotal()`, and CI asserts
`round(sum(weight), 2) = 100.00` in SQL.

**Deferred, not immediate**, so a compensating swap inside one transaction is
legal (move a point from `GOV` to `INV`) while a net change is not. Proven both
ways — and because the RLS harness always rolls back, those tests use
`SET CONSTRAINTS … IMMEDIATE` to run the pending check inside the transaction.

**Consequence:** rebalancing the model is a deliberate, single-transaction
change, and no migration or script can leave the model at 104 the way the
workbook's `Question_Bank` sheet did (D-006).

---

### D-037 · 2026-09-18 · An empty vendor register is not a declaration: the processor question is asked explicitly
**Aniket's decision (2026-09-18).** `organization_scopes.uses_data_processors`
is a tri-state (`yes|no|unknown`, default `unknown`), asked as its own wizard
question. The core pack's "Mandatory where vendors exist" trigger now reads:

```
any: [ answers.usesDataProcessors in [yes, unknown],
       vendorRoles contains data_processor ]
```

Only an explicit **`no`** with nothing in the register suppresses the vendor
questions. A recorded processor overrides a `no` — the safe direction.

**Why.** `VENDOR` is the **only** core domain whose every question hangs off one
trigger; `CONSENT`, `CHILD`, `CROSSBORDER` and `SDF_AI` are all-conditional too,
but their conditions are unmappable, so they become Potentially Applicable and
are always included. Until now that one trigger read the vendor REGISTER, so an
organisation that had simply not mapped its supply chain got no vendor questions
at all — and from Slice 5 would have lost the domain's 7 points — without anyone
deciding that. Inferring "none" from silence is exactly what D-026 forbids:
*unknown behaves as risk, never as no*. An organisation that has not mapped its
processors has a finding, not an exemption.

An external review proposed citing "no Data Processors declared in the vendor
register" as the scope-out reason. That is the same bad inference wearing a
label, so it was rejected: the gate is a declaration, not an absence of data.

**Consequence.** One wizard field closes the whole class of problem — there is no
second domain that can go empty. Migration `20260918100000_vendor_scope_gate`
adds the column, CHECKs the vocabulary, and backfills `yes` for organisations
whose register already proves it rather than making a consultant re-answer.
A tenant that declares `no` generates **92** of the 98 core questions and 15
domains; one that leaves it `unknown` generates **98** and 16. Both are pinned by
e2e tests. Mumbai University is unchanged at 124.

---

### D-038 · 2026-09-18 · A domain with no applicable questions leaves the weighted denominator
**Aniket's decision (2026-09-18),** to be implemented by the Slice 5 engine.

A domain contributes to the denominator only if it has at least one applicable
question. This covers **both** ways a domain can empty out:

1. **Scoped out** — the scope meant its questions were never generated (only
   `VENDOR` can do this, and only on an explicit `no` — D-037).
2. **All Not Applicable** — the questions were generated and the assessor
   excluded every one, each with a written reason (D-029.3).

Neither renormalises the remaining weights back to 100, and neither scores the
domain zero. Renormalising hides that the scope changed; scoring zero punishes an
organisation for a risk surface it does not have.

**Two denominators, and they are not the same.** N/A questions leave the
**question** denominator inside a domain; an empty domain leaves the **weight**
denominator across domains. An all-N/A domain is the case where they coincide,
and it is why the rule is stated in terms of *applicable questions* rather than
*scope*.

**Reporting.** The score name does not change with scope — it stays the DPDP
Compass Readiness Score, and a name that varied would be worse for comparability
than a visible denominator. Coverage is its own line:

```text
DPDP Compass Readiness Score: X / 93 applicable weighted points
Assessed Weight Coverage: 93 / 100
Scoped-out domain: Vendor Governance — no Data Processors declared
```

Three states stay distinct in every report and must never be merged: **Scoped
Out** (never generated) · **Potentially Applicable** (generated, the scope could
not decide) · **Not Applicable** (the assessor excluded it, with a reason).

**Reassessment (Slice 12):** when a previously empty domain becomes applicable,
report it as a scope change, not as score movement — otherwise a client that
merely appointed its first processor appears to have regressed.

**Consequence.** The workbook oracle cannot police this: its 98 responses are 76
Applicable + 22 Conditional with **zero** Not Applicable and all 16 domains
answered, so the 24.7015 parity gate stays green whichever way it were decided.
Slice 5 must bring its own tests.

---

### D-039 · 2026-09-18 · No override of the evidence cap, of any kind, until the pilot proves a need
The evidence cap is never overridden — not by a reviewer, not by a consultant,
never by the AI. Slice 4 stores **artefacts only**: `evidence.storage_path` is
NOT NULL, and there is no "observed but not stored" status in the vocabulary.

**Whose call.** Claude's, under Aniket's direction on 2026-09-18 to "build the
functionality first properly" after asking Claude to take its best call on the
remaining open items. Reversible: Aniket can reopen it at any time.

**Why.** The cap is the product's differentiator; it is the line between
TrustStack and a self-assessment questionnaire. Two rounds of external review
proposed a "Restricted Evidence Attestation" exception for material that is
inspected but cannot be retained, capped at E4. The controls it proposed are
sound — but a reviewer setting a level with no stored artefact **is** a cap
override, whatever it is called, and pressure on it only ever runs one way:
nobody lobbies for a lower score. More to the point, nobody has yet seen a real
instance. Designing the controls before the Mumbai University pilot shows how
often the case arises is designing for an imagined requirement.

**What handles the sensitive case instead.** A **redacted artefact** — a board
minute with everything but the relevant paragraph blacked out is still a stored
artefact, and still re-examinable. That covers much of the confidentiality case
with no new mechanism and no loss of defensibility.

**Consequence.** Revisit after the MU pilot with a count of how often a reviewer
genuinely could not retain something. If it is a handful of questions, a
documented note at a lower evidence level is enough. If it is common, build the
attested path then, to the controls recorded in `SLICE_05` — human-only, senior
approval, audit row, visible in the report, capped at E4, and never able to
stand in for the artefact-backed score.

---

### D-040 · 2026-09-18 · The operating model: one client, one tenant, one industry, one licence — and a black box to the client
**Aniket (2026-09-18).** TrustStack is sold **per client organisation, per
industry**. Each client is its own tenant, set up for its industry, under its
own licence. The client's admin configures and manages it, alone or with an
Anix AI consultant. **To the client the platform is a black box**: they answer
plain questions and get results; they never see trigger expressions, pack
codes, reference pools or draft content.

**Sequencing (Aniket): build the assessment functionality first.** Licensing and
an Anix-side platform console are real requirements but come after the core
works — they are **Slice 14**, after the Mumbai University pilot and before a
second client. Nothing in Slices 4–13 depends on the shape of a licence: it
gates access to what those slices build, it does not change their data.

**What this means for every slice from here.**
- **Nothing may be University-specific** outside the University question packs.
  The mechanism must work identically for any industry. Slice 4 proves it by
  running its keystone journey on a `general`-industry tenant as well as MU.
- **Client-facing screens show only what applies to that client.** The Slice 3
  question-bank browser currently lists all 20 packs to everyone — including
  nine draft overlays and the University reference pool. That is the opposite of
  a black box, and is fixed in Slice 8 alongside the other client-facing
  presentation. Anix staff keep a full view.
- **The industry the scope vocabulary speaks is University-flavoured today.**
  `SYSTEM_TYPES` has `sis`, `lms` and `exam` but nothing for EMR, core banking,
  point-of-sale or plant systems; a hospital must file its patient records
  system under `other`. Widen it when each industry's overlay is approved
  (D-032), not before.
- **"108 questions" is marketing wording only** — it is in no signed proposal,
  SOW or pricing document (Aniket, 2026-09-18). The product reports the real,
  scope-derived count.

**Consequence.** Licensing is not a blocker for any slice before 14. The shape
of a licence — what it grants, what happens at expiry, who issues it, whether an
organisation may hold more than one industry — should still be settled before
Slice 14 is promoted, and is recorded as an open question in STATE.

---

### D-041 · 2026-09-18 · The first answer moves an assessment off `draft`, which freezes its question set
A `response` row's AFTER INSERT trigger moves its assessment `draft → in_progress`.
Regeneration was already draft-only (D-035), so **answering is what locks the
question set**. A BEFORE UPDATE trigger on `assessments` refuses any return to
`draft` while an answer exists — for tooling too — and `assessment_responses`
references its snapshot row through a composite FK (`ON DELETE NO ACTION`), so a
regeneration could not orphan an answer even if something reached it.

**Why.** Regenerating underneath answers would silently delete some and strand
others against questions that no longer exist; there is no safe merge. The
decision the Slice 4 prompt asked for — "does answering move the status, and does
that block regeneration?" — is yes, and yes. A scope that changes after answering
has begun is a new assessment (a reassessment, Slice 12), not a rewrite.

**Also settled here:**
- **A mandatory question cannot be marked Not Applicable** (trigger, `TS422`, and
  the API's own 422). Only `conditional` and `potentially_applicable` questions may
  be excluded, each with a written reason (D-029.3, a CHECK). Mandatory means it
  applies to every organisation; an N/A there would be a way to drop a weak answer.
- **Unanswered is outstanding** — neither scored nor excluded. The domain score is
  computed over the answers that exist and reported as `provisional` while any
  question is outstanding. Slice 5 must refuse to FINALISE with anything
  outstanding, or a client could answer only its strong questions.
- `submitted` and `finalised` lock answers, links and reviews (triggers, `TS409`).

---

### D-042 · 2026-09-18 · Evidence storage: one private bucket, tenancy in the path, policies through the tenant helpers, no service role
Bucket `evidence`, **private**, 25 MiB limit, a documents-and-images MIME
allow-list (no archives, no executables, no HTML/SVG). Path:
`organizations/{organization_id}/evidence/{evidence_id}/{file_name}` — and a CHECK
makes `evidence.storage_path` equal exactly that for its own row, so a row cannot
point at another tenant's object or another row's.

**Policies on `storage.objects`** use the same helpers as every tenant table
(`app.current_user_organization_ids()`, `app.has_permission()`), via
`app.evidence_object_organization_id(name)`, which returns null — never a cast
error — for a path outside the layout:
- `SELECT` (signing a download URL): member + `evidence.read` + a registered
  evidence row for exactly that path.
- `INSERT` (signing an upload URL, uploading): member + `evidence.write` + a
  registered row for exactly that path **uploaded by the caller**.
- **No UPDATE, no DELETE policy.** An artefact, once stored, is immutable and
  retained; an upload URL is therefore single-use (a second PUT is a duplicate).

**Signed URLs are minted with the caller's JWT**, so Storage evaluates these
policies at signing time; the service role is not used on the request path.
Download URLs live 60 seconds and every issuance is audited
(`evidence.download_url.issued`); upload-URL issuance likewise
(`evidence.upload_url.issued`). Issuing a URL writes no row, so these two are
audited by the API; everything that writes a row is audited by trigger.

**Linking and reviewing both require the object to exist** in the bucket
(`app.evidence_object_exists`, SECURITY DEFINER over `storage.objects`). An
evidence row whose upload never completed is inert — it cannot be linked, reviewed
or shown — which is what makes "every evidence row is a stored artefact" (D-039)
true in practice and not only as `storage_path NOT NULL`.

**Verified against both Storage builds** (local CLI 2.117 and the hosted project):
no row → upload URL refused; second PUT → `KeyAlreadyExists`; Org B → "Object not
found" for Org A's path; delete and upsert → refused.

**Consequence.** CI now starts `storage-api` (it creates the `storage` schema the
migration writes into). Test teardown deletes objects with
`storage.allow_delete_query`, which removes the metadata row but leaves the bytes
as an unreferenced blob in the storage backend — accepted for few-byte test
files; see STATE.

---

### D-043 · 2026-09-18 · Nobody reviews evidence they uploaded
Two locks, both tested:
1. **Permission.** Contributors hold `evidence.write`, never `evidence.review`
   (D-020). The UPDATE policy on `evidence` requires `evidence.review`, and the
   only user-updatable columns are the review (`review_status`, `evidence_level`,
   `review_notes`), so any user UPDATE is a review.
2. **Separation of duties.** A reviewer may not review an artefact they uploaded:
   the BEFORE UPDATE trigger raises `TS403`, and a CHECK
   `reviewed_by <> uploaded_by` binds tooling too. The consultant and the DPDP
   owner both hold `evidence.review`; the rule is what stops either grading their
   own upload.

`reviewed_by` / `reviewed_at` are stamped by the database from the JWT, never
sent by a client (no grant). Review rules as CHECKs: `pending` ⇔ no level;
`rejected` ⇒ E0; there is no attested status (D-039).

**Consequence.** The keystone always needs two people. The e2e disposable tenant
helper gained `extraMembers`; seeded MU evidence is uploaded by the Registrar and
reviewed by the consultant.

---

### D-044 · 2026-09-18 · The adjusted score is derived by the database, and the cap is a row invariant
- `app.evidence_cap()` is the cap table; `app.adjusted_score(claimed, level)` is
  `least(claimed, cap(coalesce(level, 0)))` — **an unreviewed level is E0**.
- A BEFORE INSERT/UPDATE trigger on `assessment_responses` ALWAYS re-derives
  `evidence_level` (from the links) and `adjusted_score` (from the cap), whoever
  writes. A CHECK `assessment_responses_adjusted_is_capped` refuses any stored
  value that is not the capped one — so even tooling with the trigger disabled
  cannot store an uncapped score.
- **A response's evidence level is the STRONGEST reviewed artefact linked to it.**
  One good document supports the claim however many weak ones sit beside it;
  unreviewed links do not count. A review, or a new link, re-derives every linked
  response in the same transaction, and the audit log records the score change
  under the reviewer.
- Users hold column-level grants only on the answer (`applicability_decision`,
  `claimed_maturity`, `na_reason`, `notes`). A CI step asserts no user role can
  INSERT or UPDATE a derived column, and checks the cap in SQL (`1/2/2/1`).
- `packages/core` holds the same table (`EVIDENCE_CAP`) for the API and UI; a
  unit test parses the migration and fails if the two differ.

**Audit trigger, widened.** `app.audit_scope_change()` metadata gains the scoring
fields (question code, claim, level, adjusted score, review status, file name,
link target) so the log shows who set a level and what it did to the score. Still
no free text: N/A reasons, notes and review notes never enter the log (tested).

---

### D-045 · 2026-09-18 · The workbook's adjusted-score formula is the naive one; the spec's cap table governs
Found while promoting Slice 5: the workbook's `Responses!J` is
`IF(Evidence Current = "No", MIN(claimed, evidence, 3), MIN(claimed, evidence))`.
That is the **naive** "use the evidence level as the cap" rule D-007 warns
against — E0 gives 0 (spec: 1) and E1 gives 1 (spec: 2).

**The spec's table governs** (CLAUDE.md DPDP invariants, D-007): E0→1, E1→2,
E2→2, E3→3, E4→4, E5→5. Parity with the oracle is unaffected: in all 98 sample
responses claimed equals evidence, and `min(g, cap(g)) = g` for every g, so
24.7015 reproduces either way. Recorded so that nobody "fixes" the engine to match
the workbook: the workbook is the oracle for the SAMPLE, not for the cap.

**Two workbook rules Slice 5 inherits and must decide explicitly:**
1. **Freshness:** evidence that is not current caps the adjusted score at 3.
   Slice 4 has no freshness field at all (out of scope). Adding it is Slice 5's call.
2. **Red flags** use `adjusted < 2`. Under the spec's cap, `adjusted < 2` happens
   only at E0 or a claim ≤ 1 — whereas the workbook's MIN also fires at E1. The
   red-flag threshold was calibrated against the naive rule; Slice 5 should
   confirm `< 2` is still the intended trigger rather than inherit it silently.

---

### D-046 · 2026-09-20 · Red flags fire at adjusted ≤ 2, not < 2
**Aniket's decision (2026-09-20),** answering D-045's open question. Every red
flag in the Slice 5 table (`G1.2`, and any question in `INV`, `ROPA`, `SECURITY`,
`BREACH`, `VENDOR`, `CHILD`) fires when a question's adjusted score is **2 or
below**. The caps themselves are unchanged (60 / 55 / 60 / 60 / 65 / 70 / 50,
lowest wins).

**Why.** The workbook's `< 2` was calibrated on its naive `MIN(claimed,
evidence)`, under which E1 evidence already produced 1 and fired. Under the
spec's cap E1 and E2 both produce 2, so `< 2` would have quietly stopped firing
for them — weak evidence on a red-flag obligation would no longer cap the score.
`≤ 2` restores the intent: in a red-flag area, anything short of **E3** evidence
(or a claim of 2 or less) caps the whole assessment.

**Checked against the workbook sample.** The cap on the 98 sample responses is
**50 either way** (`CHILD` fires in both), and the raw score is far below it, so
the final score is unaffected. `≤ 2` additionally fires `SECURITY` (D11) on the
sample, which `< 2` did not.

---

### D-047 · 2026-09-20 · Correction: the workbook sample DOES exercise the cap — parity target open
D-007, D-045, CLAUDE.md and the Slice 5 prompt all said the 98 sample responses
have claimed = evidence everywhere. **They do not.** Checked from the workbook's
cached values on 2026-09-20, 10 rows differ:
- `A1.1`–`A1.5`: claim 3, E2 → 2 under both rules (no difference).
- `CB1.1`–`CB1.5`: claim 2, E1 → **1** under the workbook's naive `MIN`, **2**
  under the spec's cap table.

| Rule | Raw score | Evidence confidence | Critical | High |
|---|---:|---:|---:|---:|
| Workbook `MIN(claimed, evidence)` | **24.7014** | 23.9% | 10 | **57** |
| Spec cap table (built, live since Slice 4) | **25.3014** | 23.9% | 10 | **52** |

So the parity gate as written (24.7015 · 57 high) is **unreachable with the
spec's cap**. Also: the workbook's own value is 24.70142857…, which is **24.7014**
to 4 dp — "24.7015" in the docs was a rounding slip.

**Open — Aniket to choose before Slice 5 starts:**
1. **Keep the spec's cap and re-base the gate (recommended).** Assert TWO things
   from the 98 samples: (a) with the workbook's naive rule plugged in, the engine
   reproduces **24.7014 · 23.9% · 10 · 57** exactly — proving the aggregation,
   weights, bands and counts match the workbook; (b) with the spec's cap, it gives
   **25.3014 · 23.9% · 10 · 52** — pinning the product's own numbers. The only
   difference between (a) and (b) is then the cap itself, isolated and explained.
2. **Adopt the workbook's naive rule.** Reverses the CLAUDE.md invariant and
   Slice 4's built, tested and live behaviour (E0 → 0, E1 → 1).

**Consequence.** The evidence-confidence and critical-count targets stand either
way. Nothing live changes until this is decided; Slice 5 must not start without it.

---

### D-048 · 2026-09-20 · Parity gate: keep the spec's cap and assert BOTH results
**Aniket's decision (2026-09-20),** settling D-047 with its recommended option.
The spec's cap table stays (E0→1, E1→2, E2→2, E3→3, E4→4, E5→5 — built and live
since Slice 4). The Slice 5 CI gate runs the workbook's 98 sample responses
through the engine TWICE:

| Run | Cap rule | Score | Evidence confidence | Critical | High |
|---|---|---:|---:|---:|---:|
| (a) aggregation parity | the workbook's naive `MIN(claimed, evidence)` | **24.7014** | **23.9%** | **10** | **57** |
| (b) the product | the spec's cap table | **25.3014** | **23.9%** | **10** | **52** |

(a) proves the aggregation — weights, averages, N/A handling, confidence and
severity counts — reproduces the workbook exactly; (b) pins the product's own
numbers. The only difference between them is the cap, on five `CB1.x` rows.

**Consequence.** The engine takes the cap rule as a parameter of the
aggregation (a pure function in `packages/core`); the naive rule exists ONLY as a
test fixture and is never reachable from the product or the SQL. Verified from
the workbook's cached values on 2026-09-20: 98 rows, 76 Applicable + 22
Conditional (both count as applicable), 0 Not Applicable, 0 stale ("Evidence
Current" = Yes throughout), red-flag cap 50 on the sample under both rules and
both thresholds.

---

### D-049 · 2026-09-20 · Evidence freshness is deferred to Slice 13, and nothing pretends otherwise
**Claude's call under the Slice 5 prompt's §4.4.2 recommendation.** The
workbook caps a stale answer at 3 (`Responses!J` reads `IF(Evidence Current =
"No", MIN(claimed, evidence, 3), …)`). TrustStack does **not** implement that,
and does not model freshness at all: there is no `valid_until`, no "evidence
current" verdict, and `app.adjusted_score` takes only a claim and a level.

**Why defer.** Nothing anywhere in the product has an expiry yet — not
evidence, not an assessment, not a report. Adding one to evidence alone would
be the only expiring thing in a system with no retention job to act on it, no
UI to show it and no reassessment cycle to compare against. All three arrive
together in Slices 12–13, and the same worker that purges abandoned uploads
and orphaned blobs (STATE open loops) is where an expiry sweep belongs.

**Parity is unaffected either way:** all 98 workbook samples carry
`Evidence Current = Yes`, so the gate reproduces the same numbers with or
without the rule (verified 2026-09-20).

**What this costs, stated plainly.** A three-year-old policy document reviewed
as E5 still supports a claim of 5 today. A consultant who notices can lower the
review level, but nothing prompts them to. That is a real gap in the evidence
story and it must be closed before general availability — it is not a gap in
the cap, which is what Slice 4 built and what the product is sold on.

**When it is built,** it is a migration, not a setting: the cap stays a row
invariant, so `assessment_responses_adjusted_is_capped` (D-044) must widen in
the same migration, and the SQL/TypeScript mirror test with it.

---

### D-050 · 2026-09-20 · The maturity band is a proportion of the APPLICABLE weight, not of a flat 100
The workbook bands the overall score out of 100 (`Dashboard!B8` reads
`IF(B7<=20, "Level 0 …")`). TrustStack bands it out of `applicable_weight` —
the same denominator the score itself is reported against (D-038).

**Why.** A tenant that scopes out Vendor Governance is assessed on 93 points.
Judging it against 100 understates its maturity for a risk surface it does not
have, which is exactly the error D-038 rejects for the score and for the
confidence average. The band has to follow the same denominator or the three
figures in one panel disagree with each other.

**Parity is unaffected:** the workbook's 98 samples answer all sixteen domains,
so `applicable_weight` is 100 and the two rules coincide. The divergence is
real but unreachable from the oracle, so it is recorded here rather than
discovered later.

**Also settled here:** the band follows the **final** score, after any red-flag
cap — not the raw one. A red flag that caps an assessment at 50 must not leave
it reported as "Level 5 — Continuous Assurance". On the sample the raw and
final scores are both 24.70/25.30, far below the cap of 50, so this too is
invisible to the oracle.

---

### D-051 · 2026-09-20 · Unlinking is the one reversible evidence action — the artefact is still never deleted
Slice 4 left a real hole, recorded in STATE: a link could be created and never
undone, so attaching the wrong file to an answer was permanent. Slice 5 adds
`DELETE …/evidence/{id}/links/{responseId}`.

**What it does and does not do.** It detaches an artefact from ONE answer. The
artefact itself stays in the evidence store with its whole audit trail: users
hold no `DELETE` on `evidence`, and that does not change (D-042). The only new
grant in this slice is `DELETE` on `evidence_links`, behind `evidence.write` —
the same permission as linking, because unlinking moves the score just as much.

**The score follows in the same transaction.** An `AFTER DELETE` trigger
re-derives the response's level from whatever links remain, and so its adjusted
score: removing the only strong artefact drops a claim of 5 back to 1. A number
must never outlive the evidence that justified it.

**Refused once locked**, like every other evidence write on a `submitted` or
`finalised` assessment (`TS409`).

**Two cascades are NOT unlinking, and the trigger must not mistake them for
it:** deleting a response takes its links with it (the Slice 4 after-delete
trigger), and deleting an artefact takes them through the composite FK. Both
leave the parent row already gone by the time the trigger fires, which is how
they are told apart from a user's `DELETE` on the link itself. Without that
distinction a finalised assessment could never be torn down at all.

---

### D-052 · 2026-09-20 · A finalised score never changes, but it goes with the thing it scored
`assessment_score_snapshots` and `assessment_domain_scores` hold **no user
write grant of any kind** — not INSERT, not UPDATE, not DELETE. The only way a
row appears is `public.finalise_assessment`, which is SECURITY DEFINER. A
`BEFORE UPDATE OR DELETE` trigger then binds tooling too.

**The distinction the trigger draws.** UPDATE is refused always: a stored score
is evidence of what was assessed and when. DELETE is refused only while the
parent still exists. Deleting an assessment — or an organisation, which is what
erasure will mean in Slice 13 — takes its snapshot with it, and a trigger that
blocked its own cascade would make a finalised tenant undeletable. This was
found by a test teardown, not by review: the first version refused the cascade
and no assessment that had ever been finalised could be removed.

**Why the numbers are computed in SQL and not passed in.** An RPC that stored
numbers the caller computed would store numbers the caller can forge. So
`finalise_assessment` takes two ids and nothing else, and every figure — the
sixteen domain scores, the applicable weight, the red-flag cap, the band, the
confidence, the counts — is derived inside it from the stored adjusted scores,
each of which the database itself derived and CHECK-capped (D-044). A unit test
parses the migration and fails if the SQL and `packages/core` ever disagree, and
the workbook fixture runs through both.

**Two row invariants back it up:** `final_score = least(raw_score, score_cap)`,
so a snapshot can never claim a score its own red flags forbid; and
`(state = 'scored') = (score IS NOT NULL)`, so an empty domain can never be
stored as a zero (D-038).

**Finalise refuses an outstanding question** and reports how many (D-041).
Answering only the strong questions and freezing the flattering half is the
thing this exists to prevent.

**Consequence.** The seed finalises nothing. MU's baseline has one answer out
of 124, and a half-answered "finalised" baseline would be a lie about what was
assessed; the e2e suite finalises its own throwaway assessments instead. CI's
seed-count string therefore ends `…/1/1/1/0/0`.

---

### D-053 · 2026-09-20 · The live score is TypeScript, the finalised score is SQL, and a test holds them together
Two engines exist on purpose:

- `packages/core/src/engine.ts` computes a **live** score on every read of
  `GET …/score`, from the stored adjusted scores. It is also what the parity
  gate drives, because the cap rule has to be swappable there (D-048).
- `app.assessment_domain_results` / `app.assessment_red_flags` /
  `finalise_assessment` compute a **finalised** snapshot, in the database, for
  the reason in D-052.

**Why not one.** Computing the live score in SQL too would mean a round trip
per domain tile and no way to plug the workbook's naive rule in; computing the
finalised one in TypeScript would mean storing numbers the caller can forge.

**What stops them drifting.** `apps/web/tests/unit/scoring-engine.test.ts`
parses the migration and compares the bands, the severity ladder, the red-flag
table (codes, domains, caps and labels), the thresholds and the engine version
against `packages/core` — the same mirror rule Slice 1 applied to the
permission matrix and Slice 4 to the cap. The workbook fixture then runs
through both: TypeScript in `scoring-parity.test.ts`, SQL in
`tests/rls/scoring-engine.test.ts`, and both must give **25.3014 · 23.9% · 10 ·
52**. A rule added to one and not the other fails CI.

**`engine_version` is stamped on every snapshot** (`1.0.0` today) and must be
bumped whenever a change here could give a different number for the same
answers — otherwise a reassessment delta (Slice 12) cannot tell a real
improvement from an engine change.

---

### D-054 · 2026-10-02 · A gap opens at adjusted ≤ 3 — and that is not the red-flag threshold
**Claude's call under the Slice 6 prompt's §4.4.1 recommendation.** An
applicable answer whose stored adjusted score is **3 or below** opens a gap.
This is the workbook's own rule, read from the formula: `Gap_Action_Tracker!D`
is `IF(Responses!$J2<=3, "Yes", "No")`.

| Threshold | What it means | Decision |
|---|---|---|
| adjusted **≤ 2** | a RED FLAG — caps the whole assessment's score | D-046 |
| adjusted **≤ 3** | a GAP — there is remediation work to do | this one |

**Why keep 3.** 3 of 5 is "Implementing", not done. A register that stayed
silent about it would make the 90-day plan look shorter than it is — and the
gap between "has a document" (E3) and "operates the control" (E4/E5) is exactly
the work a consultant-led engagement exists to drive.

**Three kinds of question open NO gap, and they are different facts:** a Scoped
Out domain has no questions at all (D-038); a Not Applicable answer was
excluded with a written reason; an unanswered question is outstanding — not yet
assessed, which is not the same as assessed and found weak.

**The oracle cannot police this.** Every one of the workbook's 98 sample
answers is adjusted 2 or below, so `≤ 3` and `≤ 2` open the same 98 gaps
(**10 critical · 52 high · 36 medium**, which the SQL generator reproduces).
The boundary has its own tests in core, in SQL and in the RLS suite: adjusted 3
opens a gap, adjusted 4 does not.

**Consequence.** `GAP_MAX_ADJUSTED` in `packages/core/src/gaps.ts` and
`app.gap_max_adjusted()` in SQL, mirror-tested. A CHECK refuses a stored gap
above the threshold, and the migration asserts at apply time that the two
thresholds differ.

---

### D-055 · 2026-10-02 · Due dates come from priority, are stored once, and a Low gap gets none
**Claude's call under §4.4.2.** The workbook's `Due Days` is a flat 30 on every
row, which is not a roadmap. TrustStack derives the default from the gap's
priority, which comes from its severity (the workbook's `Responses!L`):

| Severity | Priority | Default due date |
|---|---|---|
| Critical | P0 | 30 days from the day the gap is first opened |
| High | P1 | 60 days |
| Medium | P2 | 90 days |
| Low | P3 | **none** — "next assessment cycle" |

**Stored, never computed at read time.** `gap_actions.due_date` is written when
the action is created and regeneration never rewrites it — otherwise every
report of the same assessment would show different dates. If an answer worsens
(High → Critical) the gap's priority changes and the stored date does not: a
person moves a date, the generator never does.

**A Low gap gets no invented date.** It is real work, but it is not part of
the 90-day sprint; `null` shows as "Next assessment cycle" and can be given a
date by hand. `P3 → 180 days` would have been a number with nothing behind it.

**"Today" is the date in India** (`Asia/Kolkata`), in the generator and in the
roadmap. A due date is a calendar date, and the server's UTC date is
yesterday's for the first 5½ hours of every Indian day. Hard-coded: the product
is a DPDP product. A per-tenant time zone is not modelled.

**The gap's priority is never the question's authored priority.** That column
is null on 234 bank questions and is never guessed (`QUESTION_FORMAT.md`);
severity is always present. The register shows the authored one separately.

---

### D-056 · 2026-10-02 · An action is never closed on a promise: accepted evidence, or a reviewer who is not the owner
**Claude's call under §4.4.3 — stricter than the prompt's recommendation, on
purpose.** To close an action:

1. it must have an **owner** — an unowned action has nobody who did the work;
2. and **EITHER** a stored artefact, reviewed as **Adequate or Strong**, is
   attached to the action (`closure_basis = 'evidence'`),
3. **OR** the person closing holds **`evidence.review`** and is **not the
   owner** (`closure_basis = 'reviewer_approval'`).

**Where this is stricter than recommended, and why.**
- The prompt suggested any `evidence_links` row. But an unreviewed upload is
  still a promise — the owner could attach any file and close. Requiring an
  accepted review brings in D-043 for free: nobody reviews their own upload, so
  the evidence path always involves a second person.
- The prompt suggested "a reviewer with `gap.write`". Contributors hold
  `gap.write`; two contributors could then close each other's actions with
  nothing attached. Approval needs `evidence.review` — the people already
  trusted to grade evidence. No matrix change (D-020).

So both routes take two people. When both hold, the basis recorded is evidence.

**Enforced in the database.** A BEFORE UPDATE trigger decides, and stamps
`closed_at`, `closed_by` and `closure_basis`; users hold no grant on any of
them. CHECKs bind tooling too: closed ⇔ a timestamp ⇔ a basis, and
`gap_actions_no_self_approval`. `closureDecision()` in core is the same rule
for the API's messages, and a unit test compares the two.

**Also settled here.**
- **The workflow:** Open ⇄ In Progress, either → Blocked, Blocked → Open or In
  Progress, Open or In Progress → Closed. **A Blocked action cannot close
  directly.** As data in core and as `app.gap_action_transition_allowed()`.
- **A Closed action can be reopened**, to In Progress only. A wrong closure
  must be reversible; the audit log keeps both events and the row stops
  claiming the closure.
- **A Closed action is read-only until reopened**, and evidence cannot be
  detached from it — it may be the artefact the closure stands on.
- **Closing IS allowed on a finalised assessment.** See D-058.

**What this does not prevent, stated plainly.** A reviewer who did the work
can assign a colleague as owner and then approve the closure. It is on the
audit log — who became owner, who closed, on what basis — but it is not
refused. The evidence route is the strong one; reviewer approval is for the
gap where no artefact exists to attach.

---

### D-057 · 2026-10-02 · Regeneration follows the answers and never discards human work
**Claude's call under §4.4.4.** Gaps are derived data: `POST …/gaps/generate`
brings the register in line with the current answers. But an action somebody
has worked on is never silently discarded.

| The answer now… | Its gap | Its action |
|---|---|---|
| still opens a gap | refreshed in place (severity, priority, adjusted score) | **not touched** |
| newly opens one | created | one created, Open, unowned |
| no longer opens one — and nobody touched the action | **deleted** | deleted with it |
| no longer opens one — but somebody worked on the action | kept, `state = 'superseded'` | **kept, intact** |

**"Human work"** is any of: a user ever edited the action (`updated_by`,
stamped by trigger), it has an owner, it has notes, it is not Open, or evidence
is attached. A superseded gap reopens — with the same action — if the answer
falls back.

**An existing action is never rewritten by the generator**: not its owner, its
notes, its status, nor its due date (D-055). `app.refresh_assessment_gaps`
contains no `UPDATE public.gap_actions`, and a unit test asserts that.

**The register is regenerated on request, not on every answer.** Between the
two it can be out of step, so `GET …/gaps` returns `stale: true` — computed by
comparing the stored gaps with what the current answers would derive — and the
UI says so rather than present an old register as current.

**Why not regenerate by trigger on every answer.** An answer changes its score
when evidence is linked, reviewed or detached, as well as when it is edited.
A register that rewrote itself on each of those would move under the person
working through it; an explicit, audited "regenerate" is something a
consultant does at a known moment.

---

### D-058 · 2026-10-02 · A finalised assessment's gaps are frozen with its score; its actions live on
**Claude's call on §4.4.5 — "the one genuinely open design question in this
slice". Reversible; Aniket can reopen it.**

**Gaps belong to the assessment, and are frozen when it is.**
`finalise_assessment` now brings the register in line with the answers
immediately before it freezes them. So a finalised assessment's gaps are
exactly the gaps of the answers its score was computed from — the snapshot's
critical and high counts and the register's always agree — and nobody has to
remember to generate first. After that:
- `generate_assessment_gaps` refuses a finalised assessment (`TS409`);
- a trigger on `assessment_gaps` refuses INSERT, UPDATE and DELETE while the
  assessment is finalised — binding tooling too, the way D-052's does.

**Actions are deliberately NOT frozen.** Remediation is what happens after
finalising; a register that locked with the score would be a report, not a
plan. Owner, due date, status, notes, evidence and closing all continue. The
90-day sprint runs against the finalised baseline's register.

**Evidence follows the same split.** An ANSWER's evidence stays locked with
the score (Slice 4). An ACTION accepts evidence after finalising — evidence
that the work was done is exactly what arrives then — and it never moves the
frozen score, because linking to an action re-derives nothing (D-059).

**Reassessment (Slice 12)** starts its own register from its own answers. What
it does with the previous cycle's open actions — carry them, link them, or
report them as unresolved — is that slice's decision; nothing here forecloses
it. The actions stay attached to the assessment that found the gap.

**Assessments finalised before this slice** had a frozen score and no
register, and could never have got one. Migration
`20261002010000_backfill_finalised_gap_registers` derives it once, with the
freeze switched off for that statement block and asserted back on. Their
answers were locked, so the rows are the ones finalising would have written;
only `generated_at` and the default due dates count from the backfill instead.
One such assessment existed, on the hosted dev database (124 gaps, all High,
matching its snapshot).

**A cascade is not an edit.** Deleting the assessment, or the whole
organisation, takes its gaps with it. The freeze looks up the assessment AND
the organisation, because a gap hangs off both and nothing guarantees which
cascade reaches it first.

**No number changes**, so `ENGINE_VERSION` stays `1.0.0`.

---

### D-059 · 2026-10-02 · The gap/action shape, and how `evidence_links` was widened
**Two tables.**
- `assessment_gaps` — one per weak answer, UNIQUE per
  `(organization_id, assessment_id, question_code)`, composite FKs to the
  assessment and to its SNAPSHOT question (D-027, D-035). `severity`,
  `priority`, `adjusted_score`, `state`, `finding`, `recommended_fix`. **No
  user write grant of any kind**: rows appear, change and go only through
  `app.refresh_assessment_gaps`. `severity = app.question_severity(adjusted_score)`
  and `priority = app.question_priority(severity)` are CHECKs, so a forged
  severity is refused even from tooling.
- `gap_actions` — `title`, `owner_user_id`, `owner_role`, `status`,
  `due_date`, `notes`, plus the stamped `closed_at`, `closed_by`,
  `closure_basis`, `updated_by`. Users may UPDATE six columns and nothing
  else; no INSERT, no DELETE.

**One action per gap is generated; the schema allows more.** `gap_id` is not
unique, and the API returns `actions[]`. No route creates a second action yet.

**`recommended_fix` is copied onto the gap at generation**, from the exact
question VERSION the snapshot names (`question_version`) — not carried on
`assessment_questions`, and never read from "whatever the bank says today".
It is null for every industry question (only the core pack has one); the
action's title then falls back to "Review and remediate: <the question>".

**Generation is one SECURITY DEFINER RPC** taking two ids and nothing else,
auditing once with the counts (`assessment.gaps.generated`). The engine under
it (`app.refresh_assessment_gaps`) has no permission check and no audit row:
the RPC, `finalise_assessment` and the seed all call it.

**`evidence_links` gained `gap_action`.** FOUR trigger functions assumed the
target was a response — counted from the migrations, and a unit test now
counts them again on every run:

| Trigger | Before | Now |
|---|---|---|
| `evidence_link_before_insert` | looked up a response, `TS404` otherwise | branches on type; a gap action needs `gap.write`; an unknown type is `TS422` |
| `evidence_link_after_insert` | re-derived the response's level | returns at once unless the target is a response |
| `evidence_link_before_delete` | applied the locked-assessment rule | a gap action: refused while the action is Closed |
| `evidence_link_after_delete` | re-derived the response's level | returns at once unless the target is a response |

**Linking or unlinking a gap action never re-derives an answer's score.**
Evidence that an action was done says nothing about what the answer scored;
only evidence on the ANSWER moves it. An RLS test pins it by the row's `xmin`:
the response is not even written.

**The object-exists rule (D-039) applies to both targets. The
locked-assessment rule applies to responses only** (D-058) — the prompt
expected it to come "for free", and it was deliberately not taken.

**Routes.** Linking reuses `POST …/evidence/{id}/link`, whose body is now
exactly one of `{ responseId }` or `{ gapActionId }`. Unlinking from an action
is `DELETE …/gaps/{gapId}/actions/{actionId}/evidence/{evidenceId}` — nested
under the assessment like every route here (D-035), rather than a second
shape under `/evidence`. The roadmap has no route: it is derived client-side
from `GET …/gaps`, with the window arithmetic in core.

**Audit.** A user's change to an action is audited by the existing trigger
(`gap.gap_actions.update`), now carrying `actionStatus`, `ownerUserId`,
`dueDate`, `closureBasis` and the changed column NAMES. Title, notes and
finding never enter the log (tested).

---

### D-060 · 2026-10-02 · ROPA-driven gaps get their own gap table and share the action table
**Decided now because the Slice 7 stub asked Slice 6 to decide it**, against
the shape that exists.

`assessment_gaps` cannot hold a ROPA gap. Its key is a question code; its FKs
reach an assessment and that assessment's question snapshot; its severity is a
CHECKed function of an adjusted score. A gap raised because a processing
record has no retention rule has none of those. Loosening the table to admit
it would mean nullable keys and a conditional invariant — and the invariant is
the point of the table.

**So:** Slice 7 adds its own derived table (`ropa_gaps`), written only by its
own generator. And it **shares `gap_actions`**: one more nullable composite FK
(`ropa_gap_id`) with a CHECK that an action has exactly one parent. One action
table means one workflow, one closing rule (D-056), one roadmap, one set of
evidence links — a client must not have to learn two remediation processes.

**Consequence for Slice 7.** `gap_actions.gap_id` becomes nullable; every
query that reaches an action through `assessment_gaps` keeps working; the
roadmap gains ROPA actions with no change to its bucketing. The ROPA gap's
severity ladder is Slice 7's to define and must not be `questionSeverity()`,
which is a function of an adjusted score.

---

### D-061 · 2026-10-03 · The ROPA record: its fields, what "complete" means, a derived risk floor, and a four-status lifecycle
**Claude's calls under the Slice 7 prompt's §4.4.1–4.4.6 and §4.4.9, each on
its recommendation unless said otherwise. Reversible; Aniket can reopen any.**
The spec positions the register as "a practical DPDP readiness artifact … not
a statutory GDPR-style ROPA", and every screen and the export say so (D-011).

**Fields (§4.4.1).** The workbook's 24 columns as typed text, plus what an area
or a risk factor needs: `description`, `department_id` (composite FK) beside
the `department_text` the workbook carries, `owner_user_id` (an active member),
`estimated_data_principals`, `high_risk_documents`, `status`, `version`. The
spec's other ~25 fields are a backlog, not a migration. **`data_categories` is
free text (§4.4.9)** — the workbook's column is free text, and a controlled
vocabulary is an Anix content decision, not a schema one. The three workbook
"yes/no" columns are tri-states, parsed as: starts with *yes* → `yes`; plainly
*no* → `no`; **anything else** ("Possible", "Likely / Unknown", "Possible
under-18 / Needs review") → `unknown` — never a guess towards *no* (D-026).
`record_code` (`ROPA-001` …) is assigned when missing, unique per organisation
case-insensitively, immutable, and not the key.

**What "complete" means (§4.4.2)** — per area, as data in core and SQL alike:
a text field is complete when it is non-blank, not a placeholder (`-`, `—`,
`?`), not a to-do ("Define retention…") and contains none of eleven reviewed
"unresolved" phrases (`unknown`, `to be reviewed`, `to be legally reviewed`,
`review needed`, `needs review`, `to be confirmed`, `to be defined`, `not
defined`, `not known`, `tbc`, `tbd`) — a reviewed list matched as substrings,
never NLP (D-033's rule). **"Unknown" and "To be legally reviewed" are NOT
complete**: honest, and exactly the gap. Three area rules go beyond "filled in":
- **Department and owner** needs a named PERSON as well as a department. So
  every imported record starts 8 points short until somebody owns it — the
  workbook's "Admissions Department" is a department, not an accountable owner.
- **Evidence linkage** needs a STORED artefact attached (D-039), not the
  workbook's Evidence column, which describes evidence and is kept as
  `evidence_note`. A description is a promise.
- **Systems and vendors**: text OR a link counts, with no partial credit
  (§4.4.6) — integer weights only, so no half-points. Linking is asked for by
  the `vendor_unmapped` gap instead. An explicit "None" is a complete vendor
  answer that involves no vendor.

**Risk (§4.4.3) — a derived FLOOR an assessor may raise and never lower**
(D-039's direction). The spec's ten factors as points: children's data yes 3 /
unknown 1 · large scale (≥ 1,00,000, the D-028 trigger) 2 · high-risk
documents yes 2 / unknown 1 · two or more Data Processors 1 · cross-border
UNKNOWN 1 (a known transfer is assessed by questions — D-026's rule for the
scope tag) · AI yes 2 / unknown 1 · no notice 1 · no retention rule 1 · no
stored evidence 1 · no owner or no review date 1. Low ≤ 2 · Medium ≤ 5 · High
≤ 8 · Critical 9+, each boundary in the lower band. The derived rating, its
factors and its points are stored; the assessor's rating is stored beside it
and the database refuses one set BELOW the derived floor (`TS422`). What is
shown is the higher of the two, as a CHECK.

**There is no oracle.** The workbook's Risk Rating is typed by hand. Through
these rules the ten MU records rate **6 the same** as the hand ratings;
**ROPA-002** and **ROPA-007** are hand-rated Critical over a derived High, and
the raise is kept; **ROPA-008** (AI + no retention rule) derives Critical over
a hand High, and **ROPA-009** (children's data "Possible") derives High over a
hand Medium — both hand ratings would LOWER the floor and are ignored, with a
warning on import. Pinned in `tests/unit/ropa-import.test.ts`.

**Stored, not computed (§4.4.4).** A BEFORE INSERT/UPDATE trigger derives
completeness, band, missing areas, risk factors, points and ratings on every
write, whoever writes; seven CHECKs make each a row invariant of the record's
own fields and link counts, so tooling with the trigger disabled cannot store
a forged score. Users hold no grant on any derived, counted or stamped column.
Integer score, integer boundaries, in TypeScript and SQL — never the Slice 5
float-at-a-boundary defect. `ropa-register.test.ts` mirrors every rule.

**Lifecycle (§4.4.5).** `draft → in_review → approved`, `archived` from any,
restore and reopen to `draft`. Approval needs an owner, a completeness of at
least **61 (Usable)**, and a person holding `evidence.review` who is **not the
owner** — two people, as D-043/D-056; no matrix change (D-020). Approval
stamps `last_reviewed_at` (it IS a review). **An approved record is read-only
until reopened** — content, links and evidence detach are all refused — and
reopening starts the next **version**, like D-056's closed actions. Editing
and approving in one request is refused: the approver approves what they saw.
DELETE archives; a record is never removed by a user.

---

### D-062 · 2026-10-03 · ROPA gaps: twelve rules on their own ladder, generated on request, actions shown on the register
**Claude's call under §4.4.7, building on D-060** (own gap table, shared
`gap_actions`).

**The rules** are the spec's twelve conditions, each with a severity of this
slice's own (never `question_severity`, which needs an adjusted score):
`no_records` Critical (the only organisation-level gap — its record is NULL) ·
`no_owner` High · `categories_missing` High · `purpose_missing` High (purpose
or basis unresolved) · `vendor_unmapped` Medium · `notice_missing` High ·
`consent_missing` Medium · `retention_missing` High · `safeguards_missing`
High · `children_unreviewed` Critical · `ai_unreviewed` High ·
`review_overdue` Medium. "Without review" means **not yet approved**: approval
is the review. Children's or AI data that is merely *unknown* still needs it.
"Overdue" is a next-review date before **today in India** (D-055); today
itself is not overdue. An archived record opens nothing; an empty or
all-archived register opens one `no_records`. Priority and due date come from
the SHARED severity → priority → 30/60/90 tables, so the roadmap is unchanged.

**Generated on request, by one SECURITY DEFINER RPC taking one id** — the
D-057 rule unchanged: refreshed in place, newly derived → a gap and ONE
action, resolved → deleted if untouched, `superseded` if somebody worked on
its action; an action is never rewritten. `GET …/ropa/gaps` reports `stale`.
Generation needs `ropa.write`; reading the gaps needs `ropa.read` (the
actions, as before, `gap.read` / `gap.write`). **The seed generates none**:
`review_overdue` depends on today's date, so a seeded count would change on
the day the workbook's review dates pass.

**Where a client sees ROPA actions:** on the register's own page,
`/dashboard/ropa/gaps`, with the SAME action editor and the SAME roadmap
component as an assessment's — not on an assessment's roadmap. The register
belongs to the organisation and outlives any one assessment. So `gap_actions`
now holds rows with **no assessment behind them** (`gap_id` NULL, `ropa_gap_id`
set, exactly one — a CHECK). Slice 8's owner-wise and roadmap dashboards must
read BOTH parents and label each by its source.

---

### D-063 · 2026-10-03 · The ROPA import is CSV-only, parsed on the server, with no new dependency
**Claude's call under §4.4.8 — the prompt names CSV-only as legitimate.**
No `.xlsx` library was added (a stack change), and `packages/core` stays
dependency-free. A client saves the sheet as CSV ("CSV UTF-8" in Excel). The
upload is untrusted input: a 40-line RFC 4180 reader in `apps/web/lib/ropa/csv.ts`
parses it **on the server**, limited to 1 MB and 2,000 records; a formula cell
is its TEXT (`=HYPERLINK(...)` is stored as typed, never evaluated, never
followed); React escapes every cell it renders.

**The pipeline:** core proposes a column mapping by header NAME with aliases
(the `questions.ts` HEADERS pattern) → the user confirms or corrects it (a dry
run) → core validates each row and returns every problem at once → the valid
rows go to `public.import_ropa_records`, which inserts each in its own
sub-transaction so a row the DATABASE refuses (a duplicate record ID) comes
back with a reason too. **A bad row never fails the file; a file with no valid
row is a 422.** Rows arrive as Drafts, derived by the same trigger as a
hand-made record. A department is linked when the file names one EXACTLY as
the register does; anything else stays text. A hand-entered risk rating is
kept only when it raises the derived one, with a warning when it would lower.
**One audit row per import** (`ropa.records.imported`, with the counts) — the
per-row trigger is silenced by a transaction-local setting only that RPC sets.

**Export** (`GET …/ropa/export`, audited every time as
`ropa.register.exported`) writes every field under its workbook column name,
so an export imports straight back, then the derived columns; opens with a `#`
comment line saying it is a readiness register, not a statutory record, which
the importer skips; and prefixes any cell a spreadsheet would read as a
formula with an apostrophe (CSV injection), which the importer strips again.
`.xlsx` import is a later decision, if the pilot shows CSV is a real burden.

---

### D-064 · 2026-10-03 · `evidence_links` gains a third target, and a ROPA link re-derives the record's completeness
`linked_entity_type` now accepts `assessment_response`, `gap_action` and
`ropa_record`. All four trigger functions were redefined **from the Slice 6
bodies**, and `ropa-register.test.ts` counts every trigger function ever
attached to `evidence_links` across all migrations and fails if one is not
redefined.

**One deliberate departure from the prompt.** The prompt expected the two
AFTER triggers to return early for a ROPA record ("it has no score to
re-derive"). It does have one: completeness, whose evidence area needs a
stored artefact attached (D-061). So a ROPA link re-derives the RECORD's
`evidence_count` — and through the record's trigger, its completeness and its
"no evidence" risk factor — and then returns BEFORE the answer branch. It
never touches an answer: the RLS suite re-runs Slice 6's test and pins that an
answer's row is not even written (`xmin`) when evidence is linked to an action
or to a record, while an answer's own evidence still moves its score.

**Rules on the third target:** linking needs `ropa.write` (and the route,
`evidence.write`), the record in this organisation, and not archived;
detaching is refused while the record is APPROVED — it may be what the
approval stood on (the same reason as a closed action, D-056). The object-
exists rule applies to all three targets; the locked-assessment rule still
applies to answers only (D-058).

---

### D-065 · 2026-10-03 · A ROPA record states its lawful ground, its children's-data duties, what ends retention, its Rule 6 safeguards — and reads its processors' contracts
**Aniket approved (2026-10-03), after an expert review of Slice 7 against the
Act and the Rules** ("Package A — legally right"). Amends D-061's "complete"
rules for four areas and D-062's gap rules; the thirteen areas and their
weights are untouched (still exactly 100). Second migration
`20261004000000_ropa_dpdp_structure` — the first is applied and frozen.

**Why.** D-061 asked every record for a notice and a consent position and
read the basis as free text. Under DPDP that is wrong in a way a client would
notice on day one: a notice (s.5, Rule 3) accompanies a request for CONSENT,
and payroll runs on the employment legitimate use (s.7(i)) — it needs
neither. The register raised false gaps. Children's data was one yes/no where
the Act has two duties; retention was free text where s.8(7) and Rule 8 need
what ends it; Rule 6 has a stated minimum; and s.8(2) allows a processor only
under a valid contract, which the vendor register already recorded and a
record never showed.

**What a record now holds** — every choice a NOTE FOR COUNSEL, never a legal
opinion (D-011):
- **Lawful ground:** consent (s.6), one of the nine legitimate uses (s.7(a)–
  (i)), or the s.17 exemption; null while undecided. *Purpose and basis* is
  complete with a purpose and a ground (the free-text note is commentary).
- **Notice and consent follow the ground.** A notice is needed for consent
  and for a s.7(b) benefit (the Second Schedule's intimation); consent only
  for consent. **Undecided counts as needing both** (D-026). Gaps and the
  "no notice" risk factor follow the same rule.
- **Children (s.9, Rules 10–12):** verifiable parental consent (yes/no/
  unknown), tracking or targeted advertising (yes/no/unknown), and a Fourth
  Schedule exemption (its eleven, by Part and item). Two Critical gaps replace
  "children's data not reviewed": `child_consent_missing` and
  `child_tracking`. An exemption lifts both — within its conditions, which
  the form states. Approval no longer clears them: the duty is consent and no
  tracking, not a review.
- **Retention (s.8(7), Rule 8):** what ends it — purpose served, consent
  withdrawn, a named law, or the Third Schedule's three years — and the law,
  when that is the trigger. The area needs a rule and a trigger.
- **Rule 6(1) safeguards** as a six-item checklist ((f) is read from the
  vendors). The area is complete with ticks or a description;
  `rule6_unconfirmed` (Medium) opens until all six are confirmed.
- **Processor contracts:** the database counts linked vendors that are (or
  may be) Data Processors without a contract or DPDP clauses — maintained when
  a link changes AND when the vendor register changes — and
  `processor_contract_missing` (High) opens. Independent fiduciaries are
  excepted.

**Fifteen gap rules** (was twelve). Risk factors are unchanged but for
`no_notice`, which now fires only where a notice is required; "no retention"
still means no retention rule written, so no seeded rating moved.

**The derivation is one function,** `app.ropa_derive(row)`, called before the
lifecycle (approval needs the score) and after it (approval can set the review
date) — so a stored number is always that of the row as stored.

**Effect on the seed:** the workbook names a lawful ground for one record
(payroll: "Employment/statutory basis") and what ends retention for two
(events, alumni); the seed sets those as SEED JUDGEMENT, plus Rule 6 ticks for
what each safeguards cell lists. Everything else stays undecided and shows as
a gap — every seeded record is still Usable (62–80).

---

### D-066 · 2026-10-03 · Templates, "what do we hold about…", impact lookup, and a yearly review
**Aniket approved (2026-10-03)** ("Package B — useful day to day").
- **Starter templates.** `ropaTemplatesFor(industry)` — the spec's suggested
  activities for the organisation's industry, then six common to nearly
  everyone. A template fills the name, whose data and the purpose; it NEVER
  fills a lawful ground, a retention rule or a safeguard. Writers only.
- **"What do we hold about…"** — `GET …/ropa/lookup?principal=` returns the
  records whose own Data Principal text names that kind of person, with their
  data, purposes, grounds and recipients: a DRAFT of the s.11(1) access answer
  (a summary of personal data and processing activities, and every Fiduciary
  and Processor it is shared with). Matching is a case-insensitive substring
  of the record's words — never inference — and the page says so.
- **Impact lookup** — `?systemId=` / `?vendorId=` returns every live record
  linked to that system or processor, and every one whose text names it
  (labelled "named, not linked"): the first question in a breach (Rule 7's
  nature and extent). A system or vendor of another organisation is a 404.
- **Review cycle** — approving a record sets its next review twelve months
  out when none is set or it is already due; a sooner date is kept.

All read-only; `ropa.read`; one route with a sweep probe in both directions.

---

### D-067 · 2026-10-03 · No pilot: TrustStack launches as a production platform — and the ROPA design calls are settled for that
**Aniket (2026-10-03):** the platform will not run a Mumbai University pilot;
it launches as a production-grade live platform. Claude recommended how the
five open Slice 7 calls change under that, and Aniket approved all of it.
**Supersedes D-040's sequencing** (licensing "after the MU pilot"), and the
"pilot" framing in SLICES.md, SLICE_13 and SLICE_14.

**The five calls, settled:**
1. **A record is complete only with a named person as owner** (D-061) —
   confirmed. s.8(1) accountability, and the two-person approval and closing
   rules, need a person, not a department.
2. **Evidence linkage needs a stored artefact** (D-061, D-064) — confirmed.
   **Evidence expiry (D-049) becomes a launch blocker**, for answers and
   records alike: a live product cannot let a three-year-old document carry
   full weight.
3. **The risk model stays, with three safeguards for launch** (built here):
   every rating is stamped with `risk_model_version` (1.0.0) — a
   recalibration bumps it and re-derives in its own migration; an assessor's
   RAISE must carry a written reason (a CHECK; cleared when withdrawn; lowering
   stays impossible); and the factors and thresholds get a **sign-off from a
   DPDP practitioner or counsel before launch** (a human task, in STATE).
   Migration `20261005000000_ropa_risk_governance`.
4. **Excel import is added** (built here). **Stack change:** `exceljs` 4.4
   (MIT, maintained) in `apps/web`, with its `uuid` pinned to `^11.1.1` by a
   pnpm override to clear the one advisory it brought. Not SheetJS — its npm
   release is no longer updated and carries CVE-2023-30533. The workbook is
   hostile input and is checked BEFORE the parser sees it: 2 MB; its ZIP
   directory is read first and refused if it declares more than 40 MB
   unpacked, uses ZIP64, has more than 500 parts, carries macros
   (`vbaProject.bin`) or links to other workbooks (`externalLinks/`); parsing
   has a 10-second limit; only VALUES are read — a formula gives its cached
   result and is never evaluated or even read, a hyperlink its text. Rows go
   through the same mapping and validation as CSV, with Excel's own row
   numbers. CSV stays.
5. **ROPA actions stay on the register's page** (D-062) — confirmed. The
   combined owner-wise and 30/60/90 view across BOTH action parents (Slice 8)
   becomes **required before launch**.

**The plan, re-sequenced (numbers kept, so every "Slice 13" reference to
hardening work stays true):** Slice 13 is hardening and launch readiness;
Slice 14 is the console and licensing; **the production launch is the end of
Slice 14** — no client before licensing exists. Mumbai University becomes the
first production client, not a pilot. Launch blockers are listed in STATE.

**Found and fixed on the way:** the ROPA gap reader put every gap id into one
PostgREST `in.(…)` URL; a register of ~100 gaps returned 500 "URI too long".
The whole-register read now filters by organisation and pages; id lists
elsewhere (the assessment register too) go in chunks of 80. A 60-record,
300+-gap register is now an e2e test.

---

### D-068 · 2026-10-04 · The question bank is a black box to the client — a new permission, filtered in the API
**Claude's call under SLICE_08 §4.3, carrying D-040.** `question.read` still
lets every role read the questions; the WHOLE bank — all twenty packs, the
nine draft overlays and the reference pool, with codes, tiers, triggers and
source references — now needs **`question.read_bank`**, held by `super_admin`
and `consultant` only (migration `20261006000000_question_bank_black_box`,
core `rbac.ts`, `rbac-matrix.test.ts`; D-020's one-PR rule).

**What a client gets.** `GET /question-packs` returns `view: "client"` and
only the packs its OWN assessments were generated from
(`assessments.pack_codes`, frozen at generation), as `{ code, name,
questionCount }`. `GET /question-packs/{code}/questions` returns plain
questions (text, domain, evidence guidance, suggested owner) for those packs
and the SAME 404 as an unknown pack for any other — the route says nothing
about what else the bank holds. An organisation with no assessment sees no
pack. The browser hides the code on screen; it stays in the payload only as
the key the questions route takes. The assessment page hides pack codes and
trigger expressions from a client too, with plain reasons ("Included because
of your scope answers").

**Why not RLS.** Generating an assessment reads the bank as the caller
(D-033), so a policy restricting the bank would break generation for the
DPDP Programme Owner and the Organisation Admin. The bank is reference
content, not tenant data: this is a presentation boundary enforced in the
API, not isolation. What the database DOES guarantee, and the RLS suite
asserts, is that only Anix roles hold the permission and that a client's pack
list is built from rows RLS confines to its own tenant.

**A consequence, accepted.** The Organisation Admin holds every other
permission, so before this it could invite someone as a Consultant. Now the
consultant role carries a permission the admin lacks, and the no-escalation
rule (`assertCanAssignRole`, and the invite RPC, which reads the same matrix)
refuses it. That is the black box working: a client admin cannot hand a
colleague the whole bank. Consultants are added by Anix — the Slice 14
console, or a consultant already in the tenant.

**Not done (an open loop).** `GET …/assessments/{id}/questions` still returns
`packCode`, `includedReason` (with its trigger expression) and the question
code to every role; the UI hides them from clients. Trimming that payload per
role is a small follow-up, not a leak — it is the client's own assessment.

---

### D-069 · 2026-10-04 · Dashboards: one aggregate read, frozen and live scores side by side, actions from both parents, no new arithmetic
**Claude's calls under SLICE_08 §4.1, 4.2, 4.4, 4.5 and 4.6.**

1. **Which score the overview shows.** The newest FINALISED assessment's
   snapshot, labelled with the date it was frozen — and, separately, the
   live score of an assessment started AFTER it, labelled provisional with
   its unanswered count. With no finalised assessment, the newest one with
   answers, else the newest (the Slice 5 tile's rule). Two tiles, never one
   blended number (`pickAssessments`, unit-tested). An older draft created
   before the finalised one is not "in progress" on the overview.
2. **One aggregate endpoint:** `GET /organizations/{id}/dashboard`, guarded
   by `organization.read` (every role), each section checking its own
   permission and OMITTED (null, named in `omitted`) when the caller lacks
   it — never an error. It calls the EXISTING readers, which this slice
   extracted from their handlers so the route and the dashboard share them:
   `readAssessmentScore` (score.ts), `readGapRegister` / `readGaps`
   (gaps), `readRopaGapRegister` and `ropaRegisterCounts` (ropa). A unit test
   parses the reader and the two pages and fails if they import a scoring,
   completeness, risk or gap-derivation function, or query a table directly;
   an e2e test asserts the dashboard's score equals `GET …/score`'s and its
   ROPA counts equal `GET …/ropa`'s. No role in today's matrix lacks a
   section, so omission is reachable only by a future role.
3. **Counting lives in core** (`dashboard.ts`): `summariseActions`,
   `groupActionsByOwner`, `bucketActionsByWindow`, `isOutstanding` (an open
   gap and an unclosed action — the roadmap's existing rule), and
   `countRopaRegister` — the spec's ten ROPA metrics, now shared by the
   register page. Counts of stored fields only: "missing retention" reads
   the areas the DATABASE found missing; "vendor-linked" reads the stored
   link count; children's data and AI count "not yet known" as well as
   "yes", as the register's children tile always did. No average
   completeness is shown — a mean would be a new number.
4. **Owner-wise across both parents.** Owner = `owner_user_id`, a person;
   Unassigned is its own bucket, listed first. Each item carries `source`
   ("Assessment" / "Processing register"), and a context: the question's
   DOMAIN for an assessment action (never a question code), the record code
   and rule for a ROPA action — as the register's own roadmap labels it. The
   actions list reads EVERY assessment's gaps, not only the two on the
   overview, because a finalised assessment's actions live on (D-058). The
   shared roadmap now groups by owner ID, not display name (two people can
   share a name). Editing stays on each register's page: the actions page
   reads.
5. **Charts: none, and no dependency.** The data is a handful of counts, so
   per the dataviz guidance the form is a KPI row of stat tiles plus
   labelled severity and band chips — no chart library, no stack change.
   The readiness score and register completeness are on different tiles
   with different headings, never summed, averaged or on one axis (D-061).
6. **The assessment page collapses by domain.** Each domain is a header
   button (`domain-toggle-{code}`, `aria-expanded`) with its weight,
   question count and answered count; a closed group renders no answer
   panels. The first domain is open by default, so the existing tests'
   `answer-G1.2` path still works; "Open every domain" opens the rest. Every
   existing test id is still there once its group is open.

---

### D-070 · 2026-10-04 · Aniket approves D-068 and D-069 — and a database-level gap in the black box is found
**Aniket (2026-10-04):** both explicit calls are approved — an Organisation
Admin may NOT invite a Consultant (D-068), and the overview shows the frozen
snapshot and the live provisional score side by side, never one number
(D-069.1).

**Found the same day, while answering Aniket's question about trimming the
assessment questions API:** D-068's black box is enforced only in our API.
The Supabase URL and anon key are public by design (they ship in the
browser bundle), so any signed-in user can call PostgREST directly with
their own JWT. Probed on the local stack: the MU Dean and BML's admin each
read **all 20 packs (15 of them draft)** and the questions' **trigger text**
straight from `question_packs` / `question_versions`, and the Dean read his
own snapshot's `pack_code` and `included_reason` (`trigger:answers.…`).
**Tenant isolation is NOT broken** — BML read no MU snapshot row; the bank is
reference content, not tenant data — but the product promise ("a black box
to the client") is not met at the layer that counts. D-068's sentence "this
is presentation, not isolation" was accurate and is not good enough for a
data-protection product.

**Recommended fix (awaiting Aniket's approval — not built):** deny by default
in the DATABASE, not the API — bank tables readable only with
`question.read_bank`; generation reads the bank through one SECURITY DEFINER
RPC that checks `assessment.write`; the snapshot's provenance columns
(`pack_code`, `included_reason`) withdrawn from `authenticated` by column
privilege and served to Anix staff by an RPC; the client's "question sets"
view built from its own snapshot; allow-list response shapes per view; tests
that call PostgREST directly with a client JWT. Detail:
`docs/proposals/INTELLIGENT_REPORTING_PROPOSAL.md` §0.

---

### D-071 · 2026-10-04 · The black box is enforced by the database: deny by default, one door for generation, provenance by column privilege
**Aniket approved D-070's recommendation (Option C) on 2026-10-04**, to land
in PR #23 before it merges. Migration `20261007000000_black_box_database`.
Supersedes D-068's "presentation, not isolation" stance and its client view
of the bank.

1. **The bank is Anix's view, in RLS.** `question_packs`, `questions` and
   `question_versions` are readable only when
   `app.current_user_has_permission_anywhere('question.read_bank')` — a new
   SECURITY DEFINER helper for reference data that belongs to no tenant.
   `dpdp_domains` stays readable by every member (clients see the weights).
   The bank routes now require `question.read_bank` (403 for every client
   role); the nav hides the bank and the page points a client to its own
   assessments. D-068's client view (own packs by name, plain questions) is
   removed: a client's questions are on its assessment, which is exactly
   "what applies to them".
2. **One door for generation.** `public.bank_for_generation(org, pack_codes)`
   (SECURITY DEFINER) checks `assessment.write` in that organisation and
   returns ONE jsonb value — pack metadata for the codes named, and the
   current version of every question in those packs that are `approved` and
   not `reference`. A caller naming a draft or the reference pool gets no
   question from it. `loadBankForPacks` calls it; nothing else in the request
   path reads the bank tables except as Anix staff.
3. **Provenance by column privilege.** Table-level SELECT is revoked from
   `authenticated` on `assessment_questions`, `assessments` and `industries`
   and re-granted per column WITHOUT `pack_code`, `included_reason`,
   `pack_codes` and `overlay_pack_code`. A direct read of those columns is
   `42501 permission denied` for every signed-in role, consultants included.
   Anix staff read them through `public.assessment_provenance(org,
   assessment?)` (SECURITY DEFINER, `question.read_bank` IN THAT
   organisation). Writes are unchanged: the snapshot via
   `set_assessment_questions`, `pack_codes` via the writer's UPDATE.
4. **Allow-listed API shapes.** The assessment list, read and questions
   routes add `packCodes` / `packCode` / `includedReason` only for
   `question.read_bank`; the generation payload drops pack codes, skipped
   packs, trigger exclusions and trigger coverage for clients; the scope GET,
   PUT and preview drop `questionPacks` (`previewFor`); `/industries` drops
   the overlay mapping for everyone. Every field is ABSENT for a client, not
   empty.
5. **Tested the way it would be attacked.** `e2e/api/black-box.spec.ts`
   signs in as five client roles and calls PostgREST and the RPCs directly
   with their own JWTs; RLS tests assert the same at the SQL layer
   (`question-bank.test.ts`); a CI gate fails if a provenance column is ever
   granted or a bank SELECT policy stops requiring `question.read_bank`.

**Cost, accepted.** A client user no longer sees why a question is in its
assessment ("Included because of your scope answers") — the reason is
provenance. Potentially Applicable questions still say so, from their
applicability, and the consultant sees every reason.

**Deploy order — this migration is NOT additive (found the hard way,
2026-10-04).** It withdraws grants that the code on `main` reads. Applied
to the hosted database (which the live site uses) before PR #23 merged, it
broke the live site's assessment pages ("permission denied" on
`assessment_questions(count)` and `pack_codes`) for a few minutes until
Claude reverted it by hand — the exact inverse, in one transaction, and the
`_prisma_migrations` row removed so `prisma migrate deploy` applies it again
cleanly. Checked after: the live assessment list answers 200. **Runbook:**
merge PR #23 → wait for Vercel's production deploy → run `pnpm db:migrate`
against hosted at once. In the minutes between, the new code calls two
functions that do not exist yet: generating an assessment and the
consultant's provenance view fail; nothing else does.


---

### D-072 · 2026-10-05 · Slice 9's ten §4 decisions, as approved — and the exposure model 1.0.0 is data in core
**Aniket approved SLICE_09 on 2026-10-04** (its §4 decisions and the
rechecked §6 mapping). Recorded here as the prompt asks, so a cold session
does not re-litigate them:

1. **Live in core, stored in SQL** (D-053's pattern). The live view is
   `exposureFor` in `packages/core/src/exposure.ts`; a stored snapshot
   (Stage 2) is derived in SQL by one SECURITY DEFINER RPC taking an
   organisation id and nothing else, and a unit test will hold the two
   together.
2. **Which assessment:** `pickAssessments` (D-069.1) — the newest finalised
   snapshot, else the live provisional score, else none. The payload says
   which (`basis`).
3. **"Not yet assessed" counts as exposed in the headline**, labelled apart
   from "Exposed".
4. **SDF status is entered, never inferred** (D-028): two columns on
   `organizations`, `organization.update` only — see D-073.
5. **The rupee band** is a third of the ceiling in whole crore, only for
   Exposed / Partially mitigated / Not yet assessed, always with reasons,
   never summed; the headline sums CEILINGS, labelled as ceilings.
6. **Forecast** (Stage 2): trailing 8 weeks of `closed_at`, P50/P85 by seeded
   resampling, "not enough history" under 2 weeks.
7. **PDF** (Stage 3): `@react-pdf/renderer`, a stack change to record then;
   `exceljs` for XLSX.
8. **Generation** synchronous in the route for MVP sizes; `reports.status`
   keeps a worker's shape.
9. **No matrix change:** reading exposure needs `score.read`; recording a
   snapshot `score.calculate`; reports the existing `report.*`.
10. **Retention:** a report and its file go together; users delete neither.

**The model is data** (`EXPOSURE_HEADS`, `EXPOSURE_MAPPING`,
`EXPOSURE_THRESHOLDS`, `POSITION_FACTORS`, `COMMENCEMENT`,
`EXPOSURE_MODEL_VERSION = "1.0.0"`), every row counsel-reviewable, and the
unit tests pin the approved §6.2 table exactly. Any change to a mapping row,
a threshold or a point bumps the version and (from Stage 2) the SQL mirror in
the same PR. Exposure is a third view built on the readiness score and the
register; it never feeds back into either (D-061).

---

### D-073 · 2026-10-05 · Exposure model 1.0.0: the calls Stage 1 had to make that the prompt did not
**Claude's calls while building SLICE_09 Stage 1.** Each is reversible, each
is in the model as data or one function, and each is in the Stage 1
walk-through (`docs/testing/SLICE_09_stage1_walkthrough.md`) for Aniket's
approval at the gate.

1. **The scope gains the guardian question** (§6.2 said it would):
   `organization_scopes.guardian_data` — personal data of persons with
   disability who have a lawful guardian (s.9(1)) — tri-state, column default
   `unknown`, and absent from a `PUT …/scope` body means `unknown` (Zod
   default), as `uses_data_processors` does (D-037). It fires no risk tag and
   selects no pack. MU is seeded `unknown` (nobody has asked), BML `no`.
2. **SDF columns:** `sdf_notified_on date` + `sdf_notification_ref text`,
   both or neither (CHECK), the reference trimmed and 1–200 characters, the
   date not before the Act (11 Aug 2023, CHECK) and not in the future (API,
   India's date). `app.guard_organization_update` gains a third column
   group: the DPDP Programme Owner, who holds `scope.write`, may NOT record
   or clear one (TS403). Audited by the existing organisations trigger —
   column names only, never the reference.
3. **An unsaved scope is unknown on every fact** the model reads (children,
   guardian, sensitive documents, location). The wizard's blank-form
   defaults say `no` for children's data; the exposure model must not read
   that as a declaration (D-026).
4. **Children's data** for H3's "applies when" and the position factor is
   the strongest of the scope answer, every Data Principal type, every system
   and every live (non-archived) register record: any `yes` → yes, else any
   `unknown` → unknown.
5. **"Sensitive documents" counts on `unknown` too** (+1), as the scope's own
   `sensitive_documents` tag does. The prompt's table said "in scope".
6. **An open gap counts only while it is outstanding:** state `open` and at
   least one action not closed (or no action). A gap whose every action is
   closed has been remediated; its register just has not been regenerated —
   or it is frozen with a finalised score while its actions live on (D-058).
   This is what lets closing actions retire exposure (Stage 2's leverage).
7. **Mitigated needs evidence:** at least one direct domain answered, and
   every direct domain that has questions answered, ≥ 60% and ≥ 60%
   confidence. A head whose only direct domain is scoped out or all Not
   Applicable cannot be Mitigated — nothing evidences it — so it is Partially
   mitigated (with questions) or Not yet assessed (without). A domain scoped
   out or excluded in full evidences nothing (D-038).
8. **The (e) mitigation factor** ("every open gap has an owner and a due
   date", −1) needs at least one such gap — no gaps is not a plan — and a Low
   gap needs an owner only, because a Low gap carries no due date by design
   (D-055). The confidence factor (−1) needs at least one answered direct
   domain.
9. **Enabling controls say which heads they explain** (`supports`): GOV → all
   five; INV → H1, H2, H7; ROPA → H1, H7; CROSSBORDER → H1, H7; register
   housekeeping → H1/H2/H7 as listed. Shown as "Root cause: …" only on a head
   that is not Mitigated, and proven unable to move a status by a unit test
   from three starting points. `ai_unreviewed` evidences H4 only — outside an
   SDF it explains nothing (Rule 13(3) binds SDFs only).
10. **H5 and H6 are listed, never evaluated** (`notModelled`, with the
    reason), so the output shows all seven heads of the Schedule.
11. **`GET …/exposure` needs the whole picture:** `score.read`, plus
    `assessment.read`, `gap.read` and `ropa.read` — every role holds all
    four today; a future narrower role gets a 403, never a falsely calm view
    built from the inputs it could read.
12. **D-011's caveat now lives in code** (`DPDP_REPORT_CAVEAT`,
    `packages/core/src/reports.ts`), because every exposure output carries it
    beside the exposure caveat. Stage 3 adds the report kinds there.

---

### D-074 · 2026-10-06 · Stage 1 approved; Stage 2 — the exposure model in SQL, history, forecast, leverage and the what-if
**Aniket approved Stage 1 on 2026-10-06 ("Stage 1 approved"), with no
changes:** D-073's twelve calls stand. Migration `20261008000000_exposure_sdf`
went to hosted the same day (additive; 16 migrations; `db:types --check`
clean against hosted).

**Claude's calls building SLICE_09 Stage 2** — each reversible, each in the
Stage 2 walk-through (`docs/testing/SLICE_09_stage2_walkthrough.md`) for
approval at the gate:

1. **The SQL mirror is a pure evaluator over core's own input shape.**
   Migration `20261009000000_exposure_snapshots`: the model's data as small
   IMMUTABLE functions (`app.exposure_heads`, `_domain_links`, `_rule_links`,
   `_thresholds`, `_position_factors`, `_forecast_config`,
   `_large_scale_threshold`, `_model_version`, `_deadline`); the logic as
   `app.exposure_evaluate(input jsonb)`, which takes the same `ExposureInput`
   `exposureFor` takes; the inputs gathered by `app.exposure_input(org,
   today)`, which reads what the API's readers read (`pickAssessments`, a
   finalised assessment from its snapshot, a live one through
   `app.assessment_domain_results`, red flags WITHOUT their question codes).
   Three guards: a unit test parses the data (`exposure-mirror.test.ts`); an
   RLS test runs 400 generated inputs and 120 forecast histories through
   both copies and fails on any difference, reasons word for word; an e2e
   test proves a stored snapshot equals the live model at that moment. The
   evaluator stages its input in temporary tables, so it is VOLATILE.
2. **Floating-point noise is removed in core** before a 40%/60% comparison
   and before a percentage is rounded (`exactProportion`, the engine's own
   9-decimal rule) — numerics in SQL are exact, doubles are not (0.145 × 100
   = 14.499999…). Not a rule change: no real input changes status. The
   model stays **1.0.0**. `ExposureActionInput` gains an optional `id` the
   model never reads.
3. **Forecast** (`forecast.ts`, `app.exposure_forecast`): Park–Miller MINSTD
   (48271, 2³¹−1, exact in a double and a bigint), seed **20270513**, 1,000
   runs, nearest-rank P50/P85, a **260-week horizon** ("beyond five years" is
   reported, never hidden). Critical/high and all work run on the SAME draws
   (so critical/high never finishes later), and the critical/high projection
   assumes that work is done first. "Not enough history" = fewer than 2 of 8
   weeks with a closure, and only when work is outstanding. Required rate =
   ⌈outstanding × 70 ÷ days⌉ ÷ 10 (one decimal, rounded UP); null once the
   deadline has passed.
4. **Work and pace.** Work = on the gaps the MODEL reads (the chosen
   assessment and the register), each outstanding gap's actions not closed —
   or one unit for a gap with no action (`outstandingWork`,
   `app.exposure_outstanding_work`). Pace = every action closed in the
   organisation (either parent, any assessment) in the trailing eight weeks,
   by `closed_at` as the date in India — a stamp only the database writes.
5. **Leverage** (§8): weight = Σ ceilings (crore) of the heads AT STAKE the
   gap counts against directly × severity (critical 4 · high 3 · medium 2 ·
   low 1). A head that is mitigated or not applicable retires nothing; an
   enabling-only gap is not listed. Ties: earlier due date (none last), then
   id. Top 10, each with what closing it ALONE would change.
6. **What-if**: `POST …/exposure/what-if { actionIds ≤ 50 }`, the same
   permissions as the exposure view (`score.read` + the three input reads);
   ids that are not open actions of this organisation come back as
   `unknownActionIds` (an Org B id on Org A's path is simply unknown); pure
   over a copy of the input, so read-only by construction and not audited.
7. **Six slippage warnings**: not enough history (notice); critical/high P50
   after 13 May 2027; all-work P85 after it; the pace below the required
   rate; overdue actions on heads at stake; unowned actions on heads at
   stake. Plain words, dates as "18 May 2027", no codes.
8. **"What changed"** compares the live model with the NEWEST stored
   snapshot (status and band per head, ceilings, heads at stake) and flags a
   snapshot recorded under another model version.
9. **`exposure_snapshots`**: `as_of` (India's date), `basis`, the chosen
   assessment and its score snapshot (composite FKs, CASCADE — a snapshot
   goes only with what it was about, as D-052; the organisation itself is
   pinned by `audit_logs`), the evaluator's `heads`, `ceilings_at_stake`,
   `exposed_heads`, `applicable_heads`, `forecast`. SELECT with `score.read`;
   no write grant; an immutability trigger (TS409, tooling included). One
   audit row per recording (`exposure.snapshot.recorded`, as the person). No
   seeded snapshot (§13). A CI gate checks the grants, the trigger and the
   model's version/thresholds/seed in SQL.
10. **Routes**: `GET|POST …/exposure/snapshots` (history: newest first,
    default 52, at most 200, summaries without reasons) and
    **`GET …/exposure/snapshots/{snapshotId}`** — a full read §9 did not
    list, added for Stage 3's reports. Each has a route-sweep probe.
11. **UI**: `/dashboard/exposure`, linked as "Exposure" for every
    `score.read` holder. Direct evidence first; root causes collapsed
    (Stage 1's open loop). History: one series (ceilings at stake), one hue,
    a table alongside, a hover tooltip, plain SVG — no chart library. The
    overview's exposure strip makes its OWN request (`GET …/exposure`); the
    dashboard's single request is unchanged. Pages compute nothing (a unit
    test fails if one imports the model, the forecast or leverage).
12. **Two consequences of the approved rules — reported, NOT changed:**
    (a) closing the last open gap on a head whose actions were all owned and
    dated removes the (e) −1 (D-073.8 "no gaps is not a plan"), so the
    head's POSITION can rise a point as remediation finishes; ceilings and
    statuses never worsen (unit-tested). Suggested for 1.1.0: also award the
    −1 when no direct gap is outstanding and a direct domain is answered.
    (b) With no assessment, closing a head's only register gap moves it from
    Exposed to Not yet assessed — still at stake (D-026).

---

### D-075 · 2026-10-06 · Stage 2 approved as built — exposure model stays 1.0.0
**Aniket approved Stage 2 on 2026-10-06 ("Stage 2 approved"), with no
changes.** D-074's twelve calls stand. That includes call 12: the two
consequences of the approved 1.0.0 rules — the (e) mitigation factor lost
when a head's last gap closes, and an unassessed head moving from Exposed to
Not yet assessed when its only register gap closes — are KEPT. No 1.1.0
bump; both are listed in STATE to go to counsel with the model sign-off.
Migration `20261009000000_exposure_snapshots` went to hosted the same day
(additive; 17 migrations; `db:types --check` clean against hosted; hosted
reports model 1.0.0 and no snapshot yet). Stage 3 starts in a new session
(SLICE_09 §0.8: one stage per session).

---

### D-076 · 2026-10-06 · Stage 3 — the report store, and the Exposure Brief and Programme Status Report as stored, versioned PDFs
**Claude's calls building SLICE_09 Stage 3** — each reversible, each in the
Stage 3 walk-through (`docs/testing/SLICE_09_stage3_walkthrough.md`) for
approval at the gate. Migration `20261010000000_reports` (additive; local
only until Stage 3 is approved).

1. **PDF library: `@react-pdf/renderer` 4.9.0** (decision 7, MIT) — the stack
   change, recorded. `pnpm audit` before and after is IDENTICAL: 4 moderate /
   5 high, all pre-existing (`next`→`postcss`, Prisma tooling, Tailwind's
   `source-map-js`); nothing comes from react-pdf. It is loaded unbundled
   (`serverExternalPackages`: it runs its own React reconciler), and the
   fonts are traced into the two generating functions
   (`outputFileTracingIncludes`, checked in the build's `.nft.json`).
   Measured locally on MU's data: the Exposure Brief 621 ms end to end on a
   cold server (198 ms of it rendering), the Programme Status Report 247 ms
   warm. **Not measured: a Vercel cold start** — previews sit behind Vercel
   Authentication, so the laptop cannot call one; checking it on the PR's
   preview is a Stage 4 item.
2. **Fonts are embedded: Noto Sans, with Noto Sans Devanagari as a per-glyph
   fallback** (both SIL OFL, vendored unmodified in `lib/reports/fonts/` with
   `OFL.txt`). PDF's standard fonts have no ₹; names and action titles may be
   typed in Hindi or Marathi. A unit test fails if any string literal core can
   print needs a glyph neither font has. Other Indian scripts (Tamil, Bengali,
   Gujarati…) would print as missing glyphs: an open loop.
3. **One document model, one renderer.** Core builds a `ReportDocument`
   (tiles, tables, paragraphs, bullets, notices, caveats, notes) per kind,
   purely (`exposureBrief`, `programmeStatusReport`); `lib/reports/pdf.ts`
   draws any of them and decides nothing but layout. Wording, caveats and the
   black box are unit-tested in core; the FILE is tested by extracting its
   text with pdfjs (both caveats verbatim, no code, page count).
4. **The store is written by three functions only.** `begin_report(org,
   kind, format, subject?)` decides the version (per organisation, kind and
   owner; an advisory lock, and a `NULLS NOT DISTINCT` unique index behind
   it), the file name (`TrustStack_DPDP_Exposure_Brief_v3_2026-10-06.pdf`),
   the path, the date in India — and, for an exposure report, records a FRESH
   exposure snapshot through `record_exposure_snapshot` first (so generating
   one also needs `score.calculate`) and points at it. `complete_report` READS
   the size from the stored object (the caller sends no number) and only the
   person who began the report may finish it; `fail_report` records why.
   No user write grant on `reports`; an immutability trigger allows only
   running → ready | failed and a pointer cleared by a foreign key; DELETE
   only with the organisation.
5. **A report outlives its basis.** Unlike a snapshot (which CASCADEs with its
   assessment), a report's assessment and snapshot keys are `ON DELETE SET
   NULL (column)`: deleting a draft assessment must not delete what the Board
   was shown, and the row and its file stay together (decision 10). Prisma
   cannot express a column-list action; `schema.prisma` says NoAction and
   says why.
6. **Bucket `reports`**: private, 20 MiB, PDF and XLSX only; tenancy in the
   path `organizations/{org}/reports/{report}/{file}`. INSERT only by the
   person who began a still-running report, at exactly its path; SELECT
   (signing a URL) only for a READY report with `report.download` — or an
   owner's own pack; no UPDATE, no DELETE. The file is uploaded with the
   caller's JWT, never the service role. Downloads: 60-second signed URLs,
   each audited (`report.download_url.issued`).
7. **All seven kinds are in the schema now** (`app.report_kinds()`, the
   kind/format CHECK, mirrored by `REPORT_KIND_DEFINITIONS` and a unit test),
   so Stage 4 needs no constraint change; only the two built kinds are
   offered (`AVAILABLE_REPORT_KINDS`, the route's Zod enum). Decision 9's
   owner-pack rule is in SQL already and RLS-tested (your own pack with
   `gap.read`; downloading your own pack). The evidence pack records an
   exposure snapshot; the owner pack does not (owners hold no
   `score.calculate`). Stage 4 may change either — with a migration.
8. **What a report prints.** The STORED snapshot — headline, heads,
   positions, reasons, forecast — never recomputed. Leverage, slippage and
   "what changed" come from the Command Centre's own reader
   (`readLiveExposure`, extracted from the exposure route in the same
   request); the DPO's actions, owners, roadmap windows, register counts and
   scorecard from the overview's own reader (`readDashboard`, extracted from
   the dashboard route). The Programme Status Report's "what changed"
   compares with the snapshot recorded BEFORE its own. Unit tests fail if the
   report code imports a scoring, model, forecast, leverage or counting
   function, or writes a row.
9. **The Exposure Brief is one A4 page, always** — proved with a worst-case
   fixture (five long reasons, five long actions, Devanagari names). To fit,
   it names heads briefly with their provision ("1. Security safeguards
   (s.8(5))"), lists the top five leverage actions, puts the pace in three
   sentences, merges stale-input notices into one, and moves "not modelled"
   to the notes. The DPO's report uses the full statutory titles, every
   reason and position factor, the forecast table, by-owner and by-window
   tables, the register's eleven counts and the scorecard as an appendix on
   its own page. Short tables (≤ 14 rows) never split across pages, and a
   section title always travels with its first block.
10. **Generation is synchronous** (decision 8): begin → gather → render →
    upload → complete, inside the request (`maxDuration` 60 s on the two
    generating routes). Any failure after `begin` marks the row failed with
    where it stopped — never a stack trace. A report still "generating" after
    ten minutes is shown as failed. The POST returns the measured timings
    (not stored) and the server logs them.
11. **Permissions — no matrix change.** List and read: `report.read` (every
    role). Generate and regenerate: `report.generate`, plus, for an exposure
    report, `score.calculate` and every input the exposure view reads (a
    clear 403 otherwise). Download: `report.download` (the Executive Sponsor
    and the Auditor may; contributors may list but not download), or your own
    owner's pack.
12. **Audit, as the person:** `report.requested`, `report.generated`,
    `report.generation_failed` (in SQL), `report.download_url.issued` (the
    API, every time), beside the snapshot's own `exposure.snapshot.recorded`.
13. **UI:** `/dashboard/reports` ("Reports" in the nav for `report.read`):
    generate cards (hidden without `report.generate`), every version with who
    and when, Download (hidden without `report.download`), "New version".
14. **D-011's caveat moved to `packages/core/src/caveat.ts`** so the exposure
    model and the report builders can both import it without importing each
    other. Wording unchanged.

---

### D-077 · 2026-10-08 · Stage 3 approved as built
**Aniket approved Stage 3 on 2026-10-08 ("Slice 9, I approve stage 3"),
with no changes.** D-076's fourteen calls stand: react-pdf 4.9.0, embedded
Noto Sans + Devanagari, one document model and one renderer, the store
written only by `begin_report` / `complete_report` / `fail_report`, reports
outliving their basis (`SET NULL`), the private `reports` bucket, all seven
kinds in the schema, the one-page Exposure Brief and the DPO's Programme
Status Report as built. Migration `20261010000000_reports` went to hosted the
same day (additive; 18 migrations; `prisma migrate status` up to date;
`db:types --check` clean against hosted). CI on `8578dbe` is green, e2e
**248/248**, so the 7 local e2e failures recorded at Stage 3 were the
laptop (Auth port exhaustion), not Stage 3. Stage 4 starts in a new session
(SLICE_09 §0.8: one stage per session).

---

### D-078 · 2026-10-08 · Stage 4 — the Owner Action Pack, the Regulator-Ready Evidence Pack and the three working spreadsheets
**Claude's calls building SLICE_09 Stage 4** — each reversible, each in the
Stage 4 walk-through (`docs/testing/SLICE_09_stage4_walkthrough.md`) for
approval at the PR. **No migration**: all seven kinds, the owner-pack rule
and the bucket's XLSX type have been in the schema since Stage 3 (D-076.7).

1. **An owner generates and downloads their OWN pack** (decision 9). The
   generate and regenerate routes are guarded by `report.read` (every role),
   and the rule — `report.generate`, or your own pack with `gap.read` — is
   checked in the route for the message and again in `begin_report`. The
   download route and the bucket already served an owner their own pack.
   Everyone else's reports stay listed (`report.read`) but not downloadable
   without `report.download`. An owner's pack names its owner
   (`ownerUserId`, required for that kind and refused for any other); the
   database refuses a person who is not an active member (422).
2. **The evidence pack generates its Evidence Index first, in the same
   request, from the same reads** (`Gathered` in `lib/reports/generate.ts`),
   and names it by file name — "PDF summary + XLSX index" (§2.7). Two rows,
   two version sequences; regenerating the pack makes a new index too. If
   the index fails, the pack is never begun.
3. **One remediation reader.** `readRemediation` was extracted from
   `readDashboard` (every assessment's gaps — actions live on after a freeze,
   D-058 — and the register's); the overview, the tracker, the owner's pack
   and the evidence pack all read through it, so none can list a different
   set of actions (D-069). `lib/reports/inputs.ts` only changes shapes.
4. **Evidence coverage is counting, in core** (`evidenceCoverage`): each
   artefact counted ONCE per head, per domain and in the total however many
   links it has; which head a link evidences is the model's own mapping
   (`directHeadsOf`, `linkDirectHeads`) — an enabling control evidences no
   head and says "Enabling control"; a register record evidences its record.
   **Accepted = Adequate or Strong**, the closing rule (D-056,
   `CLOSING_REVIEW_STATUSES`). Evidence confidence is the engine's, from the
   scorecard the snapshot was based on.
5. **The workbook is data, in core** (`workbooks.ts`: `ReportWorkbook`, an
   About block with D-011's caveat, sheets of plain values), rendered by
   `lib/reports/xlsx.ts` (exceljs) which decides nothing. **Values only**: no
   formula or link object is ever written, and text is defused by
   `defuseFormula` — `csvCell`'s rule, now one function shared by the CSV and
   every XLSX (pitfall 9). Tests read every file back cell by cell, and a
   guard-on-the-guard proves the reader would catch a formula or a link.
6. **The ROPA workbook is the CSV export, column for column**: the export's
   row builder moved to `lib/ropa/shape.ts` (`ropaExportHeaders`,
   `ropaExportRow`, §5), so the two can never drift; like the CSV it includes
   archived records, and it imports straight back.
7. **The Gap & Action Tracker**: an Actions sheet (one row per action, both
   parents, labelled by source, owner or "Unassigned", window and Overdue from
   today in India, penalty heads through the model, artefacts attached and
   accepted, how it closed) and a Gaps sheet (finding, fix, state, actions
   still owed). An action on a gap that no longer applies is listed, not owed.
8. **The Evidence Index**: one row per artefact and link (all three link
   types), one "Not linked" row for an artefact linked to nothing; a question
   is named by its text from the assessment's snapshot, never its code
   (D-071); a link whose target the caller cannot read is left out, never
   invented. Every read is paged or chunked (pitfall 8).
9. **The Owner Action Pack** (D-011's caveat only — it records no exposure
   snapshot; owners hold no `score.calculate`): at a glance (owed, overdue,
   due in 30 days, closed), Overdue, the owed actions by window, "Evidence to
   provide" (what each owed action still needs to close), and the processing
   records the owner is named on, with the review-overdue rule the
   register's count uses (`ropaReviewOverdue`, now one function).
10. **PDF layout**: a subheading — and a section that opens with one — keeps
    the block it introduces on its page; a long table's title and header need
    about three rows after them (react-pdf `minPresenceAhead`, with an empty
    preceding sibling, because react-pdf only breaks for presence when a
    sibling precedes the element). The Board brief is still one page.
11. **UI**: every kind offered, grouped "Reports (PDF)" / "Working files
    (Excel)"; the owner picker lists active members (for `report.generate`
    holders, from the users route); a contributor sees only "Generate my
    pack"; the evidence pack card says it also makes the index.
12. **Measured locally** (MU and a demo hospital): owner pack 0.19–0.33 s,
    evidence pack with its index 0.20–0.34 s, each spreadsheet 0.03–0.07 s.
    A Vercel cold start is still unmeasured (previews sit behind Vercel
    Authentication) — Aniket's check on the PR preview, by hand.

---

### D-079 · 2026-10-10 · Slice 9 closed; SLICE_10 re-verified before approval
**Slice 9 Stage 4 is approved by its merge.** Aniket instructed "Merge PR
#25" on 2026-10-08; it merged as `a691d88` with CI green (e2e 259/259) and
deployed; D-078's twelve calls stand. The docs follow-up (PR #26) merged
2026-10-10 as `8161688`. Aniket ran the Stage 4 manual test
(`docs/testing/SLICE_09_stage4_manual_test.md`, twelve steps) on the local
stack on 2026-10-10 and reported no discrepancy.

**SLICE_10 was re-checked against `main` and the Gazette before approval**,
and corrected — nothing in it is approved yet:
1. **Rule 8 was stated too broadly.** Rule 8(1)–(2) — the deemed-purpose
   period and the 48-hour notice before erasure — binds only the Third
   Schedule's classes (e-commerce ≥ 2 crore users, online gaming ≥ 50 lakh,
   social media ≥ 2 crore). Every fiduciary is bound by s.8(7) and by Rule
   8(3): keep personal data, traffic data and processing logs at least one
   year, then erase.
2. **Decision 3 now carries a recommendation**: staff-entered rights
   requests and grievances in Stage 2; every public surface (notice page,
   consent widget, public rights and grievance forms) together in Stage 3,
   with a NEW `organizations.public_slug` column — none exists today.
3. **The approval wording is fixed**: "SLICE_10 approved" (all as written) or
   "SLICE_10 approved with changes: …"; anything else → ask, no code.
4. **Every Slice 10 stage ends with a walk-through AND a step-by-step manual
   test** (`docs/testing/SLICE_10_stageN_manual_test.md`: numbered steps, each
   with Do and Expect, on the local stack) — the format Aniket asked for in
   Slice 9.
5. A breach whose affected people are not yet told **caps H2 at Partially
   mitigated**; it is not a status of its own.
6. **Per-stage model versions — Aniket's decision, 2026-10-10 ("use
   per-stage versions").** Each stage's migration reaches hosted when that
   stage is approved, and an applied rule never changes under the same
   version (D-074), so each stage that adds model rows bumps the minor
   version in core and in its own new migration: Stage 1 → 1.1.0 (breach),
   2 → 1.2.0 (rights and grievance), 3 → 1.3.0 (consent and children),
   4 → 1.4.0 (processors), 5 → 1.5.0 (retention); Stage 6 changes no rule.
   Rejected: one 1.1.0 held back from hosted until Stage 6 — the live site
   would show no module's effect on exposure until the end.

---

### D-080 · 2026-10-11 · SLICE_10 approved as written
**Aniket approved SLICE_10 on 2026-10-11 ("SLICE_10 approved")**: every §4
decision as recommended and every §6 model row as written. Recorded here as
§0.2 asks, so a cold session does not re-litigate them:

1. **Port the logic, not the schema.** Each module is designed here on
   composite keys, RLS through the tenant helpers, D-019 grants and audit by
   trigger; the old app's pure helpers are ported into `packages/core`.
2. **Processors extend the Slice 2 `vendors` table**; a processor's contract is
   evidence (`evidence_links` type `vendor`), not a URL (Stage 4).
3. **Public intake is RPC-only and comes in Stage 3**, with a new
   `organizations.public_slug`; Stage 2 ships staff-entered rights requests
   and grievances only.
4. **Breach facts are derived, never forged**: the database computes the Board
   report's due time (aware + 72 h); "notified" needs a timestamp and who
   recorded it; a Board extension is recorded with its reference, moves the
   due time, and is audited.
5. **One model version per stage** (D-079.6): 1.1.0 breach · 1.2.0 rights and
   grievance · 1.3.0 consent and children · 1.4.0 processors · 1.5.0
   retention; Stage 6 changes no rule. Each in core AND its own migration.
6. **The consent widget** ships English, Hindi and Marathi; the other
   languages are flagged "translation pending", never machine-translated.
7. **Three new report kinds** (`security_breach`, `legal_position`,
   `processor_exposure`) in one additive migration in Stage 6.

The §6 rows stand as written: Stage 1's are a Board report past its due time
and not recorded as made → H2 Exposed; affected Data Principals not yet
intimated → H2 at best Partially mitigated; breaches in the last 24 months →
s.33(2)(c) +1 (one) / +2 (two or more).

---

### D-081 · 2026-10-11 · Slice 10 Stage 1 — the breach register and exposure model 1.1.0: the calls the prompt did not make
**Claude's calls while building SLICE_10 Stage 1.** Each is reversible before
the migration reaches hosted, and each is in the Stage 1 walk-through
(`docs/testing/SLICE_10_stage1_walkthrough.md`) for Aniket's approval at the gate.

1. **Two new permissions** (a matrix change: core + migration, D-020):
   `breach.read` for all ten roles, `breach.write` for the roles that already
   write registers (Super Admin, Consultant, Organisation Admin, DPDP
   Programme Owner and the four contributors). Anyone who discovers a breach
   can record it; the Executive Sponsor and the Auditor read only.
2. **The register's shape** (`breach_incidents`): title, narrative, nature
   (six), staff-assessed severity (critical · high · medium · low — its actions
   carry it, on the gap ladder: critical → P0), when aware, when it occurred,
   where (Rule 7(2)(a) "location"), people affected (approximate), data
   involved, likely impact, containment. The code is the database's:
   `BRH-<year the organisation became aware, in India>-NNN`, per organisation.
3. **Two Board intimations, recorded apart** — Rule 7(2)(a) "without delay"
   and Rule 7(2)(b) the detailed report. Only (b) has a clock, so only (b)
   feeds the model's "overdue" row.
4. **The clock** (`board_report_due_at`) = aware + 72 h, or the time the Board
   allowed — derived by the trigger and a CHECKed row invariant. **Exactly 72
   hours is still in time**; overdue is strictly after the due instant. An
   extension must run beyond the 72 hours and carry the Board's reference.
5. **Nothing moves the clock.** `aware_at` has no UPDATE grant once the row
   exists; no user holds a grant on the code, the due time, any
   `*_recorded_*` stamp, `created_by`, `closed_*`, or the status on insert. A
   recorded intimation or extension may be corrected but never removed
   (TS409). No time may be in the future (five minutes of clock skew allowed)
   or, for an intimation, before awareness. Nothing before the Act (11 Aug
   2023) is a DPDP breach.
6. **The lifecycle**: `open` → `contained` → `closed`; `dismissed` = assessed as
   NOT a personal data breach, with its reason. Closing needs both the Board
   report and the people's intimation recorded (a CHECK, so tooling obeys
   it); a closed or dismissed breach is reopened before anything changes;
   reopening withdraws a dismissal. **Nothing is deleted** (no DELETE grant).
   A dismissed breach runs no clock, counts nowhere in the model, and its
   actions are no longer owed (`superseded`, the word the gap registers use).
7. **Actions: a third parent on `gap_actions`** (`breach_incident_id`, composite
   FK, one-parent CHECK widened to three). A breach's remediation is written
   by people, not derived, so it gets ONE door — `add_breach_action`, which
   needs `breach.write` AND `gap.write`; users still hold no INSERT grant on
   the table. A closed breach can still take remedial work; a dismissed one
   cannot. Every other rule — the closing rule (D-056), the workflow, the
   editor — is the existing one. The forecast's pace counts breach-action
   closures too, because it always counted every closed action.
8. **Model 1.1.0 as data.** `MODULE_INPUTS` (core) and
   `app.exposure_module_inputs()` (SQL): each row its head, provision,
   effect (`exposed` or `not_mitigated`) and reason text. An overdue Board
   report is direct evidence: it makes H2 Exposed even with no assessment.
   The people-not-told row only bars Mitigated — it never raises a head out of
   "Not yet assessed". Their reasons follow the register's, before "not
   answered yet". Repetition counts breaches (not dismissed) the organisation
   became aware of within 24 calendar months ending today, dated in India,
   both ends included, on H2 only — a well-handled breach counts, as the
   approved row says. The input carries `now` (an instant) and raw breach
   facts; the model decides. `UNSCORED_FACTORS` drops (c). Both mirror tests
   cover it (400 generated inputs, now with breaches at the boundaries).
9. **The exposure view needs `breach.read` too** — every role holds it; a
   narrower future role gets a 403, never a calm view missing the register.
10. **A breach as a mapping key** (`{ source: "breach" }`) evidences the heads
    the breach register's own rows read (H2): what the reports' "penalty
    heads" column prints for a breach's action. Never an enabling control.
11. **The overview gains a `breaches` section** — counts (core
    `countBreaches`) and the clocks still running, soonest first — omitted
    for a caller without `breach.read`. The Actions page and the Stage 4
    reports list breach actions, labelled "Breach register"; a breach with no
    action is not listed as remediation.
12. **Times are UTC instants, shown in IST.** The register's date-and-time
    fields are read as India's time whatever the browser's time zone, so a
    consultant's laptop abroad cannot shift the clock.
13. **Not in Stage 1:** evidence linked to a breach itself (a
    `breach_incident` link type joins the evidence index with Stage 6's other
    new link types — a breach's ACTIONS already take evidence); email
    escalations on a timer (Slice 13); any AI-drafted letter (Slice 11).
14. **Seed:** Mumbai University gets one past breach, BRH-2026-001 (exam marks
    shared through a public link, March 2026), handled in time and closed, with
    one open remedial action. Its consequence: MU's H2 position gains +1
    (repetition) while the breach is inside 24 months.
15. **Old app (Slice 13's inventory):** this stage replaces
    `src/app/api/breach`, `src/lib/breach/countdown.ts` (ported to core
    `breach.ts` with tests) and `db/breach_incidents.sql`. Not ported:
    `escalation.ts` (timed email, Slice 13) and `notification.ts` (the Claude
    DPBI letter, Slice 11).

---

### D-082 · 2026-10-11 · Slice 10 Stage 1 approved as built
**Aniket approved Stage 1 on 2026-10-11 ("Stage 1 approved"), with no
changes.** D-081's fifteen calls stand: the two breach permissions, the
register's shape and code, two Board intimations recorded apart, the clock
(exactly 72 hours is in time), nothing moving the clock, the lifecycle with no
DELETE, the third parent on `gap_actions` behind `add_breach_action`, model
1.1.0 as data, the exposure view needing `breach.read`, a breach as a mapping
key, the overview's `breaches` section, UTC instants shown in IST, the
deferred `breach_incident` link type, MU's seeded breach and the old-app
inventory. Migration `20261011000000_breach_register` went to hosted the same
day (additive; 19 migrations; `prisma migrate status` up to date;
`db:types --check` clean against hosted). Stage 2 starts in a new session
(SLICE_10 §0.8).

---

### D-083 · 2026-10-11 · Slice 10 Stage 2 — the rights and grievance register and exposure model 1.2.0: the calls the prompt did not make
**Claude's calls while building SLICE_10 Stage 2.** Each is reversible before
migration `20261012000000_rights_register` reaches hosted, and each is in the
Stage 2 walk-through (`docs/testing/SLICE_10_stage2_walkthrough.md`) for
Aniket's approval at the gate.

1. **One register for both workflows** (`rights_requests`, `kind` ∈ access ·
   correction · completion · updating · erasure · nomination · grievance).
   s.13 makes grievance redressal itself a right, the Rules give every request
   one system and one ceiling (Rule 14(3)), and a grievance is often ABOUT a
   request (`related_request_id`, composite FK). Two families, two codes —
   `DPR-<year received>-NNN` for a request, `GRV-…` for a grievance, per
   organisation; a request may change kind within its family, never across
   it (TS422). Rejected: two tables (the old app's), which doubled the
   lifecycle, the clock and the routes for one rule.
2. **Two permissions** (a matrix change, D-020): `rights.read` for all ten
   roles, `rights.write` for the eight that write registers — exactly as
   `breach.*` (D-081.1), so the exposure view keeps working for every role.
   The register holds personal data (name, email, phone, identifier): every
   member who holds `rights.read` sees it. Counsel may narrow it later.
3. **The Act's own list, nothing else.** No "restrict" or "portability" (GDPR
   rights DPDP does not grant, which the old app carried). The old app's
   section numbers were wrong (grievance "s.14", nomination "s.15"); here
   access s.11, correction/completion/updating s.12(2)(a)–(c), erasure s.12(3),
   grievance s.13, nomination s.14.
4. **The clock is days, on India's calendar, from receipt** (s.13(2) "from the
   date of its receipt"). `respond_by` = receipt + 90 days, derived by the
   trigger and CHECKed. **Day 90 is still in time**; overdue is strictly
   after. TrustStack's target is passed strictly after day 30. The ceiling is
   applied to every request, not only grievances (SLICE_10 §1). Nothing moves
   the clock: `received_on` has no UPDATE grant — a mistyped date is voided
   and recorded again.
5. **The lifecycle**: `open` → `responded` (with its outcome) · `withdrawn` (by
   the person) · `void` (entered in error) — the last two with their reason.
   Every closed state reopens to `open` only; **reopening withdraws the
   response** (the audit log keeps it) but keeps the identity check. A
   complaint about a response is a new grievance. **Nothing is deleted.**
6. **Fulfilling a request needs the person identified first** (Rule 14(1)(b),
   (2), (5)) — a CHECK, so tooling obeys it too: a request cannot be
   `fulfilled` or `partly_fulfilled` without a recorded identity check
   (date + how). A grievance, or a request declined, does not need one. A
   recorded check may be corrected, never removed (TS409).
7. **One outcome vocabulary in the family's words**: fulfilled · partly
   fulfilled · declined for a request; resolved · partly resolved · not upheld
   for a grievance. Anything short of fulfilled says why (a CHECK).
8. **Nomination** (s.14, Rule 14(4)): the nominee's name (required), contact
   and relationship sit on the nomination request; "one or more individuals"
   = one nomination request each. Who made a request is recorded:
   the Data Principal, a nominee, or a parent or lawful guardian (s.2(j)).
9. **Personal data stays in the register.** The audit trigger logs the code,
   kind, status, outcome and dates — never the person's name, email, phone or
   identifier, what they asked, the response, the nominee or a closing reason.
   The actions view, the tracker, the owner's pack and the evidence index name
   a request by its kind and code ("Grievance GRV-2026-001"), never by its
   person. The exposure model reads kind, status and the receipt date only.
   Retention of this data is Slice 13's purge job (SLICE_10 pitfall 5).
10. **Remediation: a fourth parent on `gap_actions`** (`rights_request_id`,
    composite FK, one-parent CHECK widened to four), created through ONE door,
    `add_rights_action` (`rights.write` AND `gap.write`); every other rule is
    the existing one (D-056). A void request's actions are superseded; a
    withdrawn one's are still owed. A request carries no severity of its own:
    its actions are **Medium (P2)** on the gap ladder, a grievance's **High
    (P1)** — what the person complained of is the organisation's own failing.
11. **Model 1.2.0 as data**: two rows on head 7 — `rights_ceiling_overdue`
    (open past ninety days → **Exposed**, "s.11–14, Rule 14(3)") and
    `rights_target_overdue` (open past thirty days, inside ninety → a new
    effect, **`reason`**: said, and nothing more). Only an OPEN request counts;
    a request is overdue or past the target, never both. The target's reason
    is listed whenever the head is assessed — a Mitigated head stays Mitigated,
    with the reason — and never moves a status or a position. A late response
    is not a model fact (the approved row reads "open"); the register and the
    overview count it ("Responded after the 90 days"). An overdue request is
    direct evidence: it sets head 7 Exposed even with no assessment. Both
    mirror tests cover it (400 generated inputs, now with requests on days 30,
    31, 90 and 91).
12. **The exposure view needs `rights.read` too** (every role holds it) — a
    narrower future role gets a 403, never a calm view missing the register.
13. **The overview gains a `rights` section**: counts (core `countRights`:
    open requests and grievances apart, past the target, overdue — grievances
    apart, responded, responded late, closed otherwise) and the open requests
    past the target or the ninety days, oldest first.
14. **A Stage 1 bug, fixed here**: attaching evidence to a breach's action
    stored the link and then answered 404 "Action not found" (the route only
    looked for an assessment or a ROPA parent). It now answers 201 for a
    breach's or a request's action, with the action's parent. Neither the
    Stage 1 tests nor the manual test attached evidence to a breach action;
    the Stage 2 API spec now does, for a request's.
15. **UI**: the "Add an action" form is one shared component
    (`app/dashboard/add-action.tsx`) for the breach and rights pages; the
    Actions page's source filter says "Every source" (it said "Both" since
    Slice 7); "Rights & grievances" in the nav; the exposure page links each
    register's facts to that register.
16. **Not in Stage 2**: every public surface — the forms, `public_slug`, the
    emailed one-time codes, the published Rule 9 contact and grievance officer
    (Stage 3); a `rights_request` evidence link type (Stage 6, with the other
    new link types); emailed acknowledgements and escalations on a timer
    (Slice 13); any AI-drafted response (Slice 11).
17. **Seed**: Mumbai University gets two requests, both answered inside the
    ninety days — DPR-2026-001 (a student's access request, identified,
    fulfilled on day 18) and GRV-2026-001 (a parent's grievance about a
    correction that never reached the examination system, resolved on day 22)
    with one open remedial action. Neither moves the model on any day.
18. **Old app (Slice 13's inventory)**: this stage replaces
    `src/app/api/dsr/{requests, requests/[id], stats}`,
    `src/app/api/grievance/{complaints, complaints/[id]}`, `src/lib/dsr/sla.ts`
    (ported to core `rights.ts`, with the 30-day SLA now labelled a target),
    `db/dsr_requests.sql` (requests and nominations) and
    `db/fix_grievance_reference_unique.sql`. Not yet: `dsr/submit`,
    `dsr/otp/*`, `src/lib/dsr/otp.ts`, `grievance/submit`, `grievance/officer`
    (Stage 3); `dsr/draft` and `src/lib/dsr/draft.ts` (AI, Slice 11).

---

### D-084 · 2026-10-13 · Stage 3 split into 3a and 3b; Slice 10 deploys after Stage 6, as planned
**Aniket's two decisions, 2026-10-13**, taken before Stage 2's approval
while the docs were checked for Stage 3:

1. **Stage 3 is split** into **3a** — public intake: `organizations.public_slug`,
   the published Rule 9 contact, rate limiting in the database, emailed
   one-time codes, the public rights and grievance forms; **no model change** —
   and **3b** — the versioned notice page, the consent widget, children's
   consent → H3, **model 1.3.0**. Each is its own session and gate; Slice 10
   becomes seven stages (1, 2, 3a, 3b, 4, 5, 6). Why: Stage 3 as written was
   about twice Stage 2, and its two halves are separable — the forms need the
   slug, the limits and the codes; the notice and the widget build on them.
   The version plan is unchanged: 1.3.0 is 3b's (3a changes no rule).
2. **Deploy as planned**: the live site stays on Slice 9 until PR #28 merges
   after Stage 6. Rejected: merging Stages 1–2 now — clients would see the
   registers before the slice is tested together. Each stage's additive
   migration still reaches the hosted database at its approval (D-079.6).

**SLICE_10 §7a — the 3a and 3b build brief, verified against the code
2026-10-13** (`9ebf57d`): what exists (`auth: "public"` routes, public pages
outside `/dashboard`, Resend in production, `rights_requests` with
`web_form`), what does not (no slug, no contact, no rate limiting, no public
writer), the old-app files each half ports, and the recommended calls —
anon-key RPCs only; limits in the database keyed by a hashed client address;
a code confirms the email address, not Rule 14 identity (decision 3 made
exact: the Stage 2 identity check still gates fulfilment); unconfirmed
submissions held apart and never in the register; `received_on` = the day
SUBMITTED; the same 404 for an unknown slug and a tenant without one; model
1.3.0's row made exact as `child_consent_unverified` (H3, "s.9(1), Rules
10–11", exposed). Each is Claude's call in its stage's D-number, approved at
its gate.

**Addendum, 2026-10-13 — Aniket confirmed two of §7a's calls** ("Agree with
your both recommendations"), so Stage 3a builds them as settled, not as
Claude's calls:
- **A request submitted online counts from the day it was SUBMITTED** (in
  India), not the day the person confirms their email code: receipt starts
  the ninety days (s.13(2), Rule 14(3)).
- **An unknown slug and an organisation without public pages answer the same
  "not found"**, so nobody can probe which organisations use TrustStack.

---

### D-085 · 2026-10-13 · Slice 10 Stage 2 approved as built
**Aniket approved Stage 2 on 2026-10-13 ("Stage 2 approved"), with no
changes**, after his manual test on the local stack (its one finding fixed in
`0cb43b3`). D-083's eighteen calls stand: one register for requests and
grievances with two code families, the two `rights.*` permissions, the Act's
own list of rights, the clock in days from receipt (day 90 in time, the
30-day target labelled as TrustStack's), the lifecycle with no DELETE,
fulfilment gated on a recorded identity check, the outcome vocabularies,
nomination, personal data kept inside the register, the fourth parent on
`gap_actions` behind `add_rights_action`, model 1.2.0 as data (with the new
`reason` effect), the exposure view needing `rights.read`, the overview's
`rights` section, the Stage 1 evidence-link fix, the shared "Add an action"
form, the deferred public surfaces, MU's two seeded requests and the old-app
inventory. Migration `20261012000000_rights_register` went to hosted the same
day (additive; 20 migrations; `prisma migrate status` up to date;
`db:types --check` clean against hosted). The live site stays on Slice 9
until PR #28 merges after Stage 6 (D-084). Stage 3a is next.

---

### D-086 · 2026-10-13 · Slice 10 Stage 3a — public intake: the calls the brief did not make (and one it made differently)
**Claude's calls while building SLICE_10 Stage 3a** (§7a). Each is reversible
before migration `20261013000000_public_intake` reaches hosted, and each is in
the walk-through (`docs/testing/SLICE_10_stage3a_walkthrough.md`) for Aniket's
approval at the gate. D-084's two settled calls are built as settled: receipt
is the day SUBMITTED, and every kind of missing public page is the same 404.

1. **The intake functions are the SERVER's, not anon's — a change to §7a.3.**
   The brief said a public route calls its function "with the anon key". The
   anon key is public by design, so a function `anon` may execute can be
   called straight from PostgREST, past the route, with a code the caller
   chose and a client key the caller made up: no email proof, no address
   limit. So `intake_profile`, `intake_begin`, `intake_resend` and
   `intake_confirm` are SECURITY DEFINER and executable by `service_role`
   ONLY; `anon` holds nothing in this migration. The web server calls them
   through the one admin client (`lib/intake/rpc.ts`, listed in `admin.ts`)
   and calls nothing else with it; the route gate fails if a `public/` route
   reads a table or imports anything but `lib/intake/rpc`. The concern behind
   "never the service-role key" — row security bypassed — does not arise:
   each function does one thing inside the database. CI asserts no client
   role may execute an intake function and the server holds exactly four.
2. **The public address** (`organizations.public_slug`): 3–63 lower-case
   letters, digits and inner hyphens, unique across TrustStack, NULL =
   closed. Set by `organization.update` only — the guard trigger refuses a
   DPDP Programme Owner, as for the SDF notification. A slug needs the
   Rule 9 contact (CHECK); closing keeps the contact. Audited by the existing
   organisation trigger: column names, never the contact.
3. **The Rule 9 contact**: name and email together (required to open),
   phone optional, `public_contact_is_dpo` ("if applicable"). Named on every
   public page and in both emails (`contactLine`).
4. **The same 404, byte for byte**: unknown, malformed, closed or deleted
   tenant — and a submission id of another tenant — answer
   `{ NOT_FOUND, "This page is not available.", [{outcome: not_found}] }`.
   The API e2e compares the bodies; pages use Next's own not-found page.
5. **The limits** (`app.intake_limits()` = core `INTAKE_LIMITS`, CI-asserted):
   5 submissions an hour per client address per tenant per form; 3 codes an
   hour and 10 a day per email address — across forms and TENANTS, so nobody
   can flood an inbox; 5 wrong codes per submission; a code lives 10 minutes,
   a submission 24 hours. A refused submission is not counted. Counted under
   advisory locks so parallel requests cannot share one count.
6. **The client key**: `HMAC-SHA256(ACTIVE_ORG_COOKIE_SECRET, "intake-client:" + address)`
   — the existing server secret with a purpose prefix, so no new variable
   has to be provisioned, and the attempts table cannot be reversed by
   hashing the IPv4 space. The address is the first `X-Forwarded-For` entry
   (Vercel sets it), then `x-real-ip`; with neither (local), one shared
   bucket. The email is kept in the attempts table only as sha256 of its
   normalised form.
7. **Codes**: six digits from `crypto.randomInt`, generated by the server;
   only `sha256(submission id : code)` is stored (the old `dsr_otp`'s salt);
   never in a response or a log. Wrong entries count per SUBMISSION — a new
   code does not forgive them; a new code retires the old one; single use.
   A wrong code is ANSWERED, not raised, so its count survives the call.
8. **Held apart**: an unconfirmed submission lives in `intake_submissions`,
   never the register; no role holds any grant on it or on `intake_attempts`
   (not even the service role's table access — only the functions touch
   them). Both carry RLS with a deny policy. Purging expired rows is Slice
   13's job (open loop).
9. **On confirmation**: one `rights_requests` row, `channel = web_form`,
   `received_on` = the day submitted in India, `created_by` NULL, the code
   and respond-by derived by Stage 2's trigger unchanged. Audited ONCE by the
   function as `intake.rights_requests.insert` (user NULL) with the code,
   kind, status, channel and dates — never personal data or free text. The
   register shows it with a "Web form" chip and "Recorded by: The public
   form, email address confirmed". **The code is not the Rule 14 identity
   check** — D-083.6 still blocks fulfilment until staff record one.
10. **A grievance naming an earlier request** is linked only when that
    request is this tenant's, is not a grievance, and was made from the same
    email address; otherwise "Earlier request named on the form (not
    matched): …" is prefixed to the grievance for staff. The answer is
    identical either way: the form cannot test whether a reference exists.
11. **Answers**: submit 202 (masked email, never the address); confirm 201
    (reference, received, respond-by); refusals carry their outcome in
    `details` — 404 · 429 with `Retry-After: 3600` · 422 wrong code (tries
    left) · 410 code expired / locked / submission expired · 409 already
    confirmed. Two new envelope codes: `RATE_LIMITED`, `GONE`.
12. **An email that fails never loses a submission**: the answer says
    `emailed: false` and the person asks for a new code. Reserved test
    addresses are suppressed as before, so e2e sends nothing; e2e sets a
    known code hash in the database as a stand-in for the inbox
    (`giveSubmissionKnownCode`, like `giveInviteKnownToken`).
13. **The pages**: `/p/{slug}`, `/p/{slug}/rights`, `/p/{slug}/grievance` —
    outside `/dashboard`, so no sign-in; not indexed. They ask only what the
    register records (the six rights with their sections; who the person is;
    an identifier; nominee for a nomination; an earlier reference on a
    grievance).
14. **Seed**: Mumbai University gets its Rule 9 contact and NO public
    address — the seed reaches hosted, where a submission would be a
    permanent record on a demo tenant (CI asserts no seeded slug). The
    manual test opens the local demo clinic's pages.
15. **Not in 3a**: the notice page and consent widget (3b); SMS/WhatsApp;
    a captcha; the purge; emails on a timer.
16. **Old app (Slice 13's inventory)**: replaces `src/app/public/{[slug],
    dsr/[slug], grievance/[slug]}`, `src/app/api/dsr/{submit, otp/verify,
    otp/resend}`, `src/lib/dsr/otp.ts`, `src/app/api/grievance/{submit,
    officer}` (the officer is the Rule 9 contact).

---

### D-087 · 2026-10-13 · Slice 10 Stage 3a approved as built
**Aniket approved Stage 3a on 2026-10-13 ("Stage 3a approved"), with no
changes**, after his manual test on the local stack (all twelve steps, no
findings). D-086's sixteen calls stand — including **D-086.1, the one change
to the brief**: the four intake functions are SECURITY DEFINER and executable
by `service_role` only, called through the one admin client in
`lib/intake/rpc.ts`; `anon` holds nothing. Also standing: the public address
and its guard, the Rule 9 contact, the identical 404, the limits in the
database (`app.intake_limits()` = core `INTAKE_LIMITS`), the HMAC client key
on the existing server secret, server-generated codes, receipt on the day
submitted, the signed-out unindexed pages, MU seeded with a contact and no
public address, and the old-app inventory. Migration
`20261013000000_public_intake` went to hosted the same day (additive; 21
migrations; `prisma migrate status` up to date; `db:types --check` clean
against hosted); no new Vercel variable was needed. Open loop 2 (check the
client address on the Vercel preview) is now testable. The live site stays
on Slice 9 until PR #28 merges after Stage 6 (D-084). Stage 3b is next.

---

### D-088 · 2026-10-13 · Slice 10 Stage 3b — the privacy notice, the consent widget, the consent register and model 1.3.0: the calls the brief did not make
**Claude's calls while building SLICE_10 Stage 3b** (§7a "Stage 3b"). Each is
reversible before migration `20261014000000_notice_consent` reaches hosted, and
each is in the walk-through (`docs/testing/SLICE_10_stage3b_walkthrough.md`)
for Aniket's approval at the gate. Built on D-086.1 as approved (D-087): every
public surface is a `service_role`-only function.

1. **Three permissions, and publishing is separate.** `consent.read` (all ten
   roles), `consent.write` (the eight register writers, as `rights.write`) and
   **`consent.publish`** — Super Admin, Consultant, Organisation Admin, DPDP
   Programme Owner and **Legal User** only. A notice is the organisation's
   public word to every Data Principal: a Department Owner may draft one, not
   publish it.
2. **The notice, per Rule 3.** One version per organisation and LANGUAGE,
   numbered by the database; one draft at a time per language; a draft may be
   discarded. Each purpose carries its title, **what it provides or enables**
   (Rule 3(b)(ii)) and **the personal data it needs, itemised** (3(b)(i)); the
   notice's itemised data is their union. A notice is **published only when
   complete** (a CHECK, so tooling obeys too) and then **never changes and is
   never deleted** — a correction is a new version, started from the old one.
   Rule 3(c) is built in, not left to the writer: every published notice shows
   TrustStack's fixed withdrawal sentence (s.6(4)), links to 3a's request and
   grievance forms, and the Board sentence (s.13(3): use the grievance
   redressal first); the organisation may add its own "other means" to each.
3. **A widget version cites ONE notice** of its own organisation, offers only
   purposes that notice states, always offers English, offers the notice's
   language, and is published only on a published notice. The newest published
   version is the live one; a published version never changes (consents cite it).
   Purpose text in the widget is the cited notice's own words.
4. **Nothing is pre-ticked and there is no "required" purpose** — a change from
   the old widget, which ticked "required" purposes and disabled them. s.6(1)
   asks for a clear affirmative action; processing that needs no consent is a
   legitimate use (s.7), not a box the person cannot untick.
5. **Three actions: given, refused, withdrawn.** A person's position is their
   LATEST record; a partial withdrawal is a new `given` with fewer purposes.
   Records are append-only for everyone, tooling included (a trigger); only an
   organisation's deletion removes them.
6. **The principal key** = HMAC-SHA256 of the identifier (trimmed,
   lower-cased) under a random per-organisation salt in `consent_salts`, which
   no role can read — not users, not the service role's table access; only
   `app.consent_principal_key()` inside the functions. The identifier is never
   stored. Staff find a person's history by the identifier, sent by POST so it
   never travels in a URL. The register shows the key's first twelve characters.
7. **Verification bases** (none = not verified): for a child **Rule 10(1)(a)**
   details held, **10(1)(b)(i)** details given by the individual, **10(1)(b)(ii)**
   a virtual token (DigiLocker), and **Rule 12 exempt** (a Fourth Schedule class
   or purpose, within its conditions) — the exemption counts as "recorded" for
   the model, **for counsel to confirm**; for a person with disability, **Rule
   11's** three appointing bodies: a court, a designated authority, a local level
   committee (the brief named Rule 10 only; Rule 11 is the guardian's rule). A
   basis must fit its kind (a CHECK). **The widget can never set one**: the
   organisation records it, as a new record restating the choice.
8. **Whose consent comes from the website**: `data-principal-kind="child"` (or
   `"guardian_ward"`) on the snippet; the site knows its user is a child. Such a
   record is unverified until staff record the basis — so head 3 says so.
9. **Model 1.3.0, the row as briefed and ONE addition for approval.** The row:
   `child_consent_unverified`, H3, "s.9(1), Rules 10–11", **Exposed**, counting
   principals whose latest record is a child's or a ward's consent, still given,
   with no basis recorded. The addition: a consent **still given for a child
   means children's data IS processed** (and one given by a guardian, a ward's) —
   so it makes head 3 apply and feeds the children's-data position factor, as
   the processing register's children answer already does. Without it, a tenant
   whose scope says "no children" could hold an unverified child's consent and
   see head 3 "Not applicable". Core `childrenAndGuardianFacts`, mirrored in SQL.
10. **The model reads only consents on someone's behalf**: each principal's
    latest record where it is a child's or a ward's. An adult's consent bears on
    no rule, and a busy website records thousands — they never reach the model
    or a snapshot. Counts are computed in SQL (`consent_register_facts`, one JSON
    value), so no PostgREST row limit can truncate them.
11. **The public surfaces.** Three functions, `service_role` only, through the
    one door `lib/intake/rpc.ts`: `consent_notice` (the page), `consent_widget`
    and `consent_record_public`. One public API route, `/api/v1/public/{slug}/consent`
    (GET the live version, POST a choice), answering **any origin**
    (`Access-Control-Allow-Origin: *`; no credentials, nothing private); the
    widget sends only simple requests (a GET and a **text/plain** POST), so no
    preflight and no OPTIONS handler. No JSON API for the notice — its page
    reads server-side. `/widget/` is excluded from the session middleware.
12. **The widget's limits**: **120 records an hour per client address per
    organisation** (a campus or an office shares one address) and **10 an hour
    per person**, counted in `intake_attempts` — widened in place (a `consent`
    surface and event, no email hash); every existing row satisfies the new
    CHECKs. Over a limit → 429, and the widget keeps nothing locally.
13. **Audit.** Notices and widget versions by the existing trigger, as
    `consent.*` — their number, language and status, never their text.
    A staff record once, by `record_consent`, as the person — action, purpose
    count, kind, basis; never the identifier or the reference. **A widget
    record writes no audit row**: the record itself is the log, and the widget
    is not a person in the organisation (its attempt is still counted).
14. **Languages.** English and the Eighth Schedule's twenty-two may be
    offered. The widget's own words are English plus the **old widget's Hindi
    and Marathi phrases** — title, the four buttons, the withdrawal line and its
    confirmation — and **nothing new was translated**: the description, the
    notice link and the purposes stay English in every language (decision 6:
    never machine-translated). Every other language is marked "translation
    pending" and falls back to English. The Hindi and Marathi phrases carry over
    unreviewed — a translator reviews them before production (open loop).
15. **The widget's behaviour**: the choice is kept in the visitor's browser per
    address; a NEW widget version asks again (its purposes may have changed);
    afterwards a "Privacy choices" button reopens it, pre-filled, with "Withdraw
    consent"; the site may call `window.TrustStackConsent.open()`; a choice that
    fails to record is not kept.
16. **Seed**: Mumbai University's notice v1 (English, three purposes), widget
    v1 (two purposes) and three staff-recorded adult consents (one given; one
    given then withdrawn). **No child's consent** — that would change MU's head
    3 — and no public address (the seed reaches hosted).
17. **Not in 3b**: an overview section for consent (its counts are on the
    consent page and its fact on the exposure view; Stage 6 may add one with the
    reports); an action parent (an unverified consent is remedied by recording
    the basis, not by a task); the `consent` evidence link type (Stage 6, with
    the others); a consent-manager integration (s.6(7)–(9), §3); purging the
    widget's attempt rows (Slice 13); AI drafting or translation (Slice 11).
18. **Old app (Slice 13's inventory)**: replaces `src/app/api/privacy-notice/{route,
    save, publish, [slug]}`, `src/app/api/consent/{config, versions, record,
    withdraw, manage, audit, stats}`, `public/consent-widget.js` and
    `db/{privacy_notices, consent_config_versions}.sql`; NOT ported:
    `src/app/api/privacy-notice/{generate, translate}` (AI — Slice 11).

---

### D-089 · 2026-10-13 · Stage 4 split into 4a and 4b; accuracy controls for vendor answers are required
**Aniket's decisions, 2026-10-13**, after asking how answers about a vendor
can be trusted whoever enters them:

1. **Stage 4 is split, as Stage 3 was (D-084):** **4a** — processors on
   `vendors`, the contract as evidence, the questionnaire **entered by staff**,
   its accuracy controls and **model 1.4.0**; **4b** — the **vendor-facing
   questionnaire link** (an emailed, expiring token; the respondent's email
   confirmed by a one-time code; a signed declaration; server-only, as 3a) —
   **no model change**. Slice 10 now runs in eight stages: 1, 2, 3a, 3b, 4a,
   4b, 5, 6.
2. **The accuracy controls are required** (SLICE_10 §7b, 4a.4), for answers
   entered by staff and by a vendor alike: **complete** (an incomplete
   submission is refused by the database); **evidence-backed** (an answer the
   bank marks as needing a document scores as the risky answer, "claimed, no
   evidence", until one is attached — the Compass's evidence cap, applied);
   **consistency checks** against the vendor register, flagged for the
   reviewer; **reviewed by a second person** — nothing counts until someone
   other than the person who entered it accepts it (D-043's rule); **attributed**
   (who entered, the stated source, who reviewed — stamped); **frozen once
   accepted** (a correction is a new version); **current** (a review-by date,
   twelve months by default and labelled a TrustStack default; out of date is
   a reason, never a status).

Why: no software proves a vendor is truthful; what it can do is make every
answer complete, tied to evidence, checked, reviewed by someone else and
traceable — and these controls are the same whoever types the answers, so
the vendor link (4b) adds a source, not a second set of rules.
Recorded in SLICE_10 (header, §6, §7, §7b) and STATE's tracker. The 1.4.0
row's effect (`not_mitigated` recommended, or `exposed`) is still for the 4a
gate.

**Addendum, 2026-10-13 — the 1.4.0 row's effect, settled by Aniket:**
`vendor_contract_missing` is **`not_mitigated`** on H1 and H7 — it bars
Mitigated, it does not set Exposed (Claude's recommendation, accepted ahead of
the 4a gate). Why: Exposed is kept for definite failures (red flags, critical
gaps, < 40%, an overdue Board report, a request past ninety days, an
unverified child's consent); a contract gap is a weakness in paperwork, and
"unknown" counts as a gap, so Exposed would mark most new tenants Exposed on
day one for unrecorded data; the same fact already reaches the model through
the register rule `processor_contract_missing`, graded high (bars Mitigated,
not Exposed), and the two must agree; s.33(2) weighs gravity and harm. A
narrower rule — a processor with NO contract handling sensitive or children's
data → Exposed — is for counsel, and would be a later model version.


---

### D-090 · 2026-10-13 · Slice 10 Stage 3b approved as built
**Aniket approved Stage 3b on 2026-10-13 ("Stage 3b approved"), with no
changes**, after his manual test on the local stack (all fifteen steps; one
3a carry-over, fixed in `36de5e7`). D-088's eighteen calls stand — including
**the 1.3.0 row and its one addition (D-088.9)**: a consent still given for a
child, or by a guardian, makes head 3 apply and feeds the children's-data
position factor; the Rule 11 and Rule 12 bases beside Rule 10's (D-088.7, the
Rule 12 exemption counting as "recorded" still for counsel to confirm); no
"required" purpose and nothing pre-ticked (D-088.4); `consent.publish` held by
five roles only (D-088.1); the per-organisation HMAC principal key that no
role reads (D-088.6); the three `service_role`-only public functions behind
the one door and the any-origin public route (D-088.11); the widget's limits
(D-088.12); no audit row for a widget record (D-088.13); and the Hindi and
Marathi phrases carried over unreviewed, a translator to review them before
production (D-088.14, open loop). Migration `20261014000000_notice_consent`
went to hosted the same day (additive; 22 migrations; `prisma migrate status`
up to date; `db:types --check` clean against hosted); hosted was NOT
re-seeded (MU's notice, widget and consents are local only — re-seeding hosted
is Aniket's call after PR #28 merges); no new Vercel variable was needed. The
live site stays on Slice 9 until PR #28 merges after Stage 6 (D-084). Stage 4a
is next.

---

### D-091 · 2026-10-14 · Slice 10 Stage 4a — the processor register, the staff-entered questionnaire, its accuracy controls and model 1.4.0: the calls the brief did not make
**Claude's calls while building SLICE_10 Stage 4a** (§7b "Stage 4a"). Each is
reversible before migration `20261015000000_processor_register` reaches hosted,
and each is in the walk-through (`docs/testing/SLICE_10_stage4a_walkthrough.md`)
for Aniket's approval at the gate. Built on D-089 as decided: the seven accuracy
controls are required, and `vendor_contract_missing` is `not_mitigated`.

1. **Two permissions.** `vendor.assess` — enter, save, submit and discard an
   assessment, and attach a vendor's documents — for the eight register writers
   (as `rights.write`, `consent.write`); `vendor.review` — accept or return one —
   for Super Admin, Consultant, Organisation Admin, DPDP Programme Owner, **Legal
   User and Procurement User** (§7b 4a.6: the programme leads, Procurement and
   Legal). **Reading needs only membership** (`organization.read`), as the vendor
   register itself does — no `vendor.read`.
2. **Processors are `vendors`** (decision 2): two additive columns,
   `contract_signed_on` and `contract_review_by` (review after signing — a
   CHECK), edited through the existing vendor PATCH, so **the contract facts stay
   `scope.write`'s** (the programme leads). Legal and Procurement can assess and
   review but cannot change the contract tri-states — **for Aniket: widen if
   they should**. The contract's own review date, once passed, is shown on the
   vendor; it is not a model input. Vendors are still added in the scope wizard.
3. **The contract is evidence** (`evidence_links` type **`vendor`**, the CHECK
   widened in place): attached with `vendor.assess` through the existing link
   route (`{ vendorId }`), re-deriving nothing. A document an answer cites stays
   attached (the link's delete trigger); a deleted vendor takes its links (an
   after-delete trigger, as ROPA records do). No unlink route in 4a. The evidence
   index learns the type in Stage 6.
4. **The questionnaire is the old bank, as data** — 45 questions, sections A–G,
   44 scored, the old weights, options and tiers (≤25 low · ≤50 medium · ≤75 high
   · >75 critical). Wording kept except: **G1** now asks whether a signed contract
   with DPDP clauses **is in place** (the old "will the vendor sign" could be
   answered yes with nothing signed); **F3** names Rule 7's intimations (the old
   "72-hour breach-reporting obligation" was the GDPR's shape); **E4** drops
   "SCC-equivalent"; F2's hint cites Rule 7(2)(b). The wording lives in core; the
   database holds what it checks and scores (`app.vendor_questions()`).
5. **The score in whole numbers**: each option's risk in tenths, the percentage
   rounded half up by integer arithmetic, so core and SQL agree to the digit
   (held by an RLS mirror over 120 generated answer sets). "Not applicable" leaves
   the denominator; nothing answered = no score; an assessment cannot be
   submitted "not applicable" throughout. TrustStack's indicator, never statute,
   never a status — it does not feed the model.
6. **Evidence-backed (4a.4.2), made exact**: five answers need a document — **A3**
   ISO/IEC 27001, **A4** SOC 2 Type II, **C4** penetration test, **D2** the
   sub-processor list, **G1** the signed contract. A "yes" or "partial" on one
   scores as the risky answer, and is listed as "claimed, no evidence", until an
   answer **cites** one of the vendor's documents — one per answer, which must be
   attached to that vendor. A cited document counts **unless its evidence review
   says rejected or outdated**; a pending one counts — the second person reviewing
   the assessment is the check on it.
7. **Complete (4a.4.1)**: every scored question answered, or "not applicable" with
   a reason (A1, the vendor's legal name, is optional), **and the source stated**
   ("the vendor's email of 3 Oct 2026", ≤ 300 characters) — `submit_vendor_assessment`
   refuses anything less, naming the questions.
8. **Consistency checks (4a.4.3)**: seven rules, data in core
   (`VENDOR_CONSISTENCY_RULES`), computed when the assessment is read, against the
   register **as it stands** — never stored, never resolved: stored-in-India vs
   the register's cross-border; outside-India answers vs "does not leave India";
   E1 vs E2; "no sub-processors" vs "sub-processors not known"; G1 yes vs no
   contract or clauses recorded; G1 no vs both recorded; and a vendor recorded as
   an independent fiduciary.
9. **A second person (4a.4.4), made stricter**: nobody who **created, answered or
   submitted** it may accept or return it (the brief said "entered"). Returning
   needs a reason; a returned assessment is edited and submitted again (it keeps
   the last reason). Starting a new version carries the latest accepted answers
   forward **stamped as the starter's** — they own what they submit, so they
   cannot then review it.
10. **Statuses**: draft → submitted → accepted, or → returned → submitted. One open
    (not accepted) assessment per vendor (a partial unique index). A draft or a
    returned one may be discarded; a submitted or accepted one never.
11. **Attributed (4a.4.5)**: created, answered, submitted and reviewed — by whom and
    when — are stamped by the functions. **Every write is one of five SECURITY
    DEFINER functions** that check the caller's permission themselves; the two
    tables are SELECT-only for members. Each step is audited once, as the person,
    with counts and the score — never the source note, a reason or an answer.
12. **Frozen once accepted (4a.4.6)**: guard triggers refuse any change to an
    accepted assessment or its answers, **for tooling too**; only an organisation's
    own deletion removes one (the answers' key to evidence is checked at commit,
    because that deletion reaches the two by different cascades).
13. **Current (4a.4.7)**: review-by defaults to twelve months after acceptance,
    dated in India; the reviewer may choose any date after today and **within 36
    months**. "Assessment out of date" strictly after the date — on the vendor,
    in the register's counts, and as a model reason.
14. **The score is stored** when submitted and **derived again** when accepted (a
    document may have been rejected in between); a draft shows core's preview of
    the same rule, labelled so.
15. **Model 1.4.0**: §7b.5's row as settled — `vendor_contract_missing`,
    `not_mitigated`, as **two rows** (H1, "s.8(5), Rule 6(1)(f)"; H7, "s.8(2)"),
    counted over the whole vendor register; plus `vendor_assessment_out_of_date`
    as a `reason` on both heads, citing the TrustStack default. As 1.1.0's
    breach row, **a not-mitigated fact never makes a head "assessed" on its own**:
    a tenant with no assessment and no register gap keeps heads 1 and 7 "Not yet
    assessed" (the register shows the gap). **MU**: the LMS provider (clauses
    "no") and the proctoring vendor (clauses "not known") are the two; on heads 1
    and 7, once assessed, they bar Mitigated and say so. No e2e pinned MU's H1/H7
    status; the version pins moved to 1.4.0.
16. **No fifth action parent** (4a.7): a vendor's fix is the register's — record the
    contract, attach it, re-assess.
17. **Seed**: MU's payment gateway — v1 **accepted** (entered by the CISO, accepted
    by Legal on 15 Sep 2026, review by 15 Sep 2027; its DPA and ISO certificate as
    documents; C4 claimed with no document); the LMS provider — v1 **awaiting
    review** (entered by the Registrar; A3, C4, G1 claimed with no document; three
    flags for the reviewer). Tooling writes the answers; the score is the
    database's.
18. **Not in 4a**: the vendor link (4b); the reports (Stage 6); AI drafting of a DPA
    or AI review of a contract (Slice 11); reminders on a timer (Slice 13).
19. **Old app (Slice 13's inventory)**: replaces `src/lib/vendors/{risk,
    questionnaire, status}.ts` and `src/app/api/vendors/{route, [id], stats}`;
    4b replaces `api/vendors/{[id]/send-questionnaire, questionnaire/[token],
    questionnaire/submit}` and `src/app/public/vendor-questionnaire`; NOT ported:
    `src/lib/vendors/dpa.ts` and `api/vendors/[id]/dpa` (Claude-drafted DPA —
    Slice 11), `dpa_document_url`.

---

### D-092 · 2026-10-14 · Slice 10 Stage 4a approved as built; Stage 4b's one call settled
**Aniket approved Stage 4a on 2026-10-14 ("Stage 4a approved"), with no
changes**, after his manual test on the local stack (no findings). D-091's
nineteen calls stand, and the four in the walk-through's §8 are **confirmed as
built**: (1) the contract facts stay `scope.write`'s — Legal and Procurement
assess and review but do not mark "DPDP clauses: yes" (D-091.2); (2) a pending
document counts for the evidence rule, only a rejected or outdated one does not
(D-091.6); (3) nobody who created, **answered** or submitted an assessment may
review it (D-091.9); (4) the out-of-date reason sits on heads 1 and 7, and
review-by may be set up to 36 months (D-091.13, D-091.15). Model 1.4.0 stands.
Migration `20261015000000_processor_register` went to hosted the same day
(additive; 23 migrations; `db:types --check` clean against hosted); hosted was
NOT re-seeded; no new Vercel variable. The live site stays on Slice 9 until PR
#28 merges after Stage 6 (D-084).

**Stage 4b's call (SLICE_10 §7b 4b.5), settled by Aniket in the same message:
"the link's sender may not review the vendor's answers."** The staff member who
sends a vendor link has, by sending it, asked for those answers; they may not
accept or return the assessment — whether or not they answered any question
themselves. This is the recommended default, now a decision, not a call for the
4b gate.

---

### D-093 · 2026-10-14 · Slice 10 Stage 4b — the vendor-facing questionnaire link: the calls the brief did not make
**Claude's calls while building SLICE_10 Stage 4b** (§7b "Stage 4b"), on D-089
and D-092 as decided. Each is reversible before migration
`20261016000000_vendor_link` reaches hosted, and each is in the walk-through
(`docs/testing/SLICE_10_stage4b_walkthrough.md`) for Aniket's approval at the gate.
**No model change** — exposure stays 1.4.0.

1. **The sender rule, made exact (D-092).** Anyone who sent **any** link for an
   assessment version — open, revoked, expired or used — may not accept or
   return it, whether or not they answered anything; on top of 4a's rule
   (nobody who created, answered or submitted it). When a person is both, they
   are told the sender reason first ("You sent this assessment to the vendor —
   someone else must review their answers") — in the database, the route and
   the page alike.
2. **One link open per assessment; sending again revokes the last.** A link is
   **open** until revoked, used by a submission, past its 14 days, or locked by
   five wrong codes. While one is open **staff may not save or submit** the
   assessment (one writer at a time; "revoke it first"); they may still discard
   the draft, which takes its links with it. A used link never reopens: after a
   return, staff send a new one.
3. **`source` follows who is answering:** `vendor` while a link is open and once
   the respondent submits; revoking makes a draft `staff` again; a staff
   submission is `staff` and clears the declaration of an earlier, returned
   vendor submission (the audit log keeps that submission). A CHECK holds that a
   submitted or accepted assessment is `vendor` **exactly when** it carries a
   declaration, and then has no staff submitter.
4. **Three secrets, hashes only.** The token (32 random bytes, base64url, in the
   emailed URL `/v/{token}` and nowhere else — never returned to staff, so the
   sender cannot answer as the vendor); the six-digit code (salted with the
   token's hash); and the **respondent's browser session** — an HttpOnly,
   SameSite=Lax cookie set when the right code is entered, per link, until the
   link expires. A forwarded link is useless without the respondent's mailbox;
   a code entered in a second browser ends the first session. Members read who a
   link went to and its state through a **column grant that excludes every
   hash** (CI checks it).
5. **The code reuses the public intake's limits** (`app.intake_limits()`: ten
   minutes, 3 an hour and 10 a day per address, five wrong entries) on a new
   `intake_attempts` surface `vendor_link`; the fifth wrong code **locks the
   link** (staff send a new one). The code is single use.
6. **One "not found" for every dead link** — unknown, malformed, expired,
   revoked, used, locked, its assessment no longer a draft or returned, or its
   organisation deleted — at every step and on the page.
7. **Seven `service_role`-only functions** behind the one door
   (`lib/intake/rpc.ts`): view, send code, confirm, save, add document, attach
   document, submit (the brief's four, with the code and the two document steps
   made separate functions). Two staff functions, `send_vendor_link` and
   `revoke_vendor_link`, run as the user and check `vendor.assess`.
   `save_`, `submit_` and `review_vendor_assessment` are replaced in place, each
   with its check added and nothing removed.
8. **What the respondent sees:** the organisation's and vendor's names, the 45
   questions with the answers as they stand (including staff's or the last
   accepted version's), and only the documents uploaded through **their own
   link**; a document the organisation already holds and cites is shown as "on
   file", never named, and stays cited unless they change it. No return reason,
   no flag, no score, no reviewer.
9. **Their documents**: registered by the database (`uploaded_by` NULL, pending
   review, path built by the database and held by the evidence table's own
   CHECKs), uploaded by a URL the server signs with the service role, attached
   to the vendor once stored; at most **ten per link**. Their review follows the
   evidence rules (pending counts, D-091.6; the second person is the check).
10. **The declaration** — "These answers are accurate and complete." — is a
    ticked box with the respondent's name (pre-filled, editable) and role, each
    ≤ 200 characters, stamped `declared_at` by the database. The staff page says
    plainly it is the vendor's word, not evidence. The submission's stated
    source is written by the database: "Answered by the vendor through the
    questionnaire link sent on {date}".
11. **Attribution**: the respondent's answers `answered_by = NULL`, their
    submission `submitted_by = NULL`; the staff page names them "the vendor's
    respondent". Audit rows for their steps (`vendor_link.*`: confirmed, answers
    saved, upload URL issued, document attached, submitted) have `user_id NULL`,
    say "by the vendor's respondent" and carry counts and ids — never the
    respondent's name or email, never a token. Code sends are counted in
    `intake_attempts`, not audited (as 3a).
12. **The emails** name the organisation and the vendor (the respondent is not a
    Data Principal, so no Rule 9 contact), the expiry, the code step and the
    declaration; "do not forward". A failed send is reported to staff ("send it
    again"), never thrown.
13. **The page** `/v/{token}`: signed-out, `noindex, nofollow`, `referrer:
    no-referrer` (the token is in the address); the register shows "With the
    vendor" and counts it.
14. **Seed**: MU's AI proctoring vendor — v1 started and sent by **Legal**,
    answered by "Priya Menon (SAMPLE)" through a used link, one document of
    theirs (a SOC 2 summary, cited on A4), awaiting review (risk 34; A3 and D2
    claimed with no document). Legal may not review it; the DPDP Programme
    Owner, the Organisation Admin or the Consultant may. The link's token and
    session are random hashes no one holds.
15. **Not in 4b**: reminders on a timer (Slice 13); a vendor portal or account;
    AI review of answers or documents (Slice 11); removing a document the
    respondent uploaded by mistake (staff can reject it in review).
16. **Old app (Slice 13's inventory)**: 4b replaces
    `src/app/api/vendors/{[id]/send-questionnaire, questionnaire/[token],
    questionnaire/submit}` and `src/app/public/vendor-questionnaire`.

---

### D-094 · 2026-10-14 · Slice 10 Stage 4b approved as built; three Stage 5 calls settled
**Aniket approved Stage 4b on 2026-10-14 ("Stage 4b approved"), with no
changes.** D-093's sixteen calls stand, and the six in the walk-through's §8
are **confirmed as built**: (1) one writer — staff cannot save or submit while
a link is open (D-093.2); (2) the sender rule covers every link for that
version, revoked or expired too, answered or not (D-093.1); (3) five wrong codes
lock the link (D-093.5); (4) the respondent sees the answers as they stand but
only their own documents, a document on file unnamed (D-093.8); (5) a staff
finish of a returned vendor submission becomes the staff's and clears the
declaration (D-093.3); (6) ten documents per link, pending review like any
upload (D-093.9). Migration `20261016000000_vendor_link` goes to hosted the same
day (additive; 24 migrations); hosted is NOT re-seeded; no new Vercel variable.
The live site stays on Slice 9 until PR #28 merges after Stage 6 (D-084).

**Stage 5's calls (SLICE_10 §7c), settled by Aniket in the same message:**
1. **"No end recorded" is a reason** (§7c.4's gate question): on model 1.5.0, a
   retention schedule with no end date is a `reason` on H7 — no status, as the
   30-day rights target is. Past its end with no erasure stays **Exposed**.
2. **The AI risk register is written with `ropa.write`** (§7c.7) — no new
   `ai_risk.*` permission; read by members.
3. **No AI actions** (§7c.6): the AI risk register has no action parent on
   `gap_actions`; its fixes are the register's own.

---

### D-095 · 2026-10-14 · Slice 10 Stage 5 — the retention register, the AI risk register and model 1.5.0: the calls the brief did not make
Built on `slice/10-workflow-modules` (PR #28), migration
`20261017000000_retention_ai_risk`, with D-094's three decisions as given. Each
call below is reversible before the migration reaches hosted; the ones to look
at are in the walk-through's §8.

1. **A schedule is a clock for the data held now.** One per processing record
   (unique), with what ends the retention (`basis`), the period in whole
   months, the law when one requires keeping it, and the **day the clock
   started** (`starts_on`). The end date = start + period in calendar months,
   derived by the database (trigger + CHECK; no user grant), clamped to the
   month's end as core's `addMonths` is. **No start = no end recorded** — the
   D-094.1 reason. A start in the future is refused (it records something that
   happened). Moving the start to a later day starts a **new cycle**.
2. **Rule 8(3)'s year is a floor for EVERY basis**, not only for logs: the rule
   covers the personal data, the traffic data and the logs together. A CHECK
   refuses a period under twelve months; the API answers in words, citing the
   rule (the schema does not pre-empt it with a range error). A century is the
   sanity ceiling.
3. **Rule 8(1)–(2)**: `organizations.third_schedule_class` (`ecommerce` ·
   `online_gaming` · `social_media`; null by default), set by
   `organization.update` only — never inferred. Only then is the basis
   **"Three years without contact"** accepted: 36 months fixed, counted from the
   later of the recorded last approach and **13 Nov 2025** (the Third
   Schedule's "commencement of the Rules" — FOR COUNSEL; Rule 8 itself
   commences 13 May 2027); the database derives **inform-by = end − 2 days**
   (48 hours, kept as dates). An erasure under that basis must record the day
   the people were told; under any other basis that field is refused. The
   class cannot be cleared while a schedule runs on it (TS409, tooling too).
4. **Erasures are append-only.** One row each: the day, how (deleted ·
   anonymised · physically destroyed · other, described), whether the
   processors were told (yes · no · no processor held it — s.8(7)(b)), and who
   recorded it and when (stamped). No UPDATE or DELETE grant; the trigger
   refuses an update even to tooling. A wrong record is corrected by recording
   the right one; the audit log keeps both.
5. **Erased for the current cycle** = an erasure on or after the clock started
   (any erasure, when none has). The model and the register read the LATEST
   erasure against the start; one from before the cycle is history.
6. **Model 1.5.0 — three rows.** `retention_overdue` (H7, s.8(7), Rule 8(3),
   **Exposed**) — strictly after the end date, nothing erased this cycle;
   `retention_end_unrecorded` (H7, s.8(7), **reason**, D-094.1);
   `ai_system_unreviewed` (H4, "Rule 13(3); twelve months is a TrustStack
   default", **reason**) — in use, and no review recorded or the last one more
   than twelve months ago. Head 4 still applies only with a recorded SDF
   notification, so for every other client the AI row is silent. As every
   `reason` row (1.2.0's target included), it speaks only once its head is
   assessed — the engine's existing rule, unchanged.
7. **The fifth action parent** (`gap_actions.retention_schedule_id`,
   `add_retention_action`, retention.write + gap.write) and a **third closure
   basis, `erasure_recorded`**: a retention action may close when an erasure is
   recorded on its schedule for the current cycle **by someone other than the
   action's owner** — two people, as D-056 requires of every closure. Order:
   accepted evidence, then the erasure, then a reviewer who is not the owner.
   A CHECK holds the basis to retention actions. The evidence pack shows a
   "Closed on a recorded erasure" tile only once one exists. A retention
   action is **High (P1)** while its schedule's erasure is overdue, else
   Medium (P2).
8. **Permissions** (D-094.2): `retention.read` (ten roles) / `retention.write`
   (eight) as the rights register. The AI risk register is read with
   `organization.read` (every member, as the vendor register) and written with
   `ropa.write`. The exposure view now also needs `retention.read` (every role
   that reads the other registers holds it).
9. **The AI risk register's row**: name, purpose and the personal data it uses
   (required); an optional system from the scope (once each; any system type,
   AI systems listed first) and an optional AI use (the scope's list, never
   "none"); affects children (s.9(3), tri-state); the human-review step; status
   in use / retired (no delete); the last review — stamped with who recorded
   it, corrected but never removed. A system removed from the scope leaves its
   row standing, unlinked (`ON DELETE SET NULL (system_id)`). No actions
   (D-094.3).
10. **Evidence link types** `retention_schedule` (retention.write) and
    `ai_system` (ropa.write); neither locks a link against detaching (no
    approval stands on it). The evidence index reads them in Stage 6.
11. **No overview section** for either register (the brief names none): the
    retention register's actions reach the overview's action list, the
    actions page and the reports' remediation lines through `readRemediation`.
12. **Seed (MU, fictional)**: a schedule for each of the ten records — ROPA-009
    past its end with no erasure (one open action, owned by the IT/Security
    Lead), ROPA-003 with no end recorded, ROPA-008 erased on 10 Jul 2026; laws
    named in the seed are marked SAMPLE. **MU's head 7 moves to Exposed** (on the local
    stack it was Partially mitigated), with both retention reasons; any e2e
    pinning MU's head-7 status moves with it. The AI proctoring system is in the AI register, never reviewed —
    MU is not an SDF, so no effect. BML: both registers empty.
13. **Not in Stage 5**: an automated erasure job or reminders (Slice 13); AI
    drafting of schedules or reviews (Slice 11); the three reports (Stage 6).

---

### D-096 · 2026-10-16 · Slice 10 Stage 5 approved with changes R1–R6
**Aniket approved Stage 5 on 2026-10-16 ("Stage 5 approved with changes:
R1–R6").** D-095's thirteen calls stand except where R1–R6 change them, and
the six in the walk-through's §8 are **confirmed**: (1) Rule 8(3)'s year is a
floor for every basis (D-095.2); (2) the third way to close — an erasure
recorded by someone other than the owner (D-095.7), now an erasure that
**counts** (R2, R4); (3) the Third Schedule's three years count from
13 Nov 2025 at the earliest — **confirmed by R3**, for counsel (D-095.3);
(4) erasures are never changed (D-095.4) — **still true**: R4's "recorded in
error" is a separate append-only record, never an edit; (5) the AI register is
read by every member — **changed by R5**: read with `ropa.read`, which every
role holds today, so nobody loses sight of it (D-095.8); retired, never
deleted (D-095.9); (6) no overview section (D-095.11) — **changed by R6**.

All six recommendations were **applied inside
`20261017000000_retention_ai_risk`** (not yet on hosted, so the edit is not
drift); the model stays **1.5.0** (no row, effect or provision changed — only
which erasures the input counts).

1. **R1 — the start is "the last day this data was processed".** Rule 8(3)
   runs "from the date of such processing", so every basis but the Third
   Schedule's labels its start that way (core `RETENTION_START_LABEL`; the
   deemed basis keeps "the day the Data Principals last approached"). The note
   adds: *during the year Rule 8(3) requires, the data is held only for the
   purposes in the Seventh Schedule — not used for the original purpose.*
   Wording only.
2. **R2 — an erasure counts only when complete under s.8(7)(b)**: processors
   told = yes, or no processor held it. One with "no" shows **"Erasure
   incomplete — processors not told"** beside the schedule's state, which
   stays as it was (overdue, if past the end); it neither clears head 7 nor
   closes an action. The fix is a new erasure with the processors told. Same
   rule in core (`erasureStanding`, `lastCountingErasureOn`), the SQL mirror
   (`app.exposure_input` — `max(erased_on) FILTER (processors_told <> 'no' AND
   not voided)`), the closing trigger and the API pre-check. "Incomplete" is a
   flag on the schedule, not a fifth clock state, so core's counts and the
   model rows are unchanged.
3. **R3 — the Third Schedule's own words**: 13 Nov 2025 stays the earliest
   start (the earlier, conservative erasure date; counsel to confirm), and the
   deemed basis's help text (core `RETENTION_DEEMED_NOTE`) names the two
   purposes outside the three years — access to the user account, and a
   virtual token usable for money, goods or services. Wording only.
4. **R4 — "recorded in error"**: a new insert-only table
   `retention_erasure_voids` (one per erasure; a reason of up to 500
   characters; who and when stamped; composite FK; RLS read with
   `retention.read`, insert with `retention.write`; no UPDATE or DELETE grant
   and the trigger refuses an update even to tooling; audited by trigger
   without the reason). **By someone other than the person who recorded the
   erasure** — refused in the trigger (TS409) and the API. A voided erasure no
   longer counts anywhere (core, SQL, closing trigger) and is shown struck
   through with the reason. **An action already closed on it stays closed** —
   its closure is history in the audit log; the schedule shows overdue again,
   and a new action is added if work remains (Claude's call: reopening actions
   from a void would let one person undo another's closure). Route `POST
   …/retention-schedules/{scheduleId}/erasures/{erasureId}/void`, a sweep
   probe, the CI gate, RLS and e2e. The method note and the reason both warn:
   never type the erased personal data here.
5. **R5 — the AI register asks s.9(3)'s question.** `affects_children` became
   `child_tracking` ("Does it track, behaviourally monitor or target
   advertising at children?" — yes / no / not known) plus `child_exemption`,
   one of the processing register's eleven Fourth Schedule codes
   (`app.ropa_child_exemptions()`, A1–A5, B1–B6), allowed **only on yes** (a
   CHECK; answering anything else drops it). "Yes" with no exemption is a **red
   warning** and a count (`childTrackingUnexempt`); **no model row** — counsel
   first. Read with **`ropa.read`** (policy, routes, nav). Seed: MU's
   proctoring = yes, exemption **A3** (educational institution) — MU's register
   shows no warning.
6. **R6 — a Retention section on the overview**: erasures overdue, ending in
   30 days, no end recorded — `countRetention` in core over `readRetention`'s
   rows (D-069), plus the overdue schedules (oldest end first, flagged when the
   erasure is incomplete), linking to the register. Read with
   `retention.read` alone (the actions still need `gap.read` too); `omitted`
   gains `retention`. On MU: 1 overdue (ROPA-009), 1 with no end.

Gates after R1–R6 (local stack, rebuilt as CI does): core **1,201**, web unit
**514**, RLS **530**, every CI SQL gate (22) green, typecheck,
`check:secrets` and `db:types --check` clean, e2e **401/402** with one worker
(the one, tenancy UI's organisation switch, is the known full-run sign-in
flake and passes alone). Then Aniket's re-test (the manual test's Part D) and
CI green, then the migration to hosted (25 migrations). Stage 6 (SLICE_10
§7d) is next, in a new session.

*Addendum to D-096 (2026-10-16):* Aniket's Part D re-test passed on the local
stack; CI green on `de0cb73` (e2e 402/402); `20261017000000_retention_ai_risk`
applied to hosted the same day (25 migrations, `db:types --check` clean, not
re-seeded).

---

### D-097 · 2026-10-16 · Slice 10 Stage 6 — the three stakeholder reports and the evidence index's last link types
**Aniket opened Stage 6 on 2026-10-16 ("Start Slice 10 Stage 6 … I keep §7d's
four Stage 6 calls as recommended").** SLICE_10 §7d's four calls stand as
written: (1) three PDF report kinds that record an exposure snapshot —
`security_breach` (CISO), `legal_position` (counsel), `processor_exposure`
(procurement) — in one migration widening `app.report_kinds()` and the CHECK;
(2) the deferred link types `breach_incident` and `rights_request`
(breach.write, rights.write); (3) the evidence index reads every link type;
(4) full test pass, the Sync Step promoting SLICE_11, PR #28 ready for review.
Built on migration `20261018000000_slice10_reports` (additive; local only until
approval). **No model change — exposure stays 1.5.0** (D-079.6).

Claude's calls the brief did not make — each in the walk-through
(`docs/testing/SLICE_10_stage6_walkthrough.md` §5) for confirmation at the gate:

1. **Attach and detach follow each register's own rule.** A breach's documents
   attach any time except while it is dismissed as not a breach; detach only
   while it is open or contained (a closed breach stands on its intimations —
   Rule 7(2)(b)(vi); a dismissed one is a record). A request's attach any time
   except while void; detach only while open (the response sent is the record
   of the answer). Enforced in `app.evidence_link_before_insert/_delete` (TS409,
   "reopen it"), mirrored in the routes and the Documents panel; an
   organisation's own deletion still takes every link (as for a vendor).
   **No role holds evidence.write without breach.write and rights.write**, so
   the register permission adds no refusal for any role today — it is the
   database's second lock, as for every other link type.
2. **A register document's penalty heads are read from the model**: the heads
   whose *status* that register's rows can set (`MODULE_INPUTS`, effect ≠
   `reason`) — breach → H2; request, retention schedule → H7; vendor → H1, H7;
   AI system → none (its one row is a reason). Never re-typed.
3. **Names**: "Security and Breach Report" (`Security_and_Breach_Report`),
   "Legal Position Report", "Processor Exposure Report"; audiences "CISO and
   the incident response team", "Counsel and the Data Protection Officer",
   "Procurement and vendor owners".
4. **What each prints** — the stored snapshot's heads it answers for (2 and 1;
   3 and 7; 1 and 7) with every reason and factor; its registers through their
   own readers (D-069): `breachSection`, `rightsSection`, `retentionSection`
   (now exported from the overview's reader), the consent register's counts,
   the processor register's counts, and a new `readAiRegister` shared with the
   AI register's route. A unit test forbids the report code from importing any
   register counter. 30 days is labelled TrustStack's target and 90 the Rules'
   (pitfall 1). The AI register is an **enabling note**: counts, and — only when
   an AI system in use tracks children with no Fourth-Schedule exemption — a
   warning citing s.9(3)–(5), Rule 12 and the Fourth Schedule "for counsel to
   confirm"; never a status. An erasure "counts only when complete and not
   recorded in error" (D-096); the Third-Schedule class is named only when
   recorded.
5. **Nothing personal leaves a register**: a request by code and kind; a
   vendor link's respondent never read; a breach by its code and its
   staff-written title — so the breach form now says under the title
   "describe what happened, never name the people affected".
6. **The evidence pack's per-head counts now include register documents** (a
   breach's Board report counts on head 2) — an approved Slice 9 report's
   numbers can rise; its note says so.
7. **No seed change**; disposable tenants `…a024` (populated) and `…a025`
   (empty) for the e2e spec; MU and BML are untouched by tests.

Gates (local stack rebuilt as CI does): core **1,225**, web unit **519**, RLS
**541**, all 23 CI SQL gates (one new: every link type admitted, the two new
ones guarded by their registers), typecheck, `check:secrets`, `db:types
--check` clean; e2e — STATE has the full-run count.

---

### D-098 · 2026-10-16 · Exposure model 1.6.0 — a recorded breach assesses head 2 (Aniket's change at the Stage 6 gate)
**Aniket, 2026-10-16, during the Stage 6 manual test (Step 5):** "Add the
head-2 change to Stage 6 as a change: any recorded, non-dismissed breach counts
as assessed for head 2." His Security and Breach Report showed head 2 "Not yet
assessed" beside an open breach whose people were not yet told — under 1.1.0 a
`not_mitigated` breach fact could not lift a head out of "Not yet assessed";
only an overdue Board report (`exposed`) could.

1. **A fourth module effect, `assessed`**: when the fact holds, the head is
   assessed (no longer "Not yet assessed") and gives its reason; nothing else.
   `exposed` keeps implying assessed.
2. **One new row, `breach_recorded`** (H2, "s.8(6), Rule 7", Breach register):
   the count of breaches recorded and not dismissed — all time, not the
   24-month repetition window. Reason: "1 personal data breach is recorded in
   the breach register (s.8(6), Rule 7), so this head is assessed from it."
3. **It sets no status of its own.** A handled breach with nothing else known
   is **Partially mitigated** (Mitigated still needs every evidencing area
   answered well); an untold breach is Partially mitigated (1.1.0's cap); an
   overdue Board report is Exposed (1.1.0); a dismissed breach counts for
   nothing; no other head moves.
4. **Model 1.6.0**, in core and SQL. Because Stage 6's migration
   `20261018000000_slice10_reports` is not yet on hosted, the 1.6.0 functions
   (`exposure_model_version`, `exposure_module_inputs`, `exposure_evaluate_head`,
   each from its 1.5.0 body) are added to it — 1.5.0 stays in Stage 5's applied
   migration (D-074). This supersedes D-097's "no model change".
5. **Effects on data**: MU's head 2 moves from Not yet assessed to Partially
   mitigated (BRH-2026-001 is closed and told; no breach question answered).
   Exposed-head counts and ceilings at stake do not change (both statuses are
   "at stake"). Every snapshot recorded from now says 1.6.0; earlier ones keep
   their version and caveat.
6. **Consultant's note (for counsel):** s.8(6) and Rule 7 are about what was
   done once a breach happened, so a recorded breach is real evidence on head
   2 even with no assessment answer — reading it as "Not yet assessed"
   understated the position. The status still never claims Mitigated from the
   register alone.

Gates on the rebuilt local stack: core **1,229**, web unit **519**, RLS
**541**, every CI SQL gate (the version pin and the breach-row gate updated),
typecheck, `check:secrets`, `db:types --check` clean; e2e **410/410** locally (one worker; two specs re-run alone).

---

### D-099 · 2026-10-16 · Slice 10 Stage 6 approved; PR #28 to merge; SLICE_11's additions agreed; Slice 10.5 next
**Aniket, 2026-10-16:** "I have already completed Stage 6 re-run" (the manual
test from Step 1 on model 1.6.0), and: "yes I agree for it also [the SLICE_11
additions]. Now you decide, you can merge PR #28 first and then runs the
simplicity audit."

1. **Stage 6 is approved as built**, with his model 1.6.0 change (D-098) and
   the head-order fix (`a44516a`). D-097's seven calls (walk-through §5) stand
   as built; D-098 stands.
2. **The merge is delegated to Claude for PR #28 only** ("you can merge PR #28
   first"): after `20261018000000_slice10_reports` is on hosted and CI is
   green. Production (Vercel, `main`) then serves Slice 10.
3. **SLICE_11's additions are agreed and written into the prompt** (A1–A5, the
   §4.2 safeguards, experience principles and the reference-answer test,
   client-hosted AI). Slice 11 itself still opens with "SLICE_11 approved".
4. **Order from here:** Slice 10.5's simplicity audit
   (`docs/slices/SLICE_10_5_simplicity_pass.md`) in a new session, then its
   approved fixes, then Slice 11. The audit is read-only and needs no
   approval to start; its fix list does.

---

### D-100 · 2026-10-16 · PR #28 merged; Slice 10.5 starts with the app shell (Aniket's request)
**PR #28 merged as `dd180ec`** (Claude, delegated by Aniket in D-099) after
the Stage 6 migration reached hosted (26 migrations, model 1.6.0) and the full
CI suite was green on identical code (`b8ff25d`; later commits were
documentation only). Vercel production deployed `dd180ec`; health 200.

**Aniket, the same day:** "can we also modify the stylesheet of our new app
just like old app, also we need pagination wherever it is applicable. The
notification messages must be clear to visualise … lot of scrolling … Can we
have the menu fixed of left hand side. Systematic login details also fixed at
top right corner. On every page user must see the logged in as which role …
professional, simple to use."

Recorded as **Slice 10.5 Stage B0 — the app shell**, run **before** the audit
and approved by his request as specified in `SLICE_10_5_simplicity_pass.md`
§1: the old app's tokens and fonts (self-hosted); a fixed, collapsible navy
left menu grouped Programme / Registers / Settings with icons (`lucide-react`,
a new dependency); a fixed top bar with the organisation switcher and the
signed-in person, **their role** and organisation, and the user menu; one
notification system (toasts + an inline `<Notice>`); a `<DataTable>` with
client-side pagination (25 a page), sorting, search and sticky headers on
every growing list; tabs on long detail pages. No API, permission, model or
migration change; every `data-testid` and permission gate kept. A rubric
check R11 ("fits the screen") joins `docs/UX_REVIEW.md`.

---

### D-101 · 2026-10-16 · Slice 10.5 Stage B0 — the app shell: the calls the brief did not make
**Aniket opened Stage B0 on 2026-10-16 ("Start Slice 10.5 Stage B0").** Built
as `SLICE_10_5_simplicity_pass.md` §1 specifies; no API, permission, model,
migration or seed change. Claude's calls — each in the walk-through
(`docs/testing/SLICE_10_5_b0_walkthrough.md` §4) for confirmation at the gate:

1. **The old palette reaches every screen through the tokens, not per-file
   edits.** `globals.css` defines semantic tokens (`brand-*`, `surface-*`,
   `line-*`, `ink-*`, `danger/warning/success/info-*`, shadows) for the new
   components, and **remaps Tailwind's `indigo` scale onto the brand** (700 =
   navy `#003366`, 500 = blue `#2563EB`) — every existing primary button and
   link was `indigo-700/800`, so each screen took the look without touching
   it. The `slate` greys already are the old app's (`#0F172A`, `#475569`,
   `#94A3B8`, `#E2E8F0`). Bordered panels inside the shell get a white card and
   a soft shadow from one base-layer rule (`[data-shell-content]`), which any
   panel's own background still overrides.
2. **Fonts are self-hosted npm packages** — `@fontsource-variable/inter` and
   `@fontsource-variable/plus-jakarta-sans` (OFL-1.1), imported in the root
   layout — rather than `next/font/google`, which fetches from Google at build
   time: a client-hosted build (Slice 15) may have no internet. New
   dependencies: those two and `lucide-react` (ISC).
3. **The menu is one list** (`lib/client/nav.ts`) read by the sidebar and the
   top bar's title. Groups: Overview · Programme (Assessments, Actions,
   Exposure, Reports) · Registers (Processing, Breaches, Rights & grievances,
   Notice & consent, Processors, Retention, AI risk) · Settings (Organisation,
   Scope, Users, Question bank). Every `nav-*` test id and `<Can>` gate is
   kept, pinned by a unit test against the old layout's list; one link is
   new — `nav-overview`, which every member always had.
4. **The page title is the top bar's `<h1>`** (with its group above it), so
   every dashboard page has exactly one `<h1>`; the Reports page's own `<h1>`
   became an `<h2>`. Sign-in and the public pages keep theirs.
5. **Who is signed in**: initials, name, a role badge and the organisation in
   the top bar; on a phone the role badge stays and the name folds into the
   menu. The role is the permissions context's `roleName` for the ACTIVE
   organisation; name and organisation come from the existing `/auth/me` and
   `/auth/me/organizations` reads — no new endpoint. The account menu holds the
   details, "Organisation settings" and **Sign out** (a `menuitem`; e2e opens
   the menu first).
6. **Collapsed menu** is remembered per browser (`localStorage`, wrapped in
   try/catch); on a phone the menu is a drawer that closes on navigation.
7. **Messages**: 119 inline messages in 47 files became `<Notice>` (error / warning /
   success / info), each keeping its test id and its exact text (the icon has
   none), so every e2e text assertion still holds. **Toasts are added only for
   successes** — saves, publishes, records, an invitation resent, a report
   ready, an assessment generated, a breach or request recorded — and never
   replace the inline message. Errors stay on the page beside the form that
   caused them, not in a toast, so nothing important can be missed or covered.
   A success toast closes after 4 s; warnings and errors (none today) stay.
8. **`<DataTable>` is client-side over the reader's rows** (D-069: no new
   arithmetic, every count the reader's): 25 a page (25/50/100), page numbers,
   "Showing 1–25 of N", sort on the columns where order means something, a
   search box, a sticky header on a laptop. Paging and the rows-per-page
   control appear only past 25 rows. Applied to: Processing (ROPA), Breaches,
   Rights & grievances, Processors, Retention, AI risk, Reports, Users, the
   consent register's choices, a question pack's questions, and a new "All
   actions" table on Actions. Card lists became tables; every row keeps its
   test id, and every in-row test id is on the same cell content.
   **Not paged:** per-item evidence and document lists (a handful each) and the
   gap register (it has its own views) — Stage A judges them.
9. **Tabs** (`<Tabs>`, every panel stays mounted so a half-filled form
   survives; the chosen tab is in the URL hash; arrow keys move between tabs):
   a breach — Timeline (with its status changes) · Documents · Actions ·
   Details; a request — Response · Documents · Actions · Details; a retention
   schedule — Erasure · Documents · Actions · Schedule (edit, writers only); a
   processor — Contract · Assessments · Documents; an assessment — Questions ·
   Score; Actions — By owner · All actions · 30/60/90-day roadmap. The first tab
   is where the work is; a tab that needs action carries a warning badge
   ("Overdue", "Gap"), counts otherwise.
10. **Public pages** (`/p/…`, `/v/…`, sign-in, invitations) keep their own
   light layout with the tokens, a navy rule under the heading and `<Notice>`;
   the consent widget on the client's own site is unchanged (it styles itself
   inside the host page).

**e2e:** selectors tied to the old layout were updated, never deleted —
Sign out opens the account menu first (6 specs); a step on content now in a
tab clicks the tab first (breaches, rights, retention, processors, scoring,
evidence, gaps); one lookup that found the old menu's "Breach register" text
now reads the action's own source label. Text assertions on hidden-but-mounted
panels need no click. The shell's test ids are `topbar-*`, `user-menu`,
`page-title`, `app-*` — a unit test fails if a page reuses one.

---

### D-102 · 2026-10-17 · Slice 10.5 Stage B0 approved as built; Stage A next
**Aniket, 2026-10-17:** "I have successfully completed the B0 Manual test.
What next? I want to start it in new session window." — the manual test
(`docs/testing/SLICE_10_5_b0_manual_test.md`, twelve steps) passed on his
laptop. Its one finding was the test's, not the app's: Step 11 asked the DPDP
Programme Owner to save the organisation profile, which only an Organisation
Admin or the consultant may edit — the page correctly showed it read-only.
The step now uses the Admin (`dacb652`).

1. **Stage B0 is approved as built.** D-101's ten calls stand as built —
   including the assessment page opening on **Questions** (Score second).
2. **CI's docs check caught CLAUDE.md at 169 lines (cap 160)**: the UI rule is
   now two lines and three others were tightened; the file is 160.
3. **B0 stays on PR #30 (draft) until Aniket says to merge it**; production
   (`main`, `dd180ec`) does not have the shell yet. Stage A is read-only and
   adds documents only, on the same branch.
4. **Next: Stage A — the audit** ("Start Slice 10.5 Stage A", a new window).
   Its prompt (`SLICE_10_5_simplicity_pass.md` §2) is re-synced to the shell:
   score R1–R11 (R11 added with B0), the B0 baselines, and the page-walk tool
   `tools/ui_shots.mjs` that took B0's screenshots.

### D-103 · 2026-10-17 · Slice 10.5 Stage A — the audit: how it was walked, what it found, and what it leaves for Aniket

**Aniket, 2026-10-17:** "Start Slice 10.5 Stage A". Read-only: no code,
API, permission, model, migration or seed change. Output: `docs/UX_REVIEW.md`
§2 (all 44 surfaces scored R1–R11, every row 🔍) and §4 ("Stage A": a ranked
top 12, five questions, 37 fixes in batches B1–B5), evidence in
`docs/testing/slice10_5-a/`, a review guide
(`docs/testing/SLICE_10_5_a_review_guide.md`).

1. **Walked as the real users, not one admin.** Every dashboard page as the
   DPDP Programme Owner at laptop and phone width; the overview and each
   role's own pages as the Admin, Consultant, Dean, Legal, CISO and a
   department owner; the public pages as a Data Principal; the widget on a
   stand-in site; a live vendor link end to end; the emails rendered from
   their templates. That is how the main first-run finding showed: **the
   overview is identical for all seven roles** (only the e-mail and role code
   differ).
2. **B0's `after/` shots are reused as the laptop/phone record of the 37
   pages** — no code changed since they were taken, so new copies would be
   duplicates. New shots only for what B0 did not reach.
3. **Reports were generated for MU on the LOCAL database, then the database
   was rebuilt** (reset → migrate → seed). Pitfall 4 protects permanent
   records; a local database that is rebuilt afterwards is disposable. The
   ten files are kept as evidence in `slice10_5-a/reports/`. MU's public
   pages were opened on the local database for the walk and closed by the
   rebuild.
4. **Q1 is a finding, not a UX fix.** `readExposureInput` gives the model only
   the assessment's and the processing register's actions, so the forecast,
   "the actions that retire the most exposure", the Programme Status source
   table and the "Critical and high work" tile leave out breach, rights and
   retention actions — while the Actions page, the Gap & Action Tracker and
   the Owner Action Pack count all five. MU: 4 open, the forecast says 1, the
   Exposure Brief says "Nothing outstanding". D-069 says dashboards read
   through the readers and add no arithmetic, so the fix belongs in the
   model, not the page. Recommended: count every open action (a new model
   version and its snapshot pin); alternative: relabel. Aniket decides.
5. **Q2–Q5 are raised, not decided**: "ceilings where you are exposed" over
   heads not yet assessed (recommend relabel "at stake"); "Needs Work" for a
   domain with nothing answered (the engine's status, oracle parity — recommend
   showing "Not started" as a display rule); no password reset (recommend a
   line now, a flow later); and the role-tailored overview (a layout change
   behind the same `<Can>` gates).
6. **Two legal-wording fixes are flagged for counsel**, not made: the s.7(a)
   gloss in the ROPA lawful-ground list (F3.5) and a s.13(3) line on the
   grievance receipt (F5.6). The widget fix (F5.1 — name the Data Fiduciary,
   equal weight for Accept and Reject) rests on s.5/Rule 3 and on consent being
   free (s.6(1)).
7. **Recommended order: B5 (public) and B1 (first-run) first**, as §2's
   ranking puts Data Principals and first-run first; B4 carries Q1 if
   approved, since it touches the reports. The batch numbers stay as the
   prompt set them.

### D-104 · 2026-10-17 · Slice 10.5 fix list approved with the recommendations; Q1–Q5 answered

**Aniket, 2026-10-17:** "I have reviewed docs/UX_REVIEW.md file. I would like
to go with recommendations. please ensure that nothing is broken. Approved
the fix list and answer Q1–Q5." — so every fix F1.1–F5.6 in `UX_REVIEW.md` §4
"Stage A" is approved as written, and each question takes its recommended
answer:

1. **Q1 — the forecast counts every open action.** `readExposureInput` passes
   all five action sources (assessment, processing register, breach, rights,
   retention) to the model, so the forecast, the "Critical and high work"
   tile, "the actions that retire the most exposure" and the Programme Status
   source table agree with the Actions page. A model change: a new model
   version (1.7.0), its CI snapshot pin and seed-count gate, its own
   DECISIONS entry when built. Penalty-head leverage rules are unchanged.
   **Built in B4** (it touches the reports).
2. **Q2 — "Statutory ceilings at stake"** replaces "Statutory ceilings where
   you are exposed" everywhere (app, PDFs); the figure is unchanged. Copy
   only. **Built in B4**, in one place, so the overview, Exposure and every
   report change together.
3. **Q3 — "Not started" for a domain with no answered question**, as a display
   rule only: the engine's stored status (`needs_work`), the score and the
   workbook oracle are untouched. Overview (F1.4, B1), assessment scorecard
   (B2), reports (F4.6, B4).
4. **Q4 — the sign-in line now** ("Forgot your password? Ask your
   organisation's admin", F1.9, B1); **a real password-reset flow is new
   behaviour, scheduled before the production launch (Slice 14)** — an open
   loop in STATE, not a UX fix.
5. **Q5 — the role-tailored overview (F1.1) is a UX fix**: it changes what each
   role sees first, never what it may see or do; every panel stays behind its
   `<Can>` gate and the backend.
6. **Order: B5 (public surfaces), B1 (first-run), then B2, B3, B4.** One batch
   per session, each its own PR.
7. **"Nothing is broken" is each batch's gate**, as §3 of the slice prompt
   sets it: no API, permission, migration or `data-testid` change (Q1's model
   version is the one approved exception, in B4); every gate green — core,
   web unit, RLS, every CI SQL gate, the full e2e — locally and in CI; a test
   that asserts old wording changes only to the approved wording; before/after
   screenshots, a walk-through and a manual test per batch.
8. **Legal wording (F3.5 s.7(a) gloss, F5.1 widget, F5.6 s.13(3) line)** is
   built as written in §4 and listed in each batch's walk-through for counsel
   — the product never claims counsel has reviewed it.
9. **Branches:** while PR #30 (B0) is open, a batch branches off
   `slice/10-5-simplicity` (e.g. `slice/10-5-b5-public`) and its PR targets
   that branch; once #30 is merged, off `main` into `main`.

### D-105 · 2026-10-17 · Slice 10.5 Batch B5 — the public surfaces: the calls the fix list did not make

**Aniket, 2026-10-17:** "Do this task here: Slice 10.5 Batch B5 — public
surfaces" — F5.1–F5.6 as approved (D-104), on `slice/10-5-b5-public` (off
`slice/10-5-simplicity`, PR into it while PR #30 is open, D-104.9). No API,
permission, migration, seed or `data-testid` change.

1. **The widget keeps its title** ("We value your privacy", translated in
   Hindi and Marathi, and the e2e dialog name) and names the organisation in
   its first sentence instead, from the `organization` the public consent API
   already returned. A reviewed translation of that sentence, when added, is
   used as written; English never counts as a "translation".
2. **Equal weight means the same style**: Accept all and Reject all are both
   filled; the dialog opens with the focus on itself, not on Accept. Nothing is
   ticked, as before (s.6(1)).
3. **The not-found page is a segment boundary, not a root one**:
   `app/p/[slug]/not-found.tsx` and `app/v/[token]/not-found.tsx` render the
   one `DeadLinkPage`; dashboard 404s and unknown app URLs are untouched (B1's
   business). It names no organisation and gives no reason, so D-084/D-086.1's
   "every dead target is the same 404" still holds — the e2e compares the page
   text across an unknown, a malformed and a closed address, a missing notice
   and a dead vendor link.
4. **The vendor's voice is a separate map** (`VENDOR_VOICE`,
   `VENDOR_SECTION_VOICE`, `vendorVoice` in core), used only on `/v/[token]`.
   `VENDOR_QUESTIONS` — staff wording, options, weights, documents, scoring —
   is unchanged; a unit test fails if a question lacks a vendor text or the
   vendor text says "they", "their", "the vendor" or "our". The declaration
   asks "Your role at your company", not the organisation's own label for the
   vendor.
5. **One name rule** (`fiduciaryName`): the display name, plus the legal name
   once in brackets where it differs (case-insensitive); the header and body
   keep the display name. Used in the public footer and the vendor footer.
6. **The grievance receipt reuses `BOARD_COMPLAINT_TEXT`** — the line every
   published notice already carries for Rule 3(c)(iii) — so the email and the
   notice can never drift; a request's receipt does not carry it.
7. **The vendor page's answered count** counts the 44 scored questions (A1,
   the legal name, is optional) as answered or marked not applicable — the
   same set the database checks before submission.

### D-106 · 2026-10-17 · Batch B5 approved and merged; Batch B1 is next

**Aniket, 2026-10-17:** "i have completed manual test … Batch B5 approved. I
want to start new prompt in new session." His one finding was not B5's: at
Step 7 the grievance code email failed twice — the log shows the email
provider timing out after 10 s ("email provider unreachable"), while the
vendor code a minute earlier went through; Resend answered normally minutes
later. No code changed for it.

1. **B5 is approved as built** — D-105's seven calls stand. PR #31 (CI green:
   e2e 410/410, one consent UI test passed on its retry) is merged into
   `slice/10-5-simplicity` (`b8d6851`). Production still serves `main`
   (`dd180ec`); B0 + B5 reach it when PR #30 is merged — Aniket's call.
2. **Carried into B1 as F1.12**: the failed-code screen says the same thing
   twice in different words ("We could not send the email. Ask for a new
   code…" and "We could not send the email. Try again in a minute.") — one
   message, saying what to do. Copy only; the intake form is a public surface
   but B1 is the next batch, so it goes there rather than reopening B5.
3. **Next: Batch B1 — first-run and the overview** ("Start Slice 10.5 Batch
   B1", a new window). Its full prompt is `SLICE_10_5_simplicity_pass.md` §3.1.

---

### D-107 · 2026-10-17 · The paging and tabs sweep: N1–N7 and a guard test join the fix list; Batch B5a first
**Aniket, testing Batch B5 (2026-10-17):** "We need pagination with tabs for
MUMBAI UNIVERSITY Processor questionnaire — Payment gateway provider. Have you
fully determined the pagination opportunities across our new app/platform."

**The honest answer was no.** B0 paged eleven growing lists and tabbed five
detail pages; Stage A flagged more and the fix list scheduled seven (F1.5,
F1.10, F1.11, F2.5, F3.2, F3.6, F4.8). But the audit noted "44 questions on
one page" on U36 without assigning a fix, and scored U43 as fitting the screen
after B5. A sweep of every page (size, lists, `<DataTable>`/`<Tabs>` use)
found seven more — N1–N7 in `docs/UX_REVIEW.md` §4.

**Aniket, the same day:** "Approved: add N1–N7 and the paging guard test to
the fix list as proposed. Do the questionnaire first, as a small batch before
B1."

1. **N1 → Batch B5a**, now, on its own branch and PR into the slice branch
   (as B5). N2, N5 → B2; N6, N7 → B3; N3, N4 → B4. **Order: B5a, B1, B2, B3, B4.**
2. **The guard ships in B5a**, so every later batch is held to it: a unit
   test lists every page that renders records with `.map` into a list or
   table, and fails unless it uses `<DataTable>` or is allowlisted with its
   reason. A new list that can grow therefore cannot ship unpaged.
3. **Readers stay as they are** (D-069): every register reader already reads
   its rows in pages of 1,000 from the database, and the consent register's
   "latest choices" is capped (`RECENT_RECORDS`), with look-up by identifier
   for the rest. Server-side paging remains the step for a list past ≈ 1,000
   rows (D-101.8).

---

### D-108 · 2026-10-17 · Batch B5a — the processor questionnaire in sections, and the paging guard: the calls the brief did not make
Built as D-107 approved (N1 and the guard), on `slice/10-5-b5a-questionnaire`.
No API, permission, model, migration or seed change; every test id kept.
Claude's calls — each in the walk-through (§3) for confirmation:

1. **One section at a time**, on the vendor's link page and the staff page:
   `<Tabs>` gains a **steps** style (wrapping pills, so all eight stay in view on
   a laptop and a phone) and a controlled mode; a new `<SteppedTabs>` adds Back
   / Next under each panel. Panels stay mounted (nothing typed is lost); the
   chosen section is in the address hash.
2. **Next saves, then moves on**; a failed save keeps the step and scrolls to
   the error. Clicking a pill does not save (as scrolling never did).
3. **Badges count the scored questions** of a section ("5/5" for A — A1 is
   optional), green when complete — the bar's "x of 44" is unchanged.
4. **Vendor**: *Your documents* stays above the pills (cite from any section);
   the declaration and **Sign and submit** moved into the last tab, **Review and
   send**, after a per-section summary and a line naming claims with no document
   cited. **Save** stays in the bottom bar.
5. **Staff**: the last tab, **Review**, is a summary (answered, still to answer,
   claimed with no evidence, per section); Submit, Save and Discard stay in the
   bottom bar.
6. **The guard counts per file** (`tests/unit/paging-guard.test.ts`): stable,
   and its reason text names what is allowed; it fails on a rise (a new unpaged
   list) and on a fall (a paged list whose allowance was not lowered). Cards
   built from `<div>`s are out of its reach — the fix list carries those.

Gates: core 1,233 · web unit 553 · RLS 541 · e2e 408/410 locally (the two:
the Auth port-exhaustion flake, green alone). `ui/vendor-link` walks the
sections, presses Next and reads the review.

---

### D-109 · 2026-10-17 · Batch B5a approved and merged; Batch B1 is next
**Aniket, 2026-10-17:** "Batch B5a approved" — after its manual test
(`docs/testing/SLICE_10_5_batch5a_manual_test.md`).

1. **B5a is approved as built** — D-108's six calls stand: Next saves (a pill
   click does not), *Your documents* above the pills, Sign and submit in
   **Review and send**, the staff page's Submit / Save / Discard in its bottom
   bar, and the guard counting per file.
2. **PR #32 (CI green: typecheck, unit, RLS, API, the full e2e) is merged into
   `slice/10-5-simplicity`** (`76a4936`), as B5 was (D-106). Production still
   serves `main` (`dd180ec`); B0, B5 and B5a reach it when PR #30 is merged —
   Aniket's call.
3. **U43 meets the bar** (R11 ✅). U36 keeps F3.8's copy fixes for B3.
4. **Next: Batch B1** ("Start Slice 10.5 Batch B1", a new window), prompt
   §3.1 — under the paging guard, as every later batch.

---

### D-110 · 2026-10-17 · Batch B1 — first-run and the overview: the calls the fix list did not make
Built as D-104 approved (F1.1–F1.11, Q3–Q5) plus F1.12 (D-106), on
`slice/10-5-b1-first-run` (PR into the slice branch, as B5 and B5a). No API,
permission, model, migration or seed change; every test id kept except the
scope wizard's `save-answers` (the button F1.11 folds into Next). Claude's calls —
each in the walk-through (§8) with a DPDP-consultant verdict, for confirmation:

1. **"Needs someone now" ranks** a Board report overdue → one inside its 72 hours
   (Rule 7(2)(b)) → a request or grievance past ninety days (Rule 14(3)) → an
   overdue erasure (s.8(7)(a), Rule 8) → a request past TrustStack's 30-day
   target (not statute, so last). Core `mostUrgentRegisterItem`, over the
   overview's own sections.
2. **Programme roles** = DPDP Programme Owner, Organisation Admin, Consultant,
   Executive Sponsor (core `PROGRAMME_ROLE_CODES`); the others see only their own
   actions. Q5: what a role sees first, never what it may see.
3. **"Evidence awaiting your review" left out** of Your next steps — no reader
   returns it; carried to B2.
4. **The role by name, never code**, on Your next steps' "For … · {role}" line,
   which keeps the `user-email` / `user-role` test ids; the invite e2e now
   expects "Legal User".
5. **Industry names from `GET /api/v1/industries`** (`lib/client/industries.ts`),
   never core's `INDUSTRIES`, which carries pack codes (D-071); a unit test guards it.
6. **Progress counts a Not Applicable answer as answered** (core
   `answeredProgress`); the source line drops "— n questions unanswered"; the
   term "Assessed Weight Coverage" stays, glossed.
7. **"Until most of the DPDP Rules apply — 208 days to 13 May 2027"**: Rule 1(4)
   (Rules 3, 5–16, 22, 23 commence eighteen months after 13 Nov 2025); "most"
   because Rule 4 and Rules 1, 2, 17–21 commence earlier (Rule 1(2)–(3)).
8. **"Not started" is a `<Scorecard notStarted>` switch** (core
   `domainStatusLabel`): on for the overview now; the assessment page in B2,
   reports in B4.
9. **My actions** shows for anyone with an open action — programme roles too,
   second — and follows the Source/Severity filters; the overview links to it
   (`/dashboard/actions#mine`).
10. **Twelve repeated page headings dropped** (Assessments, Actions, Reports,
    Processing, Breaches, Rights, Consent, Processors, Retention, AI risk, Users,
    Scope); Exposure's title stays for B4. F3.1 (B3) now only aligns menu labels.
11. **Users**: the role list is core `assignableRoles` (exactly what
    `assertCanAssignRole` accepts); a member whose role you may not grant shows a
    badge (the server refuses changing it too); the guide lists all nine
    organisation roles from core `roleCapabilities`, marking the ones you cannot
    grant. Rule 6(1)(b) access control, shown rather than discovered.
12. **Organisation settings**: menu "Organisation", top bar "Organisation
    settings"; tabs Profile · Significant Data Fiduciary · Third Schedule class ·
    Public pages; each keeps its heading and citation.
13. **Scope**: Next saves the two answer steps (the same PUT); register steps
    save per row; a pill does not save; read-only users just move on.
14. **Sign-in**: the product line replaces "Sign in to your organisation."; Q4's
    reset flow stays an open loop for Slice 14 (it must be logged, Rule 6(1)(c)).
15. **F1.12**: one message; a failed resend adds nothing. The overview's "What is
    being done" line also gains the retention source (five, as F1.5).

Gates (local stack rebuilt to the clean seed): core 1,251 (+18) · web unit 558
(+5) · RLS 541 · typecheck · `check:secrets` · 23 CI SQL gates (seed count
differs locally only in audit logs) · e2e 416/416 locally (one worker,
production build; 414 in one run + the F1.12 test and the one after it, green
on rerun after a wait fix).

---

### D-111 · 2026-10-17 · `docs/PLAYBOOK.md` — the rules of the work, loaded with CLAUDE.md
**Aniket, 2026-10-17** (after passing the B1 manual test): "please check all
desired files are updated including next prompt. No confusion or no ambiguity.
If we are finding difficult to store everything in CLAUDE.MD then is there any
way we can use some other MD file as well … I will leave it to you."

1. **`docs/PLAYBOOK.md`** holds how a session works — where the next step is,
   the local stack and every gate, what each approval gate hands Aniket (gates,
   walk-through, manual test, `.webp` screenshots), the DPDP-consultant verdicts,
   the standing reminders, push-every-turn. Until now these lived only in
   Claude's private memory on one laptop; in the repo they reach every session.
2. **CLAUDE.md imports it** (`@docs/PLAYBOOK.md`), so it loads automatically;
   CLAUDE.md keeps the product's rules. A working-rule change updates the
   playbook in the Sync Step, with a DECISIONS line.
3. **STATE.md opens with one "▶ Start here" box** (live site, in flight, waiting
   on Aniket, what to do on approval, the next start line, the gate baseline,
   open loops); the old Slice 10 status notes under it are headed as history and
   the finished Slice 9/10 trackers lose their ▶ marker. If STATE and a prompt
   ever disagree, the session stops and asks (playbook §1).
4. Stale lines fixed in the same pass: the slice prompt's status block (B5a was
   missing), its §0 (branch contents, D-range, B2's branch name, a guard that
   PR #33 is merged), `SLICES.md`'s 10.5 row, the UX register (B1 rows "✅ on
   approval", not ✅ before it) and CLAUDE.md's slice range (0A–15).

---

### D-112 · 2026-10-17 · Batch B1 approved and merged; Batch B2 is next
**Aniket, 2026-10-17:** "Batch B1 approved." — after running the manual test
(`docs/testing/SLICE_10_5_batch1_manual_test.md`) successfully; its one finding
was in the script, not the app (Step 9 expected Save buttons the Registrar has
never had — corrected in `66dd34d`, the Saves now checked as the Admin in Step 11).

1. **B1 is approved as built** — D-110's fifteen calls stand as recommended,
   including the "Needs someone now" order (Rule 7(2)(b) → Rule 14(3) → s.8(7) /
   Rule 8 → TrustStack's 30-day target), the four programme roles, "Until most of
   the DPDP Rules apply" (Rule 1(4)), and "evidence awaiting your review" carried
   to B2 (D-110.3).
2. **PR #33 (CI green, 5/5) is merged into `slice/10-5-simplicity`**, as B5 and
   B5a were. Production still serves `main` (`dd180ec`); B0, B5, B5a and B1
   reach it when PR #30 is merged — Aniket's call.
3. **U01, U02, U04, U06, U07, U13, U29, U44 meet the bar** (✅). U05 waits for
   F3.1 (B3); U08 keeps R11 🟡 (a long step, not in the fix list).
4. **Next: Batch B2** ("Start Slice 10.5 Batch B2", a new window), prompt §3.2.

**D-111 addendum (2026-10-17):** CI's `structure` check caps CLAUDE.md at 160
lines (`.github/workflows/docs.yml`, run on PRs into `main`); the playbook link
had taken it to 166 and failed PR #30. The link is one line now, and "The clock"
moved verbatim into `docs/PLAYBOOK.md` §5 (it is context, not a product rule):
CLAUDE.md is 156 lines. The playbook names the cap so new working rules land
there.

---

### D-113 · 2026-10-17 · PR #30 merged — Slice 10.5 B0, B5, B5a and B1 are live; later batches go straight to `main`
**Aniket, 2026-10-17:** "Merge PR #30 once its e2e is green, then check the live
site and update STATE." — on Claude's recommendation to merge before B2.

1. **PR #30 (`slice/10-5-simplicity` → `main`) merged as `cc1dd77`** once every
   check was green: structure (after the CLAUDE.md cap fix, D-111 addendum),
   typecheck · unit · service-role guard, migrations · RLS · API · the full e2e
   (15 min), and the Vercel preview. Production deployed `cc1dd77`.
2. **Nothing on hosted changed**: Slice 10.5 so far has no migration and no new
   environment variable; its only dependency changes are B0's (`lucide-react`,
   the bundled Inter and Plus Jakarta Sans fonts — no font CDN).
3. **Live check (signed out, read-only — Claude does not sign in to the live
   site):** `/api/v1/health` reports `cc1dd77`; `/login` shows "DPDP readiness for
   your organisation — assessments, registers and reports." and "Forgot your
   password? Ask your organisation's admin."; a dead invitation says "Ask your
   organisation's admin to send a new invitation."; `/p/…` and `/v/…` dead
   targets are the one plain 404; `/dashboard` sends a signed-out visitor to
   sign-in. Signed-in pages are for Aniket to look at with his own account.
4. **From B2 on, each batch branches off `main` and its PR targets `main`**
   (D-104.9), so an approved batch goes live when it merges. B4's model 1.7.0
   migration goes to hosted by CLAUDE.md's rule (once, final; before the merge
   only if additive — a revoke after the deploy, D-071).
   `slice/10-5-simplicity` is finished.

---

### D-114 · 2026-10-18 · Batch B2 — assessment, evidence and gaps: the calls the fix list did not make
Built as D-104 approved (F2.1–F2.7; Q3 on the assessment's scorecard) plus N2 and
N5 (D-107), on `slice/10-5-b2-assessment` off `main`, its PR into `main` (D-113.4).
No API, permission, model, migration or seed change; every test id kept except
`domains-expand-all` / `domains-collapse-all`, which one-domain-at-a-time
replaces. Claude's calls — each in the walk-through (§8) with a DPDP-consultant
verdict, for confirmation:

1. **The 0–5 claim picker uses the spec's ANSWER scale, not `MATURITY_BANDS`**
   (core `CLAIM_LEVELS`: 0 Not started · 1 Aware · 2 Draft or partial · 3
   Defined · 4 Implemented · 5 Operational and monitored — Step G "Maturity
   Scoring"). The bands name a score percentage, where Level 2 is "Defined"; on
   the answer scale 3 is. Verdict *change* (from the fix list's wording), built
   that way; one constant reverts it. TrustStack's method, not statute (s.8(4)
   is the duty it measures).
2. **Evidence in words**: the answer says "this answer counts at most N", each
   file "supports at most N" (an answer counts at its strongest reviewed file,
   D-044/D-045); a file awaiting review "supports nothing until it is
   reviewed"; `E0`–`E5` in a tooltip; the reviewer's picker names each level from
   the spec's evidence table. The cap is read from `EVIDENCE_CAP`; a unit test
   fails if a browser file writes the table out.
3. **Questions for my role** match the bank's free-text suggested owner by the
   function it names (core `isQuestionForRole`): a Department Owner matches any
   named owner that is not an organisation-wide function — 73 of MU's 124 for the
   Controller of Examinations. The default only for a Department Owner; offered
   to the five roles a question can name; display only (Rule 6(1)(b) access is
   the API's and RLS's). Narrowing to the person's own department needs a reader
   that returns it — later, not a UX fix.
4. **"n may not apply"** counts the Potentially Applicable questions not yet
   answered, so it falls to zero as they are dealt with.
5. **One domain at a time** keeps the domain cards (progress, F2.1) and adds the
   pills (N2); a card opens its domain; the first domain opens by default; every
   panel stays rendered; the domain is in the link.
6. **The gap registers** are one wide Gap column (the card and its action
   editor, sortable by severity) plus Domain/Record and Next due on a laptop; the
   search never matches a question code (D-040).
7. **Short lists page at ten** (`components/data/paged-list.tsx`) — the evidence
   or documents on one answer, action, record, processor or register row;
   registers at 25 (`<DataTable>`). A document's raw "review: pending" became its
   label.
8. **The list's "answered x of y"** is one score read a row, counted by core
   `answeredProgress` (D-069); a server-side count when Slice 12 lengthens it.
9. **D-110.3 stays an open loop**: no reader returns pending evidence across
   answers, actions and registers (the evidence index serves reports only); a
   partial list would mislead. A small reader belongs with later API work.
10. **Defect fixed**: an answered question's picker could open on "Choose…" (the
    form mounted before the answers arrived — on `main` too); the form is now
    keyed on the saved answer.
11. **"Owner" → "Suggested owner"** on each question.

Gates (local stack rebuilt to the clean seed): core 1,268 (+17) · web unit 569
(+11) · RLS 541 · typecheck · `check:secrets` · `db:types --check` · 23 CI SQL
gates · e2e 422/422 (420 in one clean run; the Reports switcher flake and two seed-dependent processor specs green alone on a clean seed) locally (one worker, production build).

---

### D-115 · 2026-10-18 · Batch B2 approved and merged; Batch B3 is next
**Aniket, 2026-10-18:** "Approved Batch B2." — after running the manual test
(`docs/testing/SLICE_10_5_batch2_manual_test.md`). Two things came up during the
test; neither was a fault in B2: Step 9's amber "register has changed" line
(expected after Step 5 saved an answer — the script now says so, `ea4d2b5`), and
one "Something went wrong" after the laptop slept ("JWT issued at future": the
Docker VM's clock lagged the Mac's for a moment; the next request succeeded).

1. **B2 is approved as built** — D-114's eleven calls stand as recommended,
   including **call 1: the 0–5 picker uses the spec's answer scale**
   (`CLAIM_LEVELS`: 3 is "Defined", 2 "Draft or partial"), not the score bands'
   names; D-110.3 / D-114.9 stays an open loop.
2. **PR #35 merges into `main`** once CI is green, so B2 goes live (D-113.4). No
   migration, no new environment variable, no new package — nothing to do on
   hosted.
3. **U09, U10, U12 meet the bar** (✅). U11 keeps R3 🟡 (question codes shown — not
   in the fix list); U16 keeps R8 🟡 as audited.
4. **Next: Batch B3** ("Start Slice 10.5 Batch B3", a new window), prompt §3.3.
   The local database is the clean seed (rebuilt after the manual test).

---

### D-116 · 2026-10-18 · Batch B3 — the registers: the calls the fix list did not make
Built as D-104 approved (F3.1–F3.12) plus N6 and N7 (D-107), F3.1 narrowed to the
menu labels (D-110.10), on `slice/10-5-b3-registers` off `main`, its PR into
`main` (D-113.4). No API, permission, model, migration or seed change; every test
id kept (new: `tab-*` on the record and consent, `ropa-tab-points-*`, `ropa-more`,
`ropa-record-risk-unknowns`, `rights-status-{code}`, `ropa-import-template`,
`assessment-progress`, `retention-period-words`, `widget-languages-pending`,
`ropa-lookup-purpose`). Claude's calls — each in the walk-through (§9) with a
DPDP-consultant verdict, for confirmation:

1. **A record tab's badge is the points the register saved** (core
   `ropaTabPoints` over the record's own `areas`, D-061); a new record shows what
   each tab is worth. The area boxes keep the live preview; the badge moves on Save.
2. **The thirteen areas in five tabs** (core `ROPA_RECORD_TABS`): Who and what 34 ·
   Purpose and ground 24 · Systems and processors 16 · Retention and security 22 ·
   Evidence 4; the unscored details split by meaning (rights workflow and
   grievance beside notice and consent; sharing beside systems and processors).
3. **Stored files sit on the Evidence tab, outside the record's form** (a form
   cannot hold another); the one Save is a sticky bar tied to the form by id.
4. **s.7(a) as approved** — "A specified purpose the person voluntarily gave the
   data for, and has not objected to (s.7(a))"; the Act's limb is "has not
   indicated … that she does not consent" — listed for counsel, with a stricter
   alternative. Every ground now reads words first, section in brackets. The old
   label still imports (a CSV exported before B3).
5. **"Risk: High until the unknowns are answered"** on a new record only, while a
   `*_unknown` factor applies — the preview's own rating.
6. **More is a native `<details>` disclosure** (`components/ui/more-menu.tsx`):
   keyboard-usable without script, every item in the page behind its own `<Can>`.
7. **Consent**: the counts above the tabs; purpose titles from the published
   notice (a draft's otherwise; an unknown key as is); "(exposure model 1.3.0)"
   dropped, not updated; the twenty pending languages in a disclosure that opens
   itself when one is offered.
8. **A notice's checks show once a purpose field is left or Save is pressed**; a
   saved draft shows them on opening; Publish stays disabled while any remains.
9. **"No accepted assessment"** relabels the reader's `neverAssessed` count (no
   accepted current assessment); the Processor Exposure Report's "Never assessed"
   moves with B4.
10. **Years only when whole** (core `formatRetentionPeriod`); the form keeps months
    and says the years beside the box.
11. **TrustStack's short names for the Fourth Schedule exemptions** (core
    `CHILD_EXEMPTION_SHORT_LABEL`), the Schedule's words in the tooltip and picker.
12. **The rights list says "Responded — Fulfilled"** (core `rightsStatusText`); the
    filter keeps the status alone.
13. **The import template is the header row only** (core `ropaImportTemplateCsv`,
    the first alias of each of the thirty import fields) — no sample row.
14. **People types fold only when the singular is inside the plural** (core
    `foldPeopleTypes`), because the look-up matches words as written.
15. **The look-up's purpose line names s.11(1)** (consent and s.7(a) processing);
    its own note already says the summary is a draft to check.
16. **Small extras**: the import's error details through `<DataTable>`; the
    look-up's risk as its label; the browser tab titles match the register names.

Gates (local stack rebuilt to the clean seed): core 1,292 (+24) · web unit 583
(+14) · RLS 541 · typecheck · `check:secrets` · `db:types --check` · 23 CI SQL
gates · e2e 423/423 in one clean run (one worker, production build).

---

### D-117 · 2026-10-18 · Batch B3 approved with one change, and merged; Batch B4 is next
**Aniket, 2026-10-18:** "tested manually successfully" — after running the manual
test (`docs/testing/SLICE_10_5_batch3_manual_test.md`) — then "Batch B3 approved,
with one change: use the closer s.7(a) wording '...and has not said they do not
consent to its use (s.7(a))'."

1. **B3 is approved as built** — D-116's sixteen calls stand as recommended,
   except call 4's wording.
2. **The s.7(a) ground reads "A specified purpose the person voluntarily gave the
   data for, and has not said they do not consent to its use (s.7(a))"** (core
   `ROPA_LAWFUL_BASES`), closer to the Act's "has not indicated to the Data
   Fiduciary that she does not consent to the use of her personal data" than the
   fix list's "has not objected to". Still listed for counsel; the product never
   claims counsel has reviewed it. The pre-B3 label still imports; the
   "objected to" wording was never live, so it needs no import alias. Pinned by
   `register-display.test.ts` and `e2e/ui/ropa.spec.ts` (core 1,292, web unit +
   RLS 1,124, the ROPA e2e 6/6 on a fresh build).
3. **PR #36 merges into `main`** once CI is green, so B3 goes live (D-113.4). No
   migration, no new environment variable, no new package — nothing to do on
   hosted.
4. **U05, U14, U15, U17, U18, U31, U33–U38 meet the bar** (✅).
5. **Next: Batch B4** ("Start Slice 10.5 Batch B4", a new window), prompt §3.4 —
   the last batch of Slice 10.5, with Q1's model 1.7.0 and its migration. The
   local database is the clean seed (rebuilt after the manual test).

---

### D-118 · 2026-10-18 · The handover check — the next prompt is verified against the code before a session ends
**Aniket, 2026-10-18:** "before i start slice 10.5 Batch B4, please ensure that all
required files are updated and upcoming prompt is also updated. i don't want any
confusion, ambiguity. always ensure that you are doing it without i am asking
everytime before i start new prompt in new session window."

1. **A standing working rule** — `docs/PLAYBOOK.md` §6 "The handover check" (the
   old §6 "Ending a turn" is now §7) and CLAUDE.md's END step 8: after every
   approval, unasked, Claude makes STATE, the slice file, `SLICES.md`,
   `UX_REVIEW.md` and DECISIONS say one next step; greps every path, function,
   test, CI step, migration name and old string the next prompt names; reads the
   prompt after next for staleness; leaves the local stack on the clean seed with
   `main` checked out.
2. **Run now for B4.** Found and fixed in `SLICE_10_5_simplicity_pass.md`: §0
   cited D-099–D-115 and e2e 422 (now D-099–D-117, 423). **§3.4's Q1 understated
   the work:** the model's gap input takes only assessment and processing-register
   gaps (`ExposureGapInput`), and breach, rights and retention actions have no gap
   row (they hang on `gap_actions` by their register's id), so "pass the five
   readers" is in fact a **new model input** counted in pace and outstanding work
   but never in head leverage — now spelled out, with the exact migration name
   (`20261019000000_exposure_model_1_7_0`), the SQL functions to replace (and where
   each was last replaced), the CI pin line, the mirror tests and the hosted
   order (merge → production deploy → `pnpm db:migrate` against hosted at once;
   checked that no live code compares the TS and SQL versions). The F4.2–F4.8 rows
   now name their exact source lines; F4.2's "1 actions" is the Exposure page's
   `{projection.outstanding} actions open`.
3. **`SLICE_11_ai_assistant.md` is stale** (baseline core 1,229 / web 519 / e2e 410
   / model 1.6.0; "PR #28 must be merged first"; no B0 shell conventions). Not
   rewritten now — B4 changes the numbers and the model again — but named as a B4
   Sync Step deliverable (§3.4) and an open loop in STATE.

---

### D-119 · 2026-10-19 · Exposure model 1.7.0: the forecast counts every open action (Q1, built in Batch B4)
Approved as D-104.1 ("the forecast counts every open action … penalty-head leverage
rules are unchanged"), built on `slice/10-5-b4-reports`. **Why:** the model's gap
input took the assessment's and the processing register's gaps only. Breach,
rights and retention actions hang on their register's record, not on a gap row
(D-067, `gap_actions_one_parent`). So the forecast, "Critical and high work" and
the Programme Status source table said 1 open action where the Actions page said
4 (MU), and the Board brief said "Nothing outstanding" with three High actions
open.

1. **A new model input, `registerActions`** (`ExposureRegisterActionInput`: source
   breach · rights · retention, severity, state, and the action's id, owner, due
   date and status). It is built by `readExposureInput` from the Actions page's
   own item builders (`breachItems`, `rightsItems`, `retentionItems`, D-069), and
   in SQL by `app.exposure_input`. Severity as that page gives it: a breach's own;
   a grievance high, a request medium; a retention schedule high while past its
   end with no erasure that counts this cycle, else medium. State: superseded
   once the breach is dismissed or the request void.
2. **Counted in outstanding work only.** `outstandingWork(gaps, registerActions)`
   and `app.exposure_outstanding_work` add one unit per register action still
   owed (state open, not closed), critical and high apart. **No head reads it**:
   `exposureFor`, `app.exposure_evaluate_head`, `EXPOSURE_MAPPING`, leverage, the
   what-if's closable actions and the slippage warnings tied to heads at stake are
   unchanged. Tested in core, in SQL (`app.exposure_evaluate(input) =
   app.exposure_evaluate(input − registerActions)`) and end to end.
3. **`EXPOSURE_MODEL_VERSION = "1.7.0"`; migration
   `20261019000000_exposure_model_1_7_0`** replaces `app.exposure_model_version()`,
   `app.exposure_input` (its 1.5.0 body plus `registerActions`) and
   `app.exposure_outstanding_work`, each keeping `REVOKE … FROM PUBLIC`. It has
   apply-time assertions and no table, grant or revoke change. `pnpm db:types`
   output unchanged. CI pin `1.7.0/0.4/0.6/60/20270513`; seed-count gate unchanged.
4. **Stored snapshots are immutable** (D-074): those before keep 1.6.0, and the
   history shows each one's model (N4).
5. **Hosted:** merge → Vercel's production deploy → `pnpm db:migrate` against hosted
   at once → `node tools/gen_db_types.mjs --check`. A snapshot taken in between
   carries 1.6.0, which is harmless: no live code compares the TS and SQL
   versions.
6. **Left as it is (an open loop, not Q1):** the forecast counts the CHOSEN
   assessment's gaps, and an open gap with no action as one unit. The Actions page
   counts every assessment's actions and no actionless gap. They agree on MU. They
   can differ with an older finalised assessment whose actions live on (D-058),
   or gaps not yet given an action.

### D-120 · 2026-10-19 · Batch B4 — reports, exposure and emails: the calls the fix list did not make
Built as D-104 approved (Q2, F4.1–F4.9, Q3 in the reports), N3 and N4 (D-107),
D-110.10's heading, and Q1 (D-119), on `slice/10-5-b4-reports` off `main`, its PR
into `main`. No API, permission or seed change; every test id kept (new: the
Exposure and Reports tabs `tab-*`/`tabpanel-*`, `exposure-tabs`, `reports-tabs`,
`reports-guide`, `exposure-history-model-{id}`). Claude's calls, each in the
walk-through (§9) with a DPDP-consultant verdict, for confirmation:

1. **Core helpers, one rule each:** `countNoun` / `actionsOpenLabel` (words.ts,
   F4.2: not used for the model's own reason text, which SQL mirrors);
   `CEILINGS_AT_STAKE_HEADING` (Q2); `FROM_EVERY_REGISTER`,
   `PENALTY_HEADS_SECTION_TITLE`, `NO_ACCEPTED_ASSESSMENT_LABEL`,
   `foldUnansweredReasons`, `changeSentence` (reports.ts); `dateCell`, `indiaDay`,
   `EVIDENCE_LEVEL_GLOSS`, `VENDOR_LINK_UPLOADER` (workbooks.ts).
2. **The "Not yet answered: …" fold** applies wherever head reasons are shown: the
   PDFs' head detail, the Board brief's main reason and the Exposure page's head
   cards. It is display only; the stored snapshot keeps the model's words.
3. **No forced page break before the scorecard appendix** (F4.5): it follows the
   register when there is room. The Slice 9 test that pinned "its own page" now
   pins "no forced break". "No change since …" also covers a partial move
   ("unchanged at").
4. **The report scorecard rows carry `questionCount`** so "Not started" follows
   core `domainStatusLabel` (F4.6): an internal report input, no API change.
5. **Evidence Index dates are India's date** as real date cells ("d mmm yyyy").
   Before, the UTC date of the timestamp was used, a day early after 18:30 UTC.
   The Gap & Action Tracker's dates stay text (not in the row). A vendor's upload
   is known from `vendor_link_documents`, never inferred from a blank uploader.
   The workbook model gains `WorkbookDate`, still values only (D-078).
6. **The reports centre:** generating opens the Stored tab; a role without
   `report.generate` sees PDF reports (its own pack, `gap.read`) and Stored, and no
   Working files tab. The guide's lines are the kinds' own audience strings.
7. **The invitation's line is Claude's wording** ("When you accept, you will be
   asked to choose a password; TrustStack then opens on the DPDP readiness work
   your role covers."), true for every role. The code boxes moved from indigo-50
   to the app's pale blue `#eff6ff` with the navy (F4.9).
8. **Exposure's tabs:** the caveats stay outside the tabs (on the page whatever the
   tab, §6.6, D-011); the Penalty heads badge is the heads at stake, History's the
   snapshot count. The history chart's line is the app's navy.
9. **Two more stale source lines fixed with F4.3:** the Gap & Action Tracker's card
   question and its About note ("from every register"); it lists every register's
   actions.
10. **Report evidence was generated on the local copy's MU** (rebuilt from the seed
    afterwards), not a disposable tenant: MU's data shows every fix. The e2e tests
    still generate only on disposable tenants.

Gates (local stack rebuilt to the clean seed): core 1,302 (+10) · web unit 595
(+12) · RLS 542 (+1) · typecheck · `check:secrets` · `db:types --check` · 23 CI
SQL gates (pin 1.7.0) · e2e 424/425 in one clean full run, the one failure the known sign-in flake (`ui/processors.spec.ts`, untouched), green alone; 425 tests (+2).

---

### D-121 · 2026-10-19 · Batch B4 approved as built; Slice 10.5 closes with it
**Aniket, 2026-10-19:** "successfully ran the manual test cases for Slice 10.5 Batch 4"
— then, of the tidy-up's "tell Claude 'Batch B4 approved', or what to change. On
approval Claude merges the PR, … applies the 1.7.0 migration to the live database
…": "you do it". Read as **"Batch B4 approved"**, with no change asked.

1. **B4 is approved as built**: Q1 as D-119 (exposure model 1.7.0) and D-120's ten
   calls, and the walk-through's fifteen, all as recommended. That includes the
   invitation line in Claude's wording (D-120.7), the closing page that holds only
   the caveats (walk-through call 7) and the tracker's dates staying text (D-120.5).
2. **Two corrections from the manual test, both on the branch before the merge.**
   **Step 5** expected ranked actions, but on the seed the What-if is empty: MU's
   one assessment action is on an enabling control, and the register's gaps are
   not generated. The step now says so, and an optional last step shows a what-if
   (`b23d42f`). **Step 10** found the Processor Exposure Report's counts table still
   saying "…never assessed". It is now "…with no accepted assessment", pinned in
   core and e2e (`b2b7208`).
3. **PR #38 merges into `main`.** Then, per D-119.5, the migration
   `20261019000000_exposure_model_1_7_0` goes to hosted at once after the
   production deploy, followed by `gen_db_types --check` and the live site's
   signed-out pages.
4. **U03, U19–U23 and U25–U28 meet the bar (✅).** U24 keeps R9 🟡 (head 7's
   evidence-trail cell, kept).
5. **Slice 10.5 is closed:** B0, A, B5, B5a, B1, B2, B3 and B4, and every item of
   the fix list (F1.1–F5.6, N1–N7, Q1–Q5) are built. What remains is in STATE's
   open loops. **Next: Slice 11** (`SLICE_11_ai_assistant.md`, re-synced by B4),
   which starts on "SLICE_11 approved".

### D-122 · 2026-10-19 · B4 is live; the handover to Slice 11 checked against the code
1. **PR #38 merged** (`01a1b53`) after CI was green. One e2e test,
   `ui/consent.spec.ts`'s notice publish, failed on both attempts of one run; the
   only change since the last green run was one report label. It passed on the
   job's re-run and 9/9 locally, so it is logged as a CI flake (STATE), not fixed
   blind.
2. **Hosted, per D-119.5:** Vercel's production deploy of `01a1b53` succeeded, then
   `prisma migrate deploy` applied `20261019000000_exposure_model_1_7_0` at once
   (27 migrations; `app.exposure_model_version()` = 1.7.0 on hosted),
   `gen_db_types --check` was up to date, and the signed-out pages were checked:
   sign-in and invite load, dead public targets are one 404, the dashboard
   redirects to sign-in, and `/api/v1/health` reports `01a1b53`.
3. **The handover check (PLAYBOOK §6):** STATE, SLICES, UX_REVIEW, the slice file
   and DECISIONS say one next step, "SLICE_11 approved". Every path
   `SLICE_11_ai_assistant.md` names exists, or is a file Slice 11 creates
   (`lib/ai/*`) or the old app's path it cites. Its baseline, merge state and UI
   conventions were re-synced by B4. **SLICE_12** (a stub) now carries D-119.6
   (a second assessment splits the forecast's count from the Actions page's) and
   D-114.8. The local stack is the clean seed with `main` checked out.

### D-123 · 2026-10-19 · The Slice 11 prompt re-validated against `main`, and split into four stages
**Aniket, 2026-10-19:** "Can you revalidate all required files are updated and next
prompt is also updated and latest. no confusion and no ambiguity. is Slice 11 prompt
is big or we have sub-prompts. which option is best."

1. **Re-validated against `main` @ `5b411e1`.** Every file and reader named in §5
   exists: `withApi`, the route sweep, `readDashboard`, `readLiveExposure`, the
   report inputs, the six registers' `lib/*/shape.ts`, `lib/intake`, the B0
   shell, `nav.ts` and the paging guard. In the local database, all ten roles
   hold `ai.use`, `organization.update` and `industry_code` exist, and
   `ai_enabled` and `ai_drafts` do not exist yet. pgvector 0.8.2 is available
   and not installed. The free e2e tenant ids start at `…a026`. The spec range
   (Step J, lines 8–278) and every cited D-number check out. The paths that do
   not exist are files Slice 11 creates (`lib/ai/*`) or the old app's paths it
   cites as history.
2. **Fixed:** §4.8 / §6.3 / §8 said "BFSI, insurance and health". The industry
   codes are `bfsi` (which covers insurance) and `healthcare`; there is no
   insurance code. §4.1 was re-checked against the current `claude-api` skill:
   the default model `claude-opus-5-5` stands. `fallbacks: "default"` needs the
   beta header `server-side-fallback-2026-07-01` (client-side middleware on
   Bedrock/Vertex). Thinking cannot be turned off, effort is the control, and
   there is no prefill or forced `tool_choice`. Claude Fable 5.1 is not used
   because it requires 30-day retention, which §6.4 rules out.
3. **One prompt file, four stages — Claude's recommendation; "SLICE_11 approved"
   approves it.** The old Stage 1 (gateway, corpus, migration, guardrails, four
   helpers, the panel) was too big for one session. **1a** the safe gateway with
   no UI and one task through the API (every safety rule first); **1b** the four
   explain helpers in the side panel; **2a** register drafts (ROPA, Rule 7(2)
   intimation, rights response); **2b** notice + translation, report narrative,
   Sync Step and the PR. Each stage gets its own session and gate, as Slice 10's
   3a/3b and 4a/4b did. One branch, and one PR at the end of 2b carrying the
   migration to hosted. Sub-prompt files were not made: one file keeps one
   source of truth (§4 and §6 apply to every stage), and §7 names each stage's
   start line.

### D-124 · 2026-10-19 · SLICE_11 approved — §4 and §6 as written; Stage 1a starts
**Aniket, 2026-10-19:** "SLICE_11 approved" — the gate phrase, with no change asked.

1. **Every §4 decision stands as recommended** (`docs/slices/SLICE_11_ai_assistant.md`):
   Claude only, behind a provider interface, `claude-opus-5-5` with effort per task
   and `fallbacks: "default"` (4.1); the whole legal corpus in one cached prefix,
   no pgvector, with the citation check, the versioned corpus and client-safe
   guidance (4.2); structured output with server-forced review flags (4.3);
   drafts only, in `ai_drafts`, and no tool that writes (4.4); the black box (4.5);
   allow-lists and the free-text scrub, A3 (4.6); `ai.use` plus the task's own
   permission (4.7); off by default, on only with the contract reference (A2),
   `bfsi` / `healthcare` and SDFs held off (A4), the `AI_ENABLED` kill switch (4.8);
   limits and usage (4.9); audit as the person, never the text (4.10); the
   wording rules in code (4.11); synchronous calls (4.12); the experience
   principles and the reference-answer test (4.13); client-hosted AI (4.14).
   The new dependency `@anthropic-ai/sdk` is approved with 4.1.
2. **§6 stands as written** — the sub-processor chain (A1), what is sent, where it
   runs, retention and incidents (A5), not a certification, and counsel's
   sign-off on A1, A4 and A5 before Mumbai University goes live (Slice 14).
   Development and the demo tenant use fictional data only.
3. **The s.16 / Rule 15 check (§6.3), done 2026-10-19:** no notification under
   s.16(1) restricting transfer to any country or territory has been reported. The
   Legal 500 survey says none as of September 2026. MeitY's notifications page
   refused an automated read (HTTP 403), so this rests on secondary sources, and
   **counsel must confirm against the Gazette**. s.16 and Rule 15 are not yet in
   force: Rule 15 commences on **13 May 2027** under Rule 1(4) of G.S.R. 846(E),
   checked in `docs/legal/`. Secondary sources say the same for s.16. s.16(2)
   (stricter sector law) and Rule 13(4) (SDFs) are why A4 holds `bfsi`,
   `healthcare` and SDF tenants off. **Re-check at every slice.**
4. **Four stages (D-123):** this session builds Stage 1a, the safe gateway with no
   UI, on `slice/11-ai-assistant` off `main` @ `2a12f4d`.

### D-125 · 2026-10-19 · Slice 11 Stage 1a — the safe gateway: the calls the prompt did not make
Built on `slice/11-ai-assistant`. Migration `20261020000000_ai_gateway` (local only
until the slice's PR at the end of 2b, D-123). Walk-through §9 puts each to Aniket
with a DPDP-consultant verdict. Stage 1a has **no screen**: the Question Helper
answers through `POST /api/v1/organizations/{id}/ai/question_helper` only.

1. **Every model call is one `ai_drafts` row** — a `draft` with its answer, or a
   `rejected` call with no answer and its reason (`refusal`, `truncated`,
   `invalid_output`, `wording`, `citation`, `other_tenant`). A CHECK makes "never a
   half-answer" (§4.3) the database's. So usage counts every call that cost tokens,
   and the audit is written by trigger in the same transaction: `ai.requested`,
   `ai.refused`, `ai.injection_flagged` (D-027). `ai.unavailable` (no answer at all,
   no tokens known) is written by the route, as the person.
2. **The citation check drops and flags, then rejects (§4.2(a) "rejects or flags").**
   A citation the corpus does not contain is removed from the answer and listed in
   `citationFlags`. An answer left with no valid citation is rejected (`citation`).
   The index is built from the corpus text itself: s.1–44, the Act's Schedule,
   rules 1–23, the First to Seventh Schedules. A sub-provision counts when "(n)"
   appears in that provision's text.
3. **Wording (§4.11): denial is not a claim.** "Is compliant", "fully compliant",
   "certified", "we certify", "guarantees compliance", "I have approved", "the gap
   has been closed", "I have raised the score" are rejected. A "not", "never" or
   "doesn't" earlier **in the same clause** lets a denial through ("this does not
   mean the organisation is compliant"); a comma breaks the clause, so "which does
   not use cookies, is compliant" is still rejected. A sentence that gives
   TrustStack's 30 days, 12 hours or twelve-month review to the Act, the Rules or
   "the law" is rejected (pitfall 2). 72 hours, 90 days, one and three years and
   48 hours (Rule 8(2)) are the law's and are not on the list.
4. **"Another tenant" means the other organisations the person can see.** The
   model only ever gets one tenant's context. The realistic leak is a consultant
   who serves several clients, so an answer naming any other organisation that
   person belongs to is rejected. Checking every tenant's name would mean reading
   names the person may not see, for a risk the context already rules out.
5. **The order of "off" (§8):** the kill switch first (it wins, §4.8), then a hold
   (it explains why the switch cannot be turned on), then the organisation's
   switch. Nothing is read, sent or stored before it. The database repeats the
   last two as a second lock on `ai_drafts`.
6. **A hold turns the assistant OFF rather than blocking the change that causes
   it.** Moving into `bfsi` or `healthcare` without a sign-off, or recording an SDF
   notification, sets `ai_enabled = false` in the same update, audited as
   `ai.disabled` as the person who made the change. Refusing a true fact (the
   Government's notification, a change of industry) would push people to leave
   the record wrong. The off state is the safe one (s.16(2), Rule 13(4)).
7. **Counsel's sign-off is platform data, not a tenant setting.**
   `ai_industry_signoffs` (industry, counsel's reference, date) is written by a
   migration only and is empty today. A sign-off is about a sector's rules, not
   about one client, and must not be self-granted by a client's admin.
8. **Turning it off keeps the contract reference** (unless cleared) and clears who
   turned it on and when. The audit keeps the history: `ai.enabled`,
   `ai.disabled`, `ai.contract_changed`, each with the reference.
9. **Limits (§4.9), config values until Slice 14:** 30 calls a person and 200 an
   organisation per rolling hour, and 20 million tokens an organisation per calendar
   month (India), counting input, output, cache-read and cache-write tokens alike.
   That is about 600 explanations a month. Counting cache reads at full weight is
   deliberately conservative. A hit answers 429 with `Retry-After`. The counts come
   from one SECURITY DEFINER function (`public.ai_usage`), so a person's narrower
   read permission cannot hide calls from the limit.
10. **What the Question Helper sends (§4.6 allow-list):** the question's text and
    evidence guidance; its area's **name**; the suggested owner (a role); whether it
    is mandatory; the organisation's name, type and industry; whether it is
    answered, applies and the claimed level (0–5); how many evidence items are
    attached and accepted; and, as untrusted data, the answer's notes, the N/A
    reason, the evidence **file names** and the person's own question. All of it is
    scrubbed (A3) and stripped of bank codes (§4.5). **Never sent:** a question or
    pack code, weight, priority, trigger, evidence level, adjusted score or cap, any
    person's name, email or id, a reviewer's notes, a storage path, file contents.
    The organisation's own name is sent: a Data Fiduciary is not a Data Principal,
    and the answer must be about this organisation (§4.13).
11. **The corpus:** the Act and the Rules extracted once from `docs/legal/` by
    `tools/extract_legal_corpus.mjs`, Hindi running heads removed, G.S.R. 892(E)
    applied where its target is unambiguous (five of six corrections). The sixth (a
    Schedule's punctuation and "(a) to (f)" → "(a) to (g)") cannot be placed by line
    after extraction, so the corrigendum's own text follows the Rules in the prompt.
    Version `dpdp-act-2023+rules-2025+gsr892e/<hash>+guidance/<hash>`; a unit test
    recomputes the hash. TrustStack's guidance (`lib/ai/corpus/guidance.ts`) is
    written by Claude for Anix and is **for Aniket's review as the DPDP expert**: it
    glosses the terms, gives the commencement dates, and lists the law's numbers
    apart from TrustStack's defaults.
12. **The provider:** `claude-opus-5-5`, effort `low` for the Question Helper,
    `max_tokens` 8,000 (thinking included), structured output, `fallbacks: "default"`
    under `server-side-fallback-2026-07-01`, a one-hour prompt cache on the corpus
    prefix (calls are occasional; a five-minute cache would mostly miss). The model
    that actually answered (a fallback may differ) is the one stored. The answer is
    returned whole: the provider streams internally to avoid timeouts, and
    streaming to a screen arrives with the panel (Stage 1b).
13. **The kill switch is OFF unless `AI_ENABLED` is exactly `true`.** CI and e2e set
    it, with `AI_PROVIDER=fake` (the recorded fake, which refuses to run on the live
    site). **The live site must not set it** until A1 (the provider's DPA and the
    client DPA's AI sub-processor clause) is in place. `ANTHROPIC_API_KEY` is read
    by `lib/ai/claude.ts` alone; `tools/check_service_role.mjs` now enforces that and
    scans the client bundle for the key's value.
14. **Recording an SDF notification on Mumbai University now turns its assistant
    off.** `tests/rls/exposure.test.ts`'s audit expectation gains `ai_enabled`
    (Slice 9's test, by A4). That is the only existing test changed.

### D-126 · 2026-10-19 · Stage 1a approved as built; Stage 1b is next
**Aniket, 2026-10-19:** ran the manual test with `node tools/ai_manual_test.mjs`, "all
green" (29 of 29 checks), then chose **"Approved, all 15 calls"** when asked to record
it as "Stage 1a approved".

1. **Stage 1a is approved as built** (D-125): the gateway, off by default with the A2
   switch and the A4 holds, the versioned corpus and the citation check, the guardrails,
   the allow-list and scrub, the insert-only draft store, audit, usage and limits, the
   provider behind its interface, the recorded fake in CI, and the key gate.
2. **All fifteen calls in walk-through §10 stand as recommended.** That includes the
   limits (30 / person / hour, 200 / organisation / hour, 20 M tokens / organisation /
   month), a hold turning the assistant off rather than blocking the change that causes
   it, the organisation's own name in the context, and TrustStack's guidance text as
   written (call 11).
3. **Call 15 is a Stage 1b deliverable:** the live smoke's mislabelled source (s.8(10)
   called a "TrustStack default") becomes the **first case of the reference set**
   (§4.13), together with the server rule: an entry citing the Act or the Rules whose
   point carries no TrustStack target is labelled "the law".
4. **Nothing merges yet.** The branch stays one draft PR (#41) into `main` until the end
   of Stage 2b (D-123). The migration stays local; the live site's `AI_ENABLED` stays unset.
   §6's contract work (A1, A5) and counsel's points (D-124.3, A4, A5 incl. fallback models)
   are unchanged and still open.
5. **Next: "Start Slice 11 Stage 1b"** in a new window — the side panel and the four
   explain helpers, the on/off switch in Organisation settings, thumbs up/down, and the
   reference set.

### D-127 · 2026-10-20 · Slice 11 Stage 1b — explain in the app: the calls the prompt did not make
Built on `slice/11-ai-assistant` from "Start Slice 11 Stage 1b". Migration
`20261021000000_ai_explain_helpers` (local only until the slice's PR at the end of 2b,
D-123). Walk-through §9 puts each call to Aniket with a DPDP-consultant verdict.

1. **A calm progress state, not streaming (§4.12, §7a.5's choice).** The panel says
   "Reading the Act, the Rules and your organisation's own records…" and, after ten
   seconds, that a careful answer takes 15–25 seconds and is checked in full first. The
   guardrails (wording, other tenant, citations, the new label rule) judge the WHOLE
   structured answer; streaming would put unchecked words on the screen before a
   rejection, which §4.3 ("never a half-answer") rules out. The provider still streams
   internally (D-125.12).
2. **The server rule (D-126.3), one way only.** An entry citing the Act or the Rules that
   the model labels a TrustStack default is relabelled "the law" unless its point names
   a TrustStack target (30 days; the 48 h / 12 h breach-clock ALERTS; the twelve-month
   review). The reverse is not relabelled: "48 hours" alone is Rule 8(2)'s notice and
   "once in every twelve months" is Rule 13(1). The reference check fails a TrustStack
   target labelled the law, so that direction is caught by the set, and §4.11's wording
   check still rejects "the Act requires … 30 days".
3. **Prompt `2026-10-20.1b`** (was `2026-10-19.1a`): two instruction lines — every
   provision of the Act or the Rules is "statute", "truststack_default" only for
   TrustStack's own targets; the "answer" field is one sentence of at most twenty-five
   words (the live smoke's finding 2; the reference check allows thirty); and "say who
   decides" — never describe evidence as accepted, a gap or action as closed, or a score
   as changed (from the live run, item 15). The corpus and the guidance are unchanged, so
   `CORPUS_VERSION` is too.
4. **What the Evidence Helper sends:** each file's review verdict and its NAME (as
   untrusted data), how many are attached, awaiting review and accepted (Adequate or
   Strong, D-056), the level claimed, and WHETHER the evidence held the claim down —
   never by how much, never an evidence level, the cap, the reviewer, a review note, the
   uploader, a storage path or a file's contents. An unanswered or Not Applicable
   question is a 409 ("Answer this question first"), not a guess.
5. **The Gap/Action Helper's target is always the gap;** from the Actions page it is
   asked by the action's id alone (`{ actionId }`) and the draft's `target_key` names
   the action. Only an action on an ASSESSMENT gap has the button — a ROPA, breach,
   rights or retention action has no assessment gap to explain yet (Stage 2a/2b or later).
   Owners go as roles plus "has an owner"; never a name or id.
6. **What the Score Helper sends:** the domain's share of its points as a percentage —
   never its weight — its band, confidence, counts, gaps, provisional/finalised; and,
   with `response.read` (every role holds it), the evidence effect from the STORED
   adjusted scores: how many answers were held down and by how many answer points, and
   the average claimed and counted. Without `response.read` it says the effect is not
   known. It reads through `readAssessmentScore` (a finalised assessment's snapshot) and
   a new reader, `readResponsesForDomain`.
7. **Thumbs up / down (§4.13):** a column set on `ai_drafts`, not a table. Given once,
   by the person who asked, on an answer that was kept (never a rejected call); the
   comment ≤ 500, scrubbed (A3) before it is stored, never audited (`ai.feedback` carries
   task, target, up/down and "with a comment"). Rating still works after the assistant
   is turned off: it sends nothing to the provider. The database guard replaces 1a's
   blanket "never changed" trigger with "only the rating changes", for tooling too.
8. **The button is hidden, not disabled, when the assistant cannot answer** (§7a.5):
   no `ai.use`, no task permission, or `GET …/ai` says off/held/platform-off. The off
   message then lives in Organisation settings; the panel shows it only if the assistant
   was switched off while the page was open (a 403).
9. **Organisation settings → AI assistant** (a fifth tab, last): what it does and never
   sends, in plain words, with s.8(2); the status ("On since …, turned on by …, under
   contract …"); the hold or platform notice; the contract reference (required to turn
   it on). Everyone sees it; only `organization.update` changes it. `GET
   /organizations/{id}` gains `ai.enabledByName` (additive) for "turned on by".
10. **One click to an answer:** opening the panel asks at once; "Ask something more
    specific" asks again with the person's own words, each a new call under the §4.9
    limits, with a reminder not to type anyone's name, email or phone.
11. **The reference set** (`packages/core/src/ai-reference-set.ts`, `2026-10-20.1b`):
    twenty explain cases — twelve questions, two evidence, two gap/action, three score,
    plus R20 (thirty days is TrustStack's). Each has its target on MU's seed, the
    provisions it must rest on, the labels it must get right, its allowed next steps,
    its must-not-say lines and, where the law is unclear, "counsel to confirm". The
    recorded answers are hand-written to the shape a good answer takes, except R1,
    which keeps the live smoke's citations and its s.8(10) mistake. CI runs each through
    `evaluateAnswer` and `checkReferenceAnswer`; `tools/ai_reference_run.mjs` runs the
    same check against the live model by hand.
12. **The recorded fake answers each new helper with its reference case** (R13 evidence,
    R15 gap, R17 score) so the panel's screenshots and the manual test show answers that
    fit; the Question Helper keeps 1a's answer, so 1a's e2e is untouched.
13. **A Stage 1a bug, fixed:** the Question Helper counted evidence "accepted" by a review
    status that does not exist (`accepted`), so it always sent 0. It now counts Adequate
    or Strong, core's accepted evidence (D-056). One test fixture changed with it.
14. **"Why this score?" on every scored scorecard row and on the domain tile;** "Explain"
    beside each question's details; "Is this evidence enough?" on each answer's evidence;
    "Explain this gap" on each gap; "Explain this action" on each assessment action (All
    actions, My actions, By owner). The panel's three short lists are bounded by the
    answer schema (≤ 8 each) and allow-listed in the paging guard.
15. **A 1a guardrail narrowed, from the live reference run** — for Aniket's confirmation
    (walk-through §9 call 12). The first live run passed 14 of 20. The `approves_evidence`
    and `closes_gap` wording rules refused the assistant's own correct disclaimers, 7
    times in 8 repeat calls of the evidence and gap cases: "a reviewer, not this
    assistant, decides whether the evidence is accepted", "the action can be closed once
    that evidence is accepted", "whether the gap is closed". For those two rules only, a
    denial or a condition (whether, once, until, unless, if, when, after, before) earlier
    in the same clause is not a claim — the same clause-bounded test 1a uses for
    "compliant" (D-125.3). A comma still ends the clause, so "Once uploaded, the evidence
    is accepted" and every bare claim are still refused; unit tests prove both ways. The
    gateway now logs the refused rule's NAME (never the text) as `[ai] … refused: …`.
16. **The live reference run after the change: 20 of 20** (`docs/testing/slice11-1b/
    reference_run_live.md`): no refusal, every headline one sentence ≤ 30 words, one
    non-provision citation dropped and flagged, about $1.02 and 268 s for twenty calls.
    The reference set's never-lines are now first-person claims only ("I have approved",
    "I have closed"…); substring lines like "is compliant" or "has been closed" also hit
    correct denials and conditions, which the server's wording check already judges.


### D-128 · 2026-10-20 · Stage 1b approved as built, call 12 included; Stage 2a is next
**Aniket, 2026-10-20:** ran Part A of the manual test (`node tools/ai_manual_test_1b.mjs`;
Step 8's ✗ was the tool misreading vitest's coloured output — fixed in `367ff1a`, the 24
reference tests had passed), the reference set against the live model (**20 of 20**, his own
run), and the panel in the browser on the real model (three answers kept, one rating). Asked
what call 12 means, then: **"Stage 1b approved"**.

1. **Stage 1b is approved as built** (D-127): the side panel with the Question, Evidence,
   Gap/Action and Score helpers; thumbs up/down; the AI assistant tab in Organisation
   settings; the reference set (20 explain cases) with the server's label rule (D-126.3).
2. **Every call in walk-through §9 stands as recommended — including call 12** (D-127.15):
   for the evidence and gap wording rules, a denial or a condition (whether, once, until,
   unless, if, when, after, before) earlier in the same clause is not a claim; a bare claim
   is still refused. Aniket's explicit yes, as §7a.7 required for any guardrail change.
3. **Call 9 (the reference set's recorded answers):** approved with the stage; Aniket's
   review of R1–R20 as the DPDP expert stays an open loop before Slice 11 closes (2b), and
   counsel's later. R20's "no access-request deadline" reading stays for counsel. R17's live
   wording ("evidence is not yet fully reviewed" for an answer reviewed as Partial) is a
   loose phrase, not a legal error — noted for the reference set's next version.
4. **Asked and answered — one organisation's data never reaches another's answer:** every
   context is read for the active organisation through tenant-filtered readers and RLS; the
   cached prompt prefix carries only the law, the guidance and the instructions (identical
   for every client); the API keeps no memory between calls; drafts are per-organisation
   under RLS; an answer naming another organisation the person belongs to is refused (Gate 5
   tests: `tests/rls/ai.test.ts` §1, `e2e/api/ai*.spec.ts`, the route sweep). Provider-side
   retention stays A1's contract point (zero data retention).
5. **Nothing merges yet** (D-123): one draft PR (#41) until the end of Stage 2b; migrations
   `20261020000000_ai_gateway` and `20261021000000_ai_explain_helpers` stay local; the live
   site's `AI_ENABLED` stays unset.
6. **Next: "Start Slice 11 Stage 2a"** in a new window — SLICE_11 §7b, written by this
   approval's handover check against the code.

### D-129 · 2026-10-20 · Stage 2a opened — §7b's three calls answered before any code
**Aniket, 2026-10-20:** opened "Start Slice 11 Stage 2a"; Claude put §7b's three calls with
a DPDP-consultant verdict each (checked in `docs/legal/`, `pdftotext -layout`); Aniket chose
the recommendation on all three, call (i) with Claude's one addition.

1. **(i) The accepted Rule 7(2) intimation lives on the draft row** (`ai_drafts.accepted_output`),
   shown on the breach's "Detailed report to the Board — Rule 7(2)(b)" step with Copy and
   Download; recording that the report was made stays the person's existing step; **no
   breach-register migration**. **Addition:** that step carries one line — attach the copy
   actually sent under the breach's Documents (`RegisterDocuments`, whose hint already says
   the Board intimations belong there). Basis: s.8(6) and Rule 7(2)(a)–(b)(i)–(vi) set the
   duty and the contents, not a form; the register proves it was made, the attached copy
   proves what was sent, the draft row only what was drafted. Risk avoided: a TrustStack
   draft mistaken for what was filed (Schedule item 2, up to ₹200 crore).
2. **(ii) The rights response is a letter with `[Name]`, `[reference]` and `[date]`
   placeholders**; accepting it shows the letter to copy and pre-fills only the summary box
   (`rights-response-summary`, ≤ 4,000) with the draft's one-paragraph summary. **The outcome
   (fulfilled / partly fulfilled / declined) is never pre-filled** — whether to refuse an
   erasure turns on s.12(3) ("necessary for the specified purpose or for compliance with any
   law"), a person's legal judgement. Placeholders because §4.6 keeps the Data Principal's
   identity home. Rule 14(3)'s ninety days concerns grievances; the respond-by date stays a
   TrustStack target, never presented as statute.
3. **(iii) Any holder of the register's write permission may accept or discard** (`ropa.write`,
   `breach.write`, `rights.write`), not only the asker; audited `ai.draft.accepted` /
   `ai.draft.discarded` (task, target, never the text). Accepting only pre-fills — the
   register's own Save still checks its write permission (s.8(1): the fiduciary stays
   responsible; Rule 6(1)(c): logged). D-043 does not apply: accepting is not an approval.
4. §7b's build list stands otherwise as written.

### D-130 · 2026-10-20 · Slice 11 Stage 2a — drafts for the registers: the calls the prompt did not make
Built on `slice/11-ai-assistant` (draft PR #41) to SLICE_11 §7b, with D-129's three answers.
Migration `20261022000000_ai_register_drafts` (local only, D-123). For Aniket's confirmation
at the gate (walk-through §9):

1. **Rule 7(2)(b)(vi) is written by the server, not the model.** It comes from the breach
   register's own Rule 7(1) record ("The affected Data Principals were informed on …, by:
   …"), or says none is recorded yet. §7b said (vi) "is written from
   `principals_intimated_at` and `principals_intimation_method`". A deterministic sentence
   cannot misreport to the Board what was told to whom.
2. **The model's schema has no (iv) field at all.** The server always writes the placeholder
   (`AI_INTIMATION_PERSON_PLACEHOLDER`); a model answer carrying one fails the schema. The
   person may complete (iv) in the panel; their text stays on the tenant's draft row and is
   never sent to a model.
3. **Asking for a draft needs the register's write permission too** (§7b.2: "the gateway
   must check `writePermission` beside the read one"). The panel hides the button without
   it; the gateway refuses with 403.
4. **Only an open or contained breach, and only an open request, can be drafted for**
   (409 otherwise, nothing stored). A closed or dismissed breach, or a responded request, is
   reopened first. This matches where the register's own forms are editable.
5. **The rights form's outcome starts unchosen when a draft fills the summary.** The form
   defaulted to "Fulfilled"; with a pre-filled summary that would make a fulfilled outcome a
   single click. A person must now pick it (D-129.2; s.12(3)). Without a draft, the form is
   unchanged.
6. **A rights letter that states an outcome is refused** (`wording`, detail
   `states_outcome`, core `statesRightsOutcome`), **and one without its `[Name]` and
   `[reference]` placeholders is refused** (`invalid_output`). Conditions ("once we have
   verified…") and placeholders pass; unit tests prove both ways.
7. **A ROPA draft's lawful basis may be "not sure"**, stored as no basis, for counsel to
   confirm (s.4, s.6, s.7; D-065). A ROPA draft is a register entry, not a legal draft
   (`legal: false`, §7b.2); it shows the counsel note only if the model hands a point to
   counsel.
8. **Accepted text is readable by anyone who holds `ai.use` and the register's read
   permission** — the same people who read the register (`GET …/ai/drafts?targetId=`).
   Accepting or discarding works while the assistant is switched off: a decision sends
   nothing to the provider (s.8(2) not engaged).
9. **The cached system prefix is unchanged**, byte for byte; the drafting instructions live
   in each task's user turn. `PROMPT_VERSION` moves to `2026-10-20.2a` so every draft row
   records which instructions wrote it; the explain helpers' prompts are unchanged.
10. **New routes:** `GET …/ai/drafts?targetId=` and `GET …/ai/drafts/{draftId}` (beside §7b's
    accept and discard). The new-record form needs to read the accepted draft back, and the
    breach and request pages need the latest accepted text. Each has a sweep probe.
11. **The organisation's name is not in the recorded letter's signature.** The e2e caught it:
    a person who belongs to two organisations had the recorded letter refused as "naming
    another organisation" — the other-tenant check working. The letter signs "[Name and
    role]".
12. **The seed is unchanged.** Mumbai University has no open breach or open request, and
    seeding one would move MU's exposure (head 7) and several CI baselines. The manual test
    and the live reference run record fictional ones on the local stack, which is then
    rebuilt.
13. **A draft's two lists are kept to the first eight** (from the live run). The live model
    cited more than eight provisions, or listed more than eight unknowns, for a long letter,
    and seven of ten drafts were refused as `invalid_output` in run 1. The bound of eight is
    the panel's (D-101), not the law's. The model is asked for "at most eight, the most
    important first", and the server keeps the first eight instead of refusing the draft.
    Each kept citation is still checked against the corpus. The explain answers' schema is
    unchanged.
14. **A drafting case's never-lines judge the draft's own text.** Run 1's D10 note said,
    correctly, "The draft does not say 'we have erased everything', as asked", and the
    never-line "we have erased" matched the quote. The first-person never-claims still judge
    everything (as D-127.16 did for the explain answers).
15. **D7 passes on a kept draft without the claim, or on a `wording` refusal**
    (`refusalPasses`). In run 2 the model wrote "A statement that the university is fully
    compliant cannot be added"; 1a's rule exempts only a denial that comes before the claim
    (D-125.3), so the draft was refused. Nothing claiming compliance was kept, which is safe.
    **The rule itself is not changed (§7b.9): narrowing it to a trailing denial is put to
    Aniket as walk-through call 15.** Live result after these: **10 of 10**
    (`docs/testing/slice11-2a/reference_run_live.md`).

### D-131 · 2026-10-21 · Stage 2a approved with Option A; Stage 2b is next
**Aniket, 2026-10-21:** ran the manual test on his laptop: Part A, Part B in the browser, then the
real model (Part C run for him at his request — 9 of 10, D10's headline two sentences, its draft
passing every substantive check; then his own browsing on the real model). Then: **"Stage 2a
approved with Option A (your recommendation)"**.

1. **Stage 2a is approved as built** (D-129, D-130): drafts for the registers — a processing record
   from a description, the Board intimation under Rule 7(2), a rights response — accepted or
   discarded by a register writer, accepting only pre-filling the register's own form.
2. **Every call in walk-through §9 stands as recommended.** **Call 15: Option A** — 1a's wording
   rule is NOT narrowed; a denial that follows the claim ("… cannot be added") is still refused,
   so a request to add a compliance claim may end in "That draft was not kept". D7 passes on a
   kept draft without the claim or on a `wording` refusal (D-130.15).
3. **CI has not run Stage 2a's finished code.** From `f5628b0` (2026-10-20) GitHub refused to
   start every job: "recent account payments have failed or your spending limit needs to be
   increased" (Billing & plans — Aniket's account). The approval rests on the local gates (core
   1,391 · web unit 864 · RLS 574 · 24 SQL gates · e2e 469/469). **CI must be re-run and green
   on the slice branch before PR #41 leaves draft and merges at the end of 2b**; any failure it
   finds is fixed first. (`dc1d07b`'s real unit failures were fixed in `f5628b0`.)
4. **Nothing merges yet** (D-123): one draft PR (#41) until the end of Stage 2b; migrations
   `20261020000000_ai_gateway`, `20261021000000_ai_explain_helpers` and
   `20261022000000_ai_register_drafts` stay local; the live site's `AI_ENABLED` stays unset.
5. **Next: "Start Slice 11 Stage 2b"** in a new window — SLICE_11 §7c, written by this approval's
   handover check against the code; its three calls go to Aniket first.

### D-132 · 2026-10-21 · CI spends minutes only where code changed
**Aniket, 2026-10-21:** fixed GitHub billing (a payment method; an Actions budget of $15 a month;
the other products' $0 budgets kept, so they stay blocked) and said yes to cutting CI's minutes.
October had used about 1,830 minutes of the free 2,000 (172 `app` runs, most of it the e2e job).

1. **`app.yml` gains a first job, "what changed".** It diffs this push (`github.event.before` →
   the head) and runs the two heavy jobs (`quality`, then `integration`) only if a file outside
   `docs/` and `*.md` changed. A first push, a force-push, a re-run or anything it cannot judge runs
   everything. Judged per push because a `pull_request` path filter sees the whole PR's files — on
   a long-lived PR like #41 it would never skip. Nothing in the two jobs reads a document at run
   time: the question packs and the Act reach the code only through generated files under `apps/`
   and `packages/` (checked 2026-10-21), so a change to those still runs everything.
2. **`docs.yml` cancels a run superseded by a newer push** on the same branch (`app.yml` already did).
3. Skipped jobs show as "skipped" on the PR; GitHub Free has no branch protection on a private
   repository, so nothing waits on them. A documents-only push still runs `docs.yml`.
4. **D-131.3 is met:** `3a5d05b`, the first full CI run of Stage 2a's code after billing was fixed, is
   green on every job — core 1,391 · web unit 864 · RLS 574 · e2e 469/469, the local numbers exactly.
   Stage 2b starts with §7c's three calls; the handover was re-checked for this (STATE, SLICES,
   SLICE_11 ▶ NEXT, §0, §7c).

### D-133 · 2026-10-22 · Slice 11 Stage 2b — §7c's three calls, as recommended
**Aniket, 2026-10-22:** opened "Start Slice 11 Stage 2b" and chose the recommendation on all three
of SLICE_11 §7c's calls. Each was checked first against the code (`begin_report`, `complete_report`,
`app.report_is_immutable()`, `app.consent_languages()`, core `consent.ts`, `ropa.ts`) and the Gazette
text in `docs/legal/` (Act s.4(1), s.5(1)–(3), s.6(4), s.7, s.13(3); Rules, Rule 3).

1. **(i) A narrated report is the stored document plus the narrative.** The Exposure Brief, the
   Programme Status Report and the evidence pack store their built `ReportDocument` with their row
   (`reports.document`, written by `complete_report`; `app.report_is_immutable()` lets the finish
   step write it once and never again). A narrative is drafted FROM that stored document; accepting
   it lets a `report.generate` holder render version N+1 as version N's stored document plus the
   narrative block — the same snapshot, the same figures, a new file, version N untouched (D-076).
   **Every number in the narrative must appear in the stored document**, else `invalid_output` —
   except a legal citation's numbers ("s.8(6)", "Rule 7(2)") and the document's own dates, which
   would otherwise refuse every narrative. Rejected: narrating at generate time with a reused
   snapshot — the registers are read live and could still move between versions (pitfall 1).
2. **(ii) Translation offers Hindi and Marathi only.** s.5(3) gives the Data Principal the option of
   English or an Eighth Schedule language; that duty is the client's, and the notice editor already
   publishes in all 22 (`app.consent_languages()`), so nothing is taken away. Another language is
   added once its own reference cases pass live. A translation keeps every purpose's `key` and the
   purposes' count (a server check) and is a legal draft for counsel.
3. **(iii) A notice is drafted from the consent-based records.** s.5(1) ties a notice to "every
   request … under section 6 for consent"; s.7's legitimate uses (incl. s.7(a)) make no such request.
   So the draft reads the processing records whose `lawfulBasis` is `consent` or not yet decided —
   never an s.7 or s.17 basis. Rule 3(b)'s itemised data and purposes are drafted; Rule 3(c)(i) and
   (iii) stay TrustStack's fixed texts (`WITHDRAW_TEXT`, s.6(4); `BOARD_COMPLAINT_TEXT`, s.13(3)),
   never drafted; the contact for rights (Rule 3(c)(ii)) is a `[placeholder]`.

### D-134 · 2026-10-22 · Slice 11 Stage 2b — notice, translation, narrative: the calls the prompt did not make
Built on `slice/11-ai-assistant` (`750bb24`, `d180738` and the gate commit), migration
`20261023000000_ai_notice_narrative` **local only** (as 1a–2a's, D-123). For Aniket's approval in
the walk-through (`docs/testing/SLICE_11_stage2b_walkthrough.md` §9).

1. **The notice draft has no "other means" fields.** §7c.3 listed `withdrawMeans`, `rightsMeans`,
   `complaintMeans` in the schema. D-133.3 keeps Rule 3(c)(i) and (iii) TrustStack's fixed texts, and
   the notice page already prints the forms' links and the published contact for (c)(ii) — so the model
   drafts only the title, the introduction and the purposes; the three "other means, if any" stay empty
   for the person in the editor. The `[placeholder]` for the contact is therefore not needed. A draft
   carrying any of them (or a status) is refused as `invalid_output`.
2. **A purpose already consented to keeps its key.** The notice builder sends the newest published
   English notice's purpose keys and titles, and tells the model to reuse a key for the same purpose —
   a consent record names a purpose by its key (s.6). A draft's purposes must pass core
   `noticePurposeProblems` (publishable shape) or it is not kept.
3. **A translation's language and keys are the server's.** The language comes from the request, never
   the model; the keys go to the model in their own `<purpose_keys>` block, apart from the text, and the
   server refuses a changed, missing, extra or repeated key — for the model's draft and again for the
   person's accepted edit (422). A translation is made from a PUBLISHED notice into another language.
   Accepting pre-fills a NEW notice in that language; the editor's key fields are read-only in the panel.
4. **The number check (D-133.1) is a set check.** Core `numbersNotInDocument`: every figure the
   narrative states (Indian grouping and decimals normalised) must appear somewhere in the stored
   document's printed text (`reportDocumentText`); a citation's numbers are taken out first ("s.8(6)",
   "Rule 7(2)(b)", "sections 11 to 14", "the Act, 2023"). It catches a figure the report never states —
   not a true figure put to the wrong use, and not a number written as a word ("four"). The person's
   accepted edit is held to the same rule (422 with the numbers named).
5. **What a narrative reads.** The stored document's sections before the appendices (`pageBreakBefore`),
   tables to their first twelve rows, the "Generated" line dropped, every active member's full name
   replaced by "[a member]" before the scrub, all of it untrusted data. The WHOLE stored text stays on
   the server for the number check (`facts`, never stored in the draft's context).
6. **The narrated version is printed by `begin_narrated_report`**, a fourth report function (the CI gate
   "A report is a record…" now names four): version N must be ready, narratable, not itself narrated,
   and have kept its document; the narrative must be an ACCEPTED `report_narrative_draft` about version
   N; one narrated version per narrative (a failed attempt may be retried). `complete_report` gains
   `p_document` (the two-argument form is dropped) and refuses a narrated document that is not version
   N's sections, caveats and notes with one section in front. A version generated before this migration
   has no document and cannot be narrated ("Generate a new version, then draft its narrative").
7. **The narrative is printed with existing block types**, as a first section "Executive narrative": a
   notice ("Drafted with the TrustStack AI assistant and accepted by … on …. It reads the figures below,
   which are this report's own as recorded in version N. It does not assess or certify the
   organisation's position under the Act."), the headline, the paragraphs, the points to act on. The
   header says "Version N+1" and "Figures: As recorded in version N (…)"; the footer the new version.
   The PDF renderer is unchanged.
8. **"Print the narrated version" survives a reload.** The report list returns, per narratable version,
   its latest accepted narrative with no printed version yet (`pendingNarrativeDraftId`), read through
   the person's own RLS. Accepting never prints; printing needs `report.generate` alone (no new exposure
   snapshot is recorded, so not `score.calculate`).
9. **The live narrative cases.** Run 1: D19 sent an empty `law` list (`invalid_output`) and D20 was
   refused by the statute-target wording rule. Fixed in the prompt (`PROMPT_VERSION` `2026-10-22.2b`):
   the narrative's user turn asks for at least one provision and says what to do with a forbidden ask;
   and the narrative's structured-output schema alone gains `law.minItems: 1` (accepted by the API;
   the approved tasks' schemas are unchanged, §7c.9). **D20 passes on a `wording` refusal**, as D7 and
   D19 do (D-130.15): its ask IS the forbidden statement, so a draft without it or none at all meets the
   case. Final live run on a clean seed: **10 of 10** (`docs/testing/slice11-2b/reference_run_live.md`).
10. **Wording rules are English.** A Hindi or Marathi translation is checked for its keys, its shape, its
   citations and the other tenant's names; 1a's wording rules (e.g. "compliant") match English text
   only. The source notice is staff-written and the translation is a legal draft for a reviewer who
   reads the language and for counsel. Put to Aniket as walk-through call 4.
11. **Free e2e tenants are `…a034` onwards** (`…a032` the API spec, `…a033` the UI spec).

### D-135 · 2026-10-22 · Stage 2b — two fixes from Aniket's Part C run
**Aniket, 2026-10-22:** ran the manual test's Part A (39 of 39) and asked Claude to run Part C (the
ten new cases on the real model): **7 of 10**. Nothing wrong was kept: D11 (a notice) sent no
provision (`invalid_output law`); D19 and D20 (narratives asked for a compliance claim and a
TrustStack target as the law) left the forbidden statement out, as the prompt asks, and explained why
in a note over 300 characters (`invalid_output missingInformation.N`). Aniket: "make the two fixes …,
reset the local database, and re-run the ten cases on the real model."

1. **A provision is required on all three Stage 2b drafts** — `law.minItems: 1` in the notice's and the
   translation's structured output too (the narrative's since D-134.9); their prompts ask for one
   (s.5(1) and Rule 3; s.5(3)). The Zod schema already required it.
2. **A note in "What the assistant did not know" may run to 600 characters on Stage 2b's three drafts**
   (`DRAFT_NOTE_LIMIT_2B`, as the law points' 600); prompts ask for one or two sentences. **2a's three
   drafts keep 300 and their schemas unchanged** (§7c.9) — tested both ways.
3. `PROMPT_VERSION` `2026-10-22.2b-2`. Local database reset to the clean seed before the re-run (the
   Registrar had used the hour's thirty calls).

### D-136 · 2026-10-22 · Stage 2b approved; Slice 11 closes
**Aniket, 2026-10-22:** "Stage 2b approved, including call 11 (widen the TrustStack-target pattern to
"thirty-day" etc. in the slice's close)", after his manual test (Part A 39/39) and Part C (10/10 after
D-135).

1. **Stage 2b is approved as built** (D-133, D-134, D-135): every walk-through §9 call as recommended.
   **Call 10 — his review of the reference set (R1–R20, D1–D20, D-128.3)** is the one item the slice's
   merge waits on; it is asked for explicitly with the merge approval (not assumed from this phrase).
2. **Call 11, built in the close (`742b4ec`):** core's `TRUSTSTACK_TARGET` and `TRUSTSTACK_ALERT` match
   the hyphenated forms ("30-day", "thirty-day", "12-hour", "48-hour"). A point naming TrustStack's
   thirty-day target keeps its "TrustStack default" badge (D-126.3), and a hyphenated target stated as
   the law is refused (`statute_target`). Tests. A guardrail change, made on Aniket's word.
3. **The notice editor's save/publish race, fixed in the close (`742b4ec`).** 0f14084's CI failed
   `ui/consent.spec.ts:65` on all three tries: saving a NEW draft moved to the notice's own page, and a
   Publish click in between published the draft, then the new page overwrote "Version 1 is published."
   with "Draft saved." — a real (if quick-fingered) user's view too, and the flake STATE had carried
   since Slice 10. The page being replaced now stays busy and offers no Publish. 3/3 locally.
4. **SLICE_12 promoted from its stub** (`docs/slices/SLICE_12_reassessment.md`), written against the
   code — two stages, twelve decisions for Aniket's approval (§4), the stub's six "must not be lost"
   kept. SLICE_13's stub gains Slice 11's carry-forwards (A1 before `AI_ENABLED` on the live site;
   Hindi/Marathi wording rules; evidence-content reading after a sandbox; the old app's AI routes to
   retire).
5. **What remains of Slice 11:** CI green on the close; PR #41 out of draft; Aniket's merge approval
   (with call 10); merge; after the production deploy, the four Slice 11 migrations on hosted, in
   order, then `gen_db_types --check` against hosted. `AI_ENABLED` stays unset on the live site.

### D-137 · 2026-10-22 · The reference set reviewed as a DPDP expert; nine fixes and R21 (call 10)
**Aniket, 2026-10-22:** asked Claude to "act as a tough DPDP expert and review the reference set",
then "fix F1–F3 and P1–P5 …, re-run the affected cases live, then come back for the merge". The review:
`docs/testing/SLICE_11_reference_set_review.md` (every cited provision checked in the Gazette text).

1. **F1 — the ninety days are for grievances.** Rule 14(3) and s.13(2) set a period for GRIEVANCES; the Act
   and the Rules set none for access, correction, completion, updating or erasure requests. Fixed at the
   source — the assistant's guidance (`lib/ai/corpus/guidance.ts`, in the cached prefix; the corpus
   version moves with it), the rights-letter prompt, R20 (rewritten: "no legal deadline for an access
   request"), D20's recorded law. TrustStack keeps ninety days as ITS outer limit for a request and thirty
   as its target, both labelled TrustStack's. **The rights register's own note (`RIGHTS_CLOCK_NOTE`,
   D-083) still says "the Rules set one period" — put to counsel with R20's open question, not changed.**
2. **F2 — access and the s.12 rights exist only for consent-based processing** (s.11(1), s.12(1):
   "previously given consent, including … clause (a) of section 7"). The guidance says so; the rights
   letter never says an s.11/s.12 right applies: for those five kinds the server refuses a letter without
   `AI_RIGHTS_APPLIES_PLACEHOLDER` (`draft.letter: right_applies`); grievance and nomination need none. R1
   names the limit; **new R21** (a staff member's payroll data — s.7(i), probably no s.11 right, counsel to
   confirm). Core `rightsKindNeedsConsentBasis`.
3. **F3 — Rule 9's contact in every rights response.** `AI_RIGHTS_CONTACT_PLACEHOLDER` joins
   `AI_RIGHTS_PLACEHOLDERS`; the server refuses a letter without it (`draft.letter: rule_9_contact`). D8–D10
   expect both placeholders.
4. **P1–P5:** R5 reframed to s.5(1)'s consent request ("accompanied or preceded by"); "comparable", not
   "same", ease (R4, D12; s.6(4)); R13 no longer rewards "the Act requires a DPO" for a non-SDF (its
   never-lines name only the unconditional claims — the live model rightly said "only a notified SDF must
   appoint a DPO"); R18 "the highest penalty ceiling (up to ₹250 crore)"; TrustStack targets' points say
   they are not in the cited provision (R6, R20, D20). P6 (R8, Rule 13(4)) left as optional.
5. Reference set `2026-10-22.2b-3` (41 cases: R1–R21, D1–D20); `PROMPT_VERSION` `2026-10-22.2b-3`. Live,
   `claude-opus-5-5`, clean seed: the 13 affected cases **13 / 13** (R13 after narrowing its never-lines;
   `docs/testing/slice11-2b/reference_run_review_20261022.json`). Gates: core 1,403 · web unit 900 · the
   AI, rights and consent e2e 69/69.
6. **A testing slip, recorded:** a stale production server held port 3100, so a first e2e run hit the old
   server with new build files (four UI failures; its API passes meaningless). Rerun on a fresh server:
   69/69. Runners now kill the port's listener, not a process name.

### D-138 · 2026-10-22 · Slice 11 is live; the handover to Slice 12 checked
**Aniket, 2026-10-22:** "I accept the fixed reference set (D-137). Merge PR #41, and after the production
deploy apply the four Slice 11 migrations to hosted."

1. **The reference set is accepted** (D-128.3 met): R1–R21, D1–D20, `2026-10-22.2b-3`, as fixed in D-137.
2. **PR #41 merged** into `main` as `49c9eba` (a merge commit, as #38). CI green on `424052d` (every job,
   e2e 27 min). Vercel's production deploy of `49c9eba` succeeded.
3. **Hosted, per D-071:** before the merge, hosted showed 27 applied and exactly the four Slice 11
   migrations pending. After the deploy, `prisma migrate deploy` applied `20261020000000_ai_gateway`,
   `20261021000000_ai_explain_helpers`, `20261022000000_ai_register_drafts` and
   `20261023000000_ai_notice_narrative` — their apply-time assertions passed — **31 migrations on hosted**;
   `gen_db_types --check` up to date against hosted. Read-only on hosted: ten AI tasks, the three
   narratable report kinds, **two organisations, the assistant on for neither**, no AI draft.
4. **The live site, signed out:** `/api/v1/health` reports `49c9eba`; sign-in loads; dead public targets
   (`/invite/…`, `/p/…/notice`) are one 404; the dashboard redirects to sign-in; the AI route answers 401.
   **`AI_ENABLED` stays unset on the live site until A1** (the provider's DPA, zero data retention) and the
   client DPA's AI sub-processor clause — and every organisation's switch is off.
5. **The handover check (PLAYBOOK §6):** STATE, SLICES, the slice files and DECISIONS name one next step,
   "SLICE_12 approved" (a new window); SLICE_12's baseline says `main` @ `49c9eba` (core 1,403 · web unit 900
   · RLS 581 · 24 gates · e2e 485 · 31 migrations); the prompt after next (SLICE_13's stub) carries Slice 11's
   leftovers (D-136.4). The local stack is the clean seed with `main` checked out.
6. **Open for counsel, carried:** `RIGHTS_CLOCK_NOTE`'s "the Rules set one period" (D-137.1), R20's reading,
   s.16 / Rule 15, A4, A5, s.7(a), the notice and translation drafts.


### D-139 · 2026-10-28 · s.11(1)(b): an access request shows who the data was shared with (a fix, not a slice)
**Aniket, 2026-10-28** (consolidated feature analysis, Q2): "yes do it" — fix the gap now, as a small change
separate from Slice 12.

**The gap.** `core/intake.ts` tells a Data Principal an access reply includes "who it has been shared with
(s.11)", but nothing in the register helped a person compile it. s.11(1)(b) (Gazette text, checked with
`pdftotext`): "the identities of all other Data Fiduciaries and Data Processors with whom the personal data
has been shared by such Data Fiduciary, along with a description of the personal data so shared"; s.11(2)
excludes sharing with a fiduciary authorised by law on a written request for offences or cyber incidents.

1. **Core** `sharing.ts` (pure): `compileSharingList` over the processing register — each non-archived
   record's linked processors (by the vendor register's own role: `data_processor` → Data Processor,
   `independent` → another Data Fiduciary, `unknown` → not yet classified; never inferred) and its free-text
   `sharing`, each with the record's `data_categories`. Only records s.11(1) reaches: `consent` and
   `voluntary` (s.7(a)); **undecided kept and marked**; another s.7 use or an exemption **left out and
   counted**. "None", "nil", "-" mean no sharing.
2. **Route** `GET …/rights-requests/{id}/sharing` (`rights.read`; `ropa.read` re-checked — every role with
   the first holds the second). 409 for any kind but `access`; 404 for a foreign or missing id. Read through
   `readAllRecords` + `ropa_vendors` with the user's JWT (RLS applies). Nothing about the requester.
3. **UI** on an access request's Response tab: "Who the person's data was shared with", a `<DataTable>`
   (D-107), a "Copy the list for the reply" button (`sharingListText`), the s.11(1)(b)/(2) note.
4. **No migration, no permission, no AI change** (the rights-response draft and the reference set are
   untouched — feeding the list to the draft is for Slice 12/13).
5. **Calls for Aniket** (walk-through §Claude's calls): the organisation's list, not the person's; the
   s.11(1) scope; the register's classification; free text shown not parsed (follow-up: a hint on the ROPA
   field — "other organisations only, not your own teams" — MU's seed names internal teams); s.11(2) as a
   note; no AI change now.
6. **Tests:** core +8 (`sharing.test.ts`); API (`rights.spec.ts`: the list, scope, 409/404, no personal
   data, GATE 5 path); the route sweep; UI (`ui/rights.spec.ts`, MU's DPR-2026-001, read-only).

### D-140 · 2026-10-28 · The s.11(1)(b) fix approved and merged
**Aniket, 2026-10-28**, after running `docs/testing/FIX_s11_sharing_manual_test.md` on the local stack:
"done. Fix s.11 approved."

1. **All six calls in the walk-through stand** as recommended (D-139.5): the organisation's list, not the
   person's; consent and s.7(a) only, undecided kept and marked; the register's own classification; free
   text shown, not parsed; s.11(2) as a note; no AI change now.
2. **Call 4's follow-up is open** (carried in STATE): a hint on the ROPA field "Who it is shared with" —
   other organisations only, not your own teams — a small change for Slice 12 or 13.
3. **CI green on `f66adc5`**: every job, including the full e2e (13m54s). Locally the full suite gave 483/486
   (three UI timeouts in breach, retention and rights); all seven tests in those specs pass on a fresh
   database, and CI's run passes them too.
4. **PR #44 merged** into `main`. No migration, so nothing is applied to hosted; the live site gets the
   panel with Vercel's production deploy.

### D-141 · 2026-10-28 · The consolidated feature analysis approved — one platform, Sentinel, packs, and the build sequence
**Aniket, 2026-10-28**, step by step (each step approved before the next): Steps 1–6 approved with
Claude's recommendations; the analysis is `docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md`, the
feature register `docs/reference/feature_register.json`, the tracker `docs/reference/FEATURE_TRACKER.html`
(merged with PR #43 as `8a82ef9`). Step 7 (the final pack) awaits sign-off; nothing below depends on it.

1. **68 consolidated capabilities** (old app + new app + PRD/proposal/deck): KEEP 15 · MERGE 19 · NEW 19 ·
   PARK 13 · DROP 2. The old app's code is never ported; ten of its strengths are rebuilt (analysis §2.3.1).
2. **Commercial:** licence first; client-hosted and a small-business tier both wanted later; **feature
   selection** (ticked modules set the fee, or everything at a fixed fee) in Slice 14; the public chatbot
   kept, rebuilt on the guarded gateway; brands TrustStack™ · DPDP Compass™ · Sentinel™.
3. **Sentinel (Step 3):** 23 controls; no separate score; **Essentials** (six legal-clock controls) in
   the core for every client; tiers Essentials · Lite · Sentinel · Critical; TrustStack defaults
   (12 months; basis within 30 days) labelled and changeable; legal-clock Failing alerts cannot be
   switched off.
4. **Position (Step 4):** "the DPDP assurance platform that proves it" for regulated institutions;
   integrate with registered Consent Managers (no registration of our own now); partner for data
   discovery; client-hosted earlier; first segments universities, NBFCs and co-operative / small-finance
   banks, hospitals, public sector, with CA and law-firm partners.
5. **Industry model (Step 5):** five layers (core · legal-class switches · risk packs · industry pack ·
   client settings); the pack factory; order BFSI → Healthcare → Public sector → EdTech → General →
   SaaS → Retail → Manufacturing → Professional services; the six risk packs first; one industry per unit
   (refines D-040 when multi-entity ships).
6. **Sequence (Step 6):** Slice 12 (+ Sentinel S1, §4.13) → **12.5 Packs I** → 13 → **13.5 Sentinel
   S2–S3** → 14 (launch, target mid-Dec 2026) → 15 client-hosted (Jan 2027) → Phase B before 13 May 2027
   → Phase C; **Track M** (landing pages + chatbot) in parallel. Written into `SLICES.md`, the Slice 12
   prompt (§2.5, §3, §4.13, §7), and stubs `SLICE_12_5_packs_i.md`, `SLICE_13_5_sentinel.md`,
   `TRACK_M_marketing.md`; Slices 13 and 14 stubs carry the new must-not-lose items. Dates are targets.

### D-142 · 2026-10-28 · The consolidated analysis signed off
**Aniket, 2026-10-28:** "Step 7 approved. The consolidated analysis is closed." The final pack stands as
written (`docs/reference/CONSOLIDATED_FEATURE_ANALYSIS.md` Step 7): the sales line "TrustStack — the DPDP
assurance platform that proves it", the top 10 must-win features, the never-say list, the risks. The plan
is D-141's; the next step is unchanged: **"SLICE_12 approved"** in a new window.

### D-143 · 2026-10-29 · Business models (Phase I) and the multi-level assessment (Phase II, Steps 1–6) approved
**Aniket, 2026-10-29**, step by step, each "approved with your recommendations". The analyses:
`docs/reference/BUSINESS_MODEL_ANALYSIS.md` (B1–B7) and `docs/reference/MULTI_LEVEL_ASSESSMENT_ANALYSIS.md`
(Steps 1–6). Confidential partner margins and the LLP royalty split are outside the repo.

1. **Business models (B1–B7):** enterprise licences plus a network of **TrustStack Certified DPDP
   Professionals**. Practising CAs, CSs and advocates get **no commissions, paid leads or reselling**
   (CA Act First Schedule Part I cl. 2, 3, 6, 7, 11; BCI Rules 36, 47–52); four lawful routes: A practice
   licence, B client invites its professional, C academy and certification, D authorised partners
   (unregulated firms only). Prices: Essentials ₹24k/36k/60k; Practice ₹24k/75k/2L; Level 1 ₹17,999
   (Practice Starter year 1 included), Level 2 ₹14,999, renewal ₹4,999. Ethics enforced in the database;
   partner access only through client membership, visible and removable by the client. Build packages
   PK1–PK5; wave 1 (Dec–Jan) on today's platform; self-serve sign-up and billing in wave 2. Counsel /
   ICAI EAC opinion before launch.
2. **The assessment ladder (Steps 1–3):** **DPDP Compass™ Pulse** (short, self-declared, ends in five
   actions) → **DPDP Compass™ Proof** (today's evidence-backed assessment) → **Sentinel™**. The declared
   rule is the same engine with `claimed → claimed`, always labelled "self-declared", **never blended**
   with proven; the five actions are ranked by rule; Team Pulse and workshop mode; prove domain by domain.
3. **Visuals (Steps 4, 4b):** six audience views; the chart quality standard 4b.2a (proven blue
   `#2a78d6`, declared orange `#eb6834`, status colours always with words, a Table view per chart, no
   radar / Sankey / treemap / waterfall / donut); Apache ECharts proposed for the product (a stack entry
   at build time); `tools/visual_report.mjs` kept as a living demo.
4. **AI (Step 5):** explain and draft only; ten use cases (six new tasks); a "deliberately not AI" list
   (no auto-answer); guardrails G1–G7, including **the product works fully with AI off** (BFSI and
   healthcare stay held, s.16(2)); AI included in paid plans within the allowance; counsel's trade-mark
   search on "DPDP Compass" (an ICAI-listed tool uses the name).
5. **Simplicity (Step 6):** **one set of answer words for Pulse and Proof** (*Not started · Aware ·
   Written down · Approved · In use · Checked regularly* + *I don't know*), replacing `CLAIM_LEVELS`'
   names at build time (numbers and rules unchanged); "about 20 minutes"; inline scope; fixes S5–S12.
6. **Step 7** (the implementation plan: Slice 12.3 Pulse after Slice 12, dates shifted) is written and
   awaits approval; on approval it is recorded as D-144.

### D-144 · 2026-10-29 · Step 7 approved — Pulse is Slice 12.3; the combined programme closed
**Aniket, 2026-10-29:** "Step 7 approved with your recommendations (Q1–Q5). The combined programme is
closed. Merge the branch." (`docs/reference/MULTI_LEVEL_ASSESSMENT_ANALYSIS.md` Step 7.)

1. **Pulse is Slice 12.3**, right after Slice 12 (Option A): 12 → 12.3 → 12.5 → 13 → 13.5 → 14 → 15.
   Targets: 12.3 9–20 Nov · 12.5 21–27 Nov · 13 28 Nov–5 Dec · 13.5 7–14 Dec · **14 launch 15–23 Dec
   2026** · 15 4–22 Jan 2027. All ahead of 13 May 2027 (Rule 1(4), G.S.R. 846(E)). Dates are targets.
2. **The Slice 12.3 prompt** (`docs/slices/SLICE_12_3_pulse.md`) stands as written; it runs on
   "SLICE_12_3 approved" once Slice 12 is merged. The Pulse question list needs Aniket's and counsel's
   approval before Stage 1 merges.
3. **Wave 1 professionals** use the existing `consultant` role and workshop mode; partner packages run
   PK2 + PK1 (Jan 2027) → PK3 + PK4 (wave 2, Feb–Apr) → PK5 (Mar–Apr).
4. **Packs I content and counsel work start 9 Nov**, in parallel with 12.3; its code follows 12.3.
5. The branch `docs/multi-level-assessment` is merged to `main`. The next step is unchanged:
   **"SLICE_12 approved"** in a new window.
