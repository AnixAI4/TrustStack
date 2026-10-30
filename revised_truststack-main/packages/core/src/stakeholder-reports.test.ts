/**
 * Slice 10, Stage 6 — the three stakeholder reports and the evidence index's
 * register link types, without a renderer.
 *
 *  - Each report prints the STORED snapshot for its own heads, both caveats
 *    verbatim, and the registers' own counts — never a computed figure.
 *  - A TrustStack target is never presented as statute (pitfall 1); the AI
 *    register is a note, never a status; a request is named by code and kind.
 *  - Nothing is bank internals (D-071) and an empty organisation still gets a
 *    complete report.
 */
import { describe, expect, it } from "vitest";
import { AI_RISK_NOTE } from "./ai-risk.js";
import { BREACH_CLOCK_NOTE } from "./breach.js";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import { countRopaRegister } from "./dashboard.js";
import { S37_NOTICE, exposureCaveat } from "./exposure.js";
import type { ForecastResult, Projection } from "./forecast.js";
import {
  EVIDENCE_LINK_LABEL,
  evidenceCoverage,
  legalPositionReport,
  linkDirectHeads,
  processorExposureReport,
  reportDocumentText,
  reportFileName,
  securityBreachReport,
  type EvidenceIndexEntry,
  type EvidenceLinkLine,
  type LegalPositionInput,
  type ProcessorExposureInput,
  type ReportActionLine,
  type ReportBreachLine,
  type ReportExposure,
  type ReportExposureHead,
  type ReportHeader,
  type ReportProcessorLine,
  type SecurityBreachInput,
  type StakeholderReportInput,
} from "./reports.js";
import { RETENTION_DEEMED_NOTE, RETENTION_NOTE } from "./retention.js";
import { RIGHTS_CLOCK_NOTE } from "./rights.js";
import { evidenceIndexWorkbook } from "./workbooks.js";

// ---------------------------------------------------------------------------
// Fixtures — the shapes the app's readers hand over
// ---------------------------------------------------------------------------

const header: ReportHeader = {
  organizationName: "Sahyadri Health Trust",
  version: 2,
  asOf: "2026-10-18",
  generatedAt: "2026-10-18T05:30:00.000Z",
  generatedByName: "Priya Nair",
};

const projection = (): Projection => ({
  outstanding: 6,
  requiredPerWeek: 0.4,
  p50Weeks: 10,
  p85Weeks: 14,
  p50Date: "2026-12-27",
  p85Date: "2027-01-24",
  beyondHorizon: { p50: false, p85: false },
  meetsDeadline: { p50: true, p85: true },
});

const forecast: ForecastResult = {
  today: "2026-10-18",
  deadline: "2027-05-13",
  daysToDeadline: 207,
  weeklyClosures: [1, 0, 2, 0, 1, 0, 0, 1],
  activeWeeks: 4,
  averagePerWeek: 0.6,
  notEnoughHistory: false,
  criticalHigh: projection(),
  all: projection(),
  method: "Resamples the last eight weeks' closures.",
};

const head = (over: Partial<ReportExposureHead> & Pick<ReportExposureHead, "code" | "serial">): ReportExposureHead => ({
  title: `Head ${over.serial} title`,
  ceilingCrore: 200,
  applies: true,
  status: "exposed",
  statusLabel: "Exposed",
  atStake: true,
  position: { points: 3, band: "middle", bandLabel: "Middle third", rangeLabel: "₹67–133 crore", factors: [] },
  reasons: [{ kind: "status", text: `Reason on head ${over.serial}.` }],
  ...over,
});

