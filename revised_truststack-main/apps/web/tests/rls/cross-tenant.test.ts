/**
 * GATE 5 — RLS layer. Talks straight to Postgres, bypassing the API entirely,
 * impersonating a signed-in user exactly as PostgREST does. If the API's tenant
 * check ever regresses, these policies are what still stand between tenants.
 */
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;
const USER_A = SEED_USERS.mumbaiUniversity.id;
const USER_B = SEED_USERS.bharatManufacturing.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const A = () => who.get(USER_A)!;
const ADMIN_A = () => who.get(SEED_USERS.muAdmin.id)!;

/** Single statement as a user, rolled back. */
function asUser<T extends pg.QueryResultRow>(
  user: { sub: string; email?: string } | null,
  sql: string,
  params: unknown[] = [],
) {
  return inTransaction(client, (tx) => tx.as<T>(user, sql, params));
}

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((u) => u.id));
});

afterAll(async () => {
  await client?.end();
});

describe("RLS — Org A's JWT, direct to Postgres", () => {
  it("reads 0 rows of Org B from organizations", async () => {
    const { rows } = await asUser(A(), "SELECT id, name FROM public.organizations WHERE id = $1", [ORG_B]);
    expect(rows).toHaveLength(0);
  });

  it("sees only its own organisation when reading all organizations", async () => {
    const { rows } = await asUser<{ id: string }>(A(), "SELECT id FROM public.organizations");
    expect(rows.map((r) => r.id)).toEqual([ORG_A]);
  });

  it("reads only Org A rows from organization_users — even the consultant's Org B membership is hidden", async () => {
    const { rows } = await asUser<{ organization_id: string }>(
      ADMIN_A(),
      "SELECT organization_id FROM public.organization_users",
    );
    expect(rows.length).toBe(SEED_USERS_IN(ORG_A));
    expect(rows.every((r) => r.organization_id === ORG_A)).toBe(true);
  });

  it("cannot read Org B's user row", async () => {
    const { rows } = await asUser(A(), "SELECT id FROM public.users WHERE id = $1", [USER_B]);
    expect(rows).toHaveLength(0);
  });

  it("users: sees Org A co-members (incl. the shared consultant) and no Org-B-only user", async () => {
    const { rows } = await asUser<{ id: string }>(ADMIN_A(), "SELECT id FROM public.users");
    const ids = rows.map((r) => r.id).sort();
    const expected = Object.values(SEED_USERS)
      .filter((u) => u.memberships.some((m) => m.organizationId === ORG_A))
      .map((u) => u.id)
      .sort();
    expect(ids).toEqual(expected);
    expect(ids).not.toContain(SEED_USERS.bmlAdmin.id);
    expect(ids).not.toContain(USER_B);
  });

  it("organization_invites: an inviter sees only Org A's invitations", async () => {
    await inTransaction(client, async (tx) => {
      await tx.asAdmin(
        `INSERT INTO public.organization_invites (organization_id, email, role_id, token_hash, invited_by)
         SELECT o.org, o.email, (SELECT id FROM public.roles WHERE code = 'legal_user'), o.hash, o.by
         FROM (VALUES ($1::uuid, 'rls-a@example.com', repeat('a', 64), $3::uuid),
                      ($2::uuid, 'rls-b@example.com', repeat('b', 64), $4::uuid)) AS o(org, email, hash, by)`,
        [ORG_A, ORG_B, SEED_USERS.muAdmin.id, SEED_USERS.bmlAdmin.id],
      );
      const { rows } = await tx.as<{ organization_id: string; email: string }>(
        ADMIN_A(),
        "SELECT organization_id, email FROM public.organization_invites",
      );
      expect(rows).toEqual([{ organization_id: ORG_A, email: "rls-a@example.com" }]);

      // Same org, but no organization.users.invite permission → nothing.
      const owner = await tx.as(A(), "SELECT id FROM public.organization_invites");
      expect(owner.rows).toHaveLength(0);
    });
  });

  it("organization_invites.token_hash is not readable by any API role", async () => {
    await expect(asUser(ADMIN_A(), "SELECT token_hash FROM public.organization_invites")).rejects.toThrow(
      /permission denied/,
    );
  });

  it("reads 0 of Org B's audit_logs", async () => {
    const { rows } = await asUser(A(), "SELECT id FROM public.audit_logs WHERE organization_id = $1", [ORG_B]);
    expect(rows).toHaveLength(0);
  });

  it("cannot write an audit entry into Org B's log", async () => {
    await expect(
      asUser(
        A(),
        `INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, description)
         VALUES ($1, $2, 'test.forged', 'organization', 'cross-tenant write attempt')`,
        [ORG_B, USER_A],
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot forge an audit entry as another user, even in its own org", async () => {
    await expect(
      asUser(
        A(),
        `INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, description)
         VALUES ($1, $2, 'test.forged', 'user', 'impersonation attempt')`,
        [ORG_A, USER_B],
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot update or delete audit_logs (append-only)", async () => {
    await expect(asUser(A(), "DELETE FROM public.audit_logs")).rejects.toThrow(/permission denied/);
    await expect(asUser(A(), "UPDATE public.audit_logs SET description = 'x'")).rejects.toThrow(/permission denied/);
  });

  it("can append its own audit entry (the policy is not deny-all)", async () => {
    const { rowCount } = await asUser(
      A(),
      `INSERT INTO public.audit_logs (organization_id, user_id, event_type, entity_type, description)
       VALUES ($1, $2, 'test.allowed', 'user', 'own-tenant write')`,
      [ORG_A, USER_A],
    );
    expect(rowCount).toBe(1);
  });

  it("cannot write memberships, invites or roles directly — only through the RPCs", async () => {
    await expect(
      asUser(
        ADMIN_A(),
        "UPDATE public.organization_users SET role_id = (SELECT id FROM public.roles WHERE code = 'super_admin')",
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(ADMIN_A(), "INSERT INTO public.organization_users (organization_id, user_id, role_id) VALUES ($1, $2, $2)", [
        ORG_B,
        SEED_USERS.muAdmin.id,
      ]),
    ).rejects.toThrow(/permission denied/);
    await expect(asUser(ADMIN_A(), "DELETE FROM public.organization_invites")).rejects.toThrow(/permission denied/);
    await expect(asUser(ADMIN_A(), "UPDATE public.role_permissions SET role_id = role_id")).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("RLS — no JWT", () => {
  it("anon has no access to tenant tables at all", async () => {
    await expect(asUser(null, "SELECT id FROM public.organizations")).rejects.toThrow(/permission denied/);
    await expect(asUser(null, "SELECT id FROM public.organization_invites")).rejects.toThrow(/permission denied/);
    await expect(asUser(null, "SELECT id FROM public.roles")).rejects.toThrow(/permission denied/);
  });

  it("anon cannot call the write RPCs", async () => {
    await expect(asUser(null, "SELECT * FROM public.accept_organization_invite(repeat('a', 64))")).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asUser(null, "SELECT * FROM public.create_organization_invite($1, 'x@example.com', 'legal_user', repeat('a', 64))", [
        ORG_A,
      ]),
    ).rejects.toThrow(/permission denied/);
  });

  it("Prisma's _prisma_migrations is closed to anon and authenticated", async () => {
    await expect(asUser(null, "SELECT * FROM public._prisma_migrations")).rejects.toThrow(/permission denied/);
    await expect(asUser(A(), "DELETE FROM public._prisma_migrations")).rejects.toThrow(/permission denied/);
  });

  it("an authenticated JWT for an unknown subject sees nothing", async () => {
    const { rows } = await asUser({ sub: "00000000-0000-4000-8000-00000000dead" }, "SELECT id FROM public.organizations");
    expect(rows).toHaveLength(0);
  });
});

function SEED_USERS_IN(organizationId: string): number {
  return Object.values(SEED_USERS).reduce(
    (n, u) => n + u.memberships.filter((m) => m.organizationId === organizationId).length,
    0,
  );
}
