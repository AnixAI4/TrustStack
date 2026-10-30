import { createClient } from "@supabase/supabase-js";
import {
  SEED_ASSESSMENTS, SEED_EVIDENCE, SEED_ORGS, SEED_RESPONSES, SEED_ROPA, SEED_SCOPE, SEED_USERS,
} from "@truststack/db/seed-data";
import pg from "pg";

export { SEED_ASSESSMENTS, SEED_EVIDENCE, SEED_ORGS, SEED_RESPONSES, SEED_ROPA, SEED_SCOPE, SEED_USERS };

export function seedPassword(): string {
  const password = process.env.SEED_USER_PASSWORD;
  if (!password) throw new Error("SEED_USER_PASSWORD must be set (run the seed first)");
  return password;
}

/**
 * Access tokens are cached per worker. Supabase Auth rate-limits sign-ins, and
 * nothing in these tests depends on a fresh token: permissions and membership
 * are re-read from the database on every request (D-023). Tokens last an hour.
 */
const tokenCache = new Map<string, Promise<string>>();

/** Signs a user in against Supabase Auth (once per worker) and returns their access token (JWT). */
export function accessTokenFor(email: string, password = seedPassword()): Promise<string> {
  const key = `${email}\u0000${password}`;
  let token = tokenCache.get(key);
  if (!token) {
    token = signInForToken(email, password);
    tokenCache.set(key, token);
    token.catch(() => tokenCache.delete(key));
  }
  return token;
}

async function signInForToken(email: string, password: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`sign-in failed for ${email}: ${error?.message}`);
  return data.session.access_token;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * Privileged Postgres connection for ASSERTIONS and cleanup only (what the DB
 * actually holds). Never used to make a test pass that the API should refuse.
 */
