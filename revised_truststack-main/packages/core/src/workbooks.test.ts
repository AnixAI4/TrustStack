/**
 * Slice 9, Stage 4 — the three working spreadsheets, as data: their sheets,
 * columns and rows; D-011's caveat; values only, with formula text defused
 * by `csvCell`'s rule (pitfall 9); no bank internals.
 */
import { describe, expect, it } from "vitest";
import { DPDP_REPORT_CAVEAT } from "./caveat.js";
import type { EvidenceIndexEntry, ReportActionLine, ReportGapLine, ReportHeader } from "./reports.js";
import { csvCell, defuseFormula } from "./ropa.js";
import {
  EVIDENCE_LEVEL_GLOSS,
  VENDOR_LINK_UPLOADER,
  WORKBOOK_ABOUT_SHEET,
  dateCell,
  evidenceIndexWorkbook,
  gapActionTracker,
  ropaRegisterWorkbook,
  workbookText,
  type ReportWorkbook,
  type WorkbookSheet,
} from "./workbooks.js";

const TODAY = "2026-10-08";
const header: ReportHeader = {
  organizationName: "Sahyadri Health Trust",
  version: 1,
  asOf: TODAY,
  generatedAt: "2026-10-08T05:30:00.000Z",
  generatedByName: "Priya Nair",
};

