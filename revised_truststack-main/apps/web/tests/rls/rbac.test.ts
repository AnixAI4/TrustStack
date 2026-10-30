/**
 * Slice 1 database-side RBAC: reference data matches packages/core, and the
 * SECURITY DEFINER write RPCs enforce permission, tenancy, escalation, invite
 * validity and the last-admin rule on their own — independent of the API.
 */
import { createHash } from "node:crypto";
import { PERMISSION_CODES, ROLE_CODES, ROLE_PERMISSIONS } from "@truststack/core";
import { SEED_ORGS, SEED_USERS } from "@truststack/db/seed-data";
import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { authSubjects, connect, inTransaction } from "./db";

const ORG_A = SEED_ORGS.mumbaiUniversity.id;
const ORG_B = SEED_ORGS.bharatManufacturing.id;

let client: pg.Client;
let who: Map<string, { sub: string; email: string }>;
const u = (id: string) => who.get(id)!;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

beforeAll(async () => {
  client = await connect();
  who = await authSubjects(client, Object.values(SEED_USERS).map((x) => x.id));
});
afterAll(async () => {
  await client?.end();
});

describe("reference data in the database == packages/core", () => {
  it("roles, permissions and every role→permission pair", async () => {
    const roles = await client.query<{ code: string }>("SELECT code FROM public.roles");
    expect(roles.rows.map((r) => r.code).sort()).toEqual([...ROLE_CODES].sort());

    const perms = await client.query<{ code: string }>("SELECT code FROM public.permissions");
    expect(perms.rows.map((r) => r.code).sort()).toEqual([...PERMISSION_CODES].sort());

    const pairs = await client.query<{ pair: string }>(
      `SELECT r.code || ' ' || p.code AS pair FROM public.role_permissions rp
       JOIN public.roles r ON r.id = rp.role_id JOIN public.permissions p ON p.id = rp.permission_id`,
    );
    const expected = ROLE_CODES.flatMap((r) => ROLE_PERMISSIONS[r].map((p) => `${r} ${p}`));
    expect(pairs.rows.map((r) => r.pair).sort()).toEqual(expected.sort());
  });

  it("app.has_permission agrees with the matrix for seeded members", async () => {
    await inTransaction(client, async (tx) => {
      const check = async (userId: string, org: string, perm: string) =>
        (await tx.as<{ ok: boolean }>(u(userId), "SELECT app.has_permission($1, $2) AS ok", [org, perm])).rows[0]!.ok;

      expect(await check(SEED_USERS.muAdmin.id, ORG_A, "organization.users.update")).toBe(true);
      expect(await check(SEED_USERS.muDepartmentOwner.id, ORG_A, "organization.users.read")).toBe(false);
      expect(await check(SEED_USERS.muDean.id, ORG_A, "report.download")).toBe(true);
      // A permission in Org A is not a permission in Org B.
      expect(await check(SEED_USERS.muAdmin.id, ORG_B, "organization.read")).toBe(false);
      expect(await check(SEED_USERS.consultant.id, ORG_B, "organization.users.invite")).toBe(true);
    });
  });
});

describe("create_organization_invite", () => {
  const call = "SELECT * FROM public.create_organization_invite($1, $2, $3, $4)";

  it("an org admin invites into their own org; only the hash is stored; the RPC audits it", async () => {
    await inTransaction(client, async (tx) => {
      const raw = "raw-token-that-must-never-be-stored-0000000";
      const { rows } = await tx.as<{ invite_id: string }>(u(SEED_USERS.muAdmin.id), call, [
        ORG_A,
        "New.Person@Example.com",
        "department_owner",
        sha(raw),
      ]);
      const id = rows[0]!.invite_id;

      const stored = await tx.asAdmin<Record<string, unknown>>("SELECT * FROM public.organization_invites WHERE id = $1", [id]);
      expect(stored.rows[0]!.token_hash).toBe(sha(raw));
      expect(JSON.stringify(stored.rows[0])).not.toContain(raw);

      const audit = await tx.asAdmin<{ event_type: string; user_id: string }>(
        "SELECT event_type, user_id FROM public.audit_logs WHERE entity_id = $1",
        [id],
      );
      expect(audit.rows).toEqual([{ event_type: "organization.user.invited", user_id: SEED_USERS.muAdmin.id }]);
    });
  });

  it("refuses a raw (non-sha256) token at the schema level", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, "x@example.com", "legal_user", "not-a-hash"]),
      ).rejects.toThrow(/token_hash_is_sha256/);
    });
  });

  it("GATE 5: Org A's admin cannot invite into Org B", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_B, "x@example.com", "legal_user", sha("b")]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("a role without organization.users.invite cannot invite", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muDepartmentOwner.id), call, [ORG_A, "x@example.com", "legal_user", sha("c")]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("no escalation: a consultant cannot mint an org admin; nobody grants super_admin", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.consultant.id), call, [ORG_A, "x@example.com", "organization_admin", sha("d")]),
      ).rejects.toMatchObject({ code: "TS403" });
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, "x@example.com", "super_admin", sha("e")]),
      ).rejects.toMatchObject({ code: "TS403" });
      const ok = await tx.as(u(SEED_USERS.consultant.id), call, [ORG_A, "y@example.com", "department_owner", sha("f")]);
      expect(ok.rowCount).toBe(1);
    });
  });

  it("an existing member's email (any case) → TS409; a second open invite → TS409", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, SEED_USERS.muLegal.email.toUpperCase(), "legal_user", sha("g")]),
      ).rejects.toMatchObject({ code: "TS409" });
      await tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, "dup@example.com", "legal_user", sha("h")]);
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, "DUP@example.com", "legal_user", sha("i")]),
      ).rejects.toMatchObject({ code: "TS409" });
    });
  });
});

