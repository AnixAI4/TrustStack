/**
 * Slice 9, Stage 4 — the Owner Action Pack, the Regulator-Ready Evidence Pack
 * and the evidence coverage counts, as data (no PDF rendered).
 */
import { describe, expect, it } from "vitest";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import { EXPOSURE_CAVEAT, exposureCaveat } from "./exposure.js";
import type { ForecastResult, Projection } from "./forecast.js";
import { CLOSURE_REFUSAL_MESSAGE } from "./gaps.js";
import {
  evidenceCoverage,
  evidencePack,
  evidenceStateText,
  isAcceptedEvidence,
  linkDirectHeads,
  ownerActionPack,
  reportDocumentText,
  type EvidenceIndexEntry,
  type EvidencePackInput,
  type OwnerActionPackInput,
  type ReportActionLine,
  type ReportDocument,
  type ReportExposure,
  type ReportHeader,
} from "./reports.js";

const TODAY = "2026-10-08";

const header: ReportHeader = {
  organizationName: "Sahyadri Health Trust",
  version: 2,
  asOf: TODAY,
  generatedAt: "2026-10-08T05:30:00.000Z",
  generatedByName: "Priya Nair",
};

const line = (over: Partial<ReportActionLine> = {}): ReportActionLine => ({
  id: "a1",
  title: "Encrypt the patient records store",
  source: "assessment",
  sourceLabel: "Assessment",
  parentName: "DPDP baseline 2026",
  context: "Security safeguards",
  mapping: { source: "assessment", domainCode: "SECURITY" },
  severity: "critical",
  priority: "P0",
  gapState: "open",
  status: "open",
  ownerUserId: "u-owner",
  ownerName: "Rahul Mehta",
  dueDate: "2026-11-01",
  closedAt: null,
  closedByName: null,
  closureBasis: null,
  notes: null,
  evidence: [],
  ...over,
});

const ropaLine = (over: Partial<ReportActionLine> = {}): ReportActionLine =>
  line({
    id: "r1",
    title: "Record parental consent at registration",
    source: "ropa",
    sourceLabel: "Processing register",
    parentName: "Paediatric outpatient registration",
    context: "ROPA-004 · No verifiable parental consent",
    mapping: { source: "ropa", gapCode: "child_consent_missing" },
    severity: "high",
    priority: "P1",
    ...over,
  });

const text = (doc: ReportDocument) => reportDocumentText(doc);

function expectNoBankInternals(t: string) {
  expect(t).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(t).not.toMatch(/_V\d+\b/);
  expect(t).not.toContain("trigger:");
  // The mapping key is never printed — only the heads it leads to.
  expect(t).not.toMatch(/child_consent_missing|SECURITY\b/);
}

// ---------------------------------------------------------------------------

describe("evidence states, in the owner's words", () => {
  it("accepted beats pending beats returned beats none", () => {
    expect(evidenceStateText({ evidence: [] }).text).toBe("No evidence attached");
    expect(evidenceStateText({ evidence: [{ fileName: "a", reviewStatus: "rejected" }] }).text).toBe("Evidence returned (Rejected) — provide more");
    expect(
      evidenceStateText({ evidence: [{ fileName: "a", reviewStatus: "rejected" }, { fileName: "b", reviewStatus: "pending" }] }).text,
    ).toBe("Evidence awaiting review");
    expect(
      evidenceStateText({ evidence: [{ fileName: "a", reviewStatus: "pending" }, { fileName: "b", reviewStatus: "strong" }] }).text,
    ).toBe("Accepted evidence attached — ready to close");
  });

  it("accepted is exactly Adequate or Strong — the closing rule (D-056)", () => {
    expect((["pending", "adequate", "strong", "partial", "rejected", "outdated"] as const).filter(isAcceptedEvidence)).toEqual(["adequate", "strong"]);
  });
});

