import { expect, test } from "@playwright/test";
import { accessTokenFor, SEED_ORGS, SEED_USERS } from "../helpers";

const ORG_A = SEED_ORGS.mumbaiUniversity;
const ORG_B = SEED_ORGS.bharatManufacturing;

test.describe("GET /api/v1/health", () => {
  test("is public and returns the envelope", async ({ request }) => {
    const res = await request.get("/api/v1/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ status: "ok" });
    expect(typeof body.data.version).toBe("string");
    expect(body.meta.requestId).toMatch(/^req_/);
    expect(Date.parse(body.meta.timestamp)).not.toBeNaN();
  });
});

test.describe("GET /api/v1/organizations/me", () => {
  test("unauthenticated → 401 UNAUTHENTICATED", async ({ request }) => {
    const res = await request.get("/api/v1/organizations/me");
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toMatchObject({ success: false, error: { code: "UNAUTHENTICATED" } });
  });

  test("a garbage bearer token → 401", async ({ request }) => {
    const res = await request.get("/api/v1/organizations/me", {
      headers: { Authorization: "Bearer not-a-real-jwt" },
    });
    expect(res.status()).toBe(401);
  });

  test("authenticated → the caller's own organisation", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.mumbaiUniversity.email);
    const res = await request.get("/api/v1/organizations/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.organization).toMatchObject({ id: ORG_A.id, name: ORG_A.name });
    expect(body.data.user.email).toBe(SEED_USERS.mumbaiUniversity.email);
  });

  // GATE 5 — API layer. Slice 1 removed `?organizationId=`: the organisation
  // comes from the signed active-org cookie, never from a client-chosen value.
  test("a query param cannot choose another tenant — Org A still gets only Org A", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.mumbaiUniversity.email);
    const res = await request.get(`/api/v1/organizations/me?organizationId=${ORG_B.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const raw = await res.text();
    expect(JSON.parse(raw).data.organization.id).toBe(ORG_A.id);
    expect(raw).not.toContain(ORG_B.name);
    expect(raw).not.toContain(ORG_B.id);
    expect(raw).not.toContain(SEED_USERS.bharatManufacturing.email);
  });

  test("and the reverse: Org B user cannot reach Org A", async ({ request }) => {
    const token = await accessTokenFor(SEED_USERS.bharatManufacturing.email);
    const res = await request.get(`/api/v1/organizations/me?organizationId=${ORG_A.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    expect(await res.text()).not.toContain(ORG_A.name);
  });
});
