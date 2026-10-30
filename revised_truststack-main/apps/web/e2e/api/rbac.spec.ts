import { createHash } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  activeOrgCookieFrom,
  bearer,
  cleanupE2eInvitees,
  e2eEmail,
  giveInviteKnownToken,
  SEED_ORGS,
  SEED_USERS,
  withDb,
} from "../helpers";

const ORG_A = SEED_ORGS.mumbaiUniversity;
const ORG_B = SEED_ORGS.bharatManufacturing;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

test.describe.configure({ mode: "serial" });
const SCOPE = "rbac";
test.afterAll(() => cleanupE2eInvitees(SCOPE));

async function switchTo(request: APIRequestContext, token: string, organizationId: string) {
  return request.post("/api/v1/auth/switch-organization", { headers: bearer(token), data: { organizationId } });
}

async function auditCount(eventType: string, entityId: string, since: Date): Promise<number> {
  return withDb(async (db) => {
    const { rows } = await db.query<{ n: string }>(
      "SELECT count(*) AS n FROM public.audit_logs WHERE event_type = $1 AND entity_id = $2 AND created_at >= $3",
      [eventType, entityId, since],
    );
    return Number(rows[0]!.n);
  });
}

test.describe("auth APIs", () => {
  test("GET /auth/me, /auth/me/organizations and /auth/me/permissions for the consultant", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.consultant.email);

    const me = await (await request.get("/api/v1/auth/me", { headers: bearer(token) })).json();
    expect(me.data.user.email).toBe(SEED_USERS.consultant.email);
    expect(me.data.activeOrganizationId).toBe(ORG_A.id);

    const orgs = await (await request.get("/api/v1/auth/me/organizations", { headers: bearer(token) })).json();
    expect(orgs.data.organizations.map((o: { id: string }) => o.id).sort()).toEqual([ORG_A.id, ORG_B.id].sort());

    const perms = await (await request.get("/api/v1/auth/me/permissions", { headers: bearer(token) })).json();
    expect(perms.data).toMatchObject({ organizationId: ORG_A.id, role: "consultant" });
    expect(perms.data.permissions).toContain("organization.users.invite");
    expect(perms.data.permissions).not.toContain("organization.users.update");
  });

  test("switch-organization: consultant switches; the cookie drives /organizations/me; it is audited", async ({
    request,
  }) => {
    const token = await accessTokenFor(SEED_USERS.consultant.email);
    const since = new Date(Date.now() - 5_000);

    const res = await switchTo(request, token, ORG_B.id);
    expect(res.status()).toBe(200);
    const cookie = activeOrgCookieFrom(res.headersArray());
    expect(res.headers()["set-cookie"]).toMatch(/HttpOnly/i);
    expect(res.headers()["set-cookie"]).toMatch(/SameSite=Lax/i);

    const me = await request.get("/api/v1/organizations/me", {
      headers: { ...bearer(token), Cookie: `ts_active_org=${cookie}` },
    });
    expect((await me.json()).data.organization.id).toBe(ORG_B.id);

    expect(await auditCount("auth.organization_switched", ORG_B.id, since)).toBeGreaterThanOrEqual(1);
  });

  test("switching to a non-member org → 403 TENANT_ACCESS_DENIED, no cookie", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.muAdmin.email);
    const res = await switchTo(request, token, ORG_B.id);
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe("TENANT_ACCESS_DENIED");
    expect(res.headers()["set-cookie"] ?? "").not.toContain("ts_active_org");
    expect(await res.text()).not.toContain(ORG_B.name);
  });

  test("tampered or replayed active-org cookies are ignored — never another tenant", async ({ request, playwright }) => {
    const muAdmin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const consultant = await accessTokenFor(SEED_USERS.consultant.email);

    // (1) Org A admin's own valid cookie, payload swapped to Org B, signature kept.
    const own = activeOrgCookieFrom((await switchTo(request, muAdmin, ORG_A.id)).headersArray());
    const [, signature] = own.split(".");
    const payload = JSON.parse(Buffer.from(own.split(".")[0]!, "base64url").toString());
    const swapped = `${Buffer.from(JSON.stringify({ ...payload, o: ORG_B.id })).toString("base64url")}.${signature}`;

    // (2) A genuinely signed Org B cookie — issued to the consultant — replayed by Org A's admin.
    const fresh = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    const replayed = activeOrgCookieFrom((await switchTo(fresh, consultant, ORG_B.id)).headersArray());
    await fresh.dispose();

    for (const cookie of [swapped, replayed, "garbage", `${swapped}.extra`]) {
      const ctx = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
      for (const path of ["/api/v1/organizations/me", "/api/v1/auth/me/permissions"]) {
        const res = await ctx.get(path, { headers: { ...bearer(muAdmin), Cookie: `ts_active_org=${cookie}` } });
        expect(res.status()).toBe(200);
        const raw = await res.text();
        expect(raw).toContain(ORG_A.id);
        expect(raw).not.toContain(ORG_B.id);
        expect(raw).not.toContain(ORG_B.name);
      }
      await ctx.dispose();
    }
  });
});