describe("Owner Action Pack", () => {
  const input = (over: Partial<OwnerActionPackInput> = {}): OwnerActionPackInput => ({
    header,
    owner: { name: "Rahul Mehta" },
    today: TODAY,
    actions: [
      line({ id: "a1", title: "Overdue one", dueDate: "2026-10-01" }),
      line({ id: "a2", title: "Due soon", dueDate: "2026-10-20", evidence: [{ fileName: "p.pdf", reviewStatus: "pending" }] }),
      ropaLine({ id: "r1", dueDate: "2027-02-01" }),
      line({ id: "a3", title: "No date", dueDate: null }),
      line({ id: "a4", title: "Done already", status: "closed", closedAt: "2026-10-02T10:00:00Z", closureBasis: "evidence" }),
      line({ id: "a5", title: "Gap no longer applies", gapState: "superseded" }),
    ],
    records: [
      {
        recordCode: "ROPA-004",
        name: "Paediatric outpatient registration",
        statusLabel: "Draft",
        completenessScore: 45,
        bandLabel: "Basic",
        missing: ["Retention", "Notice"],
        riskLabel: "High",
        nextReviewAt: null,
      },
    ],
    ...over,
  });

  it("is addressed to the owner, carries D-011's caveat and no exposure caveat", () => {
    const doc = ownerActionPack(input());
    expect(doc.audience).toBe("For Rahul Mehta");
    expect(doc.caveats).toEqual([{ title: "About this report", text: DPDP_REPORT_CAVEAT }]);
    expect(text(doc)).not.toContain(EXPOSURE_CAVEAT);
    expect(doc.footer).toContain("Rahul Mehta");
  });

  it("counts what is owed: open gaps only, closed counted apart, overdue from today in India", () => {
    const tiles = ownerActionPack(input()).sections[0]!.blocks[0]!;
    expect(tiles).toMatchObject({
      type: "tiles",
      tiles: [
        { label: "Actions you owe", value: "4" },
        { label: "Overdue", value: "1", tone: "critical" },
        { label: "Due in the next 30 days", value: "1" },
        { label: "Closed", value: "1" },
      ],
    });
  });

  it("lists overdue first, then each window in order, both parents labelled by source", () => {
    const doc = ownerActionPack(input());
    const overdue = doc.sections.find((s) => s.title === "Overdue")!.blocks[0]!;
    expect(overdue.type === "table" && overdue.rows.map((r) => r[0])).toEqual(["Overdue one"]);
    const windows = doc.sections.find((s) => s.title === "Your actions, by when they are due")!.blocks;
    expect(windows.filter((b) => b.type === "subheading").map((b) => (b as { text: string }).text)).toEqual([
      "Next 30 days (1)",
      "After 90 days (1)",
      "Next assessment cycle (1)",
    ]);
    const all = text(doc);
    expect(all).toContain("Assessment · Security safeguards");
    expect(all).toContain("Processing register · ROPA-004 · No verifiable parental consent");
    expect(all).not.toContain("Done already");
    expect(all).not.toContain("Gap no longer applies");
  });

  it("asks for evidence on every owed action without accepted evidence, and says how an action closes", () => {
    const doc = ownerActionPack(
      input({ actions: [line({ id: "x", title: "Has accepted", evidence: [{ fileName: "a", reviewStatus: "adequate" }] }), line({ id: "y", title: "Has none" })] }),
    );
    const section = doc.sections.find((s) => s.title === "Evidence to provide")!;
    const table = section.blocks[0]!;
    expect(table.type === "table" && table.rows.map((r) => r[0])).toEqual(["Has none"]);
    expect(text(doc)).toContain(CLOSURE_REFUSAL_MESSAGE.no_evidence_or_reviewer);
  });

  it("flags a record whose review is overdue or unscheduled — the register's own rule", () => {
    const doc = ownerActionPack(input());
    expect(doc.sections[0]!.blocks[1]).toMatchObject({ type: "notice", text: "1 of your processing records is due for review or has no review date." });
    const table = doc.sections.find((s) => s.title === "Your processing register records")!.blocks[0]!;
    expect(table.type === "table" && table.rows[0]).toEqual([
      "ROPA-004 · Paediatric outpatient registration",
      "Draft",
      "45/100 · Basic",
      "Retention; Notice",
      "High",
      { text: "Not scheduled", tone: "critical" },
    ]);
  });

  it("an owner with nothing still gets a complete pack", () => {
    const doc = ownerActionPack(input({ actions: [], records: [] }));
    const all = text(doc);
    expect(all).toContain("Nothing is assigned to you that is still open.");
    expect(all).toContain("Nothing you owe is overdue.");
    expect(all).toContain("Every action you owe has accepted evidence attached.");
    expect(all).toContain("You are not named as the owner of any processing record.");
  });

  it("carries no question code, pack code, trigger or mapping key", () => {
    expectNoBankInternals(text(ownerActionPack(input())));
  });
});

// ---------------------------------------------------------------------------

const entry = (over: Partial<EvidenceIndexEntry> = {}): EvidenceIndexEntry => ({
  fileName: "policy.pdf",
  contentType: "application/pdf",
  byteSize: 2048,
  uploadedByName: "Rahul Mehta",
  uploadedAt: "2026-10-01T09:00:00Z",
  reviewStatus: "pending",
  evidenceLevel: null,
  reviewedByName: null,
  reviewedAt: null,
  reviewNotes: null,
  links: [],
  ...over,
});