const exposure = (over: Partial<ReportExposure> = {}): ReportExposure => ({
  snapshotId: "5f0c3b8e-1111-4aaa-8bbb-000000000006",
  recordedAt: "2026-10-18T05:30:00.000Z",
  asOf: "2026-10-18",
  modelVersion: "1.5.0",
  basis: "provisional",
  ceilingsAtStakeCrore: 450,
  exposedHeads: 3,
  applicableHeads: 4,
  heads: [
    head({ code: "H1", serial: 1, ceilingCrore: 250, status: "partially_mitigated", statusLabel: "Partially mitigated" }),
    head({ code: "H2", serial: 2 }),
    head({ code: "H3", serial: 3, status: "mitigated", statusLabel: "Mitigated", atStake: false, position: null }),
    head({ code: "H4", serial: 4, ceilingCrore: 150, applies: false, status: "not_applicable", statusLabel: "Not applicable", atStake: false, position: null }),
    head({ code: "H7", serial: 7, ceilingCrore: 50 }),
  ],
  forecast,
  ...over,
});

const action = (over: Partial<ReportActionLine> = {}): ReportActionLine => ({
  id: "a1",
  title: "Close the firewall rule",
  source: "breach",
  sourceLabel: "Breach register",
  parentName: "Laptop stolen",
  context: "BR-2026-001 · Theft or loss",
  mapping: { source: "breach" },
  severity: "high",
  priority: "P1",
  gapState: "open",
  status: "open",
  ownerUserId: "u1",
  ownerName: "Rahul Mehta",
  dueDate: "2026-10-01",
  closedAt: null,
  closedByName: null,
  closureBasis: null,
  notes: null,
  evidence: [],
  ...over,
});

const base = (over: Partial<StakeholderReportInput> = {}): StakeholderReportInput => ({
  header,
  exposure: exposure(),
  basis: {
    assessmentName: "DPDP baseline 2026",
    outstandingQuestions: 10,
    scopeSaved: true,
    assessmentGapsStale: false,
    registerGapsGenerated: true,
    registerGapsStale: false,
  },
  today: "2026-10-18",
  actions: [
    action(),
    action({ id: "a2", title: "Answer the access request", source: "rights", sourceLabel: "Rights and grievance register", context: "RR-2026-002 · Access (s.11)", mapping: { source: "rights" } }),
    action({ id: "a3", title: "Erase the admissions archive", source: "retention", sourceLabel: "Retention register", context: "ROPA-009", mapping: { source: "retention" } }),
    action({ id: "a4", title: "Closed already", status: "closed", closureBasis: "evidence" }),
  ],
  ...over,
});

const breachLine = (over: Partial<ReportBreachLine> = {}): ReportBreachLine => ({
  incidentCode: "BR-2026-001",
  title: "Laptop stolen",
  natureLabel: "Theft or loss",
  severityLabel: "High",
  statusLabel: "Open",
  awareAt: "2026-10-16T04:00:00.000Z",
  boardClock: { state: "overdue", label: "Overdue by 1h 30m" },
  extensionUntil: null,
  boardInitialAt: "2026-10-16T06:00:00.000Z",
  boardReportAt: null,
  principalsAt: null,
  documents: 2,
  ...over,
});

const securityInput = (over: Partial<SecurityBreachInput> = {}): SecurityBreachInput => ({
  ...base(),
  breaches: {
    counts: { total: 2, active: 1, insideWindow: 0, overdue: 1, principalsPending: 1, closed: 1, dismissed: 0 },
    incidents: [breachLine(), breachLine({ incidentCode: "BR-2026-000", statusLabel: "Closed", boardClock: { state: "made", label: "Made 2 Oct 2026, 10:00 IST" }, principalsAt: "2026-10-02T05:00:00.000Z" })],
  },
  readiness: null,
  ...over,
});

