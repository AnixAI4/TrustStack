import "server-only";
import ExcelJS from "exceljs";
import type { NumberedRow } from "./import";

/**
 * The Excel (.xlsx) reader for the ROPA import (D-067). The file is a client's
 * upload — untrusted input — so it is checked BEFORE a parser touches it:
 *
 * - a size limit, and the ZIP's own directory is read first: a file that
 *   declares more than XLSX_MAX_UNCOMPRESSED bytes once unpacked (a "zip
 *   bomb"), uses ZIP64, holds too many parts, carries MACROS
 *   (`vbaProject.bin`) or links to OTHER workbooks (`externalLinks/`) is
 *   refused unread;
 * - parsing runs under a time limit;
 * - only VALUES are read. A formula cell gives its cached result — what the
 *   client saw in Excel — and its formula is never read, let alone evaluated;
 *   a hyperlink gives its text and the link is never followed.
 *
 * The rows it returns go through the SAME column mapping and row validation
 * as a CSV (`./import.ts`), so a bad row is reported, never the file.
 */

export class XlsxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "XlsxError";
  }
}

export const XLSX_MAX_BYTES = 2_000_000;
export const XLSX_MAX_UNCOMPRESSED = 40_000_000;
export const XLSX_MAX_PARTS = 500;
export const XLSX_MAX_COLUMNS = 60;
export const XLSX_MAX_ROWS = 2_001; // a header and 2,000 records
export const XLSX_PARSE_MS = 10_000;

export interface ZipInventory {
  names: string[];
  uncompressed: number;
}

/**
 * Read a ZIP's central directory without unpacking anything: the part names
 * and the total size they declare. Throws on anything it cannot vouch for.
 */
export function inspectZip(buf: Buffer): ZipInventory {
  if (buf.length < 22 || buf.readUInt32LE(0) !== 0x04034b50) {
    throw new XlsxError("This is not an Excel (.xlsx) file.");
  }
  // The end-of-central-directory record sits in the last 22 + 65,535 bytes.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new XlsxError("The file is damaged — save it again from Excel.");
  const count = buf.readUInt16LE(eocd + 10);
  const size = buf.readUInt32LE(eocd + 12);
  const offset = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || size === 0xffffffff || offset === 0xffffffff) {
    throw new XlsxError("The file is too large to import — split it into smaller files.");
  }
  if (count > XLSX_MAX_PARTS) throw new XlsxError("The file has too many parts to be a register — save it again from Excel.");
  if (offset + size > buf.length) throw new XlsxError("The file is damaged — save it again from Excel.");

  const names: string[] = [];
  let uncompressed = 0;
  let p = offset;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) {
      throw new XlsxError("The file is damaged — save it again from Excel.");
    }
    const declared = buf.readUInt32LE(p + 24);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    if (declared === 0xffffffff) throw new XlsxError("The file is too large to import — split it into smaller files.");
    uncompressed += declared;
    names.push(buf.subarray(p + 46, p + 46 + nameLength).toString("utf8"));
    p += 46 + nameLength + extraLength + commentLength;
  }
  return { names, uncompressed };
}

/** Refuse what a register file has no business carrying. */
export function assertSafeWorkbook(buf: Buffer): void {
  if (buf.length > XLSX_MAX_BYTES) throw new XlsxError("The file is larger than 2 MB — split it into smaller files.");
  const { names, uncompressed } = inspectZip(buf);
  if (uncompressed > XLSX_MAX_UNCOMPRESSED) {
    throw new XlsxError("The file unpacks to far more than a register needs — it has not been opened.");
  }
  if (names.some((n) => /(^|\/)vbaProject\.bin$/i.test(n))) {
    throw new XlsxError("The file contains macros. Save it as a plain Excel workbook (.xlsx) and try again.");
  }
  if (names.some((n) => /^xl\/externalLinks\//i.test(n))) {
    throw new XlsxError("The file links to other workbooks. Copy the values in, remove the links, and try again.");
  }
  if (!names.includes("xl/workbook.xml")) throw new XlsxError("This is not an Excel (.xlsx) workbook.");
}

/** A cell as the text the client saw. Formulas give their cached result; links give their text. */
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) return value.richText.map((r) => r.text ?? "").join("");
    if ("formula" in value || "sharedFormula" in value) {
      const result = (value as { result?: ExcelJS.CellValue }).result;
      // A formula with no cached result has nothing the client saw: empty, never computed here.
      return result === undefined || (typeof result === "object" && result !== null && "error" in result) ? "" : cellText(result);
    }
    if ("text" in value) return String((value as { text: unknown }).text ?? "");
    if ("error" in value) return "";
  }
  return "";
}

/**
 * Rows of cell text from the register sheet — the one named like
 * "ROPA_Register" or "ROPA" if there is one, else the first sheet.
 */
export async function parseXlsx(buf: Buffer): Promise<NumberedRow[]> {
  assertSafeWorkbook(buf);
  const workbook = new ExcelJS.Workbook();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      workbook.xlsx.load(buf as unknown as ExcelJS.Buffer),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new XlsxError("The file took too long to read — save it again from Excel.")), XLSX_PARSE_MS);
      }),
    ]);
  } catch (error) {
    if (error instanceof XlsxError) throw error;
    throw new XlsxError("The file could not be read as an Excel workbook — save it again from Excel.");
  } finally {
    clearTimeout(timer);
  }

  const sheets = workbook.worksheets.filter((w) => w.state !== "hidden" && w.state !== "veryHidden");
  const sheet = sheets.find((w) => /^ropa(_register)?$/i.test(w.name.replace(/\s+/g, "_"))) ?? sheets[0];
  if (!sheet) throw new XlsxError("The workbook has no visible sheet.");
  if (sheet.rowCount > XLSX_MAX_ROWS + 50) throw new XlsxError("An import is at most 2,000 records — split the file.");

  const width = Math.min(sheet.columnCount, XLSX_MAX_COLUMNS);
  const rows: NumberedRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    for (let c = 1; c <= width; c++) cells.push(cellText(row.getCell(c).value).trim());
    // Excel's own row number, so a rejected row points where the client looks.
    if (cells.some((x) => x !== "")) rows.push({ number: row.number, cells });
  });
  return rows;
}