test.describe("permission guard", () => {
  test("department_owner calling admin routes → 403 FORBIDDEN", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);
    const calls = [
      request.get(`/api/v1/organizations/${ORG_A.id}/users`, { headers: bearer(token) }),
      request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
        headers: bearer(token),
        data: { email: e2eEmail(SCOPE, "forbidden"), role: "legal_user" },
      }),
      request.patch(`/api/v1/organizations/${ORG_A.id}/users/${SEED_USERS.muLegal.id}`, {
        headers: bearer(token),
        data: { role: "department_owner" },
      }),
    ];
    for (const res of await Promise.all(calls)) {
      expect(res.status()).toBe(403);
      expect((await res.json()).error.code).toBe("FORBIDDEN");
    }
  });

  test("a consultant cannot escalate: inviting an organization_admin → 403 FORBIDDEN", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.consultant.email);
    const res = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(token),
      data: { email: e2eEmail(SCOPE, "escalate"), role: "organization_admin" },
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });

  test("the last organization_admin cannot demote themselves → 422 LAST_ORGANIZATION_ADMIN", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.muAdmin.email);
    const res = await request.patch(`/api/v1/organizations/${ORG_A.id}/users/${SEED_USERS.muAdmin.id}`, {
      headers: bearer(token),
      data: { role: "dpdp_owner" },
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).error.code).toBe("LAST_ORGANIZATION_ADMIN");
  });

  test("role change works, is audited, and applies on the very next request", async ({ request }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const target = SEED_USERS.muLegal;
    const since = new Date(Date.now() - 5_000);
    try {
      const res = await request.patch(`/api/v1/organizations/${ORG_A.id}/users/${target.id}`, {
        headers: bearer(admin),
        data: { role: "dpdp_owner" },
      });
      expect(res.status()).toBe(200);
      expect((await res.json()).data.member).toMatchObject({ role: "dpdp_owner", status: "active" });
      expect(await auditCount("organization.user.role_changed", target.id, since)).toBe(1);

      const legal = await accessTokenFor(target.email);
      const perms = await (await request.get("/api/v1/auth/me/permissions", { headers: bearer(legal) })).json();
      expect(perms.data.role).toBe("dpdp_owner");
    } finally {
      const restored = await request.patch(`/api/v1/organizations/${ORG_A.id}/users/${target.id}`, {
        headers: bearer(admin),
        data: { role: "legal_user" },
      });
      expect(restored.status(), await restored.text()).toBe(200);
    }
  });
});