const legalInput = (over: Partial<LegalPositionInput> = {}): LegalPositionInput => ({
  ...base(),
  rights: {
    counts: { total: 3, openRequests: 1, openGrievances: 1, pastTarget: 1, overdue: 1, overdueGrievances: 0, responded: 1, respondedLate: 0, closedOtherwise: 0 },
    attention: [{ requestCode: "RR-2026-001", kindLabel: "Access to information", clockLabel: "Overdue — day 95, past the 90-day ceiling", overdue: true }],
  },
  consent: {
    counts: { principals: 3, given: 2, refused: 0, withdrawn: 1, onBehalf: 1, unverified: 1 },
    notices: [{ languageLabel: "English", version: 1, publishedOn: "2026-10-01" }],
    liveWidgetVersion: 1,
  },
  register: countRopaRegister([], "2026-10-18"),
  retention: {
    counts: { total: 10, noEnd: 1, running: 7, endingSoon: 0, overdue: 1, erased: 1 },
    overdue: [{ recordCode: "ROPA-009", endsOn: "2026-06-30", erasureIncomplete: true }],
    thirdScheduleLabel: null,
  },
  ai: { counts: { total: 1, inUse: 1, unreviewed: 1, childTracking: 1, childTrackingUnexempt: 1, childTrackingUnknown: 0 }, sdfNotified: false },
  ...over,
});

const vendor = (over: Partial<ReportProcessorLine> = {}): ReportProcessorLine => ({
  name: "PayFast Gateway",
  service: "Fee collection",
  role: "data_processor",
  isProcessor: true,
  contractExists: "yes",
  dpdpClauses: "no",
  crossBorder: "no",
  contractGap: true,
  contractReviewPassed: false,
  current: null,
  open: { statusLabel: "Awaiting review", withVendor: false },
  documents: 1,
  ...over,
});

const processorInput = (over: Partial<ProcessorExposureInput> = {}): ProcessorExposureInput => ({
  ...base(),
  processors: {
    counts: { vendors: 3, processors: 2, contractGaps: 1, accepted: 1, neverAssessed: 1, awaitingReview: 1, withVendor: 0, outOfDate: 0 },
    vendors: [
      vendor(),
      vendor({ name: "CloudHost", service: null, contractGap: false, dpdpClauses: "yes", current: { riskScore: 30, riskTierLabel: "Medium", reviewBy: "2027-09-01", outOfDate: false }, open: null }),
      vendor({ name: "Alumni Association", role: "independent", isProcessor: false, contractGap: false, open: null }),
    ],
  },
  ...over,
});

/** A question code (G1.2), a pack code (CORE_DPDP_V1) or a trigger — never in a report (D-071). */
function expectNoBankInternals(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/_V\d+\b/);
  expect(text).not.toContain("trigger:");
}

const builders = [
  ["security_breach", () => securityBreachReport(securityInput())],
  ["legal_position", () => legalPositionReport(legalInput())],
  ["processor_exposure", () => processorExposureReport(processorInput())],
] as const;

// ---------------------------------------------------------------------------

describe("every stakeholder report", () => {
  for (const [kind, build] of builders) {
    it(`${kind}: both caveats verbatim, the snapshot's model version, no bank internals`, () => {
      const doc = build();
      expect(doc.kind).toBe(kind);
      expect(doc.caveats).toEqual([
        { title: "About this report", text: DPDP_REPORT_CAVEAT },
        { title: "About the exposure figures", text: exposureCaveat("1.5.0") },
      ]);
      expect(doc.meta).toContainEqual({ label: "Exposure model", value: "1.5.0" });
      expectNoBankInternals(reportDocumentText(doc));
      expect(reportDocumentText(doc)).not.toMatch(/Mumbai|University|student/i);
    });

    it(`${kind}: the s.37 notice only while a head is at stake`, () => {
      expect(reportDocumentText(build())).toContain(S37_NOTICE);
    });
  }

  it("file names name the stakeholder report", () => {
    expect(reportFileName("security_breach", 1, "2026-10-18")).toBe("TrustStack_Security_and_Breach_Report_v1_2026-10-18.pdf");
    expect(reportFileName("legal_position", 2, "2026-10-18")).toBe("TrustStack_Legal_Position_Report_v2_2026-10-18.pdf");
    expect(reportFileName("processor_exposure", 3, "2026-10-18")).toBe("TrustStack_Processor_Exposure_Report_v3_2026-10-18.pdf");
  });
});

