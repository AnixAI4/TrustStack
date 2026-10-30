import { describe, expect, it } from "vitest";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import { summariseActions, countRopaRegister } from "./dashboard.js";
import { CEILINGS_AT_STAKE_HEADING, S37_NOTICE, exposureCaveat } from "./exposure.js";
import type { ForecastResult, Projection } from "./forecast.js";
import { DOMAIN_NOT_STARTED_LABEL, DOMAIN_STATUS_LABEL } from "./engine.js";
import {
  AVAILABLE_REPORT_KINDS,
  EXPOSURE_BRIEF_TOP_ACTIONS,
  FROM_EVERY_REGISTER,
  changeSentence,
  foldUnansweredReasons,
  REPORT_KINDS,
  REPORT_KIND_DEFINITIONS,
  croreLabel,
  exposureBrief,
  programmeStatusReport,
  reportDocumentText,
  reportFileName,
  timestampLabel,
  type ProgrammeStatusInput,
  type ReportAction,
  type ReportBasisFacts,
  type ReportDocument,
  type ReportExposure,
  type ReportExposureHead,
  type ReportHeader,
} from "./reports.js";

// ---------------------------------------------------------------------------
// Fixtures — the shapes the app's readers hand over
// ---------------------------------------------------------------------------

const header: ReportHeader = {
  organizationName: "Sahyadri Health Trust",
  version: 3,
  asOf: "2026-10-06",
  generatedAt: "2026-10-06T08:35:00.000Z",
  generatedByName: "Priya Nair",
};

const projection = (over: Partial<Projection> = {}): Projection => ({
  outstanding: 12,
  requiredPerWeek: 1.2,
  p50Weeks: 20,
  p85Weeks: 26,
  p50Date: "2027-02-23",
  p85Date: "2027-04-06",
  beyondHorizon: { p50: false, p85: false },
  meetsDeadline: { p50: true, p85: true },
  ...over,
});

const forecast = (over: Partial<ForecastResult> = {}): ForecastResult => ({
  today: "2026-10-06",
  deadline: "2027-05-13",
  daysToDeadline: 219,
  weeklyClosures: [3, 2, 0, 1, 4, 0, 2, 1],
  activeWeeks: 6,
  averagePerWeek: 1.6,
  notEnoughHistory: false,
  criticalHigh: projection({ outstanding: 5, requiredPerWeek: 0.2 }),
  all: projection(),
  method: "Resamples the last eight weeks' closures 1,000 times with a fixed seed.",
  ...over,
});

const head = (over: Partial<ReportExposureHead> & Pick<ReportExposureHead, "code" | "serial">): ReportExposureHead => ({
  title: `Head ${over.serial} title`,
  ceilingCrore: 250,
  applies: true,
  status: "exposed",
  statusLabel: "Exposed",
  atStake: true,
  position: {
    points: 4,
    band: "upper",
    bandLabel: "Upper third",
    rangeLabel: "₹167–250 crore",
    factors: [
      { clause: "(b)", points: 2, text: "Children's data is processed." },
      { clause: "(e)", points: -1, text: "Every open gap has an owner and a due date." },
    ],
  },
  reasons: [
    { kind: "status", text: "Security safeguards scores below 40% of its weight." },
    { kind: "root_cause", text: "Root cause: no evidenced DPDP owner." },
  ],
  ...over,
});

const exposure = (over: Partial<ReportExposure> = {}): ReportExposure => ({
  snapshotId: "5f0c3b8e-1111-4aaa-8bbb-000000000001",
  recordedAt: "2026-10-06T08:35:00.000Z",
  asOf: "2026-10-06",
  modelVersion: "1.0.0",
  basis: "provisional",
  ceilingsAtStakeCrore: 700,
  exposedHeads: 4,
  applicableHeads: 4,
  heads: [
    head({ code: "H1", serial: 1 }),
    head({ code: "H2", serial: 2, ceilingCrore: 200, status: "partially_mitigated", statusLabel: "Partially mitigated" }),
    head({ code: "H3", serial: 3, ceilingCrore: 200, status: "not_yet_assessed", statusLabel: "Not yet assessed" }),
    head({
      code: "H4",
      serial: 4,
      ceilingCrore: 150,
      applies: false,
      status: "not_applicable",
      statusLabel: "Not applicable",
      atStake: false,
      position: null,
      reasons: [{ kind: "applies", text: "No Significant Data Fiduciary notification is recorded." }],
    }),
    head({ code: "H7", serial: 7, ceilingCrore: 50 }),
  ],
  forecast: forecast(),
  ...over,
});

