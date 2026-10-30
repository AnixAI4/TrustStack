/**
 * GATE 5 — the route sweep. Enumerates every `app/api/v1/**\/route.ts` and every
 * HTTP method it exports FROM THE FILESYSTEM, then attacks each with an Org A
 * actor aimed at Org B. A route that is not in PROBES fails this test — so a
 * route added later cannot ship without a cross-tenant check.
 *
 * Actor: MU's Organisation Admin — every permission, member of Org A only — so
 * the only thing standing between it and Org B is tenancy.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  accessTokenFor,
  activeOrgCookieFrom,
  bearer,
  cleanupE2eInvitees,
  e2eEmail,
  giveInviteKnownToken,
  removeEvidence,
  SEED_ASSESSMENTS,
  SEED_EVIDENCE,
  SEED_ORGS,
  SEED_RESPONSES,
  SEED_ROPA,
  SEED_SCOPE,
  SEED_USERS,
} from "../helpers";

const ORG_A = SEED_ORGS.mumbaiUniversity;
const ORG_B = SEED_ORGS.bharatManufacturing;
const SCOPE = "sweep";

/**
 * A well-formed assessment id that belongs to nobody. Bharat Manufacturing has
 * no seeded assessment on purpose (it exercises the empty state), so a real
 * foreign id would have to be created here; an unowned id proves the same
 * thing — Org A's path must never resolve an id it does not own.
 */
const FOREIGN_ASSESSMENT_ID = "0b000006-0000-4000-8000-0000000000ff";

/** Well-formed gap and action ids that belong to nobody — same reasoning (Slice 6). */
const FOREIGN_GAP_ID = "0b00000a-0000-4000-8000-0000000000ff";
const FOREIGN_ACTION_ID = "0b00000b-0000-4000-8000-0000000000ff";

/**
 * Slice 7: a well-formed ROPA record and ROPA gap id that belong to nobody.
 * Bharat Manufacturing's register is empty on purpose (its empty state), and
 * another spec asserts it, so this sweep must not create one there. The real
 * Org-B-path-with-an-Org-A-id attack is in `e2e/api/ropa.spec.ts`.
 */
const FOREIGN_ROPA_ID = "0b00000c-0000-4000-8000-0000000000ff";
const FOREIGN_ROPA_GAP_ID = "0b00000d-0000-4000-8000-0000000000ff";
/**
 * Slice 10, Stage 3b: a well-formed notice / widget version id that belongs to
 * nobody. A published notice is never deleted, so the sweep never publishes
 * one on MU or BML; the real Org-B-id attacks are in `e2e/api/consent.spec.ts`.
 */
const FOREIGN_CONSENT_ID = "0b000013-0000-4000-8000-0000000000ff";
/**
 * Slice 10, Stage 4a: a well-formed vendor / processor assessment id that
 * belongs to nobody. An accepted assessment is never deleted, so the sweep
 * never accepts one on MU or BML; the real Org-B-id attacks are in
 * `e2e/api/processors.spec.ts`.
 */
const FOREIGN_VENDOR_ID = "0b000014-0000-4000-8000-0000000000ff";
/**
 * Slice 10, Stage 5: a well-formed retention schedule / AI system id that
 * belongs to nobody. An erasure is never changed and a schedule never deleted,
 * so the sweep writes neither on MU or BML; the real Org-B-id attacks are in
 * `e2e/api/retention.spec.ts`.
 */
const FOREIGN_RETENTION_ID = "0b000016-0000-4000-8000-0000000000ff";
/** Slice 9: a well-formed exposure snapshot id that belongs to nobody. */
const FOREIGN_SNAPSHOT_ID = "0b00000e-0000-4000-8000-0000000000ff";
/**
 * Slice 9, Stage 3: a well-formed report id that belongs to nobody. Generating
 * a report records a permanent exposure snapshot, so the sweep never generates
 * one on MU or BML; the real Org-B-id attacks are in `e2e/api/reports.spec.ts`.
 */
const FOREIGN_REPORT_ID = "0b00000f-0000-4000-8000-0000000000ff";
/**
 * Slice 10, Stage 1: a well-formed breach id that belongs to nobody. A breach
 * is never deleted, so the sweep never records one on MU or BML; the real
 * Org-B-path-with-an-Org-A-id attacks are in `e2e/api/breaches.spec.ts`.
 */
const FOREIGN_BREACH_ID = "0b000011-0000-4000-8000-0000000000ff";
/**
 * Slice 10, Stage 2: a well-formed rights request id that belongs to nobody.
 * A request is never deleted, so the sweep never records one on MU or BML;
 * the real Org-B-path attacks are in `e2e/api/rights.spec.ts`.
 */
const FOREIGN_RIGHTS_ID = "0b000013-0000-4000-8000-0000000000ff";
/** A seeded Mumbai University record — what an Org B path must never reach. */
const ORG_A_ROPA_ID = SEED_ROPA.records["ROPA-001"].id;

/** Mumbai University's seeded artefact (Slice 4) — the Org A evidence an Org B path must never reach. */
const ORG_A_EVIDENCE_ID = SEED_EVIDENCE.muG12OfficeOrder.id;

/** Strings that must never appear in any response to the Org A actor. */
const B_SCOPE = SEED_SCOPE.bharatManufacturing;
const ORG_B_MARKERS = [
  ORG_B.id,
  ORG_B.name,
  SEED_USERS.bharatManufacturing.email,
  SEED_USERS.bmlAdmin.email,
  SEED_USERS.bmlAdmin.id,
  SEED_USERS.bharatManufacturing.id,
  // Slice 2 — Org B's registers
  ...Object.values(B_SCOPE.departments).map((d) => d.id),
  ...Object.values(B_SCOPE.systems).map((d) => d.id),
  ...Object.values(B_SCOPE.vendors).map((d) => d.id),
  ...Object.values(B_SCOPE.dataPrincipalTypes).map((d) => d.id),
  "Payroll bureau",
  "Contract workers",
];

type ProbeResult = Awaited<ReturnType<Probe>>;

/** A tenant-scoped call aimed at Org B's path → must be TENANT_ACCESS_DENIED. */
async function denied(res: import("@playwright/test").APIResponse): Promise<ProbeResult> {
  return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
}

/**
 * Child routes get BOTH attacks: Org B's path (403), and Org A's own path with
 * an Org B child id — which must be a plain 404 and must not touch the row.
 */
function childProbe(method: "PATCH" | "DELETE", segment: string, childId: string, data?: object): Probe {
  return async (f) => {
    const send = (orgId: string) =>
      f.request.fetch(`/api/v1/organizations/${orgId}/${segment}/${childId}`, {
        method,
        headers: bearer(f.token),
        ...(data ? { data } : {}),
      });
    const viaA = await send(ORG_A.id);
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await send(ORG_B.id));
  };
}