describe("Security and Breach Report", () => {
  it("leads with heads 2 and 1 as stored, and the Rule 7 counts as the register counted them", () => {
    const doc = securityBreachReport(securityInput());
    const tiles = doc.sections[0]!.blocks.find((b) => b.type === "tiles");
    expect(tiles?.type === "tiles" && tiles.tiles.map((t) => [t.label, t.value])).toEqual([
      ["2. Breach notification (s.8(6))", "Exposed"],
      ["1. Security safeguards (s.8(5))", "Partially mitigated"],
      ["Detailed reports to the Board overdue", "1"],
      ["Affected people not yet told", "1"],
    ]);
    const text = reportDocumentText(doc);
    expect(text).toContain("BR-2026-001 · Laptop stolen (Theft or loss; High)");
    expect(text).toContain("Detailed report: Overdue by 1h 30m.");
    expect(text).toContain("Not recorded as told");
    expect(text).toContain(BREACH_CLOCK_NOTE);
  });

  it("prints only heads 2 and 1 in detail, in the title's order, and only breach remediation still owed", () => {
    const text = reportDocumentText(securityBreachReport(securityInput()));
    expect(text.indexOf("Reason on head 2.")).toBeLessThan(text.indexOf("Reason on head 1."));
    expect(text).toContain("Reason on head 2.");
    expect(text).toContain("Reason on head 1.");
    expect(text).not.toContain("Reason on head 7.");
    expect(text).toContain("Close the firewall rule");
    expect(text).not.toContain("Answer the access request");
    expect(text).not.toContain("Closed already");
  });

  it("an organisation with no breach and no assessment still gets a complete report", () => {
    const doc = securityBreachReport(
      securityInput({ actions: [], breaches: { counts: { total: 0, active: 0, insideWindow: 0, overdue: 0, principalsPending: 0, closed: 0, dismissed: 0 }, incidents: [] } }),
    );
    const text = reportDocumentText(doc);
    expect(text).toContain("No personal data breach is recorded.");
    expect(text).toContain("No assessment yet, so the security areas have no score.");
    expect(text).toContain("No remedial action on a breach is outstanding.");
  });
});