describe("accept_organization_invite", () => {
  async function seedInvite(tx: Parameters<Parameters<typeof inTransaction>[1]>[0], email: string, expiresSql = "now() + interval '1 day'") {
    const raw = `raw-${Math.random()}`;
    await tx.asAdmin(
      `INSERT INTO public.organization_invites (organization_id, email, role_id, token_hash, invited_by, expires_at)
       VALUES ($1, $2, (SELECT id FROM public.roles WHERE code = 'legal_user'), $3, $4, ${expiresSql})`,
      [ORG_B, email, sha(raw), SEED_USERS.bmlAdmin.id],
    );
    return sha(raw);
  }

  it("a new invitee joins, gets a users row, and the join is audited as them", async () => {
    await inTransaction(client, async (tx) => {
      const hash = await seedInvite(tx, "fresh@example.com");
      const invitee = { sub: "11111111-1111-4111-8111-111111111111", email: "Fresh@Example.com" };
      const { rows } = await tx.as<{ organization_id: string; role_code: string }>(
        invitee,
        "SELECT * FROM public.accept_organization_invite($1)",
        [hash],
      );
      expect(rows).toEqual([{ organization_id: ORG_B, role_code: "legal_user" }]);

      // Now a member: RLS lets them see exactly that organisation.
      const orgs = await tx.as<{ id: string }>(invitee, "SELECT id FROM public.organizations");
      expect(orgs.rows.map((r) => r.id)).toEqual([ORG_B]);

      const audit = await tx.asAdmin<{ n: string }>(
        `SELECT count(*) AS n FROM public.audit_logs a JOIN public.users u ON u.id = a.user_id
         WHERE a.event_type = 'organization.invite.accepted' AND u.auth_provider_user_id = $1`,
        [invitee.sub],
      );
      expect(audit.rows[0]!.n).toBe("1");

      // Single use.
      await expect(tx.as(invitee, "SELECT * FROM public.accept_organization_invite($1)", [hash])).rejects.toMatchObject({
        code: "TS404",
      });
    });
  });

  it("GATE 5: a token for another email cannot be used to join that tenant", async () => {
    await inTransaction(client, async (tx) => {
      const hash = await seedInvite(tx, "someone.at.bml@example.com");
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), "SELECT * FROM public.accept_organization_invite($1)", [hash]),
      ).rejects.toMatchObject({ code: "TS403" });
      const leaked = await tx.as(u(SEED_USERS.muAdmin.id), "SELECT id FROM public.organizations WHERE id = $1", [ORG_B]);
      expect(leaked.rows).toHaveLength(0);
    });
  });

  it("an expired invite → TS410; an unknown hash → TS404", async () => {
    await inTransaction(client, async (tx) => {
      const hash = await seedInvite(tx, "late@example.com", "now() - interval '1 second'");
      const late = { sub: "22222222-2222-4222-8222-222222222222", email: "late@example.com" };
      await expect(tx.as(late, "SELECT * FROM public.accept_organization_invite($1)", [hash])).rejects.toMatchObject({
        code: "TS410",
      });
      await expect(
        tx.as(late, "SELECT * FROM public.accept_organization_invite($1)", [sha("nope")]),
      ).rejects.toMatchObject({ code: "TS404" });
    });
  });
});