const basis = (over: Partial<ReportBasisFacts> = {}): ReportBasisFacts => ({
  assessmentName: "DPDP baseline 2026",
  outstandingQuestions: 14,
  scopeSaved: true,
  assessmentGapsStale: false,
  registerGapsGenerated: true,
  registerGapsStale: false,
  ...over,
});

const action = (i: number, over: Partial<ReportAction> = {}): ReportAction => ({
  title: `Encrypt the patient records store ${i}`,
  ownerName: i % 2 === 0 ? null : "Rahul Mehta",
  dueDate: "2026-11-05",
  severity: "critical",
  sourceLabel: "Assessment",
  context: "Security safeguards",
  heads: ["H1", "H7"],
  ...over,
});

const programmeInput = (over: Partial<ProgrammeStatusInput> = {}): ProgrammeStatusInput => ({
  header,
  exposure: exposure(),
  basis: basis(),
  changes: null,
  slippage: [],
  leverage: [action(1), action(2)],
  actions: summariseActions(
    [
      { source: "assessment", ownerUserId: null, status: "open", dueDate: "2026-09-01", severity: "high", gapState: "open" },
      { source: "ropa", ownerUserId: "u1", status: "closed", dueDate: "2026-09-01", severity: "high", gapState: "open" },
    ],
    "2026-10-06",
  ),
  owners: [
    { ownerName: null, unassigned: true, outstanding: 1, overdue: 1 },
    { ownerName: "Rahul Mehta", unassigned: false, outstanding: 3, overdue: 0 },
  ],
  register: countRopaRegister([], "2026-10-06"),
  readiness: null,
  ...over,
});

/** A question code (G1.2), a pack code (CORE_DPDP_V1) or a trigger — never in a report (D-071). */
function expectNoBankInternals(text: string) {
  expect(text).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(text).not.toMatch(/_V\d+\b/);
  expect(text).not.toContain("trigger:");
}

const allText = (doc: ReportDocument) => reportDocumentText(doc);

// ---------------------------------------------------------------------------

describe("report kinds", () => {
  it("each kind is listed once, with a format and a file stem of plain characters", () => {
    expect(REPORT_KIND_DEFINITIONS.map((k) => k.kind)).toEqual([...REPORT_KINDS]);
    for (const k of REPORT_KIND_DEFINITIONS) {
      expect(k.fileSlug).toMatch(/^[A-Za-z0-9_]+$/);
      expect(["pdf", "xlsx"]).toContain(k.format);
    }
  });

  it("since Stage 4, every kind is offered", () => {
    expect([...AVAILABLE_REPORT_KINDS]).toEqual([...REPORT_KINDS]);
  });

  it("only an owner's pack names a person; the exposure reports record a snapshot", () => {
    expect(REPORT_KIND_DEFINITIONS.filter((k) => k.perOwner).map((k) => k.kind)).toEqual(["owner_action_pack"]);
    expect(REPORT_KIND_DEFINITIONS.filter((k) => k.recordsExposure).map((k) => k.kind)).toEqual([
      "exposure_brief",
      "programme_status",
      "evidence_pack",
      "security_breach",
      "legal_position",
      "processor_exposure",
    ]);
  });

  it("file names carry the kind, the version and the date in India", () => {
    expect(reportFileName("exposure_brief", 3, "2026-10-06")).toBe("TrustStack_DPDP_Exposure_Brief_v3_2026-10-06.pdf");
    expect(reportFileName("ropa_register", 1, "2027-01-02")).toBe("TrustStack_ROPA_Register_v1_2027-01-02.xlsx");
  });
});

describe("wording helpers", () => {
  it("crore in Indian grouping, never a computed figure", () => {
    expect(croreLabel(700)).toBe("₹700 crore");
    expect(croreLabel(850)).toBe("₹850 crore");
    expect(croreLabel(0)).toBe("₹0 crore");
  });

  it("timestamps are India's date and time", () => {
    expect(timestampLabel("2026-10-06T08:35:00.000Z")).toBe("6 October 2026, 14:05 IST");
    expect(timestampLabel("2026-10-06T20:00:00.000Z")).toBe("7 October 2026, 01:30 IST");
  });
});