describe("Legal Position Report", () => {
  it("leads with heads 3 and 7; the 30 days are TrustStack's, the ninety the Rules'", () => {
    const text = reportDocumentText(legalPositionReport(legalInput()));
    expect(text).toContain("3. Children and lawful guardians");
    expect(text).toContain("Open past TrustStack's 30-day target — a target, not a statutory period");
    expect(text).toContain("Open past the ninety days the Rules allow (Rule 14(3))");
    expect(text).toContain(RIGHTS_CLOCK_NOTE);
    expect(text).toContain("RR-2026-001");
  });

  it("an erasure counts only when complete and not voided; an incomplete one says so", () => {
    const text = reportDocumentText(legalPositionReport(legalInput()));
    expect(text).toContain("Erasure incomplete — processors not told");
    expect(text).toContain("An erasure counts only when it is complete");
    expect(text).toContain("No Third Schedule class is recorded, so Rule 8(1)–(2) do not apply");
    expect(text).toContain(RETENTION_NOTE);
    expect(text).not.toContain(RETENTION_DEEMED_NOTE);
  });

  it("names the Third Schedule class only when one is recorded, with the deemed basis's own words", () => {
    const text = reportDocumentText(
      legalPositionReport(legalInput({ retention: { ...legalInput().retention, thirdScheduleLabel: "E-commerce entity with at least two crore registered users in India" } })),
    );
    expect(text).toContain("recorded in the Third Schedule (E-commerce entity");
    expect(text).toContain(RETENTION_DEEMED_NOTE);
  });

  it("the AI register is an enabling note — the s.9(3) warning for counsel, never a status", () => {
    const doc = legalPositionReport(legalInput());
    const ai = doc.sections.find((s) => s.title.startsWith("AI systems"))!;
    expect(ai.title).toBe("AI systems — an enabling note, not a status");
    const text = reportDocumentText(doc);
    expect(text).toContain("for counsel to confirm");
    expect(text).toContain(AI_RISK_NOTE);
    expect(text).toContain("so head 4 does not apply");
    // No exempt-free tracking → no warning.
    const quiet = reportDocumentText(legalPositionReport(legalInput({ ai: { counts: { total: 1, inUse: 1, unreviewed: 0, childTracking: 1, childTrackingUnexempt: 0, childTrackingUnknown: 0 }, sdfNotified: true } })));
    expect(quiet).not.toContain("for counsel to confirm");
    expect(quiet).toContain("head 4 applies");
  });

  it("warns on a child's consent with no verification (s.9(1)) only when there is one", () => {
    expect(reportDocumentText(legalPositionReport(legalInput()))).toContain("Section 9(1) requires the verifiable consent");
    const none = legalInput();
    none.consent = { ...none.consent, counts: { ...none.consent.counts, unverified: 0 } };
    expect(reportDocumentText(legalPositionReport(none))).not.toContain("Section 9(1) requires the verifiable consent");
  });

  it("lists rights and retention remediation still owed, not a breach's", () => {
    const text = reportDocumentText(legalPositionReport(legalInput()));
    expect(text).toContain("Answer the access request");
    expect(text).toContain("Erase the admissions archive");
    expect(text).not.toContain("Close the firewall rule");
  });

  it("an empty organisation still gets a complete report", () => {
    const text = reportDocumentText(
      legalPositionReport(
        legalInput({
          actions: [],
          rights: { counts: { total: 0, openRequests: 0, openGrievances: 0, pastTarget: 0, overdue: 0, overdueGrievances: 0, responded: 0, respondedLate: 0, closedOtherwise: 0 }, attention: [] },
          consent: { counts: { principals: 0, given: 0, refused: 0, withdrawn: 0, onBehalf: 0, unverified: 0 }, notices: [], liveWidgetVersion: null },
          retention: { counts: { total: 0, noEnd: 0, running: 0, endingSoon: 0, overdue: 0, erased: 0 }, overdue: [], thirdScheduleLabel: null },
          ai: { counts: { total: 0, inUse: 0, unreviewed: 0, childTracking: 0, childTrackingUnexempt: 0, childTrackingUnknown: 0 }, sdfNotified: false },
        }),
      ),
    );
    expect(text).toContain("No privacy notice has been published.");
    expect(text).toContain("No consent widget version is published");
    expect(text).toContain("No erasure is overdue.");
  });
});

describe("Processor Exposure Report", () => {
  it("leads with heads 1 and 7, and the register's own counts", () => {
    const doc = processorExposureReport(processorInput());
    const tiles = doc.sections[0]!.blocks.find((b) => b.type === "tiles");
    expect(tiles?.type === "tiles" && tiles.tiles.map((t) => t.label)).toEqual([
      "1. Security safeguards (s.8(5))",
      "7. Any other provision",
      "Processors with a contract gap",
      // B3's words for the reader's count (D-116.9), in the report too (B4, F4.4).
      "Processors with no accepted assessment",
    ]);
    // F4.4: the heads are named on the tiles; the section says what it is.
    expect(doc.sections.map((s) => s.title)).toContain("The penalty heads this report covers");
    expect(doc.sections.map((s) => s.title).join(" ")).not.toMatch(/Penalty heads \d and \d/);
  });

  it("says what each contract needs, citing s.8(2) and Rule 6(1)(f); an independent fiduciary is outside s.8(2)", () => {
    const text = reportDocumentText(processorExposureReport(processorInput()));
    expect(text).toContain("Contract: Yes. DPDP clauses: No.");
    // F4.4: the real next step — amend the contract, then record it.
    expect(text).toContain("Amend the contract to carry DPDP clauses, then record it");
    expect(text).not.toContain("Record that the contract carries DPDP clauses");
    // B3's words everywhere in the report — the tile, the column and the count row (D-116.9).
    expect(text).toContain("…with no accepted assessment");
    expect(text.toLowerCase()).not.toContain("never assessed");
    expect(text).toContain("Rule 6(1)(f)");
    expect(text).toContain("1 vendor is recorded as an independent Data Fiduciary");
    expect(text).toContain("Accepted · risk 30 (Medium)");
    expect(text).toContain("Awaiting review");
  });

  it("an organisation with no vendor still gets a complete report", () => {
    const text = reportDocumentText(
      processorExposureReport(
        processorInput({ processors: { counts: { vendors: 0, processors: 0, contractGaps: 0, accepted: 0, neverAssessed: 0, awaitingReview: 0, withVendor: 0, outOfDate: 0 }, vendors: [] } }),
      ),
    );
    expect(text).toContain("No vendor is recorded.");
    expect(text).toContain("Every processor has a contract with DPDP clauses recorded.");
    expect(text).toContain("Every processor has a current accepted assessment.");
  });
});

