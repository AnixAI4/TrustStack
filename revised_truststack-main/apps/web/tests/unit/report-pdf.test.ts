/**
 * Slice 9, Stage 3 — the PDF renderer. What a report SAYS is tested in core
 * (`packages/core/src/reports.test.ts`); this file proves the rendered FILE
 * carries it: both caveats verbatim in the extracted text (SLICE_09 §11), the
 * Board's brief on one page even when it is full, no question code, and no
 * character the embedded fonts cannot draw.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { openSync } from "fontkit";
import {
  DPDP_DOMAINS,
  DPDP_REPORT_CAVEAT,
  EXPOSURE_CAVEAT,
  countRopaRegister,
  exposureCaveat,
  evidencePack,
  exposureBrief,
  legalPositionReport,
  ownerActionPack,
  processorExposureReport,
  programmeStatusReport,
  reportDocumentText,
  securityBreachReport,
  summariseActions,
  type ReportAction,
  type ReportActionLine,
  type ReportExposure,
  type ReportExposureHead,
  type ReportHeader,
  type StakeholderReportInput,
} from "@truststack/core";
import { describe, expect, it } from "vitest";
import { REPORT_FONT_FILES, renderReportPdf } from "@/lib/reports/pdf";
import { pdfText, squash } from "../support/pdf-text";

const header: ReportHeader = {
  organizationName: "मुंबई विद्यापीठ — Mumbai University",
  version: 2,
  asOf: "2026-10-06",
  generatedAt: "2026-10-06T08:35:00.000Z",
  generatedByName: "प्रिया नायर",
};

const LONG = "Processing register: Rule 6 minimum safeguards not confirmed (10 open gaps), and the security safeguards domain scores below 40% of its weight.";

const head = (code: ReportExposureHead["code"], serial: number, title: string, ceilingCrore: number): ReportExposureHead => ({
  code,
  serial,
  title,
  ceilingCrore,
  applies: true,
  status: "exposed",
  statusLabel: "Exposed",
  atStake: true,
  position: {
    points: 5,
    band: "upper",
    bandLabel: "Upper third",
    rangeLabel: `₹${Math.round((ceilingCrore * 2) / 3)}–${ceilingCrore} crore`,
    factors: [
      { clause: "(b)", points: 2, text: "Children's data is processed." },
      { clause: "(a)", points: 1, text: "A large number of Data Principals (a TrustStack trigger, not a statutory classification)." },
      { clause: "(e)", points: -1, text: "Every open gap has an owner and a due date." },
    ],
  },
  reasons: [
    { kind: "status", text: LONG },
    { kind: "status", text: "Breach notification and incident response has not been answered yet." },
    { kind: "root_cause", text: "Root cause: processing register — No owner (10 open gaps)." },
  ],
});

const exposure: ReportExposure = {
  snapshotId: "5f0c3b8e-1111-4aaa-8bbb-000000000001",
  recordedAt: "2026-10-06T08:35:00.000Z",
  asOf: "2026-10-06",
  modelVersion: "1.0.0",
  basis: "provisional",
  ceilingsAtStakeCrore: 850,
  exposedHeads: 5,
  applicableHeads: 5,
  heads: [
    head("H1", 1, "Reasonable security safeguards to prevent a personal data breach", 250),
    head("H2", 2, "Notice of a personal data breach to the Board and to affected Data Principals", 200),
    head("H3", 3, "Additional obligations for children's data (and persons with disability who have a lawful guardian)", 200),
    head("H4", 4, "Additional obligations of a Significant Data Fiduciary", 150),
    head("H7", 7, "Any other provision of the Act or the Rules", 50),
  ],
  forecast: {
    today: "2026-10-06",
    deadline: "2027-05-13",
    daysToDeadline: 219,
    weeklyClosures: [3, 2, 0, 1, 4, 0, 2, 1],
    activeWeeks: 6,
    averagePerWeek: 1.6,
    notEnoughHistory: false,
    criticalHigh: {
      outstanding: 46,
      requiredPerWeek: 1.5,
      p50Weeks: 29,
      p85Weeks: 34,
      p50Date: "2027-04-27",
      p85Date: "2027-06-01",
      beyondHorizon: { p50: false, p85: false },
      meetsDeadline: { p50: true, p85: false },
    },
    all: {
      outstanding: 77,
      requiredPerWeek: 2.5,
      p50Weeks: 48,
      p85Weeks: 55,
      p50Date: "2027-09-07",
      p85Date: "2027-10-26",
      beyondHorizon: { p50: false, p85: false },
      meetsDeadline: { p50: false, p85: false },
    },
    method:
      "Resamples the last eight weeks' closures 1,000 times with a fixed seed; P50 and P85 are the 50th and 85th percentile of the weeks needed. Critical and high work is assumed to be done first.",
  },
};

const basis = {
  assessmentName: "DPDP baseline assessment 2026 (University)",
  outstandingQuestions: 123,
  scopeSaved: true,
  assessmentGapsStale: true,
  registerGapsGenerated: true,
  registerGapsStale: true,
};

const actions: ReportAction[] = Array.from({ length: 10 }, (_, i) => ({
  title: `Nominate the DPDP owner and publish an internal responsibility note covering every department and processor — step ${i + 1}`,
  ownerName: i % 3 === 0 ? null : "राहुल मेहता",
  dueDate: "2026-11-05",
  severity: i % 2 === 0 ? "critical" : "high",
  sourceLabel: i % 2 === 0 ? "Assessment" : "Processing register",
  context: i % 2 === 0 ? "Security safeguards" : "ROPA-003 · Rule 6 minimum safeguards not confirmed",
  heads: ["H1", "H2", "H7"],
}));

const brief = exposureBrief({ header, exposure, basis, topActions: actions });

const programme = programmeStatusReport({
  header,
  exposure,
  basis,
  changes: {
    since: { recordedAt: "2026-09-29T05:00:00.000Z", modelVersion: "1.0.0" },
    modelChanged: false,
    change: { ceilingsAtStakeCrore: { from: 850, to: 850 }, exposedHeads: { from: 5, to: 5 }, heads: [] },
  },
  slippage: [
    { code: "pace_below_required", level: "warning", text: "The organisation closes about 1.6 actions a week; 2.5 a week are needed to finish all work by 13 May 2027." },
  ],
  leverage: actions,
  actions: summariseActions([], "2026-10-06"),
  owners: [{ ownerName: null, unassigned: true, outstanding: 40, overdue: 3 }],
  register: countRopaRegister([], "2026-10-06"),
  readiness: {
    assessmentName: basis.assessmentName,
    finalised: false,
    frozenAt: null,
    finalScore: 0.4,
    rawScore: 0.4,
    scoreCap: 100,
    applicableWeight: 100,
    maturityLevel: "Level 0 - Not Started",
    evidenceConfidence: 0,
    criticalCount: 0,
    highCount: 1,
    outstandingCount: 123,
    engineVersion: "1.0.0",
    redFlags: [],
    domains: DPDP_DOMAINS.map((d) => ({
      name: d.name,
      weight: d.weight,
      state: "scored",
      score: 0,
      percent: 0,
      evidenceConfidence: 0,
      status: "critical",
      questionCount: 9,
      outstandingCount: 7,
    })),
  },
});

/** Stage 4's two PDFs, with a Devanagari owner and a long list — the owner's pack runs to pages. */
const ownerLine = (i: number, over: Partial<ReportActionLine> = {}): ReportActionLine => ({
  id: `a${i}`,
  title: `Encrypt the patient records store, backups and replicas — batch ${i}`,
  source: i % 2 === 0 ? "ropa" : "assessment",
  sourceLabel: i % 2 === 0 ? "Processing register" : "Assessment",
  parentName: "DPDP baseline 2026",
  context: i % 2 === 0 ? `ROPA-00${i % 10} · Rule 6 minimum safeguards not confirmed` : "Security safeguards",
  mapping: i % 2 === 0 ? { source: "ropa", gapCode: "rule6_unconfirmed" } : { source: "assessment", domainCode: "SECURITY" },
  severity: i % 3 === 0 ? "critical" : "high",
  priority: "P0",
  gapState: "open",
  status: i % 7 === 0 ? "closed" : "open",
  ownerUserId: "u1",
  ownerName: "प्रिया नायर",
  dueDate: `2026-${String(9 + (i % 4)).padStart(2, "0")}-15`,
  closedAt: i % 7 === 0 ? "2026-10-01T08:00:00Z" : null,
  closedByName: i % 7 === 0 ? "Rahul Mehta" : null,
  closureBasis: i % 7 === 0 ? "evidence" : null,
  notes: null,
  evidence: i % 3 === 0 ? [{ fileName: "x.pdf", reviewStatus: "pending" }] : [],
  ...over,
});
const ownerActions = Array.from({ length: 40 }, (_, i) => ownerLine(i + 1));