const registerProbes = (segment: string, childId: string, create: object, patch: object): Record<string, Probe> => ({
  [`GET /api/v1/organizations/[id]/${segment}`]: async (f) =>
    denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/${segment}`, { headers: bearer(f.token) })),
  [`POST /api/v1/organizations/[id]/${segment}`]: async (f) =>
    denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/${segment}`, { headers: bearer(f.token), data: create })),
  [`PATCH /api/v1/organizations/[id]/${segment}/[${segment === "data-principal-types" ? "dataPrincipalTypeId" : segment.slice(0, -1) + "Id"}]`]:
    childProbe("PATCH", segment, childId, patch),
  [`DELETE /api/v1/organizations/[id]/${segment}/[${segment === "data-principal-types" ? "dataPrincipalTypeId" : segment.slice(0, -1) + "Id"}]`]:
    childProbe("DELETE", segment, childId),
});

interface Fixtures {
  request: APIRequestContext;
  token: string;
  /** A validly signed active-org cookie for ORG B — issued to someone else. */
  foreignOrgBCookie: string;
  /** An open Org B invite, and a token for it, addressed to someone else. */
  orgBInviteId: string;
  orgBInviteToken: string;
  /** A registered Org B evidence row (Slice 4) — Org A's path must 404 on it. */
  orgBEvidenceId: string;
}

type Probe = (f: Fixtures) => Promise<{ status: number; body: string; expectStatus: number[]; expectCode?: string }>;

const withCookie = (f: Fixtures) => ({ ...bearer(f.token), Cookie: `ts_active_org=${f.foreignOrgBCookie}` });

