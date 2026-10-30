/**
 * An XLSX, read back for tests: every sheet as rows of plain values, plus
 * every cell that is NOT a plain value — a formula, a shared formula or a
 * hyperlink. The exports write values only (pitfall 9), so a test asserts
 * that list is empty, on the FILE.
 */
import ExcelJS from "exceljs";

export interface XlsxRead {
  sheets: Map<string, (string | number | null)[][]>;
  /** `Sheet!A1: what it is` for every formula or hyperlink cell. */
  active: string[];
  /** Every value in every sheet, joined — for caveat and black-box checks. */
  text: string;
}

export async function xlsxCells(bytes: Uint8Array): Promise<XlsxRead> {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  const sheets = new Map<string, (string | number | null)[][]>();
  const active: string[] = [];
  const parts: string[] = [];
  book.eachSheet((ws) => {
    const rows: (string | number | null)[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const values: (string | number | null)[] = [];
      for (let c = 1; c <= row.cellCount; c++) {
        const cell = row.getCell(c);
        if (cell.type === ExcelJS.ValueType.Formula || cell.formula || (cell.value && typeof cell.value === "object" && "formula" in cell.value)) {
          active.push(`${ws.name}!${cell.address}: formula`);
        }
        if (cell.hyperlink || (cell.value && typeof cell.value === "object" && "hyperlink" in cell.value)) {
          active.push(`${ws.name}!${cell.address}: hyperlink`);
        }
        const v = cell.value;
        // A date cell (F4.7) reads back as its calendar day, YYYY-MM-DD.
        const plain =
          v === null || v === undefined ? null : typeof v === "number" || typeof v === "string" ? v : v instanceof Date ? v.toISOString().slice(0, 10) : String(cell.text);
        values.push(plain);
        if (plain !== null) parts.push(String(plain));
      }
      rows.push(values);
    });
    sheets.set(ws.name, rows);
  });
  return { sheets, active, text: parts.join("\n") };
}