const answerLink = (domainCode: "SECURITY" | "BREACH" | "GOV" | "CHILD" = "SECURITY") =>
  ({ type: "assessment_response", assessmentName: "DPDP baseline 2026", domainCode, questionText: "Is data encrypted at rest?" }) as const;

describe("evidence coverage — counts of artefacts, each once", () => {
  it("an artefact with several links counts once per head, per domain and in the total", () => {
    const c = evidenceCoverage([
      entry({
        reviewStatus: "strong",
        links: [
          answerLink("SECURITY"),
          answerLink("SECURITY"),
          { type: "gap_action", actionTitle: "Encrypt", sourceLabel: "Assessment", parentName: "x", context: "Security safeguards", mapping: { source: "assessment", domainCode: "SECURITY" } },
        ],
      }),
    ]);
    expect(c.total).toEqual({ artefacts: 1, accepted: 1, awaitingReview: 0, notAccepted: 0 });
    expect(c.byHead.H1).toEqual({ artefacts: 1, accepted: 1, awaitingReview: 0, notAccepted: 0 });
    expect(c.byDomain.SECURITY.artefacts).toBe(1);
    expect(c.byHead.H7.artefacts).toBe(0);
  });

  it("follows the model's mapping: VENDOR evidences heads 1 and 7; an enabling control evidences no head", () => {
    const vendor = { type: "gap_action" as const, actionTitle: "t", sourceLabel: "s", parentName: "p", context: "c", mapping: { source: "assessment" as const, domainCode: "VENDOR" as const } };
    expect(linkDirectHeads(vendor).sort()).toEqual(["H1", "H7"]);
    expect(linkDirectHeads(answerLink("GOV"))).toEqual([]);
    const c = evidenceCoverage([entry({ links: [answerLink("GOV")] })]);
    expect(Object.values(c.byHead).every((t) => t.artefacts === 0)).toBe(true);
    expect(c.byDomain.GOV.artefacts).toBe(1);
  });

  it("a register rule maps through the model too; a record link evidences its record", () => {
    const c = evidenceCoverage([
      entry({
        reviewStatus: "rejected",
        links: [
          { type: "gap_action", actionTitle: "t", sourceLabel: "Processing register", parentName: "p", context: "c", mapping: { source: "ropa", gapCode: "child_consent_missing" } },
          { type: "ropa_record", recordCode: "ROPA-004", recordName: "Paediatric" },
        ],
      }),
      entry({ links: [{ type: "ropa_record", recordCode: "ROPA-004", recordName: "Paediatric" }] }),
      entry({ links: [] }),
    ]);
    expect(c.byHead.H3).toEqual({ artefacts: 1, accepted: 0, awaitingReview: 0, notAccepted: 1 });
    expect(c.registerArtefacts).toBe(2);
    expect(c.recordsWithEvidence).toBe(1);
    expect(c.unlinked).toBe(1);
    expect(c.byStatus).toMatchObject({ pending: 2, rejected: 1, adequate: 0 });
  });
});

// ---------------------------------------------------------------------------

const projection = (over: Partial<Projection> = {}): Projection => ({
  outstanding: 3,
  requiredPerWeek: 0.2,
  p50Weeks: 6,
  p85Weeks: 9,
  p50Date: "2026-11-19",
  p85Date: "2026-12-10",
  beyondHorizon: { p50: false, p85: false },
  meetsDeadline: { p50: true, p85: true },
  ...over,
});

const forecast: ForecastResult = {
  today: TODAY,
  deadline: "2027-05-13",
  daysToDeadline: 217,
  weeklyClosures: [1, 0, 0, 0, 0, 0, 0, 0],
  activeWeeks: 1,
  averagePerWeek: 0.1,
  notEnoughHistory: true,
  criticalHigh: projection(),
  all: projection(),
  method: "Resamples the last eight weeks' closures 1,000 times with a fixed seed.",
};

