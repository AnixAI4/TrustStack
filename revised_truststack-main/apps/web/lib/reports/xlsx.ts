import "server-only";
import ExcelJS from "exceljs";
import { WORKBOOK_ABOUT_SHEET, defuseFormula, type ReportWorkbook, type WorkbookCell } from "@truststack/core";

/**
 * The one XLSX renderer (Slice 9, Stage 4; `exceljs`, D-067). It writes any
 * `ReportWorkbook` core built — an About sheet with D-011's caveat, then the
 * data sheets — and decides nothing about what they say.
 *
 * VALUES ONLY (pitfall 9): a cell is a string, a number or empty, never a
 * formula object, and text that a spreadsheet could read as a formula is
 * already defused by core (`defuseFormula`, `csvCell`'s rule). The About
 * block — which carries names a client typed — is defused here as well.
 * `tests/unit/report-xlsx.test.ts` reads every file back and fails on a
 * formula, a hyperlink or a missing caveat.
 */

export const XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };

/** Excel does not grow a merged row to fit its text: about 120 characters a line across the About sheet's two columns. */
const wrappedHeight = (text: string) => 15 * Math.max(1, Math.ceil(text.length / 120));

/** How a date cell shows (F4.7): "19 Oct 2026" — still a real date, so it sorts and filters. */
const DATE_FORMAT = "d mmm yyyy";

/** A value as exceljs writes it: never a formula or a link — text, a number, a Date, or empty. */
function value(cell: WorkbookCell): string | number | Date | null {
  if (cell === null || typeof cell === "number") return cell;
  if (typeof cell === "string") return defuseFormula(cell);
  if (typeof cell === "object" && /^\d{4}-\d{2}-\d{2}$/.test(cell.date)) {
    // Midnight UTC of the calendar day: Excel stores dates without a zone, so the day never shifts.
    return new Date(`${cell.date}T00:00:00.000Z`);
  }
  throw new Error("a workbook cell must be text, a number, a date or empty");
}

export async function renderReportXlsx(wb: ReportWorkbook): Promise<Buffer> {
  const book = new ExcelJS.Workbook();
  book.creator = "TrustStack DPDP Compass";
  book.title = wb.title;

  const about = book.addWorksheet(WORKBOOK_ABOUT_SHEET);
  about.columns = [{ width: 26 }, { width: 110 }];
  about.addRow([defuseFormula(wb.title)]).font = { bold: true, size: 14 };
  about.addRow([defuseFormula(wb.organizationName)]).font = { size: 11 };
  about.addRow([]);
  for (const a of wb.about) {
    const row = about.addRow([defuseFormula(a.label), defuseFormula(a.value)]);
    row.getCell(1).font = { bold: true };
  }
  about.addRow([]);
  for (const c of wb.caveats) {
    about.addRow([defuseFormula(c.title)]).font = { bold: true };
    const row = about.addRow([defuseFormula(c.text)]);
    about.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
    row.height = wrappedHeight(c.text);
  }
  about.addRow([]);
  about.addRow(["Notes"]).font = { bold: true };
  for (const note of wb.notes) {
    const row = about.addRow([defuseFormula(note)]);
    about.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
    row.height = wrappedHeight(note);
  }

  for (const sheet of wb.sheets) {
    const ws = book.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = sheet.columns.map((c) => ({ header: c.header, width: c.width }));
    const head = ws.getRow(1);
    head.font = { bold: true };
    head.fill = HEADER_FILL;
    head.alignment = { vertical: "top", wrapText: true };
    if (sheet.rows.length === 0) {
      ws.addRow([sheet.empty]).font = { italic: true };
    } else {
      for (const r of sheet.rows) {
        const row = ws.addRow(r.map(value));
        r.forEach((c, i) => {
          if (c !== null && typeof c === "object") row.getCell(i + 1).numFmt = DATE_FORMAT;
        });
      }
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };
    }
  }

  return Buffer.from(await book.xlsx.writeBuffer());
}