export async function withDb<T>(fn: (db: pg.Client) => Promise<T>): Promise<T> {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
  const db = new pg.Client({ connectionString });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

/** Pulls `ts_active_org=<value>` out of a response's Set-Cookie headers. */
export function activeOrgCookieFrom(headers: { name: string; value: string }[]): string {
  const header = headers.find((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith("ts_active_org="));
  if (!header) throw new Error("no ts_active_org cookie set");
  return header.value.split(";")[0]!.slice("ts_active_org=".length);
}

/**
 * Unique, disposable example.com address for invite tests. `scope` is per spec
 * file so parallel workers never clean up each other's rows.
 */
export function e2eEmail(scope: string, label: string): string {
  return `e2e-invitee-${scope}-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function cleanupE2eInvitees(scope: string): Promise<void> {
  const pattern = `e2e-invitee-${scope}-%@example.com`;
  await withDb(async (db) => {
    await db.query("DELETE FROM public.organization_invites WHERE email::text LIKE $1", [pattern]);
    await db.query("DELETE FROM public.users WHERE email::text LIKE $1", [pattern]);
    await db.query("DELETE FROM auth.users WHERE email LIKE $1", [pattern]);
  });
}

/**
 * Stand-in for the invitee's mailbox. The API never returns invite links
 * (D-025), and e2e invitees are on example.com so no email is sent. This gives
 * an open invite a token the test knows, exactly as if it had been read from
 * the email. Setup only — it never makes a request the API should refuse pass.
 */
export async function giveInviteKnownToken(inviteId: string): Promise<string> {
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  await withDb(async (db) => {
    const { rowCount } = await db.query(
      "UPDATE public.organization_invites SET token_hash = $1 WHERE id = $2 AND accepted_at IS NULL",
      [hash, inviteId],
    );
    if (rowCount !== 1) throw new Error(`no open invite ${inviteId}`);
  });
  return token;
}

/**
 * Stand-in for a Data Principal's mailbox (Slice 10 Stage 3a). The API never
 * returns a code, and e2e addresses are on example.com so no email is sent.
 * This gives a waiting submission a code the test knows — as if read from the
 * email. Only the hash is stored, so the test cannot read the real one. Setup
 * only: it never makes a request the API should refuse pass.
 */
export async function giveSubmissionKnownCode(submissionId: string, code = "424242"): Promise<string> {
  const { createHash } = await import("node:crypto");
  await withDb(async (db) => {
    const { rowCount } = await db.query(
      "UPDATE public.intake_submissions SET code_hash = $1 WHERE id = $2 AND confirmed_at IS NULL",
      [createHash("sha256").update(`${submissionId}:${code}`).digest("hex"), submissionId],
    );
    if (rowCount !== 1) throw new Error(`no waiting submission ${submissionId}`);
  });
  return code;
}

/**
 * Stand-in for the vendor respondent's mailbox (Slice 10 Stage 4b). The API
 * never returns a link's token — it is emailed, and e2e respondents are on
 * example.com so no email is sent. This gives the assessment's open link a
 * token the test knows, as if read from the email. Setup only.
 */
export async function giveVendorLinkKnownToken(assessmentId: string): Promise<string> {
  const { createHash, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  await withDb(async (db) => {
    const { rowCount } = await db.query(
      "UPDATE public.vendor_assessment_links SET token_hash = $1 WHERE assessment_id = $2 AND revoked_at IS NULL AND submitted_at IS NULL",
      [createHash("sha256").update(token).digest("hex"), assessmentId],
    );
    if (rowCount !== 1) throw new Error(`no open link for assessment ${assessmentId}`);
  });
  return token;
}

/** Stand-in for the code email: the link's live code becomes one the test knows. Setup only. */
export async function giveVendorLinkKnownCode(token: string, code = "424242"): Promise<string> {
  const { createHash } = await import("node:crypto");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await withDb(async (db) => {
    const { rowCount } = await db.query(
      "UPDATE public.vendor_assessment_links SET code_hash = $1 WHERE token_hash = $2 AND code_hash IS NOT NULL",
      [createHash("sha256").update(`${tokenHash}:${code}`).digest("hex"), tokenHash],
    );
    if (rowCount !== 1) throw new Error("no code waiting on that link — ask for one first");
  });
  return code;
}

/** The newest waiting submission for an email address — what a UI test knows after pressing Send. */
export async function waitingSubmissionFor(email: string): Promise<string> {
  return withDb(async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM public.intake_submissions WHERE requester_email = lower($1) AND confirmed_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [email],
    );
    if (!rows[0]) throw new Error(`no waiting submission for ${email}`);
    return rows[0].id;
  });
}

/** Opens a disposable tenant's public pages, as tooling (setup). */
export async function openPublicPages(organizationId: string, slug: string): Promise<void> {
  await withDb((db) =>
    db.query(
      "UPDATE public.organizations SET public_slug = $2, public_contact_name = 'E2E Grievance Officer', public_contact_email = 'grievance@e2e-intake.example.com' WHERE id = $1",
      [organizationId, slug],
    ),
  );
}

export async function openInviteIdFor(email: string): Promise<string> {
  return withDb(async (db) => {
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM public.organization_invites WHERE email = $1 AND accepted_at IS NULL",
      [email],
    );
    if (!rows[0]) throw new Error(`no open invite for ${email}`);
    return rows[0].id;
  });
}

/**
 * A disposable tenant, for specs that must write a SCOPE.
 *
 * Spec files run in parallel against ONE database, so a spec that makes a
 * scope stale cannot share a tenant with one that re-saves it. The member is
 * an EXISTING seeded user given a second membership here — creating an Auth
 * user would need either the service-role key (which only
 * apps/web/lib/supabase/admin.ts may name) or a sign-up, which Supabase Auth
 * refuses for example.com addresses.
 *
 * Pass a seeded user no other spec asserts memberships for. Fixed ids, so a
 * crashed run is cleaned up by the next one; `removeE2eTenant` is the matching
 * teardown, and belongs in afterAll.
 */
export interface E2eTenantSpec {
  organizationId: string;
  name: string;
  industryCode: string;
  dataPrincipalCountEstimate?: number;
  /** An existing seeded user, and the role it holds IN THIS tenant. */
  member: { userId: string; email: string };
  roleCode: string;
  /**
   * More seeded users, each with its role here. Slice 4's journey needs two
   * people: nobody may review evidence they uploaded (D-043).
   */
  extraMembers?: { userId: string; roleCode: string }[];
}

export async function createE2eTenant(tenant: E2eTenantSpec): Promise<void> {
  await removeE2eTenant(tenant);
  await withDb(async (db) => {
    await db.query(
      `INSERT INTO public.organizations (id, name, organization_type, industry_code, data_principal_count_estimate)
       VALUES ($1, $2, 'company', $3, $4)`,
      [tenant.organizationId, tenant.name, tenant.industryCode, tenant.dataPrincipalCountEstimate ?? null],
    );
    // A role is scoped to a membership, so the same user can be an
    // it_security_user in Mumbai University and an admin here (D-020).
    await db.query(
      `INSERT INTO public.organization_users (organization_id, user_id, role_id, status, joined_at)
       SELECT $1, $2, r.id, 'active', now() FROM public.roles r WHERE r.code = $3`,
      [tenant.organizationId, tenant.member.userId, tenant.roleCode],
    );
    for (const extra of tenant.extraMembers ?? []) {
      await db.query(
        `INSERT INTO public.organization_users (organization_id, user_id, role_id, status, joined_at)
         SELECT $1, $2, r.id, 'active', now() FROM public.roles r WHERE r.code = $3`,
        [tenant.organizationId, extra.userId, extra.roleCode],
      );
    }
  });
}

export async function removeE2eTenant(tenant: { organizationId: string }): Promise<void> {
  await withDb(async (db) => {
    // audit_logs.organization_id is ON DELETE RESTRICT — the log is append-only
    // by design. Only this teardown, on a throwaway tenant, ever removes rows.
    await db.query("DELETE FROM public.audit_logs WHERE organization_id = $1", [tenant.organizationId]);
    await deleteStoredObjects(db, `organizations/${tenant.organizationId}/%`);
    // Then the organisation, cascading to its membership, scope and registers.
    await db.query("DELETE FROM public.organizations WHERE id = $1", [tenant.organizationId]);
  });
}

/**
 * Test cleanup for stored evidence and reports. Users can never delete an
 * artefact or a report (no DELETE policy, no DELETE grant — D-042, D-076);
 * this privileged teardown can.
 *
 * Storage refuses direct deletes from its tables unless
 * `storage.allow_delete_query` is set, because the row is only the metadata:
 * the bytes stay in the storage backend as an unreferenced blob. For test
 * files of a few bytes that is accepted (docs/STATE.md open loop).
 */
async function deleteStoredObjects(db: pg.Client, namePattern: string): Promise<void> {
  await db.query("BEGIN");
  try {
    await db.query("SET LOCAL storage.allow_delete_query = 'true'");
    await db.query("DELETE FROM storage.objects WHERE bucket_id IN ('evidence', 'reports') AND name LIKE $1", [namePattern]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

/** Removes evidence rows (their links cascade) and their stored objects. */
export async function removeEvidence(organizationId: string, evidenceIds: string[]): Promise<void> {
  if (evidenceIds.length === 0) return;
  await withDb(async (db) => {
    for (const id of evidenceIds) await deleteStoredObjects(db, `organizations/${organizationId}/evidence/${id}/%`);
    await db.query("DELETE FROM public.evidence WHERE organization_id = $1 AND id = ANY($2::uuid[])", [
      organizationId,
      evidenceIds,
    ]);
  });
}