const action = (over: Partial<ReportActionLine> = {}): ReportActionLine => ({
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

const gap = (over: Partial<ReportGapLine> = {}): ReportGapLine => ({
  source: "assessment",
  sourceLabel: "Assessment",
  parentName: "DPDP baseline 2026",
  context: "Security safeguards",
  mapping: { source: "assessment", domainCode: "SECURITY" },
  finding: "Review and remediate: Is data encrypted at rest?",
  recommendedFix: "Encrypt the store and its backups.",
  severity: "critical",
  priority: "P0",
  state: "open",
  actions: [action()],
  ...over,
});

const ropaGap = gap({
  source: "ropa",
  sourceLabel: "Processing register",
  parentName: "Paediatric outpatient registration",
  context: "ROPA-004 · No verifiable parental consent",
  mapping: { source: "ropa", gapCode: "child_consent_missing" },
  severity: "high",
  priority: "P1",
  actions: [
    action({
      id: "r1",
      title: "Record parental consent",
      source: "ropa",
      sourceLabel: "Processing register",
      parentName: "Paediatric outpatient registration",
      context: "ROPA-004 · No verifiable parental consent",
      mapping: { source: "ropa", gapCode: "child_consent_missing" },
      ownerUserId: null,
      ownerName: null,
      dueDate: null,
    }),
  ],
});

const sheet = (wb: ReportWorkbook, name: string) => wb.sheets.find((s) => s.name === name)!;
const column = (s: WorkbookSheet, header: string) => s.columns.findIndex((c) => c.header === header);
const cell = (s: WorkbookSheet, row: number, header: string) => s.rows[row]![column(s, header)];

function expectValuesOnly(wb: ReportWorkbook) {
  for (const s of wb.sheets) {
    expect(s.name.length).toBeLessThanOrEqual(31);
    expect(s.name).not.toMatch(/[[\]:*?/\\]/);
    expect(s.name).not.toBe(WORKBOOK_ABOUT_SHEET);
    for (const r of s.rows) {
      expect(r).toHaveLength(s.columns.length);
      for (const c of r) {
        // A date cell (F4.7) is a value too: a calendar day, never a formula.
        const isDate = c !== null && typeof c === "object" && /^\d{4}-\d{2}-\d{2}$/.test(c.date);
        expect(c === null || typeof c === "string" || typeof c === "number" || isDate).toBe(true);
        if (typeof c === "string") expect(c).not.toMatch(/^[=+\-@\t\r]/);
      }
    }
  }
}

function expectNoBankInternals(t: string) {
  expect(t).not.toMatch(/\b[A-Z]{1,4}\d+\.\d+\b/);
  expect(t).not.toMatch(/_V\d+\b/);
  expect(t).not.toContain("trigger:");
  expect(t).not.toMatch(/child_consent_missing|\bSECURITY\b/);
}

describe("formula text is defused with csvCell's rule", () => {
  it("the same characters, one rule for CSV and XLSX", () => {
    for (const s of ["=HYPERLINK(\"x\")", "+1", "-2", "@SUM(A1)", "\tx", "\rx"]) {
      expect(defuseFormula(s)).toBe(`'${s}`);
      expect(csvCell(s)).toContain(`'${s.replace(/"/g, '""')}`);
    }
    expect(defuseFormula("Plain text")).toBe("Plain text");
  });
});

describe("Gap & Action Tracker", () => {
  const wb = gapActionTracker({ header, today: TODAY, gaps: [gap(), ropaGap] });

  it("has an Actions and a Gaps sheet, D-011's caveat, and values only", () => {
    expect(wb.sheets.map((s) => s.name)).toEqual(["Actions", "Gaps"]);
    expect(wb.caveats).toEqual([{ title: "About this export", text: DPDP_REPORT_CAVEAT }]);
    expectValuesOnly(wb);
  });

  it("one row per action from both parents, labelled by source, with heads through the model", () => {
    const s = sheet(wb, "Actions");
    expect(s.rows.map((_, i) => cell(s, i, "Source"))).toEqual(["Assessment", "Processing register"]);
    expect(cell(s, 0, "Penalty heads")).toBe("Head 1");
    expect(cell(s, 1, "Penalty heads")).toBe("Head 3");
    expect(cell(s, 0, "Overdue")).toBe("Yes");
    expect(cell(s, 0, "Roadmap window")).toBe("Overdue");
    expect(cell(s, 1, "Owner")).toBe("Unassigned");
    expect(cell(s, 1, "Roadmap window")).toBe("Next assessment cycle");
    expect(cell(s, 1, "Due date")).toBeNull();
  });

  it("a closed action has no window, is never overdue, and says how it closed", () => {
    const closed = gapActionTracker({
      header,
      today: TODAY,
      gaps: [gap({ actions: [action({ status: "closed", closedAt: "2026-10-03T10:00:00Z", closedByName: "Priya Nair", closureBasis: "reviewer_approval", evidence: [{ fileName: "x", reviewStatus: "strong" }, { fileName: "y", reviewStatus: "partial" }] })] })],
    });
    const s = sheet(closed, "Actions");
    expect(cell(s, 0, "Roadmap window")).toBeNull();
    expect(cell(s, 0, "Overdue")).toBe("No");
    expect(cell(s, 0, "Closed on")).toBe("2026-10-03");
    expect(cell(s, 0, "Closed on the basis of")).toBe("A reviewer's approval");
    expect(cell(s, 0, "Artefacts attached")).toBe(2);
    expect(cell(s, 0, "Accepted artefacts")).toBe(1);
  });

  it("an action on a gap that no longer applies is not owed", () => {
    const s = sheet(gapActionTracker({ header, today: TODAY, gaps: [gap({ state: "superseded" })] }), "Actions");
    expect(cell(s, 0, "Overdue")).toBe("No");
    expect(cell(s, 0, "Gap")).toBe("No longer applies");
    const g = sheet(gapActionTracker({ header, today: TODAY, gaps: [gap({ state: "superseded" })] }), "Gaps");
    expect(cell(g, 0, "Actions still owed")).toBe(0);
  });

  it("text a client typed is defused, never a formula", () => {
    const s = sheet(gapActionTracker({ header, today: TODAY, gaps: [gap({ actions: [action({ title: "=cmd|' /C calc'!A0", notes: "+notes" })] })] }), "Actions");
    expect(cell(s, 0, "Action")).toBe("'=cmd|' /C calc'!A0");
    expect(cell(s, 0, "Notes")).toBe("'+notes");
  });

  it("an empty organisation still gets both sheets, saying so", () => {
    const empty = gapActionTracker({ header, today: TODAY, gaps: [] });
    expect(workbookText(empty)).toContain("No remediation action yet.");
    expect(workbookText(empty)).toContain("No gap has been generated yet.");
  });

  it("carries no question code, pack code, trigger or mapping key", () => {
    expectNoBankInternals(workbookText(wb));
  });
});

describe("ROPA Register", () => {
  it("writes the export's own columns and stored values, defused", () => {
    const wb = ropaRegisterWorkbook({ header, columns: ["Record ID", "Processing activity", "Completeness /100"], rows: [["ROPA-001", "=evil()", 72]] });
    const s = sheet(wb, "Register");
    expect(s.columns.map((c) => c.header)).toEqual(["Record ID", "Processing activity", "Completeness /100"]);
    expect(s.rows).toEqual([["ROPA-001", "'=evil()", 72]]);
    expect(wb.notes).toContain("A DPDP readiness register — not a statutory record.");
    expect(wb.caveats[0]!.text).toBe(DPDP_REPORT_CAVEAT);
    expectValuesOnly(wb);
  });
});

describe("Evidence Index", () => {
  const entry = (over: Partial<EvidenceIndexEntry> = {}): EvidenceIndexEntry => ({
    fileName: "policy.pdf",
    contentType: "application/pdf",
    byteSize: 2048,
    uploadedByName: "Rahul Mehta",
    uploadedAt: "2026-10-01T09:00:00Z",
    reviewStatus: "adequate",
    evidenceLevel: 4,
    reviewedByName: "Priya Nair",
    reviewedAt: "2026-10-02T09:00:00Z",
    reviewNotes: null,
    links: [],
    ...over,
  });

  const wb = evidenceIndexWorkbook({
    header,
    entries: [
      entry({
        links: [
          { type: "assessment_response", assessmentName: "DPDP baseline 2026", domainCode: "SECURITY", questionText: "Is data encrypted at rest?" },
          { type: "gap_action", actionTitle: "Encrypt the store", sourceLabel: "Assessment", parentName: "DPDP baseline 2026", context: "Security safeguards", mapping: { source: "assessment", domainCode: "SECURITY" } },
          { type: "ropa_record", recordCode: "ROPA-004", recordName: "Paediatric outpatient registration" },
          { type: "assessment_response", assessmentName: "DPDP baseline 2026", domainCode: "GOV", questionText: "Is there a DPDP owner?" },
        ],
      }),
      entry({ fileName: "draft.docx", reviewStatus: "pending", evidenceLevel: null, reviewedByName: null, reviewedAt: null }),
    ],
  });
  const s = sheet(wb, "Evidence index");

  it("one row per artefact and link — all three link types — and one row for an unlinked artefact", () => {
    expect(s.rows.map((_, i) => cell(s, i, "Linked to"))).toEqual([
      "Assessment answer",
      "Remediation action",
      "Register record",
      "Assessment answer",
      "Not linked",
    ]);
    expectValuesOnly(wb);
  });

  it("names what each link supports in plain words, with the heads it evidences directly", () => {
    expect(cell(s, 0, "What it supports")).toBe("Security safeguards: Is data encrypted at rest?");
    expect(cell(s, 0, "Penalty heads")).toBe("Head 1");
    expect(cell(s, 1, "What it supports")).toBe("Encrypt the store (Security safeguards)");
    expect(cell(s, 1, "Where")).toBe("Assessment · DPDP baseline 2026");
    expect(cell(s, 2, "Where")).toBe("ROPA-004");
    expect(cell(s, 2, "Penalty heads")).toBe("—");
    expect(cell(s, 3, "Penalty heads")).toBe("Enabling control");
  });

  it("prints the stored review: verdict, level, reviewer and date", () => {
    expect([cell(s, 0, "Review"), cell(s, 0, "Evidence level"), cell(s, 0, "Reviewed by"), cell(s, 0, "Reviewed on")]).toEqual(["Adequate", "E4", "Priya Nair", { date: "2026-10-02" }]);
    expect([cell(s, 4, "Review"), cell(s, 4, "Evidence level"), cell(s, 4, "Reviewed by")]).toEqual(["Awaiting review", null, null]);
    expect(cell(s, 0, "Size (bytes)")).toBe(2048);
  });

  it("F4.7: dates are date cells, as the date in India; E0–E5 are glossed on the About sheet; a vendor's upload names the vendor", () => {
    expect(cell(s, 0, "Uploaded on")).toEqual({ date: "2026-10-01" });
    // 20:00 UTC on 1 October is 01:30 on 2 October in India (D-055).
    const late = sheet(evidenceIndexWorkbook({ header, entries: [entry({ uploadedAt: "2026-10-01T20:00:00Z" })] }), "Evidence index");
    expect(cell(late, 0, "Uploaded on")).toEqual({ date: "2026-10-02" });
    expect(wb.notes).toContain(EVIDENCE_LEVEL_GLOSS);
    expect(EVIDENCE_LEVEL_GLOSS).toContain("E0 — No evidence");
    expect(EVIDENCE_LEVEL_GLOSS).toContain("E3 — Approved document or process");
    expect(EVIDENCE_LEVEL_GLOSS).toContain("E5 — Evidence it is monitored and reviewed");
    const vendor = sheet(evidenceIndexWorkbook({ header, entries: [entry({ uploadedByName: null, uploadedViaVendorLink: true })] }), "Evidence index");
    expect(cell(vendor, 0, "Uploaded by")).toBe(VENDOR_LINK_UPLOADER);
    expect(VENDOR_LINK_UPLOADER).toBe("The vendor (questionnaire link)");
    expect(cell(sheet(evidenceIndexWorkbook({ header, entries: [entry({ uploadedByName: null })] }), "Evidence index"), 0, "Uploaded by")).toBeNull();
    expect(() => dateCell("2026-02-30")).toThrow();
    expect(dateCell(null)).toBeNull();
    expect(workbookText(wb)).toContain("2026-10-01");
  });

  it("an organisation with no evidence still gets the sheet, saying so", () => {
    expect(workbookText(evidenceIndexWorkbook({ header, entries: [] }))).toContain("No evidence has been uploaded yet.");
  });

  it("carries D-011's caveat and no bank internals", () => {
    expect(workbookText(wb)).toContain(DPDP_REPORT_CAVEAT);
    expectNoBankInternals(workbookText(wb));
  });
});
