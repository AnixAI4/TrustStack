/**
 * Slice 7 — the ROPA import, short of the database, and the workbook's ten
 * records through it.
 *
 * Two promises are tested here: a bad row is reported with its reasons and
 * never fails the file, and a formula is text — `=HYPERLINK(...)` is stored
 * as typed and never evaluated.
 *
 * The ten workbook records are NOT an oracle. The sheet computes no
 * completeness score and its Risk Rating is typed by hand, so these tests pin
 * what the register's OWN rules give for them — and say plainly where the
 * hand ratings disagree.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { csvCell, ROPA_AREA_CODES } from "@truststack/core";
import { describe, expect, it } from "vitest";
import { CsvError, parseCsv } from "@/lib/ropa/csv";
import { prepareImport, toRpcRow } from "@/lib/ropa/import";

const FIXTURE: { columns: string[]; records: Record<string, string>[] } = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../../../packages/db/question-bank/ropa-register.json"), "utf8"),
);

/** The workbook's register, as the CSV a client would export from it. */
const WORKBOOK_CSV = [
  FIXTURE.columns.map(csvCell).join(","),
  ...FIXTURE.records.map((r) => FIXTURE.columns.map((c) => csvCell(r[c])).join(",")),
].join("\r\n");

describe("parseCsv", () => {
  it("reads quoted cells, doubled quotes, and commas and new lines inside quotes", () => {
    expect(parseCsv('a,"b, c","say ""hi""","two\nlines"\n1,2,3,4')).toEqual([
      ["a", "b, c", 'say "hi"', "two\nlines"],
      ["1", "2", "3", "4"],
    ]);
  });

  it("handles CRLF, a byte-order mark, and blank lines", () => {
    expect(parseCsv("﻿h1,h2\r\n\r\nx,y\r\n")).toEqual([
      ["h1", "h2"],
      ["x", "y"],
    ]);
  });

  it("keeps empty cells", () => {
    expect(parseCsv("a,,c\n,,")).toEqual([
      ["a", "", "c"],
      ["", "", ""],
    ]);
  });

  it("refuses a file that ends inside a quote", () => {
    expect(() => parseCsv('a,"unterminated')).toThrow(CsvError);
  });

  it("never evaluates a formula: the cell is the text", () => {
    expect(parseCsv("=1+1,=SUM(A1:A9)")).toEqual([["=1+1", "=SUM(A1:A9)"]]);
    // Quoted as a spreadsheet writes it, the whole formula is one cell, verbatim.
    expect(parseCsv('"=HYPERLINK(""http://evil.example"",""x"")"')).toEqual([['=HYPERLINK("http://evil.example","x")']]);
  });
});

describe("prepareImport — a bad row never fails the file", () => {
  const header = "Processing Activity,Purpose,Next Review,Risk Rating,Evidence";
  const good = (n: number) => `Activity ${n},Purpose ${n},2027-0${(n % 9) + 1}-15,,`;

  it("8 good rows and 2 bad: imports 8, reports 2 — each with its row number and reason", () => {
    const csv = [
      header,
      good(1),
      good(2),
      ",Purpose without a name,2027-01-01,,", // row 4: no name
      good(3),
      good(4),
      "Activity 5,Purpose,31/31/2027,Severe,", // row 7: bad date AND bad rating
      good(6),
      good(7),
      good(8),
      good(9),
    ].join("\n");
    const prepared = prepareImport(csv);
    expect(prepared.valid).toHaveLength(8);
    expect(prepared.rejected).toEqual([
      { row: 4, errors: [{ field: "name", issue: "The processing activity needs a name." }] },
      {
        row: 7,
        errors: [
          { field: "riskRating", issue: "A risk rating is Low, Medium, High or Critical." },
          { field: "nextReviewAt", issue: "Use a date like 2026-12-31 or 31/12/2026." },
        ],
      },
    ]);
    expect(prepared.valid.map((v) => v.row)).toEqual([2, 3, 5, 6, 8, 9, 10, 11]);
  });

  it("a formula cell is imported as TEXT, never evaluated", () => {
    const formula = '=HYPERLINK("http://evil.example","click")';
    const prepared = prepareImport(`${header}\nActivity,Purpose,,,${csvCell(formula)}`);
    expect(prepared.valid[0]!.record.text.evidenceNote).toBe(formula);
    expect(toRpcRow(prepared.valid[0]!, null).evidence_note).toBe(formula);
    // Unguarded, as a client's own spreadsheet would write it, it is the same text.
    const raw = prepareImport(`${header}\nActivity,Purpose,,,"${formula.replace(/"/g, '""')}"`);
    expect(raw.valid[0]!.record.text.evidenceNote).toBe(formula);
  });

  it("a file with no name column cannot be imported until it is mapped", () => {
    const prepared = prepareImport("Activity title,Purpose\nx,y");
    expect(prepared.mapping.missingRequired).toEqual(["name"]);
    expect(prepared.mapping.unmapped).toEqual(["Activity title"]);
    // …and the user's confirmed mapping fixes it.
    const confirmed = prepareImport("Activity title,Purpose\nx,y", { "Activity title": "name", Purpose: "purpose" });
    expect(confirmed.valid[0]!.record).toMatchObject({ name: "x", text: { purpose: "y" } });
  });

  it("an empty file is refused, and so is one over 2,000 records", () => {
    expect(() => prepareImport("")).toThrow(/empty/);
    const big = [header, ...Array.from({ length: 2001 }, (_, i) => good(i))].join("\n");
    expect(() => prepareImport(big)).toThrow(/at most 2,000/);
  });
});