describe("DPDP Exposure Brief", () => {
  it("carries D-011's caveat and the exposure caveat, verbatim, with the snapshot's model version", () => {
    // The snapshot was recorded under 1.0.0: its caveat says so, whatever the current model is.
    const doc = exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] });
    expect(doc.caveats.map((c) => c.text)).toEqual([DPDP_REPORT_CAVEAT, exposureCaveat("1.0.0")]);
    const older = exposureBrief({ header, exposure: exposure({ modelVersion: "0.9.0" }), basis: basis(), topActions: [] });
    expect(older.caveats[1]!.text).toBe(exposureCaveat("0.9.0"));
  });

  it("prints the stored headline — ceilings as ceilings, never a fine", () => {
    const text = allText(exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] }));
    expect(text).toContain("₹700 crore");
    expect(text).toContain("Statutory ceilings, not a predicted fine; penalties are per breach.");
    expect(text).toContain("4 of 4");
    expect(text).toContain("219");
    expect(text).not.toMatch(/\bfine of\b|you will pay|compliant\b/i);
  });

  it("one row per modelled head, with status, ceiling, position and its main reason", () => {
    const doc = exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] });
    const table = doc.sections[1]!.blocks[0]!;
    expect(table.type).toBe("table");
    if (table.type !== "table") return;
    expect(table.rows).toHaveLength(5);
    expect(table.rows[0]).toEqual([
      "1. Security safeguards (s.8(5))",
      { text: "Exposed", tone: "critical" },
      "₹250 crore",
      "Upper third: ₹167–250 crore",
      "Security safeguards scores below 40% of its weight.",
    ]);
    // Not applicable: no band, and why it does not apply.
    expect(table.rows[3]![3]).toBe("—");
    expect(table.rows[3]![4]).toBe("No Significant Data Fiduciary notification is recorded.");
    expect(allText(doc)).toContain("Not modelled: 5. Duties of a Data Principal");
  });

  it("lists at most five actions, from the leverage ranking, in order", () => {
    const actions = Array.from({ length: 9 }, (_, i) => action(i + 1));
    const doc = exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: actions });
    const table = doc.sections[2]!.blocks[0]!;
    if (table.type !== "table") throw new Error("expected a table");
    expect(table.rows).toHaveLength(EXPOSURE_BRIEF_TOP_ACTIONS);
    expect(table.rows[0]).toEqual(["Encrypt the patient records store 1", "Head 1, Head 7", "Critical", "Rahul Mehta", "5 November 2026"]);
    expect(table.rows[1]![3]).toBe("Unassigned");
  });

  it("says so when no action retires exposure", () => {
    const text = allText(exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] }));
    expect(text).toContain("No open action counts against a penalty head that is at stake.");
  });

  it("shows the s.37 notice only when a head is at stake", () => {
    expect(allText(exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] }))).toContain(S37_NOTICE);
    const calm = exposure({ exposedHeads: 0, ceilingsAtStakeCrore: 0 });
    expect(allText(exposureBrief({ header, exposure: calm, basis: basis(), topActions: [] }))).not.toContain(S37_NOTICE);
  });

  it("names its basis — finalised, provisional with the unanswered count, or none", () => {
    const t = (b: ReportExposure["basis"], facts = basis()) =>
      allText(exposureBrief({ header, exposure: exposure({ basis: b }), basis: facts, topActions: [] }));
    expect(t("finalised")).toContain("The newest finalised assessment, “DPDP baseline 2026”, as frozen.");
    expect(t("provisional")).toContain("provisional: 14 questions are still unanswered");
    expect(t("none", basis({ assessmentName: null, outstandingQuestions: null }))).toContain("No assessment yet");
  });

  it("reports a stale input instead of hiding it", () => {
    const text = allText(
      exposureBrief({
        header,
        exposure: exposure(),
        basis: basis({ scopeSaved: false, assessmentGapsStale: true, registerGapsGenerated: false }),
        topActions: [],
      }),
    );
    expect(text).toContain("The organisation's scope has not been saved");
    expect(text).toContain("The assessment's gap register is out of date");
    expect(text).toContain("The processing register's gaps have never been generated.");
  });

  it("forecasts in words: not enough history, beyond five years, or dates", () => {
    const thin = exposure({ forecast: forecast({ notEnoughHistory: true }) });
    expect(allText(exposureBrief({ header, exposure: thin, basis: basis(), topActions: [] }))).toContain("Not enough history");
    const slow = exposure({
      forecast: forecast({ criticalHigh: projection({ p50Date: null, p85Date: null, beyondHorizon: { p50: true, p85: true }, meetsDeadline: { p50: false, p85: false } }) }),
    });
    expect(allText(exposureBrief({ header, exposure: slow, basis: basis(), topActions: [] }))).toContain("Beyond five years");
    expect(allText(exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] }))).toContain("23 February 2027");
  });

  it("the pace line is plain sentences in every case", () => {
    const pace = (f: ForecastResult) => {
      const doc = exposureBrief({ header, exposure: exposure({ forecast: f }), basis: basis(), topActions: [] });
      const block = doc.sections[3]!.blocks[0]!;
      return block.type === "paragraph" ? block.text : "";
    };
    expect(pace(forecast())).toBe(
      "Critical and high work: 5 outstanding, likely to finish 23 February 2027 (cautious: 6 April 2027). " +
        "All work: 12 outstanding, likely to finish 23 February 2027 (cautious: 6 April 2027). " +
        "Closing about 1.6 actions a week; 1.2 a week are needed to finish all work by 13 May 2027.",
    );
    expect(pace(forecast({ criticalHigh: projection({ outstanding: 0 }) }))).toContain("Critical and high work: nothing outstanding.");
    expect(pace(forecast({ notEnoughHistory: true }))).toContain("All work: 12 outstanding; not enough history yet to forecast a finish date.");
    expect(pace(forecast({ all: projection({ beyondHorizon: { p50: true, p85: true } }) }))).toContain(
      "All work: 12 outstanding; at the current pace it would not finish within five years.",
    );
    expect(pace(forecast({ all: projection({ requiredPerWeek: null }) }))).toContain("13 May 2027 has passed.");
  });

  it("carries no question code, pack code or trigger", () => {
    expectNoBankInternals(allText(exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [action(1)] })));
  });

  it("an empty organisation still gets a complete brief", () => {
    const empty = exposure({
      basis: "none",
      ceilingsAtStakeCrore: 500,
      exposedHeads: 3,
      applicableHeads: 3,
      forecast: forecast({ weeklyClosures: [0, 0, 0, 0, 0, 0, 0, 0], activeWeeks: 0, averagePerWeek: 0, notEnoughHistory: true }),
    });
    const doc = exposureBrief({ header, exposure: empty, basis: basis({ assessmentName: null, outstandingQuestions: null }), topActions: [] });
    expect(doc.sections).toHaveLength(4);
    expect(doc.caveats).toHaveLength(2);
  });
});

