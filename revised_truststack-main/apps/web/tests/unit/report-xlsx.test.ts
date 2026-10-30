/**
 * Slice 9, Stage 4 — the XLSX renderer. What a workbook SAYS is tested in core
 * (`packages/core/src/workbooks.test.ts`); this file proves the rendered FILE:
 * an About sheet with D-011's caveat verbatim, the data sheets as built, and
 * no formula and no hyperlink anywhere — read back, cell by cell (pitfall 9).
 */
import {
  DPDP_REPORT_CAVEAT,
  evidenceIndexWorkbook,
  gapActionTracker,
  ropaRegisterWorkbook,
  type ReportHeader,
  type ReportWorkbook,
} from "@truststack/core";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { renderReportXlsx } from "@/lib/reports/xlsx";
import { xlsxCells } from "../support/xlsx-cells";

const header: ReportHeader = {
  // A name a client typed, starting with a formula character.
  organizationName: "=Sahyadri Health Trust",
  version: 1,
  asOf: "2026-10-08",
  generatedAt: "2026-10-08T05:30:00.000Z",
  generatedByName: "प्रिया नायर",
};

const tracker = gapActionTracker({
  header,
  today: "2026-10-08",
  gaps: [
    {
      source: "assessment",
      sourceLabel: "Assessment",
      parentName: "DPDP baseline 2026",
      context: "Security safeguards",
      mapping: { source: "assessment", domainCode: "SECURITY" },
      finding: "@SUM(A1:A9) typed into a finding",
      recommendedFix: null,
      severity: "critical",
      priority: "P0",
      state: "open",
      actions: [
        {
          id: "a1",
          title: "=HYPERLINK(\"http://evil.example\", \"click\")",
          source: "assessment",
          sourceLabel: "Assessment",
          parentName: "DPDP baseline 2026",
          context: "Security safeguards",
          mapping: { source: "assessment", domainCode: "SECURITY" },
          severity: "critical",
          priority: "P0",
          gapState: "open",
          status: "open",
          ownerUserId: null,
          ownerName: null,
          dueDate: "2026-10-01",
          closedAt: null,
          closedByName: null,
          closureBasis: null,
          notes: "-2+3",
          evidence: [],
        },
      ],
    },
  ],
});

const register = ropaRegisterWorkbook({ header, columns: ["Record ID", "Processing activity", "Completeness /100"], rows: [["ROPA-001", "+cmd", 64]] });
const index = evidenceIndexWorkbook({ header, entries: [] });

async function roundTrip(wb: ReportWorkbook) {
  const bytes = await renderReportXlsx(wb);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  return xlsxCells(bytes);
}

describe("the rendered XLSX", () => {
  for (const [name, wb] of [
    ["Gap & Action Tracker", tracker],
    ["ROPA Register", register],
    ["Evidence Index", index],
  ] as const) {
    it(`${name}: About first with D-011's caveat verbatim, then its sheets; no formula or hyperlink`, async () => {
      const read = await roundTrip(wb);
      expect([...read.sheets.keys()]).toEqual(["About", ...wb.sheets.map((s) => s.name)]);
      expect(read.active).toEqual([]);
      expect(read.sheets.get("About")!.flat()).toContain(DPDP_REPORT_CAVEAT);
      expect(read.text).toContain(wb.title);
    });
  }

  it("text a client typed stays text: defused, never evaluated", async () => {
    const read = await roundTrip(tracker);
    const [head, row] = read.sheets.get("Actions")!;
    expect(row![head!.indexOf("Action")]).toBe("'=HYPERLINK(\"http://evil.example\", \"click\")");
    expect(row![head!.indexOf("Notes")]).toBe("'-2+3");
    expect(read.sheets.get("Gaps")![1]![read.sheets.get("Gaps")![0]!.indexOf("Finding")]).toBe("'@SUM(A1:A9) typed into a finding");
    expect(read.sheets.get("About")![1]![0]).toBe("'=Sahyadri Health Trust");
  });

  it("numbers stay numbers, and an empty sheet says so", async () => {
    const reg = await roundTrip(register);
    expect(reg.sheets.get("Register")![1]).toEqual(["ROPA-001", "'+cmd", 64]);
    const idx = await roundTrip(index);
    expect(idx.sheets.get("Evidence index")![1]).toEqual(["No evidence has been uploaded yet."]);
  });
});

describe("dates are date cells (Slice 10.5 B4, F4.7)", () => {
  it("an Evidence Index date is a real Excel date, shown as a day — a value, never a formula", async () => {
    const wb = evidenceIndexWorkbook({
      header,
      entries: [
        {
          fileName: "dpa.pdf",
          contentType: "application/pdf",
          byteSize: 10,
          uploadedByName: null,
          uploadedViaVendorLink: true,
          uploadedAt: "2026-10-01T20:00:00Z",
          reviewStatus: "pending",
          evidenceLevel: null,
          reviewedByName: null,
          reviewedAt: null,
          reviewNotes: null,
          links: [],
        },
      ],
    });
    const bytes = await renderReportXlsx(wb);
    const read = await xlsxCells(bytes);
    expect(read.active).toEqual([]);
    const [head, row] = read.sheets.get("Evidence index")!;
    expect(row![head!.indexOf("Uploaded on")]).toBe("2026-10-02");
    expect(row![head!.indexOf("Uploaded by")]).toBe("The vendor (questionnaire link)");
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(bytes as unknown as ArrayBuffer);
    const cell = book.getWorksheet("Evidence index")!.getRow(2).getCell(head!.indexOf("Uploaded on") + 1);
    expect(cell.value).toBeInstanceOf(Date);
    expect(cell.numFmt).toBe("d mmm yyyy");
  });
});

describe("the read-back helper (a guard on the guard)", () => {
  it("does report a formula and a hyperlink when a file has them", async () => {
    const book = new ExcelJS.Workbook();
    const ws = book.addWorksheet("Bad");
    ws.getCell("A1").value = { formula: "1+1", result: 2 };
    ws.getCell("B1").value = { text: "click", hyperlink: "http://evil.example" };
    const read = await xlsxCells(Buffer.from(await book.xlsx.writeBuffer()));
    expect(read.active).toEqual(["Bad!A1: formula", "Bad!B1: hyperlink"]);
  });
});