describe("the workbook's ten records, through the importer", () => {
  const prepared = prepareImport(WORKBOOK_CSV);

  it("every column maps by name, and every record parses", () => {
    expect(prepared.mapping.unmapped).toEqual([]);
    expect(prepared.rejected).toEqual([]);
    expect(prepared.valid.map((v) => v.record.recordCode)).toEqual(
      Array.from({ length: 10 }, (_, i) => `ROPA-${String(i + 1).padStart(3, "0")}`),
    );
  });

  it("the yes/no columns arrive as honest tri-states", () => {
    const children = prepared.valid.map((v) => v.record.childrenData);
    // "Yes / Needs review" ×2 · "Possible under-18 / Needs review" ×1 · "Possible" ×5 · "No" ×2
    expect(children.filter((c) => c === "yes")).toHaveLength(2);
    expect(children.filter((c) => c === "unknown")).toHaveLength(6);
    expect(children.filter((c) => c === "no")).toHaveLength(2);
    // Cross-border is never known; AI is "Yes" once and "Possible analytics" once.
    expect(new Set(prepared.valid.map((v) => v.record.crossBorder))).toEqual(new Set(["unknown"]));
    expect(prepared.valid.map((v) => v.record.aiProcessing).filter((a) => a !== "no")).toEqual(["unknown", "yes"]);
  });

  /**
   * What the rules give for each record AS IMPORTED (no owner, no links, no
   * evidence). The seed adds department and system links; those change no
   * number here, because text already completes those areas.
   */
  // D-065: an import names no lawful ground and no retention trigger, so
  // "purpose and basis" and "retention" are honestly missing on every row —
  // and with the ground undecided, notice AND consent are both expected.
  const EXPECTED: Record<string, { score: number; missing: string[]; derived: string; hand: string; shown: string }> = {
    "ROPA-001": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "high", shown: "high" },
    "ROPA-002": { score: 62, missing: ["department_owner", "purpose_basis", "notice_consent", "retention", "evidence"], derived: "high", hand: "critical", shown: "critical" },
    "ROPA-003": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "high", shown: "high" },
    "ROPA-004": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "high", shown: "high" },
    "ROPA-005": { score: 62, missing: ["department_owner", "purpose_basis", "notice_consent", "retention", "evidence"], derived: "medium", hand: "medium", shown: "medium" },
    "ROPA-006": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "high", shown: "high" },
    "ROPA-007": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "critical", shown: "critical" },
    "ROPA-008": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "critical", hand: "high", shown: "critical" },
    "ROPA-009": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "high", hand: "medium", shown: "high" },
    "ROPA-010": { score: 70, missing: ["department_owner", "purpose_basis", "retention", "evidence"], derived: "medium", hand: "medium", shown: "medium" },
  };

  it("each scores, bands and rates as the rules say", async () => {
    const { importedRecordFacts, ropaCompleteness, ropaRisk } = await import("@truststack/core");
    for (const v of prepared.valid) {
      const facts = importedRecordFacts(v.record);
      const completeness = ropaCompleteness(facts);
      const risk = ropaRisk(facts, v.record.riskRating);
      const want = EXPECTED[v.record.recordCode!]!;
      expect({ score: completeness.score, missing: completeness.missing, derived: risk.derived, hand: v.record.riskRating, shown: risk.rating }, v.record.recordCode!).toEqual(want);
      expect(completeness.band).toBe("usable");
      for (const area of completeness.missing) expect(ROPA_AREA_CODES).toContain(area);
    }
  });

  it("none is below Usable, and none is Strong — no owner and no stored evidence anywhere", () => {
    expect(Object.values(EXPECTED).every((e) => e.score > 60 && e.score <= 80)).toBe(true);
  });

  it("the hand ratings the rules disagree with are exactly four — and only two survive, because a rating is never lowered", () => {
    const disagree = Object.entries(EXPECTED).filter(([, e]) => e.hand !== e.derived).map(([code]) => code);
    expect(disagree).toEqual(["ROPA-002", "ROPA-007", "ROPA-008", "ROPA-009"]);
    // ROPA-002 and ROPA-007: the hand rating RAISES (High → Critical) and is kept.
    // ROPA-008: AI processing + no retention rule make the rules say Critical; the hand said High.
    // ROPA-009: children's data "Possible" counts as risk (D-026); the hand said Medium.
    const warned = prepared.valid.filter((v) => v.warnings.length > 0).map((v) => v.record.recordCode);
    expect(warned).toEqual(["ROPA-008", "ROPA-009"]);
  });

  it("the RPC payload carries the raising rating only", () => {
    const payload = prepared.valid.map((v) => toRpcRow(v, null));
    expect(payload.filter((p) => p.risk_rating_assessor !== null).map((p) => [p.record_code, p.risk_rating_assessor])).toEqual([
      ["ROPA-002", "critical"],
      ["ROPA-007", "critical"],
    ]);
  });
});

describe("long id lists are sent in chunks (the URI-too-long fix)", () => {
  it("chunks preserves every item, in order, in pieces no larger than the limit", async () => {
    const { chunks, IN_CHUNK } = await import("@/lib/gaps/shape");
    const items = Array.from({ length: IN_CHUNK * 2 + 5 }, (_, i) => i);
    const parts = chunks(items);
    expect(parts.map((p) => p.length)).toEqual([IN_CHUNK, IN_CHUNK, 5]);
    expect(parts.flat()).toEqual(items);
    expect(chunks([])).toEqual([]);
  });
});