test.describe("invitations", () => {
  test("invite → link is emailed, never returned → accept (new account) → member; every step audited", async ({
    request,
    playwright,
  }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const email = e2eEmail(SCOPE, "accept");
    const since = new Date(Date.now() - 5_000);

    const created = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email, role: "department_owner" },
    });
    expect(created.status()).toBe(201);
    const createdRaw = await created.text();
    const { invite, delivery } = JSON.parse(createdRaw).data;
    // D-025: the inviter never receives the link or the token.
    expect(createdRaw).not.toMatch(/invites\/accept|token/i);
    // example.com is reserved: recorded, never handed to the provider.
    expect(delivery).toBe("suppressed");
    expect(await auditCount("organization.user.invited", invite.id, since)).toBe(1);
    expect(await auditCount("organization.invite.email_suppressed", invite.id, since)).toBe(1);

    const stored = await withDb(async (db) =>
      (await db.query("SELECT token_hash FROM public.organization_invites WHERE id = $1", [invite.id])).rows[0],
    );
    expect(stored.token_hash).toMatch(/^[0-9a-f]{64}$/);

    // The list shows it as pending; token_hash never leaves the API.
    const list = await request.get(`/api/v1/organizations/${ORG_A.id}/users`, { headers: bearer(admin) });
    const listRaw = await list.text();
    expect(listRaw).toContain(email);
    expect(listRaw).not.toContain(stored.token_hash);

    // "Read the email": give the invite a token the test knows.
    const token = await giveInviteKnownToken(invite.id);
    const hashNow = await withDb(async (db) =>
      (await db.query("SELECT * FROM public.organization_invites WHERE id = $1", [invite.id])).rows[0],
    );
    expect(hashNow.token_hash).toBe(sha256(token));
    expect(JSON.stringify(hashNow)).not.toContain(token);

    // Signed out, no account yet: choose a password.
    const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    const password = `E2e-${sha256(email).slice(0, 16)}`;
    const accepted = await anon.post("/api/v1/invites/accept", { data: { token, password, fullName: "E2E Invitee" } });
    expect(accepted.status()).toBe(200);
    expect((await accepted.json()).data).toEqual({ organizationId: ORG_A.id, role: "department_owner" });
    await anon.dispose();
    expect(await auditCount("organization.invite.accepted", invite.id, since)).toBe(1);

    const inviteeToken = await accessTokenFor(email, password);
    const me = await (await request.get("/api/v1/organizations/me", { headers: bearer(inviteeToken) })).json();
    expect(me.data).toMatchObject({ organization: { id: ORG_A.id }, role: "department_owner" });

    // Single use.
    const again = await request.post("/api/v1/invites/accept", { headers: bearer(inviteeToken), data: { token } });
    expect(again.status()).toBe(404);
    expect((await again.json()).error.code).toBe("INVITE_INVALID");
  });

  test("resend mints a new link: the old one stops working; it is audited", async ({ request, playwright }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const email = e2eEmail(SCOPE, "resend");
    const since = new Date(Date.now() - 5_000);
    const created = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email, role: "legal_user" },
    });
    const { invite } = (await created.json()).data;
    const oldToken = await giveInviteKnownToken(invite.id);

    const resent = await request.post(`/api/v1/organizations/${ORG_A.id}/invites/${invite.id}/resend`, {
      headers: bearer(admin),
    });
    expect(resent.status()).toBe(200);
    const resentRaw = await resent.text();
    expect(resentRaw).not.toMatch(/invites\/accept|token/i);
    expect(JSON.parse(resentRaw).data).toMatchObject({ invite: { id: invite.id, email }, delivery: "suppressed" });
    expect(await auditCount("organization.invite.reissued", invite.id, since)).toBe(1);

    const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    const res = await anon.post("/api/v1/invites/accept", { data: { token: oldToken, password: "Old-link-passw0rd" } });
    expect(res.status()).toBe(404);
    expect((await res.json()).error.code).toBe("INVITE_INVALID");
    await anon.dispose();

    // Not someone without the invite permission.
    const deptOwner = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);
    const denied = await request.post(`/api/v1/organizations/${ORG_A.id}/invites/${invite.id}/resend`, {
      headers: bearer(deptOwner),
    });
    expect(denied.status()).toBe(403);
    expect((await denied.json()).error.code).toBe("FORBIDDEN");
  });

  test("expired invite token → 410 INVITE_EXPIRED; no account, no membership", async ({ request, playwright }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const email = e2eEmail(SCOPE, "expired");
    const created = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email, role: "legal_user" },
    });
    const { invite } = (await created.json()).data;
    const token = await giveInviteKnownToken(invite.id);
    await withDb((db) =>
      db.query("UPDATE public.organization_invites SET expires_at = now() - interval '1 minute' WHERE id = $1", [invite.id]),
    );

    const anon = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    const res = await anon.post("/api/v1/invites/accept", { data: { token, password: "Expired-invite-pass-1" } });
    expect(res.status()).toBe(410);
    expect((await res.json()).error.code).toBe("INVITE_EXPIRED");
    await anon.dispose();

    const leftovers = await withDb(async (db) => ({
      auth: (await db.query("SELECT 1 FROM auth.users WHERE email = $1", [email])).rowCount,
      users: (await db.query("SELECT 1 FROM public.users WHERE email = $1", [email])).rowCount,
    }));
    expect(leftovers).toEqual({ auth: 0, users: 0 });
  });

  test("a garbage token → 400; an unknown well-formed token → 404 INVITE_INVALID", async ({ request }) => {
    const bad = await request.post("/api/v1/invites/accept", { data: { token: "nope", password: "x".repeat(12) } });
    expect(bad.status()).toBe(400);
    const unknown = await request.post("/api/v1/invites/accept", {
      data: { token: "A".repeat(43), password: "x".repeat(12) },
    });
    expect(unknown.status()).toBe(404);
    expect((await unknown.json()).error.code).toBe("INVITE_INVALID");
  });

  test("inviting an email that is already a member → 409 CONFLICT, no duplicate row", async ({ request }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const res = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email: SEED_USERS.muLegal.email.toUpperCase(), role: "legal_user" },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).error.code).toBe("CONFLICT");

    const counts = await withDb(async (db) => ({
      invites: (await db.query("SELECT 1 FROM public.organization_invites WHERE email = $1", [SEED_USERS.muLegal.email])).rowCount,
      memberships: (
        await db.query("SELECT 1 FROM public.organization_users WHERE user_id = $1 AND organization_id = $2", [
          SEED_USERS.muLegal.id,
          ORG_A.id,
        ])
      ).rowCount,
    }));
    expect(counts).toEqual({ invites: 0, memberships: 1 });
  });

  test("a second open invite for the same email → 409 CONFLICT", async ({ request }) => {
    const admin = await accessTokenFor(SEED_USERS.muAdmin.email);
    const email = e2eEmail(SCOPE, "dup");
    const first = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email, role: "legal_user" },
    });
    expect(first.status()).toBe(201);
    const second = await request.post(`/api/v1/organizations/${ORG_A.id}/users/invite`, {
      headers: bearer(admin),
      data: { email, role: "it_security_user" },
    });
    expect(second.status()).toBe(409);
  });
});