const ownerPack = ownerActionPack({
  header,
  owner: { name: "प्रिया नायर" },
  today: "2026-10-06",
  actions: ownerActions,
  records: [
    {
      recordCode: "ROPA-004",
      name: "बाह्यरुग्ण नोंदणी — outpatient registration",
      statusLabel: "Draft",
      completenessScore: 45,
      bandLabel: "Basic",
      missing: ["Retention", "Notice"],
      riskLabel: "High",
      nextReviewAt: "2026-09-01",
    },
  ],
});

const evidenceDoc = evidencePack({
  header,
  exposure,
  basis,
  entries: Array.from({ length: 12 }, (_, i) => ({
    fileName: `artefact-${i}.pdf`,
    contentType: "application/pdf",
    byteSize: 1000 + i,
    uploadedByName: "प्रिया नायर",
    uploadedAt: "2026-10-01T09:00:00Z",
    reviewStatus: (["pending", "adequate", "strong", "partial", "rejected", "outdated"] as const)[i % 6]!,
    evidenceLevel: i % 6 === 0 ? null : 3,
    reviewedByName: i % 6 === 0 ? null : "Rahul Mehta",
    reviewedAt: i % 6 === 0 ? null : "2026-10-02T09:00:00Z",
    reviewNotes: null,
    links: [{ type: "assessment_response" as const, assessmentName: "DPDP baseline 2026", domainCode: DPDP_DOMAINS[i % 16]!.code, questionText: "Is it done?" }],
  })),
  actions: ownerActions,
  readiness: null,
  registerRecords: 9,
  indexFileName: "TrustStack_Evidence_Index_v2_2026-10-06.xlsx",
});