describe("update_organization_member", () => {
  const call = "SELECT * FROM public.update_organization_member($1, $2, $3, $4)";

  it("the last org admin cannot demote or suspend themselves", async () => {
    await inTransaction(client, async (tx) => {
      const admin = u(SEED_USERS.muAdmin.id);
      await expect(tx.as(admin, call, [ORG_A, SEED_USERS.muAdmin.id, "dpdp_owner", null])).rejects.toMatchObject({
        code: "TS422",
        hint: "LAST_ORGANIZATION_ADMIN",
      });
      await expect(tx.as(admin, call, [ORG_A, SEED_USERS.muAdmin.id, null, "suspended"])).rejects.toMatchObject({
        code: "TS422",
      });
    });
  });

  it("an admin changes a role; the change is audited with from/to", async () => {
    await inTransaction(client, async (tx) => {
      // Pin the starting role inside the transaction: never depend on shared DB state.
      await tx.asAdmin(
        "UPDATE public.organization_users SET role_id = (SELECT id FROM public.roles WHERE code = 'legal_user') WHERE organization_id = $1 AND user_id = $2",
        [ORG_A, SEED_USERS.muLegal.id],
      );
      const { rows } = await tx.as<{ role_code: string }>(u(SEED_USERS.muAdmin.id), call, [
        ORG_A,
        SEED_USERS.muLegal.id,
        "procurement_user",
        null,
      ]);
      expect(rows[0]!.role_code).toBe("procurement_user");
      const audit = await tx.asAdmin<{ metadata: { from: string; to: string } }>(
        "SELECT metadata FROM public.audit_logs WHERE event_type = 'organization.user.role_changed' AND entity_id = $1 ORDER BY created_at DESC LIMIT 1",
        [SEED_USERS.muLegal.id],
      );
      expect(audit.rows[0]!.metadata).toEqual({ from: "legal_user", to: "procurement_user" });
    });
  });

  it("GATE 5: Org A's admin cannot change a member of Org B", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_B, SEED_USERS.bmlAdmin.id, "legal_user", null]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });

  it("a consultant (no organization.users.update) cannot change roles", async () => {
    await inTransaction(client, async (tx) => {
      await expect(
        tx.as(u(SEED_USERS.consultant.id), call, [ORG_A, SEED_USERS.muLegal.id, "department_owner", null]),
      ).rejects.toMatchObject({ code: "TS403" });
    });
  });
});

describe("reissue_organization_invite", () => {
  const call = "SELECT * FROM public.reissue_organization_invite($1, $2, $3)";

  async function openInvite(tx: Parameters<Parameters<typeof inTransaction>[1]>[0], org: string, by: string) {
    const { rows } = await tx.asAdmin<{ id: string }>(
      `INSERT INTO public.organization_invites (organization_id, email, role_id, token_hash, invited_by, expires_at)
       VALUES ($1, 'reissue@example.com', (SELECT id FROM public.roles WHERE code = 'legal_user'), $2, $3, now() + interval '1 hour')
       RETURNING id`,
      [org, sha("old"), by],
    );
    return rows[0]!.id;
  }

  it("swaps the hash, restarts the 7-day expiry, kills the old link and audits", async () => {
    await inTransaction(client, async (tx) => {
      const id = await openInvite(tx, ORG_A, SEED_USERS.muAdmin.id);
      const { rows } = await tx.as<{ invite_id: string; expires_at: Date }>(u(SEED_USERS.muAdmin.id), call, [
        ORG_A,
        id,
        sha("new"),
      ]);
      expect(rows[0]!.invite_id).toBe(id);
      expect(rows[0]!.expires_at.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 3600 * 1000);

      const stored = await tx.asAdmin<{ token_hash: string }>("SELECT token_hash FROM public.organization_invites WHERE id = $1", [id]);
      expect(stored.rows[0]!.token_hash).toBe(sha("new"));

      const audit = await tx.asAdmin("SELECT 1 FROM public.audit_logs WHERE event_type = 'organization.invite.reissued' AND entity_id = $1", [id]);
      expect(audit.rowCount).toBe(1);

      const invitee = { sub: "33333333-3333-4333-8333-333333333333", email: "reissue@example.com" };
      await expect(tx.as(invitee, "SELECT * FROM public.accept_organization_invite($1)", [sha("old")])).rejects.toMatchObject({
        code: "TS404",
      });
    });
  });

  it("GATE 5: Org A cannot reissue Org B's invite, even naming its own org", async () => {
    await inTransaction(client, async (tx) => {
      const idB = await openInvite(tx, ORG_B, SEED_USERS.bmlAdmin.id);
      await expect(tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, idB, sha("x")])).rejects.toMatchObject({ code: "TS404" });
      await expect(tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_B, idB, sha("x")])).rejects.toMatchObject({ code: "TS403" });
      const stored = await tx.asAdmin<{ token_hash: string }>("SELECT token_hash FROM public.organization_invites WHERE id = $1", [idB]);
      expect(stored.rows[0]!.token_hash).toBe(sha("old"));
    });
  });

  it("a role without invite permission cannot reissue; an accepted invite cannot be reissued", async () => {
    await inTransaction(client, async (tx) => {
      const id = await openInvite(tx, ORG_A, SEED_USERS.muAdmin.id);
      await expect(tx.as(u(SEED_USERS.muDepartmentOwner.id), call, [ORG_A, id, sha("x")])).rejects.toMatchObject({
        code: "TS403",
      });
      await tx.asAdmin("UPDATE public.organization_invites SET accepted_at = now() WHERE id = $1", [id]);
      await expect(tx.as(u(SEED_USERS.muAdmin.id), call, [ORG_A, id, sha("y")])).rejects.toMatchObject({ code: "TS404" });
    });
  });

  it("anon cannot call it", async () => {
    await inTransaction(client, async (tx) => {
      await expect(tx.as(null, call, [ORG_A, ORG_A, sha("z")])).rejects.toThrow(/permission denied/);
    });
  });
});
