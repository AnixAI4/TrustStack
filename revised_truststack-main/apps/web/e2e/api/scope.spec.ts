/**
 * Slice 2 API behaviour. Mutating tests use Bharat Manufacturing (Org B in the
 * seed) so they never race the UI wizard test, which edits Mumbai University.
 * Everything created is named "E2E API …" and removed in afterAll.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { accessTokenFor, bearer, SEED_ORGS, SEED_SCOPE, SEED_USERS, withDb } from "../helpers";

const BML = SEED_ORGS.bharatManufacturing;
const MU = SEED_ORGS.mumbaiUniversity;
const base = (orgId: string) => `/api/v1/organizations/${orgId}`;

test.describe.configure({ mode: "serial" });

test.afterAll(async () => {
  await withDb(async (db) => {
    for (const t of ["vendors", "systems", "data_principal_types", "departments"]) {
      await db.query(`DELETE FROM public.${t} WHERE ${t === "data_principal_types" ? "label" : "name"} LIKE 'E2E API %'`);
    }
  });
});

async function auditCount(eventType: string, entityId: string, since: Date) {
  return withDb(async (db) => {
    const { rows } = await db.query<{ n: string }>(
      "SELECT count(*) AS n FROM public.audit_logs WHERE event_type = $1 AND entity_id = $2 AND created_at >= $3",
      [eventType, entityId, since],
    );
    return Number(rows[0]!.n);
  });
}

const bmlAnswers = SEED_SCOPE.bharatManufacturing.answers;

async function putScope(request: APIRequestContext, token: string, over: Record<string, unknown> = {}, answers = {}) {
  return request.put(`${base(BML.id)}/scope`, {
    headers: bearer(token),
    data: {
      industryCode: "manufacturing",
      dataPrincipalCountEstimate: BML.dataPrincipalCountEstimate,
      answers: { ...bmlAnswers, ...answers },
      ...over,
    },
  });
}

test("GET /industries lists the ten pack industries", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email);
  const body = await (await request.get("/api/v1/industries", { headers: bearer(token) })).json();
  expect(body.data.industries.map((i: { code: string }) => i.code).sort()).toEqual(
    ["bfsi", "edtech", "general", "healthcare", "manufacturing", "professional_services", "public_sector", "retail_ecommerce", "saas", "university"],
  );
});

test("MU preview: the seeded university derives children + AI tags and the University AI proctoring pack", async ({ request }) => {
  const token = await accessTokenFor(SEED_USERS.muDean.email); // read-only role can preview
  const res = await request.post(`${base(MU.id)}/scope/preview-assessment`, { headers: bearer(token) });
  expect(res.status()).toBe(200);
  const { data } = await res.json();
  const tags = data.riskTags.map((t: { tag: string }) => t.tag);
  expect(tags).toEqual(expect.arrayContaining(["children_data", "ai_processing", "cross_border_unknown"]));
  // Pack codes are Anix's view (D-071): the Dean never receives them…
  expect(data).not.toHaveProperty("questionPacks");
  // …and the consultant does.
  const anix = await (
    await request.post(`${base(MU.id)}/scope/preview-assessment`, {
      headers: bearer(await accessTokenFor(SEED_USERS.consultant.email)),
    })
  ).json();
  expect(anix.data.questionPacks).toEqual(expect.arrayContaining(["CORE_DPDP_V1", "UNIVERSITY_HIGHER_ED_V1", "CHILDREN_DATA_V1", "AI_RISK_V1", "UNIVERSITY_AI_PROCTORING_V1"]));
  for (const t of data.riskTags) expect(t.reasons.length).toBeGreaterThan(0);
  expect(data.profile).toMatchObject({
    processingScale: "large_scale",
    vendorDependency: "vendor_dependent",
    significantDataFiduciaryInferred: false,
  });
  expect(data.profile.largeScaleNotice).toMatch(/not a statutory classification/);
});

test("PUT scope (DPDP owner) stores DERIVED tags; client-sent risk tags are ignored; it is audited", async ({ request }) => {
  const owner = await accessTokenFor(SEED_USERS.bharatManufacturing.email); // dpdp_owner — scope.write (D-026)
  const since = new Date(Date.now() - 5_000);
  try {
    const res = await putScope(
      request,
      owner,
      { riskTags: ["totally_safe"], risk_tags: ["totally_safe"] },
      { childrenData: "unknown", aiUsageTypes: ["chatbot"], marketingTracking: "no" },
    );
    expect(res.status(), await res.text()).toBe(200);
    const { data } = await res.json();
    expect(data.storedRiskTags).toEqual(["ai_processing", "children_data", "sensitive_documents"]);
    expect(data.storedRiskTags).not.toContain("totally_safe");
    expect(data.preview.stale).toBe(false);
    // A DPDP owner is a client role: no pack codes in its preview (D-071).
    expect(data.preview).not.toHaveProperty("questionPacks");
    expect(await auditCount("scope.organization_scopes.update", BML.id, since)).toBeGreaterThanOrEqual(1);
  } finally {
    const restored = await putScope(request, owner);
    expect(restored.status()).toBe(200);
  }
});

test("PUT scope validation: bad industry / `none` mixed with AI uses → 400", async ({ request }) => {
  const owner = await accessTokenFor(SEED_USERS.bharatManufacturing.email);
  expect((await putScope(request, owner, { industryCode: "other" })).status()).toBe(400);
  expect((await putScope(request, owner, {}, { aiUsageTypes: ["none", "chatbot"] })).status()).toBe(400);
  expect((await putScope(request, owner, {}, { childrenData: "maybe" })).status()).toBe(400);
});

test("profile PATCH: org admin yes; DPDP owner and department owner → 403 FORBIDDEN", async ({ request }) => {
  const admin = await accessTokenFor(SEED_USERS.bmlAdmin.email);
  const owner = await accessTokenFor(SEED_USERS.bharatManufacturing.email);
  const deptOwner = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);

  const ok = await request.patch(base(BML.id), { headers: bearer(admin), data: { headquartersCity: "Pune (E2E)" } });
  expect(ok.status()).toBe(200);
  expect((await ok.json()).data.organization.headquartersCity).toBe("Pune (E2E)");
  await request.patch(base(BML.id), { headers: bearer(admin), data: { headquartersCity: BML.headquartersCity } });

  const byOwner = await request.patch(base(BML.id), { headers: bearer(owner), data: { name: "Renamed" } });
  expect(byOwner.status()).toBe(403);
  expect((await byOwner.json()).error.code).toBe("FORBIDDEN");

  const byDept = await request.patch(base(MU.id), { headers: bearer(deptOwner), data: { name: "Renamed" } });
  expect(byDept.status()).toBe(403);
  expect((await byDept.json()).error.code).toBe("FORBIDDEN");
});

test("department owner cannot write registers or scope → 403 FORBIDDEN (but can read)", async ({ request }) => {
  const deptOwner = await accessTokenFor(SEED_USERS.muDepartmentOwner.email);
  expect((await request.get(`${base(MU.id)}/systems`, { headers: bearer(deptOwner) })).status()).toBe(200);
  const res = await request.post(`${base(MU.id)}/departments`, { headers: bearer(deptOwner), data: { name: "E2E API nope" } });
  expect(res.status()).toBe(403);
  expect((await res.json()).error.code).toBe("FORBIDDEN");
});

test("registers: create → duplicate (case) 409 → cross-tenant reference 422 → in-use delete 409 → update → delete; all audited", async ({
  request,
}) => {
  const owner = await accessTokenFor(SEED_USERS.bharatManufacturing.email);
  const since = new Date(Date.now() - 5_000);
  const h = { headers: bearer(owner) };

  const dept = await request.post(`${base(BML.id)}/departments`, { ...h, data: { name: "E2E API Quality" } });
  expect(dept.status()).toBe(201);
  const deptId = (await dept.json()).data.item.id as string;

  const dup = await request.post(`${base(BML.id)}/departments`, { ...h, data: { name: "e2e api QUALITY" } });
  expect(dup.status()).toBe(409);
  expect((await dup.json()).error.code).toBe("CONFLICT");

  // Org A's department id as owner of an Org B system → rejected by the composite FK.
  const cross = await request.post(`${base(BML.id)}/systems`, {
    ...h,
    data: { name: "E2E API Cross", systemType: "crm", ownerDepartmentId: SEED_SCOPE.mumbaiUniversity.departments.it.id },
  });
  expect(cross.status()).toBe(422);
  expect(await cross.text()).not.toContain(SEED_SCOPE.mumbaiUniversity.departments.it.name);

  const sys = await request.post(`${base(BML.id)}/systems`, {
    ...h,
    data: { name: "E2E API QMS", systemType: "other", hostingModel: "saas", dataLocation: "unknown", ownerDepartmentId: deptId },
  });
  expect(sys.status(), await sys.text()).toBe(201);
  const sysItem = (await sys.json()).data.item;
  expect(sysItem).toMatchObject({ hostingModel: "saas", dataLocation: "unknown", processesChildrenData: "unknown", ownerDepartmentId: deptId });

  // Vendor linked to Org A's system → 422; to its own system → linked.
  const badVendor = await request.post(`${base(BML.id)}/vendors`, {
    ...h,
    data: { name: "E2E API Vendor", systemIds: [SEED_SCOPE.mumbaiUniversity.systems.lms.id] },
  });
  expect(badVendor.status()).toBe(422);
  const vendor = await request.post(`${base(BML.id)}/vendors`, { ...h, data: { name: "E2E API Vendor", vendorRole: "data_processor", systemIds: [sysItem.id] } });
  expect(vendor.status(), await vendor.text()).toBe(201);
  const vendorItem = (await vendor.json()).data.item;
  expect(vendorItem.systemIds).toEqual([sysItem.id]);

  // The new unknown-location system makes the stored tags stale until the next scope save.
  const scope = (await (await request.get(`${base(BML.id)}/scope`, h)).json()).data;
  expect(scope.preview.stale).toBe(true);
  expect(scope.preview.riskTags.map((t: { tag: string }) => t.tag)).toContain("cross_border_unknown");

  const inUse = await request.delete(`${base(BML.id)}/departments/${deptId}`, h);
  expect(inUse.status()).toBe(409);

  const renamed = await request.patch(`${base(BML.id)}/systems/${sysItem.id}`, { ...h, data: { dataLocation: "india" } });
  expect(renamed.status()).toBe(200);
  expect((await renamed.json()).data.item.dataLocation).toBe("india");

  const unlinked = await request.patch(`${base(BML.id)}/vendors/${vendorItem.id}`, { ...h, data: { systemIds: [] } });
  expect((await unlinked.json()).data.item.systemIds).toEqual([]);

  for (const [seg, id] of [["vendors", vendorItem.id], ["systems", sysItem.id], ["departments", deptId]] as const) {
    const del = await request.delete(`${base(BML.id)}/${seg}/${id}`, h);
    expect(del.status(), `${seg}`).toBe(200);
  }
  const gone = await request.patch(`${base(BML.id)}/departments/${deptId}`, { ...h, data: { name: "x" } });
  expect(gone.status()).toBe(404);

  expect(await auditCount("scope.departments.insert", deptId, since)).toBe(1);
  expect(await auditCount("scope.systems.update", sysItem.id, since)).toBe(1);
  expect(await auditCount("scope.departments.delete", deptId, since)).toBe(1);
  expect(await auditCount("scope.vendor_systems.insert", vendorItem.id, since)).toBe(1);
});

test("child ids: malformed → 400; another org's child via my org's path → 404", async ({ request }) => {
  const owner = await accessTokenFor(SEED_USERS.bharatManufacturing.email);
  expect((await request.patch(`${base(BML.id)}/systems/not-a-uuid`, { headers: bearer(owner), data: { name: "x" } })).status()).toBe(400);
  const res = await request.delete(`${base(BML.id)}/systems/${SEED_SCOPE.mumbaiUniversity.systems.lms.id}`, { headers: bearer(owner) });
  expect(res.status()).toBe(404);
  const still = await withDb(async (db) => (await db.query("SELECT 1 FROM public.systems WHERE id = $1", [SEED_SCOPE.mumbaiUniversity.systems.lms.id])).rowCount);
  expect(still).toBe(1);
});