const PROBES: Record<string, Probe> = {
  "GET /api/v1/health": async ({ request }) => {
    const res = await request.get("/api/v1/health");
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "GET /api/v1/auth/me": async (f) => {
    const res = await f.request.get("/api/v1/auth/me", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "GET /api/v1/auth/me/organizations": async (f) => {
    const res = await f.request.get("/api/v1/auth/me/organizations", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "GET /api/v1/auth/me/permissions": async (f) => {
    const res = await f.request.get("/api/v1/auth/me/permissions", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "POST /api/v1/auth/switch-organization": async (f) => {
    const res = await f.request.post("/api/v1/auth/switch-organization", {
      headers: bearer(f.token),
      data: { organizationId: ORG_B.id },
    });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
  },
  "GET /api/v1/organizations/me": async (f) => {
    const res = await f.request.get(`/api/v1/organizations/me?organizationId=${ORG_B.id}`, { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "GET /api/v1/organizations/[id]/users": async (f) => {
    const res = await f.request.get(`/api/v1/organizations/${ORG_B.id}/users`, { headers: bearer(f.token) });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
  },
  "POST /api/v1/organizations/[id]/users/invite": async (f) => {
    const res = await f.request.post(`/api/v1/organizations/${ORG_B.id}/users/invite`, {
      headers: bearer(f.token),
      data: { email: e2eEmail(SCOPE, "into-b"), role: "legal_user" },
    });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
  },
  "PATCH /api/v1/organizations/[id]/users/[userId]": async (f) => {
    const res = await f.request.patch(`/api/v1/organizations/${ORG_B.id}/users/${SEED_USERS.bmlAdmin.id}`, {
      headers: bearer(f.token),
      data: { role: "legal_user" },
    });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
  },
  "POST /api/v1/organizations/[id]/invites/[inviteId]/resend": async (f) => {
    // Both shapes: Org B's path, and Org A's own path with Org B's invite id.
    const intoB = await f.request.post(`/api/v1/organizations/${ORG_B.id}/invites/${f.orgBInviteId}/resend`, {
      headers: bearer(f.token),
    });
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/invites/${f.orgBInviteId}/resend`, {
      headers: bearer(f.token),
    });
    const viaABody = await viaA.text();
    expect(viaA.status()).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return { status: intoB.status(), body: await intoB.text(), expectStatus: [403], expectCode: "TENANT_ACCESS_DENIED" };
  },
  // --- Slice 2 -------------------------------------------------------------
  "GET /api/v1/industries": async (f) => {
    const res = await f.request.get("/api/v1/industries", { headers: bearer(f.token) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  "GET /api/v1/organizations/[id]": async (f) =>
    denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}`, { headers: bearer(f.token) })),
  "PATCH /api/v1/organizations/[id]": async (f) =>
    denied(await f.request.patch(`/api/v1/organizations/${ORG_B.id}`, { headers: bearer(f.token), data: { name: "Forged" } })),
  "GET /api/v1/organizations/[id]/scope": async (f) =>
    denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/scope`, { headers: bearer(f.token) })),
  "PUT /api/v1/organizations/[id]/scope": async (f) =>
    denied(
      await f.request.put(`/api/v1/organizations/${ORG_B.id}/scope`, {
        headers: bearer(f.token),
        data: {
          industryCode: "general",
          dataPrincipalCountEstimate: 1,
          answers: {
            childrenData: "no", usesDataProcessors: "no", aiUsageTypes: [], marketingTracking: "no", crossBorder: "no",
            multiLocation: false, publicFacingPortal: "no", sensitiveDocuments: "no",
          },
        },
      }),
    ),
  "POST /api/v1/organizations/[id]/scope/preview-assessment": async (f) =>
    denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/scope/preview-assessment`, { headers: bearer(f.token) })),
  ...registerProbes("departments", B_SCOPE.departments.hr.id, { name: "Forged" }, { name: "Forged" }),
  ...registerProbes("systems", B_SCOPE.systems.erp.id, { name: "Forged", systemType: "crm" }, { name: "Forged" }),
  ...registerProbes("vendors", B_SCOPE.vendors.payrollBureau.id, { name: "Forged" }, { name: "Forged" }),
  ...registerProbes("data-principal-types", B_SCOPE.dataPrincipalTypes.contractors.id, { code: "other", label: "Forged" }, { label: "Forged" }),

  // --- Slice 3 -------------------------------------------------------------
  "GET /api/v1/dpdp-domains": async (f) => {
    // Global reference data: the permission is checked against the ACTIVE
    // membership, so a forged Org B cookie must not turn into Org B access.
    const res = await f.request.get("/api/v1/dpdp-domains", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [200] };
  },
  // Since D-071 the bank is Anix's view: MU's Organisation Admin — every
  // OTHER permission — is refused, with or without a forged Org B cookie, and
  // so is BML's. (A direct PostgREST attack is in `e2e/api/black-box.spec.ts`.)
  "GET /api/v1/question-packs": async (f) => {
    const bml = await f.request.get("/api/v1/question-packs", {
      headers: bearer(await accessTokenFor(SEED_USERS.bmlAdmin.email)),
    });
    expect(bml.status()).toBe(403);
    const res = await f.request.get("/api/v1/question-packs", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "FORBIDDEN" };
  },
  "GET /api/v1/question-packs/[code]/questions": async (f) => {
    const bml = await f.request.get("/api/v1/question-packs/CORE_DPDP_V1/questions", {
      headers: bearer(await accessTokenFor(SEED_USERS.bmlAdmin.email)),
    });
    expect(bml.status()).toBe(403);
    const res = await f.request.get("/api/v1/question-packs/CORE_DPDP_V1/questions", { headers: withCookie(f) });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "FORBIDDEN" };
  },
  "GET /api/v1/organizations/[id]/assessments": async (f) =>
    denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/assessments`, { headers: bearer(f.token) })),
  "POST /api/v1/organizations/[id]/assessments": async (f) =>
    denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/assessments`, {
        headers: bearer(f.token),
        data: { name: `Forged ${Date.now()}` },
      }),
    ),
  "GET /api/v1/organizations/[id]/assessments/[assessmentId]": async (f) => {
    // Org A's own path with Org A's assessment is fine; the attack is Org B's
    // path, and Org A's path carrying an id that is not Org A's → 404, no data.
    const viaA = await f.request.get(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}`,
      { headers: bearer(f.token) },
    );
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    return denied(
      await f.request.get(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}`, {
        headers: bearer(f.token),
      }),
    );
  },
  "GET /api/v1/organizations/[id]/assessments/[assessmentId]/questions": async (f) => {
    const viaA = await f.request.get(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/questions`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.get(
        `/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/questions`,
        { headers: bearer(f.token) },
      ),
    );
  },
  "POST /api/v1/organizations/[id]/assessments/[assessmentId]/generate-questions": async (f) => {
    const viaA = await f.request.post(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/generate-questions`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.post(
        `/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/generate-questions`,
        { headers: bearer(f.token) },
      ),
    );
  },

  // --- Slice 4 -------------------------------------------------------------
  "GET /api/v1/organizations/[id]/assessments/[assessmentId]/responses": async (f) => {
    const viaA = await f.request.get(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/responses`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.get(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/responses`, {
        headers: bearer(f.token),
      }),
    );
  },
  "PUT /api/v1/organizations/[id]/assessments/[assessmentId]/responses/[questionCode]": async (f) => {
    const data = { applicabilityDecision: "applicable", claimedMaturity: 5 };
    const viaA = await f.request.put(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/responses/G1.2`,
      { headers: bearer(f.token), data },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.put(
        `/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/responses/G1.2`,
        { headers: bearer(f.token), data },
      ),
    );
  },
  "GET /api/v1/organizations/[id]/assessments/[assessmentId]/score": async (f) => {
    const viaA = await f.request.get(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/score`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.get(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/score`, {
        headers: bearer(f.token),
      }),
    );
  },
  "POST /api/v1/organizations/[id]/assessments/[assessmentId]/finalise": async (f) => {
    const viaA = await f.request.post(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/finalise`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/finalise`, {
        headers: bearer(f.token),
      }),
    );
  },
  "DELETE /api/v1/organizations/[id]/evidence/[evidenceId]/links/[responseId]": async (f) => {
    // Org A's own path carrying an Org B evidence id → 404, no data leaked.
    const viaA = await f.request.delete(
      `/api/v1/organizations/${ORG_A.id}/evidence/${f.orgBEvidenceId}/links/${SEED_RESPONSES.muG12.id}`,
      { headers: bearer(f.token) },
    );
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.delete(
        `/api/v1/organizations/${ORG_B.id}/evidence/${ORG_A_EVIDENCE_ID}/links/${SEED_RESPONSES.muG12.id}`,
        { headers: bearer(f.token) },
      ),
    );
  },
  "POST /api/v1/organizations/[id]/evidence/upload-url": async (f) =>
    denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/evidence/upload-url`, {
        headers: bearer(f.token),
        data: { fileName: "forged.pdf", contentType: "application/pdf", byteSize: 10 },
      }),
    ),
  "POST /api/v1/organizations/[id]/evidence/[evidenceId]/link": async (f) => {
    const data = { responseId: SEED_RESPONSES.muG12.id };
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/evidence/${f.orgBEvidenceId}/link`, {
      headers: bearer(f.token),
      data,
    });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    // Slice 6: the same route also links to a gap ACTION. Org A's own evidence
    // aimed at an action id it does not own → 404, and nothing is linked.
    const toForeignAction = await f.request.post(`/api/v1/organizations/${ORG_A.id}/evidence/${ORG_A_EVIDENCE_ID}/link`, {
      headers: bearer(f.token),
      data: { gapActionId: FOREIGN_ACTION_ID },
    });
    expect(toForeignAction.status(), await toForeignAction.text()).toBe(404);
    return denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/evidence/${ORG_A_EVIDENCE_ID}/link`, {
        headers: bearer(f.token),
        data,
      }),
    );
  },
  "GET /api/v1/organizations/[id]/evidence/[evidenceId]/download-url": async (f) => {
    const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/evidence/${f.orgBEvidenceId}/download-url`, {
      headers: bearer(f.token),
    });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.get(`/api/v1/organizations/${ORG_B.id}/evidence/${ORG_A_EVIDENCE_ID}/download-url`, {
        headers: bearer(f.token),
      }),
    );
  },
  "PATCH /api/v1/organizations/[id]/evidence/[evidenceId]/review": async (f) => {
    const data = { reviewStatus: "strong", evidenceLevel: 5 };
    const viaA = await f.request.patch(`/api/v1/organizations/${ORG_A.id}/evidence/${f.orgBEvidenceId}/review`, {
      headers: bearer(f.token),
      data,
    });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.patch(`/api/v1/organizations/${ORG_B.id}/evidence/${ORG_A_EVIDENCE_ID}/review`, {
        headers: bearer(f.token),
        data,
      }),
    );
  },

  // --- Slice 6 -------------------------------------------------------------
  "GET /api/v1/organizations/[id]/assessments/[assessmentId]/gaps": async (f) => {
    const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/gaps`, {
      headers: bearer(f.token),
    });
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.get(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps`, {
        headers: bearer(f.token),
      }),
    );
  },
  "POST /api/v1/organizations/[id]/assessments/[assessmentId]/gaps/generate": async (f) => {
    const viaA = await f.request.post(
      `/api/v1/organizations/${ORG_A.id}/assessments/${FOREIGN_ASSESSMENT_ID}/gaps/generate`,
      { headers: bearer(f.token) },
    );
    expect(viaA.status()).toBe(404);
    return denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps/generate`, {
        headers: bearer(f.token),
      }),
    );
  },
  "PATCH /api/v1/organizations/[id]/assessments/[assessmentId]/gaps/[gapId]/actions/[actionId]": async (f) => {
    const data = { status: "in_progress" };
    // Org A's own assessment, a gap and an action that are not Org A's → 404.
    const viaA = await f.request.patch(
      `/api/v1/organizations/${ORG_A.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps/${FOREIGN_GAP_ID}/actions/${FOREIGN_ACTION_ID}`,
      { headers: bearer(f.token), data },
    );
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.patch(
        `/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps/${FOREIGN_GAP_ID}/actions/${FOREIGN_ACTION_ID}`,
        { headers: bearer(f.token), data },
      ),
    );
  },
  "DELETE /api/v1/organizations/[id]/assessments/[assessmentId]/gaps/[gapId]/actions/[actionId]/evidence/[evidenceId]":
    async (f) => {
      const viaA = await f.request.delete(
        `/api/v1/organizations/${ORG_A.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps/${FOREIGN_GAP_ID}/actions/${FOREIGN_ACTION_ID}/evidence/${f.orgBEvidenceId}`,
        { headers: bearer(f.token) },
      );
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(
        await f.request.delete(
          `/api/v1/organizations/${ORG_B.id}/assessments/${SEED_ASSESSMENTS.muBaseline.id}/gaps/${FOREIGN_GAP_ID}/actions/${FOREIGN_ACTION_ID}/evidence/${ORG_A_EVIDENCE_ID}`,
          { headers: bearer(f.token) },
        ),
      );
    },

  // --- Slice 7 -------------------------------------------------------------
  ...((): Record<string, Probe> => {
    const ropa = (orgId: string) => `/api/v1/organizations/${orgId}/ropa`;
    /** Org A's path with ids Org A does not own → 404 and nothing; Org B's path → 403. */
    const both = (method: string, tailA: string, tailB: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${ropa(ORG_A.id)}${tailA}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${ropa(ORG_B.id)}${tailB}`));
    };
    const actionTail = `/gaps/${FOREIGN_ROPA_GAP_ID}/actions/${FOREIGN_ACTION_ID}`;
    return {
      // --- Slice 8 ---------------------------------------------------------
      "GET /api/v1/organizations/[id]/dashboard": async (f) => {
        // Both directions: Org A's own dashboard carries nothing of Org B's…
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/dashboard`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        // …and Org B's path is refused outright.
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/dashboard`, { headers: bearer(f.token) }));
      },
      // --- Slice 9 ---------------------------------------------------------
      "GET /api/v1/organizations/[id]/exposure": async (f) => {
        // Both directions: Org A's own exposure carries nothing of Org B's…
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/exposure`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        // …and Org B's path is refused outright.
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/exposure`, { headers: bearer(f.token) }));
      },
      // Stage 2: history, recording and the what-if. The real Org-A-path-with-
      // an-Org-B-snapshot attack is in `e2e/api/exposure.spec.ts`.
      "GET /api/v1/organizations/[id]/exposure/snapshots": async (f) => {
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/exposure/snapshots`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/exposure/snapshots`, { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/exposure/snapshots": async (f) =>
        denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/exposure/snapshots`, { headers: bearer(f.token) })),
      "GET /api/v1/organizations/[id]/exposure/snapshots/[snapshotId]": async (f) => {
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/exposure/snapshots/${FOREIGN_SNAPSHOT_ID}`, { headers: bearer(f.token) });
        expect(viaA.status(), await viaA.text()).toBe(404);
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/exposure/snapshots/${FOREIGN_SNAPSHOT_ID}`, { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/exposure/what-if": async (f) => {
        // An action id that is not Org A's is simply unknown on Org A's path.
        const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/exposure/what-if`, {
          headers: bearer(f.token),
          data: { actionIds: [FOREIGN_ACTION_ID] },
        });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        expect(JSON.parse(viaABody).data.unknownActionIds).toEqual([FOREIGN_ACTION_ID]);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(
          await f.request.post(`/api/v1/organizations/${ORG_B.id}/exposure/what-if`, { headers: bearer(f.token), data: { actionIds: [] } }),
        );
      },
      // Stage 3: the report store.
      "GET /api/v1/organizations/[id]/reports": async (f) => {
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/reports`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/reports`, { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/reports": async (f) =>
        denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/reports`, { headers: bearer(f.token), data: { kind: "exposure_brief" } })),
      "GET /api/v1/organizations/[id]/reports/[reportId]": async (f) => {
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/reports/${FOREIGN_REPORT_ID}`, { headers: bearer(f.token) });
        expect(viaA.status(), await viaA.text()).toBe(404);
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/reports/${FOREIGN_REPORT_ID}`, { headers: bearer(f.token) }));
      },
      "GET /api/v1/organizations/[id]/reports/[reportId]/download-url": async (f) => {
        const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/reports/${FOREIGN_REPORT_ID}/download-url`, { headers: bearer(f.token) });
        expect(viaA.status(), await viaA.text()).toBe(404);
        return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/reports/${FOREIGN_REPORT_ID}/download-url`, { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/reports/[reportId]/regenerate": async (f) => {
        const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/reports/${FOREIGN_REPORT_ID}/regenerate`, { headers: bearer(f.token) });
        expect(viaA.status(), await viaA.text()).toBe(404);
        return denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/reports/${FOREIGN_REPORT_ID}/regenerate`, { headers: bearer(f.token) }));
      },
      // Slice 11 Stage 2b (D-133.1): a narrated version — Org B's actor never reaches Org A's report or narrative.
      "POST /api/v1/organizations/[id]/reports/[reportId]/narrate": async (f) => {
        const data = { draftId: "0b000000-0000-4000-8000-0000000fffff" };
        const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/reports/${FOREIGN_REPORT_ID}/narrate`, { headers: bearer(f.token), data });
        expect([403, 404], await viaA.text()).toContain(viaA.status());
        return denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/reports/${FOREIGN_REPORT_ID}/narrate`, { headers: bearer(f.token), data }));
      },
      "GET /api/v1/organizations/[id]/ropa": async (f) =>
        denied(await f.request.get(ropa(ORG_B.id), { headers: bearer(f.token) })),
      "POST /api/v1/organizations/[id]/ropa": async (f) =>
        denied(await f.request.post(ropa(ORG_B.id), { headers: bearer(f.token), data: { name: "Sweep" } })),
      "GET /api/v1/organizations/[id]/ropa/[ropaId]": both("GET", `/${FOREIGN_ROPA_ID}`, `/${ORG_A_ROPA_ID}`),
      "PATCH /api/v1/organizations/[id]/ropa/[ropaId]": both("PATCH", `/${FOREIGN_ROPA_ID}`, `/${ORG_A_ROPA_ID}`, { name: "Hijacked" }),
      "DELETE /api/v1/organizations/[id]/ropa/[ropaId]": both("DELETE", `/${FOREIGN_ROPA_ID}`, `/${ORG_A_ROPA_ID}`),
      "DELETE /api/v1/organizations/[id]/ropa/[ropaId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `/${FOREIGN_ROPA_ID}/evidence/${f.orgBEvidenceId}`, `/${ORG_A_ROPA_ID}/evidence/${ORG_A_EVIDENCE_ID}`)(f),
      "POST /api/v1/organizations/[id]/ropa/import": async (f) =>
        denied(
          await f.request.post(`${ropa(ORG_B.id)}/import`, {
            headers: bearer(f.token),
            data: { csv: "Processing Activity\nSweep", dryRun: true },
          }),
        ),
      "GET /api/v1/organizations/[id]/ropa/export": async (f) =>
        denied(await f.request.get(`${ropa(ORG_B.id)}/export`, { headers: bearer(f.token) })),
      "GET /api/v1/organizations/[id]/ropa/lookup": async (f) => {
        // Org A's path asking about Org B's system → 404 and nothing about it.
        const viaA = await f.request.get(`${ropa(ORG_A.id)}/lookup?systemId=${Object.values(B_SCOPE.systems)[0]!.id}`, {
          headers: bearer(f.token),
        });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(404);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(`${ropa(ORG_B.id)}/lookup?principal=Student`, { headers: bearer(f.token) }));
      },
      "GET /api/v1/organizations/[id]/ropa/gaps": async (f) =>
        denied(await f.request.get(`${ropa(ORG_B.id)}/gaps`, { headers: bearer(f.token) })),
      "POST /api/v1/organizations/[id]/ropa/gaps/generate": async (f) =>
        denied(await f.request.post(`${ropa(ORG_B.id)}/gaps/generate`, { headers: bearer(f.token) })),
      "PATCH /api/v1/organizations/[id]/ropa/gaps/[ropaGapId]/actions/[actionId]": both("PATCH", actionTail, actionTail, {
        status: "in_progress",
      }),
      "DELETE /api/v1/organizations/[id]/ropa/gaps/[ropaGapId]/actions/[actionId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${actionTail}/evidence/${f.orgBEvidenceId}`, `${actionTail}/evidence/${ORG_A_EVIDENCE_ID}`)(f),
    };
  })(),

  // --- Slice 10, Stage 1: the breach register --------------------------------
  ...(() => {
    const breaches = (orgId: string) => `/api/v1/organizations/${orgId}/breaches`;
    /** Org A's path with an id Org A does not own → 404 and nothing; Org B's path → 403. */
    const both = (method: string, tail: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${breaches(ORG_A.id)}${tail}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${breaches(ORG_B.id)}${tail}`));
    };
    const one = `/${FOREIGN_BREACH_ID}`;
    const action = `${one}/actions/${FOREIGN_ACTION_ID}`;
    return {
      "GET /api/v1/organizations/[id]/breaches": async (f) => {
        // Org A's own register carries nothing of Org B's; Org B's is refused.
        const viaA = await f.request.get(breaches(ORG_A.id), { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(breaches(ORG_B.id), { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/breaches": async (f) =>
        denied(
          await f.request.post(breaches(ORG_B.id), {
            headers: bearer(f.token),
            data: { title: "Sweep", nature: "other", severity: "low", awareAt: "2026-10-01T10:00:00+05:30" },
          }),
        ),
      "GET /api/v1/organizations/[id]/breaches/[breachId]": both("GET", one),
      "PATCH /api/v1/organizations/[id]/breaches/[breachId]": both("PATCH", one, { title: "Hijacked" }),
      "POST /api/v1/organizations/[id]/breaches/[breachId]/actions": both("POST", `${one}/actions`, { title: "Hijacked" }),
      "PATCH /api/v1/organizations/[id]/breaches/[breachId]/actions/[actionId]": both("PATCH", action, { status: "in_progress" }),
      "DELETE /api/v1/organizations/[id]/breaches/[breachId]/actions/[actionId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${action}/evidence/${f.orgBEvidenceId}`)(f),
      // Slice 10, Stage 6: a document on the incident itself.
      "DELETE /api/v1/organizations/[id]/breaches/[breachId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${one}/evidence/${f.orgBEvidenceId}`)(f),
    };
  })(),

  // --- Slice 10, Stage 2: the rights and grievance register ------------------
  ...(() => {
    const rights = (orgId: string) => `/api/v1/organizations/${orgId}/rights-requests`;
    /** Org A's path with an id Org A does not own → 404 and nothing; Org B's path → 403. */
    const both = (method: string, tail: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${rights(ORG_A.id)}${tail}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${rights(ORG_B.id)}${tail}`));
    };
    const one = `/${FOREIGN_RIGHTS_ID}`;
    const action = `${one}/actions/${FOREIGN_ACTION_ID}`;
    return {
      "GET /api/v1/organizations/[id]/rights-requests": async (f) => {
        // Org A's own register carries nothing of Org B's; Org B's is refused.
        const viaA = await f.request.get(rights(ORG_A.id), { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(rights(ORG_B.id), { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/rights-requests": async (f) =>
        denied(
          await f.request.post(rights(ORG_B.id), {
            headers: bearer(f.token),
            data: { kind: "access", receivedOn: "2026-10-01", channel: "email", requesterName: "Sweep", summary: "Sweep" },
          }),
        ),
      "GET /api/v1/organizations/[id]/rights-requests/[requestId]": both("GET", one),
      "PATCH /api/v1/organizations/[id]/rights-requests/[requestId]": both("PATCH", one, { summary: "Hijacked" }),
      // D-139: the s.11(1)(b) list — Org B's request id under Org A is a 404; Org B's path is refused.
      "GET /api/v1/organizations/[id]/rights-requests/[requestId]/sharing": both("GET", `${one}/sharing`),
      "POST /api/v1/organizations/[id]/rights-requests/[requestId]/actions": both("POST", `${one}/actions`, { title: "Hijacked" }),
      "PATCH /api/v1/organizations/[id]/rights-requests/[requestId]/actions/[actionId]": both("PATCH", action, { status: "in_progress" }),
      "DELETE /api/v1/organizations/[id]/rights-requests/[requestId]/actions/[actionId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${action}/evidence/${f.orgBEvidenceId}`)(f),
      // Slice 10, Stage 6: a document on the request itself.
      "DELETE /api/v1/organizations/[id]/rights-requests/[requestId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${one}/evidence/${f.orgBEvidenceId}`)(f),
    };
  })(),

  // --- Slice 10, Stage 3a: public intake ---------------------------------------
  // Public, so no tenant to deny: the attack is reaching Org B through its
  // public address. BML has no public pages, so every guess — its name as a
  // slug, its id — is the SAME 404, and no answer names it. The real
  // two-open-tenants attack (a submission confirmed through the other slug)
  // is in e2e/api/intake.spec.ts.
  ...(() => {
    const guesses = ["bharat-manufacturing-ltd", "bharat-manufacturing", ORG_B.id];
    const notFound = async (res: import("@playwright/test").APIResponse): Promise<ProbeResult> => ({
      status: res.status(),
      body: await res.text(),
      expectStatus: [404],
      expectCode: "NOT_FOUND",
    });
    const each = (send: (f: Fixtures, slug: string) => Promise<import("@playwright/test").APIResponse>): Probe => async (f) => {
      for (const slug of guesses.slice(1)) {
        const res = await send(f, slug);
        const body = await res.text();
        expect(res.status(), body).toBe(404);
        for (const marker of ORG_B_MARKERS) expect(body).not.toContain(marker);
      }
      return notFound(await send(f, guesses[0]!));
    };
    const submission = {
      surface: "rights",
      kind: "access",
      requesterName: "Sweep",
      requesterEmail: "sweep-intake@example.com",
      summary: "Sweep",
    };
    return {
      "GET /api/v1/public/[slug]": each((f, slug) => f.request.get(`/api/v1/public/${slug}`, { headers: bearer(f.token) })),
      "POST /api/v1/public/[slug]/submissions": each((f, slug) =>
        f.request.post(`/api/v1/public/${slug}/submissions`, { headers: bearer(f.token), data: submission }),
      ),
      "POST /api/v1/public/[slug]/submissions/[submissionId]/confirm": each((f, slug) =>
        f.request.post(`/api/v1/public/${slug}/submissions/${FOREIGN_RIGHTS_ID}/confirm`, {
          headers: bearer(f.token),
          data: { code: "123456" },
        }),
      ),
      "POST /api/v1/public/[slug]/submissions/[submissionId]/resend": each((f, slug) =>
        f.request.post(`/api/v1/public/${slug}/submissions/${FOREIGN_RIGHTS_ID}/resend`, { headers: bearer(f.token) }),
      ),
    };
  })(),

  // --- Slice 10, Stage 3b: notice and consent ----------------------------------
  // Staff routes: Org B's path → 403; Org A's path with an id Org A does not
  // own → 404 and nothing. The consent widget's public route: BML has no
  // public pages, so every guess is the same 404 (as for 3a's routes). The
  // two-open-tenants attacks are in e2e/api/consent.spec.ts.
  ...(() => {
    const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
    const both = (method: string, tail: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${base(ORG_A.id)}${tail}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${base(ORG_B.id)}${tail}`));
    };
    const bOnly = (method: string, tail: string, data?: object): Probe => async (f) =>
      denied(await f.request.fetch(`${base(ORG_B.id)}${tail}`, { method, headers: bearer(f.token), ...(data ? { data } : {}) }));
    const notice = `/privacy-notices/${FOREIGN_CONSENT_ID}`;
    const config = `/consent-configs/${FOREIGN_CONSENT_ID}`;
    const guesses = ["bharat-manufacturing-ltd", "bharat-manufacturing", ORG_B.id];
    return {
      "GET /api/v1/organizations/[id]/consent": async (f) => {
        const viaA = await f.request.get(`${base(ORG_A.id)}/consent`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(`${base(ORG_B.id)}/consent`, { headers: bearer(f.token) }));
      },
      "POST /api/v1/organizations/[id]/privacy-notices": bOnly("POST", "/privacy-notices", { language: "en", title: "Hijacked" }),
      "GET /api/v1/organizations/[id]/privacy-notices/[noticeId]": both("GET", notice),
      "PATCH /api/v1/organizations/[id]/privacy-notices/[noticeId]": both("PATCH", notice, { title: "Hijacked" }),
      "DELETE /api/v1/organizations/[id]/privacy-notices/[noticeId]": both("DELETE", notice),
      "POST /api/v1/organizations/[id]/consent-configs": bOnly("POST", "/consent-configs", { noticeId: FOREIGN_CONSENT_ID, purposes: [] }),
      "PATCH /api/v1/organizations/[id]/consent-configs/[configId]": both("PATCH", config, { position: "corner" }),
      "DELETE /api/v1/organizations/[id]/consent-configs/[configId]": both("DELETE", config),
      "POST /api/v1/organizations/[id]/consent-records": both("POST", "/consent-records", {
        configId: FOREIGN_CONSENT_ID,
        identifier: "sweep",
        action: "refused",
      }),
      "POST /api/v1/organizations/[id]/consent-records/lookup": bOnly("POST", "/consent-records/lookup", { identifier: "sweep" }),
      "GET /api/v1/public/[slug]/consent": async (f) => {
        for (const slug of guesses.slice(1)) {
          const res = await f.request.get(`/api/v1/public/${slug}/consent`, { headers: bearer(f.token) });
          const body = await res.text();
          expect(res.status(), body).toBe(404);
          for (const marker of ORG_B_MARKERS) expect(body).not.toContain(marker);
        }
        const res = await f.request.get(`/api/v1/public/${guesses[0]}/consent`, { headers: bearer(f.token) });
        return { status: res.status(), body: await res.text(), expectStatus: [404], expectCode: "NOT_FOUND" };
      },
      "POST /api/v1/public/[slug]/consent": async (f) => {
        const data = { configId: FOREIGN_CONSENT_ID, identifier: "sweep", action: "refused" };
        for (const slug of guesses.slice(1)) {
          const res = await f.request.post(`/api/v1/public/${slug}/consent`, { headers: bearer(f.token), data });
          const body = await res.text();
          expect(res.status(), body).toBe(404);
          for (const marker of ORG_B_MARKERS) expect(body).not.toContain(marker);
        }
        const res = await f.request.post(`/api/v1/public/${guesses[0]}/consent`, { headers: bearer(f.token), data });
        return { status: res.status(), body: await res.text(), expectStatus: [404], expectCode: "NOT_FOUND" };
      },
    };
  })(),

  // --- Slice 10, Stage 4a: the processor register ------------------------------
  // Org B's path → 403; Org A's path with ids Org A does not own → 404 and nothing.
  ...(() => {
    const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
    const both = (method: string, tail: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${base(ORG_A.id)}${tail}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${base(ORG_B.id)}${tail}`));
    };
    const vendor = `/processors/${FOREIGN_VENDOR_ID}`;
    const assessment = `${vendor}/assessments/${FOREIGN_VENDOR_ID}`;
    return {
      "GET /api/v1/organizations/[id]/processors": async (f) => {
        const viaA = await f.request.get(`${base(ORG_A.id)}/processors`, { headers: bearer(f.token) });
        const viaABody = await viaA.text();
        expect(viaA.status(), viaABody).toBe(200);
        for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
        return denied(await f.request.get(`${base(ORG_B.id)}/processors`, { headers: bearer(f.token) }));
      },
      "GET /api/v1/organizations/[id]/processors/[vendorId]": both("GET", vendor),
      "POST /api/v1/organizations/[id]/processors/[vendorId]/assessments": both("POST", `${vendor}/assessments`),
      "GET /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]": both("GET", assessment),
      "PATCH /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]": both("PATCH", assessment, { sourceNote: null, answers: [] }),
      "DELETE /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]": both("DELETE", assessment),
      "POST /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]/submit": both("POST", `${assessment}/submit`),
      "POST /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]/review": both("POST", `${assessment}/review`, {
        decision: "return",
        reason: "Sweep",
      }),
      // Stage 4b: sending and revoking the vendor's link.
      "POST /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]/link": both("POST", `${assessment}/link`, {
        respondentName: "Sweep",
        respondentEmail: "sweep-vendor-link@example.com",
      }),
      "DELETE /api/v1/organizations/[id]/processors/[vendorId]/assessments/[assessmentId]/link": both("DELETE", `${assessment}/link`),
    };
  })(),

  // --- Slice 10, Stage 5: the retention register and the AI risk register ------
  ...(() => {
    const base = (orgId: string) => `/api/v1/organizations/${orgId}`;
    /** Org A's path with an id Org A does not own → 404 and nothing; Org B's path → 403. */
    const both = (method: string, tail: string, data?: object): Probe => async (f) => {
      const send = (url: string) => f.request.fetch(url, { method, headers: bearer(f.token), ...(data ? { data } : {}) });
      const viaA = await send(`${base(ORG_A.id)}${tail}`);
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(404);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await send(`${base(ORG_B.id)}${tail}`));
    };
    const list = (tail: string): Probe => async (f) => {
      // Org A's own register carries nothing of Org B's; Org B's is refused.
      const viaA = await f.request.get(`${base(ORG_A.id)}${tail}`, { headers: bearer(f.token) });
      const viaABody = await viaA.text();
      expect(viaA.status(), viaABody).toBe(200);
      for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
      return denied(await f.request.get(`${base(ORG_B.id)}${tail}`, { headers: bearer(f.token) }));
    };
    const schedule = `/retention-schedules/${FOREIGN_RETENTION_ID}`;
    const action = `${schedule}/actions/${FOREIGN_ACTION_ID}`;
    const ai = `/ai-systems/${FOREIGN_RETENTION_ID}`;
    return {
      "GET /api/v1/organizations/[id]/retention-schedules": list("/retention-schedules"),
      "POST /api/v1/organizations/[id]/retention-schedules": async (f) =>
        denied(
          await f.request.post(`${base(ORG_B.id)}/retention-schedules`, {
            headers: bearer(f.token),
            data: { ropaRecordId: ORG_A_ROPA_ID, basis: "fixed_period", periodMonths: 12, startsOn: "2026-01-01" },
          }),
        ),
      "GET /api/v1/organizations/[id]/retention-schedules/[scheduleId]": both("GET", schedule),
      "PATCH /api/v1/organizations/[id]/retention-schedules/[scheduleId]": both("PATCH", schedule, { notes: "Hijacked" }),
      "POST /api/v1/organizations/[id]/retention-schedules/[scheduleId]/erasures": both("POST", `${schedule}/erasures`, {
        erasedOn: "2026-10-01",
        method: "deleted",
        processorsTold: "no",
      }),
      // D-096 (R4): marking an erasure as recorded in error.
      "POST /api/v1/organizations/[id]/retention-schedules/[scheduleId]/erasures/[erasureId]/void": both(
        "POST",
        `${schedule}/erasures/${FOREIGN_RETENTION_ID}/void`,
        { reason: "Hijacked" },
      ),
      "POST /api/v1/organizations/[id]/retention-schedules/[scheduleId]/actions": both("POST", `${schedule}/actions`, { title: "Hijacked" }),
      "PATCH /api/v1/organizations/[id]/retention-schedules/[scheduleId]/actions/[actionId]": both("PATCH", action, { status: "in_progress" }),
      "DELETE /api/v1/organizations/[id]/retention-schedules/[scheduleId]/actions/[actionId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${action}/evidence/${f.orgBEvidenceId}`)(f),
      "DELETE /api/v1/organizations/[id]/retention-schedules/[scheduleId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${schedule}/evidence/${f.orgBEvidenceId}`)(f),
      "GET /api/v1/organizations/[id]/ai-systems": list("/ai-systems"),
      "POST /api/v1/organizations/[id]/ai-systems": async (f) =>
        denied(
          await f.request.post(`${base(ORG_B.id)}/ai-systems`, {
            headers: bearer(f.token),
            data: { name: "Sweep", purpose: "Sweep", personalData: "Sweep" },
          }),
        ),
      "GET /api/v1/organizations/[id]/ai-systems/[aiSystemId]": both("GET", ai),
      "PATCH /api/v1/organizations/[id]/ai-systems/[aiSystemId]": both("PATCH", ai, { name: "Hijacked" }),
      "DELETE /api/v1/organizations/[id]/ai-systems/[aiSystemId]/evidence/[evidenceId]": async (f) =>
        both("DELETE", `${ai}/evidence/${f.orgBEvidenceId}`)(f),
    };
  })(),

  // --- Slice 11, Stage 1a: the AI gateway -------------------------------------------
  // Org B's path is refused before anything is read or sent. Org A's own path with
  // an assessment it does not own is a plain 404 — no context is built, no model
  // is called and no draft is stored. The real two-tenant attacks (drafts, audit,
  // the off switch) are in e2e/api/ai.spec.ts.
  "GET /api/v1/organizations/[id]/ai": async (f) => {
    const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/ai`, { headers: bearer(f.token) });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(200);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/ai`, { headers: bearer(f.token) }));
  },
  "POST /api/v1/organizations/[id]/ai/[task]": async (f) => {
    const data = { assessmentId: FOREIGN_ASSESSMENT_ID, questionCode: "G1.2" };
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/ai/question_helper`, { headers: bearer(f.token), data });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/ai/question_helper`, {
        headers: bearer(f.token),
        data: { assessmentId: SEED_ASSESSMENTS.muBaseline.id, questionCode: "G1.2" },
      }),
    );
  },

  // Stage 1b: rating an answer. Org A's path with a draft id it does not hold is a
  // plain 404 and changes nothing; Org B's path is refused before anything is read.
  "POST /api/v1/organizations/[id]/ai/drafts/[draftId]/feedback": async (f) => {
    const foreign = "0b0000ff-0000-4000-8000-0000000fd001";
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/ai/drafts/${foreign}/feedback`, { headers: bearer(f.token), data: { feedback: "up" } });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(
      await f.request.post(`/api/v1/organizations/${ORG_B.id}/ai/drafts/${foreign}/feedback`, { headers: bearer(f.token), data: { feedback: "up" } }),
    );
  },

  // Stage 2a: the drafts for the registers. Org A's path with a draft (or a target)
  // it does not hold is a plain 404 (or an empty list) and changes nothing; Org B's
  // path is refused before anything is read. The real two-tenant attacks — accepting
  // another organisation's draft, a reader deciding one — are in e2e/api/ai-drafts.spec.ts.
  "GET /api/v1/organizations/[id]/ai/drafts": async (f) => {
    const foreign = "0b0000ff-0000-4000-8000-0000000fd002";
    const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/ai/drafts?targetId=${foreign}`, { headers: bearer(f.token) });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(200);
    expect(JSON.parse(viaABody).data.drafts).toEqual([]);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/ai/drafts?targetId=${foreign}`, { headers: bearer(f.token) }));
  },
  "GET /api/v1/organizations/[id]/ai/drafts/[draftId]": async (f) => {
    const foreign = "0b0000ff-0000-4000-8000-0000000fd003";
    const viaA = await f.request.get(`/api/v1/organizations/${ORG_A.id}/ai/drafts/${foreign}`, { headers: bearer(f.token) });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await f.request.get(`/api/v1/organizations/${ORG_B.id}/ai/drafts/${foreign}`, { headers: bearer(f.token) }));
  },
  "POST /api/v1/organizations/[id]/ai/drafts/[draftId]/accept": async (f) => {
    const foreign = "0b0000ff-0000-4000-8000-0000000fd004";
    const data = { output: { letter: "Dear [Name],", summary: "" } };
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/ai/drafts/${foreign}/accept`, { headers: bearer(f.token), data });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/ai/drafts/${foreign}/accept`, { headers: bearer(f.token), data }));
  },
  "POST /api/v1/organizations/[id]/ai/drafts/[draftId]/discard": async (f) => {
    const foreign = "0b0000ff-0000-4000-8000-0000000fd005";
    const viaA = await f.request.post(`/api/v1/organizations/${ORG_A.id}/ai/drafts/${foreign}/discard`, { headers: bearer(f.token) });
    const viaABody = await viaA.text();
    expect(viaA.status(), viaABody).toBe(404);
    for (const marker of ORG_B_MARKERS) expect(viaABody).not.toContain(marker);
    return denied(await f.request.post(`/api/v1/organizations/${ORG_B.id}/ai/drafts/${foreign}/discard`, { headers: bearer(f.token) }));
  },

  // --- Slice 10, Stage 4b: the vendor-facing link --------------------------------
  // Public, so no tenant to deny: the attack is reaching Org B through a link.
  // A token is 256 random bits and only its hash is stored, so a guess is the
  // SAME 404 at every step, with nothing of Org B in it — and the caller's own
  // Supabase session counts for nothing here. The real two-tenants attack (one
  // link's session aimed at another's) is in e2e/api/vendor-link.spec.ts.
  ...(() => {
    const guess = "A".repeat(43);
    const notFound = (send: (f: Fixtures) => Promise<import("@playwright/test").APIResponse>): Probe => async (f) => {
      const res = await send(f);
      return { status: res.status(), body: await res.text(), expectStatus: [404], expectCode: "NOT_FOUND" };
    };
    const link = `/api/v1/vendor-links/${guess}`;
    return {
      "GET /api/v1/vendor-links/[token]": notFound((f) => f.request.get(link, { headers: bearer(f.token) })),
      "PATCH /api/v1/vendor-links/[token]": notFound((f) => f.request.patch(link, { headers: bearer(f.token), data: { answers: [] } })),
      "POST /api/v1/vendor-links/[token]/code": notFound((f) => f.request.post(`${link}/code`, { headers: bearer(f.token) })),
      "POST /api/v1/vendor-links/[token]/confirm": notFound((f) => f.request.post(`${link}/confirm`, { headers: bearer(f.token), data: { code: "123456" } })),
      "POST /api/v1/vendor-links/[token]/documents": notFound((f) =>
        f.request.post(`${link}/documents`, { headers: bearer(f.token), data: { fileName: "x.txt", contentType: "text/plain", byteSize: 1 } }),
      ),
      "POST /api/v1/vendor-links/[token]/documents/[evidenceId]/attach": notFound((f) =>
        f.request.post(`${link}/documents/${FOREIGN_VENDOR_ID}/attach`, { headers: bearer(f.token) }),
      ),
      "POST /api/v1/vendor-links/[token]/submit": notFound((f) =>
        f.request.post(`${link}/submit`, { headers: bearer(f.token), data: { declaredName: "Sweep", declaredRole: "Sweep", accurate: true } }),
      ),
    };
  })(),

  "POST /api/v1/invites/accept": async (f) => {
    const res = await f.request.post("/api/v1/invites/accept", {
      headers: bearer(f.token),
      data: { token: f.orgBInviteToken },
    });
    return { status: res.status(), body: await res.text(), expectStatus: [403], expectCode: "FORBIDDEN" };
  },
};

function discoverRoutes(): string[] {
  const apiRoot = path.resolve(import.meta.dirname, "../../app/api/v1");
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : name === "route.ts" ? [full] : [];
    });

  return walk(apiRoot).flatMap((file) => {
    const urlPath = "/api/v1/" + path.relative(apiRoot, path.dirname(file)).split(path.sep).join("/");
    const methods = [...readFileSync(file, "utf8").matchAll(/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/g)].map(
      (m) => m[1],
    );
    return methods.map((method) => `${method} ${urlPath}`);
  });
}

test.describe.configure({ mode: "serial" });
test.afterAll(async () => {
  await cleanupE2eInvitees(SCOPE);
  if (fixtures?.orgBEvidenceId) await removeEvidence(ORG_B.id, [fixtures.orgBEvidenceId]);
});

let fixtures: Omit<Fixtures, "request">;

test.beforeAll(async ({ playwright }) => {
  const baseURL = test.info().project.use.baseURL;
  const ctx = await playwright.request.newContext({ baseURL });
  const token = await accessTokenFor(SEED_USERS.muAdmin.email);

  const consultant = await accessTokenFor(SEED_USERS.consultant.email);
  const switched = await ctx.post("/api/v1/auth/switch-organization", {
    headers: bearer(consultant),
    data: { organizationId: ORG_B.id },
  });
  const foreignOrgBCookie = activeOrgCookieFrom(switched.headersArray());

  const bmlAdmin = await accessTokenFor(SEED_USERS.bmlAdmin.email);
  const invite = await ctx.post(`/api/v1/organizations/${ORG_B.id}/users/invite`, {
    headers: bearer(bmlAdmin),
    data: { email: e2eEmail(SCOPE, "bml-only"), role: "legal_user" },
  });
  expect(invite.status()).toBe(201);
  const orgBInviteId = (await invite.json()).data.invite.id as string;
  const orgBInviteToken = await giveInviteKnownToken(orgBInviteId);

  // An Org B evidence row, registered by Org B's own admin (Slice 4).
  const issued = await ctx.post(`/api/v1/organizations/${ORG_B.id}/evidence/upload-url`, {
    headers: bearer(bmlAdmin),
    data: { fileName: "bml-only.pdf", contentType: "application/pdf", byteSize: 10 },
  });
  expect(issued.status()).toBe(201);
  const orgBEvidenceId = (await issued.json()).data.evidence.id as string;
  ORG_B_MARKERS.push(orgBEvidenceId, "bml-only.pdf");

  await ctx.dispose();
  fixtures = { token, foreignOrgBCookie, orgBInviteId, orgBInviteToken, orgBEvidenceId };
});

test("every /api/v1 route on disk has a cross-tenant probe", () => {
  const discovered = discoverRoutes();
  expect(discovered.length).toBeGreaterThanOrEqual(10);
  const missing = discovered.filter((r) => !(r in PROBES));
  expect(missing, "add a probe to PROBES for each new route").toEqual([]);
  const stale = Object.keys(PROBES).filter((r) => !discovered.includes(r));
  expect(stale, "PROBES lists routes that no longer exist").toEqual([]);
});

for (const route of discoverRoutes()) {
  test(`${route} — Org A actor never receives Org B data`, async ({ playwright }) => {
    const probe = PROBES[route];
    test.skip(!probe, "reported by the coverage test above");
    const request = await playwright.request.newContext({ baseURL: test.info().project.use.baseURL });
    try {
      const result = await probe!({ request, ...fixtures });
      expect(result.expectStatus).toContain(result.status);
      if (result.expectCode) expect(JSON.parse(result.body).error.code).toBe(result.expectCode);
      for (const marker of ORG_B_MARKERS) expect(result.body).not.toContain(marker);
    } finally {
      await request.dispose();
    }
  });
}