// Slice 10, Stage 6 — the three stakeholder reports, full, with Devanagari names.
const stakeholder: StakeholderReportInput = { header, exposure, basis, today: "2026-10-06", actions: ownerActions };

const securityDoc = securityBreachReport({
  ...stakeholder,
  breaches: {
    counts: { total: 12, active: 8, insideWindow: 2, overdue: 3, principalsPending: 5, closed: 3, dismissed: 1 },
    incidents: Array.from({ length: 12 }, (_, i) => ({
      incidentCode: `BR-2026-${String(i + 1).padStart(3, "0")}`,
      title: i % 2 === 0 ? "प्रवेश पोर्टल — admissions portal exposed" : "Laptop stolen from the records office",
      natureLabel: "Unauthorised access",
      severityLabel: "High",
      statusLabel: i % 4 === 0 ? "Closed" : "Open",
      awareAt: "2026-10-01T04:00:00.000Z",
      boardClock: i % 4 === 0 ? { state: "made" as const, label: "Made 3 Oct 2026, 10:00 IST" } : { state: "overdue" as const, label: "Overdue by 50h 5m" },
      extensionUntil: i === 3 ? "2026-10-08T04:00:00.000Z" : null,
      boardInitialAt: "2026-10-01T06:00:00.000Z",
      boardReportAt: i % 4 === 0 ? "2026-10-03T04:30:00.000Z" : null,
      principalsAt: i % 4 === 0 ? "2026-10-02T04:30:00.000Z" : null,
      documents: i % 3,
    })),
  },
  readiness: null,
});