const exposure: ReportExposure = {
  snapshotId: "5f0c3b8e-1111-4aaa-8bbb-000000000009",
  recordedAt: "2026-10-08T05:29:00.000Z",
  asOf: TODAY,
  modelVersion: "1.0.0",
  basis: "provisional",
  ceilingsAtStakeCrore: 450,
  exposedHeads: 2,
  applicableHeads: 3,
  heads: [
    { code: "H1", serial: 1, title: "Security safeguards", ceilingCrore: 250, applies: true, status: "exposed", statusLabel: "Exposed", atStake: true, position: null, reasons: [] },
    { code: "H2", serial: 2, title: "Breach notification", ceilingCrore: 200, applies: true, status: "partially_mitigated", statusLabel: "Partially mitigated", atStake: true, position: null, reasons: [] },
    { code: "H7", serial: 7, title: "Any other provision", ceilingCrore: 50, applies: true, status: "mitigated", statusLabel: "Mitigated", atStake: false, position: null, reasons: [] },
  ],
  forecast,
};

describe("Regulator-Ready Evidence Pack", () => {
  const input = (over: Partial<EvidencePackInput> = {}): EvidencePackInput => ({
    header,
    exposure,
    basis: { assessmentName: "DPDP baseline 2026", outstandingQuestions: 3, scopeSaved: true, assessmentGapsStale: false, registerGapsGenerated: true, registerGapsStale: false },
    entries: [entry({ reviewStatus: "adequate", links: [answerLink("SECURITY")] }), entry({ links: [] })],
    actions: [
      line({ id: "c1", title: "Closed on evidence", status: "closed", closedAt: "2026-10-03T08:00:00Z", closedByName: "Rahul Mehta", closureBasis: "evidence", evidence: [{ fileName: "x", reviewStatus: "strong" }] }),
      line({ id: "c2", title: "Closed by a reviewer", status: "closed", closedAt: "2026-10-05T08:00:00Z", closedByName: "Priya Nair", closureBasis: "reviewer_approval" }),
      line({ id: "o1", title: "Still open" }),
    ],
    readiness: null,
    registerRecords: 4,
    indexFileName: "TrustStack_Evidence_Index_v2_2026-10-08.xlsx",
    ...over,
  });

  it("carries both caveats verbatim, with the snapshot's model version", () => {
    const doc = evidencePack(input());
    expect(doc.caveats.map((c) => c.text)).toEqual([DPDP_REPORT_CAVEAT, exposureCaveat("1.0.0")]);
    expect(doc.meta).toContainEqual({ label: "Exposure model", value: "1.0.0" });
  });

  it("prints the stored heads with each head's artefacts, and every area with its heads or 'Enabling control'", () => {
    const doc = evidencePack(input());
    const byHead = doc.sections.find((s) => s.title === "Evidence by penalty head")!.blocks[0]!;
    expect(byHead.type === "table" && byHead.rows.map((r) => [r[0], (r[1] as { text: string }).text, r[3]])).toEqual([
      ["1. Security safeguards (s.8(5))", "Exposed", "1"],
      ["2. Breach notification (s.8(6))", "Partially mitigated", "0"],
      ["7. Any other provision", "Mitigated", "0"],
    ]);
    const byArea = doc.sections.find((s) => s.title === "Evidence by obligation area")!.blocks[0]!;
    expect(byArea.type === "table" && byArea.rows.length).toBe(16);
    const gov = byArea.type === "table" ? byArea.rows.find((r) => r[1] === "Enabling control") : undefined;
    expect(gov).toBeDefined();
  });

  it("says what was closed, on what basis, newest first", () => {
    const doc = evidencePack(input());
    const section = doc.sections.find((s) => s.title === "Remediation closed, and on what basis")!;
    expect(section.blocks[0]).toMatchObject({
      type: "tiles",
      tiles: [
        { label: "Closed on accepted evidence", value: "1" },
        { label: "Closed on a reviewer's approval", value: "1" },
        { label: "Still outstanding", value: "1" },
      ],
    });
    const table = section.blocks[1]!;
    expect(table.type === "table" && table.rows.map((r) => [r[0], r[4]])).toEqual([
      ["Closed by a reviewer", "A reviewer's approval"],
      ["Closed on evidence", "Accepted evidence"],
    ]);
  });

  it("names the Evidence Index generated with it", () => {
    expect(text(evidencePack(input()))).toContain("generated with this pack: TrustStack_Evidence_Index_v2_2026-10-08.xlsx.");
  });

  it("an organisation with nothing still gets a complete pack", () => {
    const all = text(evidencePack(input({ entries: [], actions: [], registerRecords: 0, indexFileName: null })));
    expect(all).toContain("No remediation action has been closed yet.");
    expect(all).toContain("0 of 0 live processing records have evidence attached (0 artefacts).");
  });

  it("carries no question code, pack code, trigger or mapping key", () => {
    expectNoBankInternals(text(evidencePack(input())));
  });
});