describe("Programme Status Report", () => {
  it("has its sections in reading order, the scorecard as an appendix that follows on — no forced break, no near-empty page (F4.5)", () => {
    const doc = programmeStatusReport(programmeInput());
    expect(doc.sections.map((s) => s.title)).toEqual([
      "At a glance",
      "Slippage warnings",
      "Exposure by penalty head",
      "Pace and forecast",
      "What changed since the last snapshot",
      "The actions that retire the most exposure",
      "Remediation by owner and by window",
      "Processing register",
      "Appendix — Readiness scorecard",
    ]);
    expect(doc.sections.some((s) => s.pageBreakBefore)).toBe(false);
  });

  it("carries both caveats verbatim", () => {
    expect(programmeStatusReport(programmeInput()).caveats.map((c) => c.text)).toEqual([DPDP_REPORT_CAVEAT, exposureCaveat("1.0.0")]);
  });

  it("prints every head's reasons and position factors, signed", () => {
    const text = allText(programmeStatusReport(programmeInput()));
    expect(text).toContain("Root cause: no evidenced DPDP owner.");
    expect(text).toContain("(b) Children's data is processed. +2; (e) Every open gap has an owner and a due date. −1.");
    expect(text).toContain("Indicative position: upper third, ₹167–250 crore (4 points).");
  });

  it("counts are the summary's own, and Unassigned is its own bucket", () => {
    const doc = programmeStatusReport(programmeInput());
    const tiles = doc.sections[0]!.blocks[1]!;
    if (tiles.type !== "tiles") throw new Error("expected tiles");
    expect(tiles.tiles.map((t) => t.value)).toEqual(["1", "1", "1", "1"]);
    expect(allText(doc)).toContain("Unassigned");
  });

  it("says when this is the first snapshot, and otherwise what moved — flagging a model change", () => {
    expect(allText(programmeStatusReport(programmeInput()))).toContain("This is the first exposure snapshot");
    const moved = programmeStatusReport(
      programmeInput({
        changes: {
          since: { recordedAt: "2026-09-29T05:00:00.000Z", modelVersion: "0.9.0" },
          modelChanged: true,
          change: {
            ceilingsAtStakeCrore: { from: 700, to: 500 },
            exposedHeads: { from: 4, to: 3 },
            heads: [
              {
                code: "H3",
                title: "Children",
                fromStatus: "exposed",
                toStatus: "mitigated",
                fromLabel: "Exposed",
                toLabel: "Mitigated",
                fromBand: "upper",
                toBand: null,
              },
            ],
          },
        },
      }),
    );
    const text = allText(moved);
    expect(text).toContain("ceilings at stake went from ₹700 crore to ₹500 crore; heads at stake from 4 to 3.");
    expect(text).toContain("Exposed, upper third");
    expect(text).toContain("exposure model 0.9.0");
  });

  it("prints slippage warnings and notices as given", () => {
    const text = allText(
      programmeStatusReport(
        programmeInput({ slippage: [{ code: "pace_below_required", level: "warning", text: "The organisation closes about 1.6 actions a week." }] }),
      ),
    );
    expect(text).toContain("Warning: The organisation closes about 1.6 actions a week.");
  });

  it("the appendix prints the scorecard as stored — or says there is none", () => {
    expect(allText(programmeStatusReport(programmeInput()))).toContain("No assessment has been started");
    const doc = programmeStatusReport(
      programmeInput({
        readiness: {
          assessmentName: "DPDP baseline 2026",
          finalised: true,
          frozenAt: "2026-10-01T06:30:00.000Z",
          finalScore: 25.3014,
          rawScore: 25.3014,
          scoreCap: 100,
          applicableWeight: 93,
          maturityLevel: "Level 1 - Aware",
          evidenceConfidence: 23.9,
          criticalCount: 10,
          highCount: 52,
          outstandingCount: 0,
          engineVersion: "1.0.0",
          redFlags: [{ label: "No evidenced breach response", cap: 50 }],
          domains: [
            { name: "Security safeguards", weight: 10, state: "scored", score: 2.5, percent: 0.25, evidenceConfidence: 20, status: "critical", questionCount: 4, outstandingCount: 0 },
            { name: "Vendor / Data Processor governance", weight: 7, state: "scoped_out", score: null, percent: null, evidenceConfidence: null, status: null, questionCount: 0, outstandingCount: 0 },
          ],
        },
      }),
    );
    const text = allText(doc);
    expect(text).toContain("25.30 of 93.00");
    expect(text).toContain("Red flag: No evidenced breach response (caps the score at 50).");
    expect(text).toContain("Out of scope");
    expect(text).toContain("25%");
  });

  it("carries no question code, pack code or trigger", () => {
    expectNoBankInternals(allText(programmeStatusReport(programmeInput())));
  });
});

