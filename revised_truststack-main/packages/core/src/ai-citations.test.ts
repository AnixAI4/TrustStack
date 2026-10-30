import { describe, expect, it } from "vitest";
import { checkCitation, formatCitation, indexProvisions, parseCitation } from "./ai-citations.js";

// A miniature of the corpus's shape (the real one is checked in apps/web tests/unit/ai-corpus.test.ts).
const ACT = [
  "THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023",
  "1. (1) This Act may be called the Digital Personal Data Protection Act, 2023.",
  "(2) It shall come into force on such date as the Central Government may appoint.",
  "2. In this Act, unless the context otherwise requires,—",
  "(i) “Data Fiduciary” means any person who determines the purpose and means;",
  "(k) “Data Processor” means any person who processes on behalf of a Data Fiduciary;",
  "3. Subject to the provisions of this Act, it shall apply to—",
  "1. a numbered list inside section 3 is not section 1",
  "THE SCHEDULE",
  "1. Breach of the obligation to take reasonable security safeguards",
].join("\n");
const RULES = [
  "1. Short title and commencement. — (1) These rules may be called the DPDP Rules, 2025.",
  "2. Definitions. — (1) In these rules,",
  "17.Appointment of Chairperson and other Members.— (1) The Central Government shall constitute",
  "FIRST SCHEDULE",
  "THIRD SCHEDULE",
].join("\n");

describe("the provision index, built from the corpus text", () => {
  const index = indexProvisions(ACT, RULES);
  it("reads sections in order and ignores a list inside one", () => {
    expect([...index.act.keys()]).toEqual([1, 2, 3]);
    expect(index.act.get(3)).toContain("numbered list inside section 3");
    expect(index.actSchedule).toBe(true);
  });
  it("reads rules even when the number touches the heading (17.Appointment)", () => {
    // 3–16 are missing from the miniature, so 17 is not the next number: the index stops at 2.
    expect([...index.rules.keys()]).toEqual([1, 2]);
    const full = indexProvisions(ACT, Array.from({ length: 17 }, (_, i) => `${i + 1}. Rule ${i + 1}. — (1) text`).join("\n").replace("17. Rule", "17.Rule"));
    expect(full.rules.has(17)).toBe(true);
  });
  it("finds the Rules' Schedules by their headings", () => {
    expect([...index.rulesSchedules]).toEqual([1, 3]);
  });
});

describe("§4.2(a) — a citation the corpus does not contain is caught", () => {
  const index = indexProvisions(ACT, RULES);
  const valid = ["s.1(2)", "section 2(k)", "S. 2(i)", "DPDP Act, s.1(1)", "Rule 1(1)", "rule 2(1)", "r.1", "First Schedule", "the Third Schedule to the Rules", "the Schedule to the Act"];
  for (const ref of valid) it(`accepts ${ref}`, () => expect(checkCitation(ref, index)).toMatchObject({ valid: true }));

  const invalid: [string, string][] = [
    ["s.45", "not_in_corpus"],
    ["s.1(3)", "not_in_corpus"],
    ["s.2(zz)", "not_in_corpus"],
    ["Rule 99(1)", "not_in_corpus"],
    ["Second Schedule", "not_in_corpus"],
    ["Article 21 of the Constitution", "unreadable"],
    ["GDPR Art. 33", "unreadable"],
  ];
  for (const [ref, reason] of invalid) {
    it(`rejects ${ref} (${reason})`, () => expect(checkCitation(ref, index)).toMatchObject({ valid: false, reason }));
  }

  it("prints one canonical form", () => {
    expect(formatCitation(parseCitation("section 8 (5)")!)).toBe("s.8(5)");
    expect(formatCitation(parseCitation("r. 7(2)(a)")!)).toBe("Rule 7(2)(a)");
    expect(formatCitation(parseCitation("seventh schedule")!)).toBe("Seventh Schedule");
  });
});