// ---------------------------------------------------------------------------

const entry = (links: EvidenceLinkLine[]): EvidenceIndexEntry => ({
  fileName: "board-intimation.pdf",
  contentType: "application/pdf",
  byteSize: 2048,
  uploadedByName: "Rahul Mehta",
  uploadedAt: "2026-10-16T09:00:00Z",
  reviewStatus: "adequate",
  evidenceLevel: 3,
  reviewedByName: "Priya Nair",
  reviewedAt: "2026-10-17T09:00:00Z",
  reviewNotes: null,
  links,
});

const REGISTER_LINKS: EvidenceLinkLine[] = [
  { type: "breach_incident", incidentCode: "BR-2026-001", title: "Laptop stolen" },
  { type: "rights_request", requestCode: "RR-2026-001", kindLabel: "Access to information" },
  { type: "vendor", vendorName: "PayFast Gateway", service: "Fee collection" },
  { type: "retention_schedule", scheduleName: "ROPA-009 · Admissions archive", context: "ROPA-009 · Fixed period" },
  { type: "ai_system", systemName: "AI proctoring" },
];

describe("the register link types (Slice 10, Stage 6)", () => {
  it("each has a label", () => {
    for (const l of REGISTER_LINKS) expect(EVIDENCE_LINK_LABEL[l.type]).toBeTruthy();
  });

  it("evidences the heads its register's rows can set — read from the model; the AI register sets none", () => {
    const heads = Object.fromEntries(REGISTER_LINKS.map((l) => [l.type, linkDirectHeads(l).sort()]));
    expect(heads).toEqual({
      breach_incident: ["H2"],
      rights_request: ["H7"],
      vendor: ["H1", "H7"],
      retention_schedule: ["H7"],
      ai_system: [],
    });
  });

  it("counts in the evidence pack's coverage, once per head", () => {
    const c = evidenceCoverage([entry(REGISTER_LINKS)]);
    expect(c.byHead.H2.accepted).toBe(1);
    expect(c.byHead.H7.artefacts).toBe(1);
    expect(c.byHead.H4.artefacts).toBe(0);
    expect(c.registerArtefacts).toBe(0);
  });

  it("the Evidence Index names each as its register does — a request by code and kind", () => {
    const wb = evidenceIndexWorkbook({ header, entries: [entry(REGISTER_LINKS)] });
    expect(wb.sheets[0]!.rows.map((r) => r.slice(10))).toEqual([
      ["Personal data breach", "BR-2026-001", "Laptop stolen", "Head 2"],
      ["Rights request or grievance", "RR-2026-001", "Access to information", "Head 7"],
      ["Vendor", "Processor register", "PayFast Gateway (Fee collection)", "Head 1, Head 7"],
      ["Retention schedule", "Retention register", "ROPA-009 · Admissions archive (ROPA-009 · Fixed period)", "Head 7"],
      ["AI system", "AI risk register", "AI proctoring", "—"],
    ]);
  });
});