// ---------------------------------------------------------------------------
// Slice 10.5, Batch B4 — the reports in plain words (Q2, F4.2–F4.6)
// ---------------------------------------------------------------------------

describe("Batch B4 — the reports' wording", () => {
  it("Q2: the headline is \"Statutory ceilings at stake\" — one constant, the app's and every report's", () => {
    expect(CEILINGS_AT_STAKE_HEADING).toBe("Statutory ceilings at stake");
    for (const doc of [programmeStatusReport(programmeInput()), exposureBrief({ header, exposure: exposure(), basis: basis(), topActions: [] })]) {
      const text = allText(doc);
      expect(text).toContain("Statutory ceilings at stake");
      expect(text).not.toContain("where you are exposed");
    }
  });

  it("F4.2: a pace of one is \"1 action\", never \"1 actions\"", () => {
    const one = exposure({ forecast: forecast({ averagePerWeek: 1 }) });
    const text = allText(programmeStatusReport(programmeInput({ exposure: one })));
    expect(text).toContain("Pace: about 1 action closed a week");
    expect(allText(exposureBrief({ header, exposure: one, basis: basis(), topActions: [] }))).toContain("Closing about 1 action a week");
    expect(text).not.toMatch(/\b1 actions\b/);
  });

  it("F4.3 + Q1: actions are \"From every register\", and the source table lists all five, totalling the tile", () => {
    const actions = summariseActions(
      (["assessment", "ropa", "breach", "rights", "retention"] as const).map((source) => ({
        source,
        ownerUserId: "u1",
        status: "open" as const,
        dueDate: "2026-12-01",
        severity: "high" as const,
        gapState: "open" as const,
      })),
      "2026-10-06",
    );
    const doc = programmeStatusReport(programmeInput({ actions }));
    const text = allText(doc);
    expect(text).toContain(FROM_EVERY_REGISTER);
    expect(text).not.toContain("Across the assessment and the processing register");
    const table = doc.sections
      .flatMap((s) => s.blocks)
      .find((b) => b.type === "table" && b.columns[0]!.header === "Source");
    expect(table?.type === "table" && table.rows.map((r) => r[0])).toEqual([
      "Assessment",
      "Processing register",
      "Breach register",
      "Rights and grievance register",
      "Retention register",
    ]);
    const total = table?.type === "table" ? table.rows.reduce((sum, r) => sum + Number(r[1]), 0) : -1;
    expect(total).toBe(actions.outstanding);
  });

  it("F4.4: a head's \"not answered yet\" lines fold into one \"Not yet answered: …\" — display only", () => {
    const reasons = [
      { kind: "status", text: "2 processors have no contract with DPDP clauses recorded." },
      { kind: "status", text: "Notice management has not been answered yet." },
      { kind: "status", text: "Consent and consent withdrawal has not been answered yet." },
      { kind: "root_cause", text: "Root cause: no evidenced DPDP owner." },
    ];
    expect(foldUnansweredReasons(reasons).map((r) => r.text)).toEqual([
      "2 processors have no contract with DPDP clauses recorded.",
      "Not yet answered: Notice management; Consent and consent withdrawal.",
      "Root cause: no evidenced DPDP owner.",
    ]);
    expect(foldUnansweredReasons(reasons.slice(0, 1))).toEqual(reasons.slice(0, 1));
    const h7 = head({ code: "H7", serial: 7, reasons: reasons.slice(0, 3) });
    const text = allText(programmeStatusReport(programmeInput({ exposure: exposure({ heads: [h7] }) })));
    expect(text).toContain("Not yet answered: Notice management; Consent and consent withdrawal.");
    expect(text).not.toContain("has not been answered yet");
  });

  it("F4.5: \"No change since the snapshot of …\" when nothing moved; a moved figure still says from and to", () => {
    const since = { recordedAt: "2026-10-01T05:30:00.000Z", modelVersion: "1.7.0" };
    const same = { ceilingsAtStakeCrore: { from: 700, to: 700 }, exposedHeads: { from: 4, to: 4 }, heads: [] };
    expect(changeSentence({ since, modelChanged: false, change: same })).toBe(
      "No change since the snapshot of 1 October 2026, 11:00 IST: ceilings at stake ₹700 crore; heads at stake 4.",
    );
    expect(changeSentence({ since, modelChanged: false, change: { ...same, exposedHeads: { from: 4, to: 3 } } })).toBe(
      "Since the snapshot of 1 October 2026, 11:00 IST: ceilings at stake unchanged at ₹700 crore; heads at stake from 4 to 3.",
    );
    const text = allText(programmeStatusReport(programmeInput({ changes: { since, modelChanged: false, change: same } })));
    expect(text).not.toContain("went from ₹700 crore to ₹700 crore");
  });

  it("F4.6: a scored domain with no question answered reads \"Not started\" in the scorecard; the stored status is untouched", () => {
    const readiness = {
      assessmentName: "DPDP baseline 2026",
      finalised: false,
      frozenAt: null,
      finalScore: 4.2,
      rawScore: 4.2,
      scoreCap: 100,
      applicableWeight: 100,
      maturityLevel: "Level 0 - Not Started",
      evidenceConfidence: 60,
      criticalCount: 0,
      highCount: 0,
      outstandingCount: 9,
      engineVersion: "1.0.0",
      redFlags: [],
      domains: [
        { name: "Notice management", weight: 7, state: "scored", score: null, percent: null, evidenceConfidence: null, status: "needs_work", questionCount: 9, outstandingCount: 9 },
        { name: "Security safeguards", weight: 10, state: "scored", score: 2, percent: 0.2, evidenceConfidence: 20, status: "needs_work", questionCount: 4, outstandingCount: 1 },
      ],
    };
    const doc = programmeStatusReport(programmeInput({ readiness }));
    const table = doc.sections.at(-1)!.blocks.find((b) => b.type === "table");
    expect(table?.type === "table" && table.rows.map((r) => r.at(-1))).toEqual([DOMAIN_NOT_STARTED_LABEL, DOMAIN_STATUS_LABEL.needs_work]);
  });
});
