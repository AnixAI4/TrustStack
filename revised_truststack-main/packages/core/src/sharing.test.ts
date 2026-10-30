import { describe, expect, it } from "vitest";
import { compileSharingList, sharingInScope, sharingListText, SHARING_LAW_NOTE, type SharingSourceRecord } from "./sharing.js";

const rec = (over: Partial<SharingSourceRecord> = {}): SharingSourceRecord => ({
  recordCode: "ROPA-001",
  name: "Admissions",
  status: "approved",
  lawfulBasis: "consent",
  dataCategories: "Name, contact, marks",
  sharing: null,
  vendors: [],
  ...over,
});

describe("sharingInScope — who s.11(1) reaches", () => {
  it("consent and s.7(a) are in; undecided counts as in; other s.7 uses are out", () => {
    expect(sharingInScope("consent")).toBe(true);
    expect(sharingInScope("voluntary")).toBe(true);
    expect(sharingInScope(null)).toBe(true);
    expect(sharingInScope("legal_obligation")).toBe(false);
    expect(sharingInScope("medical_emergency")).toBe(false);
  });
});

describe("compileSharingList — s.11(1)(b)", () => {
  it("lists linked processors once each, with every record that shares with them", () => {
    const list = compileSharingList([
      rec({ recordCode: "ROPA-002", name: "Exams", vendors: [{ name: "ExamCloud", service: "Exam hosting", role: "data_processor" }] }),
      rec({ recordCode: "ROPA-001", vendors: [{ name: "examcloud ", service: null, role: "data_processor" }] }),
    ]);
    expect(list.recipients).toHaveLength(1);
    expect(list.recipients[0]).toMatchObject({ name: "examcloud", kind: "data_processor", service: null });
    expect(list.recipients[0]!.records.map((r) => r.recordCode)).toEqual(["ROPA-001", "ROPA-002"]);
  });

  it("classifies by the register's own role, never by guess", () => {
    const list = compileSharingList([
      rec({
        vendors: [
          { name: "Bank", service: null, role: "independent" },
          { name: "Mailer", service: "Email", role: "data_processor" },
          { name: "Mystery", service: null, role: "unknown" },
        ],
      }),
    ]);
    expect(list.recipients.map((r) => [r.name, r.kind])).toEqual([
      ["Bank", "data_fiduciary"],
      ["Mailer", "data_processor"],
      ["Mystery", "not_classified"],
    ]);
  });

  it("keeps free-text recipients for a person to read, and ignores 'none'", () => {
    const list = compileSharingList([
      rec({ recordCode: "ROPA-001", sharing: "Affiliated colleges; scholarship board" }),
      rec({ recordCode: "ROPA-002", sharing: "None" }),
      rec({ recordCode: "ROPA-003", sharing: " - " }),
    ]);
    expect(list.namedInRecords.map((n) => n.text)).toEqual(["Affiliated colleges; scholarship board"]);
    expect(list.counts.recordsSharingNothing).toBe(2);
  });

  it("leaves out archived records and records s.11 does not reach, and counts them", () => {
    const list = compileSharingList([
      rec({ recordCode: "ROPA-001", status: "archived", vendors: [{ name: "Old", service: null, role: "data_processor" }] }),
      rec({ recordCode: "ROPA-002", lawfulBasis: "legal_obligation", vendors: [{ name: "Tax", service: null, role: "independent" }] }),
      rec({ recordCode: "ROPA-003", lawfulBasis: null, vendors: [{ name: "Payroll", service: null, role: "data_processor" }] }),
    ]);
    expect(list.recipients.map((r) => r.name)).toEqual(["Payroll"]);
    expect(list.recipients[0]!.records[0]!.basisUndecided).toBe(true);
    expect(list.counts).toEqual({ recordsRead: 2, recordsInScope: 1, recordsUndecided: 1, recordsOutOfScope: 1, recordsSharingNothing: 0 });
  });

  it("an empty register gives an empty list", () => {
    expect(compileSharingList([])).toEqual({
      recipients: [],
      namedInRecords: [],
      counts: { recordsRead: 0, recordsInScope: 0, recordsUndecided: 0, recordsOutOfScope: 0, recordsSharingNothing: 0 },
    });
  });
});

describe("sharingListText", () => {
  it("names each recipient with the kinds of data, and marks what is missing", () => {
    const text = sharingListText(
      compileSharingList([
        rec({ vendors: [{ name: "ExamCloud", service: "Exam hosting", role: "data_processor" }] }),
        rec({ recordCode: "ROPA-002", dataCategories: null, sharing: "Scholarship board" }),
      ]),
    );
    expect(text).toBe(
      "- ExamCloud (Data Processor, Exam hosting): Name, contact, marks\n- Scholarship board: [kinds of personal data — to be completed]",
    );
  });

  it("the law note cites s.11(1)(b) and the s.11(2) exception", () => {
    expect(SHARING_LAW_NOTE).toContain("s.11(1)(b)");
    expect(SHARING_LAW_NOTE).toContain("s.11(2)");
  });
});