const legalDoc = legalPositionReport({
  ...stakeholder,
  rights: {
    counts: { total: 20, openRequests: 6, openGrievances: 2, pastTarget: 3, overdue: 2, overdueGrievances: 1, responded: 10, respondedLate: 1, closedOtherwise: 2 },
    attention: Array.from({ length: 5 }, (_, i) => ({ requestCode: `RR-2026-00${i + 1}`, kindLabel: "Access to information", clockLabel: "Overdue — day 95, past the 90-day ceiling", overdue: i % 2 === 0 })),
  },
  consent: {
    counts: { principals: 300, given: 250, refused: 20, withdrawn: 30, onBehalf: 40, unverified: 3 },
    notices: [
      { languageLabel: "English", version: 2, publishedOn: "2026-09-01" },
      { languageLabel: "Hindi", version: 1, publishedOn: "2026-09-02" },
    ],
    liveWidgetVersion: 2,
  },
  register: countRopaRegister([], "2026-10-06"),
  retention: {
    counts: { total: 10, noEnd: 1, running: 7, endingSoon: 1, overdue: 1, erased: 1 },
    overdue: [{ recordCode: "ROPA-009", endsOn: "2026-06-30", erasureIncomplete: true }],
    thirdScheduleLabel: "E-commerce entity with at least two crore registered users in India",
  },
  ai: { counts: { total: 2, inUse: 2, unreviewed: 1, childTracking: 1, childTrackingUnexempt: 1, childTrackingUnknown: 1 }, sdfNotified: false },
});

const processorDoc = processorExposureReport({
  ...stakeholder,
  processors: {
    counts: { vendors: 14, processors: 12, contractGaps: 5, accepted: 6, neverAssessed: 6, awaitingReview: 2, withVendor: 1, outOfDate: 1 },
    vendors: Array.from({ length: 14 }, (_, i) => ({
      name: i % 2 === 0 ? "शुल्क संकलन — fee gateway" : `Cloud host ${i}`,
      service: i % 3 === 0 ? null : "Hosting",
      role: (i < 12 ? "data_processor" : "independent") as "data_processor" | "independent",
      isProcessor: i < 12,
      contractExists: (i % 3 === 0 ? "unknown" : "yes") as "unknown" | "yes",
      dpdpClauses: (i % 2 === 0 ? "no" : "yes") as "no" | "yes",
      crossBorder: "no" as const,
      contractGap: i < 12 && (i % 3 === 0 || i % 2 === 0),
      contractReviewPassed: i === 1,
      current: i % 2 === 1 ? { riskScore: 40 + i, riskTierLabel: "Medium", reviewBy: "2027-01-01", outOfDate: i === 5 } : null,
      open: i % 4 === 0 ? { statusLabel: "Awaiting review", withVendor: i === 4 } : null,
      documents: i % 3,
    })),
  },
});

