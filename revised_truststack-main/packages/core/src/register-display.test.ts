/**
 * Slice 10.5 Batch B3 — what the registers SAY. None of these rules stores,
 * derives or permits anything: they word a period, an exemption, a request's
 * status, a questionnaire's progress, the people a register names, and the
 * s.7(a) ground.
 */
import { describe, expect, it } from "vitest";
import {
  CHILD_EXEMPTION_SHORT_LABEL,
  childExemptionShort,
  foldPeopleTypes,
  formatRetentionPeriod,
  questionnaireProgress,
  rightsStatusText,
  ROPA_RECORD_TABS,
  ropaTabPoints,
  ropaImportTemplateCsv,
  ropaTabWeight,
} from "./register-display.js";
import { mapColumns, parseLawfulBasis, ROPA_CHILD_EXEMPTION_CODES, ROPA_COMPLETENESS_AREAS, ROPA_IMPORT_FIELDS, ROPA_LAWFUL_BASES } from "./ropa.js";

describe("F3.9 — a retention period in years where whole", () => {
  it.each([
    [120, "10 years"],
    [12, "1 year"],
    [36, "3 years"],
    [18, "18 months"],
    [13, "13 months"],
    [1, "1 month"],
    [1200, "100 years"],
  ])("%i months → %s", (months, text) => {
    expect(formatRetentionPeriod(months)).toBe(text);
  });
});

describe("F3.10 — the Fourth Schedule exemption by its short name, the code in brackets", () => {
  it("every exemption has a short name", () => {
    expect(Object.keys(CHILD_EXEMPTION_SHORT_LABEL).sort()).toEqual([...ROPA_CHILD_EXEMPTION_CODES].sort());
  });

  it("names it and brackets the code", () => {
    expect(childExemptionShort("education")).toBe("Educational institution (A3)");
    expect(childExemptionShort("clinical")).toBe("Clinical health services (A1)");
    expect(childExemptionShort("age_check")).toBe("Confirming the person is not a child (B6)");
  });

  it("nothing for none, or for a code the Schedule does not list", () => {
    expect(childExemptionShort(null)).toBe(null);
    expect(childExemptionShort("A3")).toBe(null);
  });
});

describe("F3.11 — a request's status, the same words everywhere", () => {
  it("Responded — the outcome, once one is recorded", () => {
    expect(rightsStatusText("Responded", "Fulfilled")).toBe("Responded — Fulfilled");
    expect(rightsStatusText("Responded", "Resolved")).toBe("Responded — Resolved");
  });
  it("the status alone while there is none", () => {
    expect(rightsStatusText("In progress", null)).toBe("In progress");
  });
});

describe("F3.8 — a questionnaire's progress in words", () => {
  it("43 answered, 1 not applicable, of 44", () => {
    expect(questionnaireProgress(43, 1, 44)).toBe("43 answered, 1 not applicable, of 44");
  });
});

describe("F3.12 — people types folded by case and plural", () => {
  it("one kind of person is offered once", () => {
    expect(foldPeopleTypes(["Applicant", "Applicants", "Students", "Student", "student", "Staff"])).toEqual(["Applicant", "Student", "Staff"]);
  });

  it("keeps a plural whose singular is not there, and keeps order", () => {
    expect(foldPeopleTypes(["Parents", "Alumni", "Applicant"])).toEqual(["Parents", "Alumni", "Applicant"]);
  });

  it("folds -es; never a plural the singular would not find as a substring", () => {
    expect(foldPeopleTypes(["Address", "Addresses"])).toEqual(["Address"]);
    expect(foldPeopleTypes(["University", "Universities"])).toEqual(["University", "Universities"]);
  });
});

describe("F3.5 — the s.7(a) ground in the Act's terms", () => {
  const voluntary = ROPA_LAWFUL_BASES.find((b) => b.code === "voluntary")!;

  it("a specified purpose, the data given voluntarily, and no word that they do not consent (s.7(a); D-117)", () => {
    expect(voluntary.section).toBe("s.7(a)");
    expect(voluntary.label).toBe("A specified purpose the person voluntarily gave the data for, and has not said they do not consent to its use");
    expect(`${voluntary.label} (${voluntary.section})`).toBe(
      "A specified purpose the person voluntarily gave the data for, and has not said they do not consent to its use (s.7(a))",
    );
  });

  it("an import reads the new words, the section, and the words a CSV exported before B3 carries", () => {
    expect(parseLawfulBasis(voluntary.label)).toBe("voluntary");
    expect(parseLawfulBasis("s.7(a)")).toBe("voluntary");
    expect(parseLawfulBasis("Data the person gave for a purpose they asked for")).toBe("voluntary");
  });
});

describe("F3.2 — a processing record in five tabs", () => {
  it("names the tabs in order", () => {
    expect(ROPA_RECORD_TABS.map((t) => t.label)).toEqual(["Who and what", "Purpose and ground", "Systems and processors", "Retention and security", "Evidence"]);
  });

  it("every one of the thirteen areas is in exactly one tab", () => {
    const placed = ROPA_RECORD_TABS.flatMap((t) => t.areas);
    expect(placed).toHaveLength(13);
    expect([...placed].sort()).toEqual(ROPA_COMPLETENESS_AREAS.map((a) => a.code).sort());
  });

  it("the tabs' weights are 34, 24, 16, 22 and 4 — 100 in all", () => {
    expect(ROPA_RECORD_TABS.map((t) => ropaTabWeight(t.areas))).toEqual([34, 24, 16, 22, 4]);
  });

  it("a tab's points are the complete areas the register returned", () => {
    const areas = ROPA_COMPLETENESS_AREAS.map((a) => ({ code: a.code, weight: a.weight, complete: a.code !== "data_categories" && a.code !== "evidence" }));
    expect(ropaTabPoints(areas, ROPA_RECORD_TABS[0]!.areas)).toEqual({ got: 24, of: 34 });
    expect(ropaTabPoints(areas, ROPA_RECORD_TABS[4]!.areas)).toEqual({ got: 0, of: 4 });
    expect(ropaTabPoints(areas, ROPA_RECORD_TABS[1]!.areas)).toEqual({ got: 24, of: 24 });
  });
});

describe("F3.12 — the import template is the columns the importer reads", () => {
  const csv = ropaImportTemplateCsv();
  const headers = csv.trim().split(",");

  it("one header row, no quoting needed", () => {
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv.trim()).not.toMatch(/["\r\n]/);
    expect(headers[1]).toBe("Processing Activity");
  });

  it("the importer maps every column to a field, and every field has its column", () => {
    const m = mapColumns(headers);
    expect(m.unmapped).toEqual([]);
    expect(m.missingRequired).toEqual([]);
    expect(Object.keys(m.fields).sort()).toEqual([...ROPA_IMPORT_FIELDS].sort());
  });
});
