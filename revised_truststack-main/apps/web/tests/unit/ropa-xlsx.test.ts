/**
 * D-067 — the Excel import. A client's workbook is untrusted input: it is
 * refused UNREAD when it carries macros, links to other workbooks, or unpacks
 * to far more than a register needs; and when it is read, only VALUES are
 * read — a formula gives its cached result and is never evaluated, a
 * hyperlink gives its text and is never followed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { prepareRows } from "@/lib/ropa/import";
import { assertSafeWorkbook, cellText, inspectZip, parseXlsx, XlsxError, XLSX_MAX_UNCOMPRESSED } from "@/lib/ropa/xlsx";

const FIXTURE: { columns: string[]; records: Record<string, string>[] } = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../../packages/db/question-bank/ropa-register.json"), "utf8"),
);

async function workbook(build: (wb: ExcelJS.Workbook) => void): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  build(wb);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** A minimal ZIP whose central directory says what the test needs — nothing is ever unpacked. */
function zipWith(entries: { name: string; declared?: number }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt32LE(e.declared ?? 10, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length;
  }
  const cd = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, eocd]);
}

describe("refused unread", () => {
  it("a workbook with macros", () => {
    expect(() => assertSafeWorkbook(zipWith([{ name: "xl/workbook.xml" }, { name: "xl/vbaProject.bin" }]))).toThrow(/macros/);
  });

  it("a workbook linking to other workbooks", () => {
    expect(() => assertSafeWorkbook(zipWith([{ name: "xl/workbook.xml" }, { name: "xl/externalLinks/externalLink1.xml" }]))).toThrow(
      /links to other workbooks/,
    );
  });

  it("a zip bomb: the directory declares more than a register could need", () => {
    expect(() => assertSafeWorkbook(zipWith([{ name: "xl/workbook.xml", declared: XLSX_MAX_UNCOMPRESSED + 1 }]))).toThrow(
      /unpacks to far more/,
    );
  });

  it("ZIP64, too many parts, not a workbook, not a ZIP at all, or too large", () => {
    expect(() => assertSafeWorkbook(zipWith([{ name: "xl/workbook.xml", declared: 0xffffffff }]))).toThrow(XlsxError);
    expect(() => assertSafeWorkbook(zipWith(Array.from({ length: 501 }, (_, i) => ({ name: `p${i}` }))))).toThrow(/too many parts/);
    expect(() => assertSafeWorkbook(zipWith([{ name: "word/document.xml" }]))).toThrow(/not an Excel/);
    expect(() => assertSafeWorkbook(Buffer.from("Processing Activity,Purpose\nx,y"))).toThrow(/not an Excel/);
    expect(() => assertSafeWorkbook(Buffer.alloc(2_000_001))).toThrow(/larger than 2 MB/);
  });

  it("a real workbook passes, and its directory is read without unpacking", async () => {
    const buf = await workbook((wb) => wb.addWorksheet("ROPA_Register").addRow(["Processing Activity"]));
    expect(() => assertSafeWorkbook(buf)).not.toThrow();
    expect(inspectZip(buf).names).toContain("xl/workbook.xml");
  });
});

describe("values only", () => {
  it("a formula gives its cached result — never its formula, never a fresh calculation", () => {
    expect(cellText({ formula: 'HYPERLINK("http://evil.example","click")', result: "click" } as ExcelJS.CellValue)).toBe("click");
    expect(cellText({ formula: "1+1" } as ExcelJS.CellValue)).toBe("");
    expect(cellText({ formula: "1/0", result: { error: "#DIV/0!" } } as ExcelJS.CellValue)).toBe("");
    expect(cellText({ sharedFormula: "A1", result: 42 } as ExcelJS.CellValue)).toBe("42");
  });

  it("a hyperlink gives its text — the link is never followed", () => {
    expect(cellText({ text: "Vendor contract", hyperlink: "http://evil.example" } as ExcelJS.CellValue)).toBe("Vendor contract");
  });

  it("rich text, dates, numbers and blanks", () => {
    expect(cellText({ richText: [{ text: "Name, " }, { text: "DOB" }] } as ExcelJS.CellValue)).toBe("Name, DOB");
    expect(cellText(new Date(Date.UTC(2026, 9, 3)))).toBe("2026-10-03");
    expect(cellText(100000)).toBe("100000");
    expect(cellText(null)).toBe("");
  });
});

describe("the workbook's own register, as Excel", () => {
  it("reads the ten records, by column name, from the register sheet — not the first sheet", async () => {
    const buf = await workbook((wb) => {
      wb.addWorksheet("Notes").addRow(["Read me first"]);
      const sheet = wb.addWorksheet("ROPA_Register");
      sheet.addRow(FIXTURE.columns);
      for (const r of FIXTURE.records) {
        sheet.addRow(
          FIXTURE.columns.map((c) => (c === "Last Reviewed" || c === "Next Review" ? new Date(`${r[c]}T00:00:00Z`) : r[c])),
        );
      }
    });
    const prepared = prepareRows(await parseXlsx(buf));
    expect(prepared.mapping.unmapped).toEqual([]);
    expect(prepared.rejected).toEqual([]);
    expect(prepared.valid.map((v) => v.record.recordCode)).toHaveLength(10);
    expect(prepared.valid[0]!.record.nextReviewAt).toBe("2026-10-03");
  });

  it("8 good rows and 2 bad: imports 8, reports 2 — by EXCEL's row numbers, blank rows included", async () => {
    const buf = await workbook((wb) => {
      const sheet = wb.addWorksheet("Register");
      sheet.getRow(1).values = ["Processing Activity", "Purpose", "Evidence"];
      const good = (n: number) => [`Activity ${n}`, `Purpose ${n}`, ""];
      let row = 2;
      for (const values of [good(1), good(2), ["", "No name", ""], good(3), good(4)]) sheet.getRow(row++).values = values;
      row++; // a blank row in the middle — row numbers must not shift
      sheet.getRow(row++).values = ["Activity 5", "Purpose", ""];
      sheet.getRow(row - 1).getCell(1).value = { formula: "1/0", result: { error: "#DIV/0!" } } as ExcelJS.CellValue;
      for (const n of [6, 7, 8]) sheet.getRow(row++).values = good(n);
      sheet.getRow(row++).values = [
        "Activity 9",
        "Purpose 9",
        { formula: 'HYPERLINK("http://evil.example","see contract")', result: "see contract" } as unknown as string,
      ];
    });
    const prepared = prepareRows(await parseXlsx(buf));
    expect(prepared.valid).toHaveLength(8);
    expect(prepared.rejected.map((r) => r.row)).toEqual([4, 8]);
    expect(prepared.valid.find((v) => v.record.name === "Activity 9")!.record.text.evidenceNote).toBe("see contract");
  });

  it("a damaged file is refused with a plain message", async () => {
    const buf = await workbook((wb) => wb.addWorksheet("x").addRow(["Processing Activity"]));
    const broken = Buffer.concat([buf.subarray(0, 200), Buffer.alloc(100), buf.subarray(300)]);
    await expect(parseXlsx(broken)).rejects.toBeInstanceOf(XlsxError);
  });
});