describe("the rendered PDF", () => {
  it("the Owner Action Pack: D-011's caveat verbatim, no exposure caveat, the owner named, every page numbered", async () => {
    const { text, pages, title } = await pdfText(await renderReportPdf(ownerPack));
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
    expect(text).not.toContain(squash(EXPOSURE_CAVEAT.slice(0, 60)));
    // Shaped Devanagari does not survive text extraction; the name is checked in the model, and its glyphs below.
    expect(reportDocumentText(ownerPack)).toContain("For प्रिया नायर");
    expect(text).toContain("Your processing register records");
    expect(text).toContain(`Page ${pages} of ${pages}`);
    expect(title).toBe("Owner Action Pack — मुंबई विद्यापीठ — Mumbai University");
  });

  it("the Regulator-Ready Evidence Pack: both caveats verbatim, every area, the index named", async () => {
    const { text } = await pdfText(await renderReportPdf(evidenceDoc));
    expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
    // The fixtures are 1.0.0 snapshots: their caveat names the version they were recorded under.
    expect(text).toContain(squash(exposureCaveat("1.0.0")));
    expect(text).toContain("TrustStack_Evidence_Index_v2_2026-10-06.xlsx");
    for (const d of DPDP_DOMAINS) expect(text).toContain(squash(d.name));
  });

  it("the Board's brief fits ONE page, full, and carries both caveats verbatim", async () => {
    const bytes = await renderReportPdf(brief);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    const { text, pages, title } = await pdfText(bytes);
    expect(pages).toBe(1);
    expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
    // The fixtures are 1.0.0 snapshots: their caveat names the version they were recorded under.
    expect(text).toContain(squash(exposureCaveat("1.0.0")));
    expect(text).toContain("₹850 crore");
    expect(text).toContain("Page 1 of 1");
    expect(title).toBe("DPDP Exposure Brief — मुंबई विद्यापीठ — Mumbai University");
  });

  it("the DPO's report runs to several pages with the scorecard appendix, and both caveats verbatim", async () => {
    const { text, pages } = await pdfText(await renderReportPdf(programme));
    expect(pages).toBeGreaterThan(1);
    expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
    // The fixtures are 1.0.0 snapshots: their caveat names the version they were recorded under.
    expect(text).toContain(squash(exposureCaveat("1.0.0")));
    expect(text).toContain("Appendix — Readiness scorecard");
    expect(text).toContain(`Page ${pages} of ${pages}`);
    for (const d of DPDP_DOMAINS) expect(text).toContain(squash(d.name));
  });

  it("the three stakeholder reports (Slice 10, Stage 6): both caveats verbatim, numbered pages, their registers", async () => {
    for (const [doc, mark] of [
      [securityDoc, "The breach register (s.8(6), Rule 7)"],
      [legalDoc, "Retention and erasure (s.8(7), Rule 8)"],
      [processorDoc, "Contracts to fix"],
    ] as const) {
      const { text, pages } = await pdfText(await renderReportPdf(doc));
      expect(text).toContain(squash(DPDP_REPORT_CAVEAT));
      expect(text).toContain(squash(exposureCaveat("1.0.0")));
      expect(text).toContain(squash(mark));
      expect(text).toContain(`Page ${pages} of ${pages}`);
    }
  });

  it("carries no question code, pack code or trigger (D-071)", async () => {
    for (const doc of [brief, programme, ownerPack, evidenceDoc, securityDoc, legalDoc, processorDoc]) {
      const { text } = await pdfText(await renderReportPdf(doc));
      expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
      expect(text).not.toMatch(/_V\d+\b|trigger:/);
    }
  });
});

describe("the embedded fonts can draw every character", () => {
  const fonts = Object.values(REPORT_FONT_FILES).map((file) => openSync(file));
  const drawable = (ch: string) => /\s/.test(ch) || fonts.some((f) => f.hasGlyphForCodePoint(ch.codePointAt(0)!));
  const undrawable = (text: string) => [...new Set([...text].filter((ch) => !drawable(ch)))];

  it("in all seven PDF reports, Devanagari names included", () => {
    for (const doc of [brief, programme, ownerPack, evidenceDoc, securityDoc, legalDoc, processorDoc]) expect(undrawable(reportDocumentText(doc))).toEqual([]);
  });

  it("in every string literal core can print in a report or an exposure reason", () => {
    // Comments may use ≥, → or ×, and so may a thrown developer error; the
    // strings a report prints may not.
    const core = path.resolve(import.meta.dirname, "../../../../packages/core/src");
    const files = ["reports.ts", "exposure.ts", "intelligence.ts", "forecast.ts", "engine.ts", "gaps.ts", "ropa.ts", "domains.ts", "dashboard.ts", "caveat.ts",
      // Slice 10, Stage 6: the stakeholder reports print these registers' notes and labels.
      "breach.ts", "rights.ts", "consent.ts", "vendors.ts", "retention.ts", "ai-risk.ts"];
    const offending: string[] = [];
    for (const file of files) {
      const source = readFileSync(path.join(core, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:"'`])\/\/.*$/gm, "$1")
        .replace(/^.*Error\(.*$/gm, "");
      for (const m of source.matchAll(/"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
        const literal = m[1] ?? m[2] ?? "";
        for (const ch of undrawable(literal)) offending.push(`${file}: ${JSON.stringify(ch)} in ${JSON.stringify(literal.slice(0, 60))}`);
      }
    }
    expect(offending).toEqual([]);
  });
});
