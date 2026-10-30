import { describe, expect, it } from "vitest";
import {
  assertUniqueQuestionCodes, DEFAULT_NA_RULE, domainFromHeading, DuplicateQuestionCodeError,
  LEGAL_BASIS_PLACEHOLDER, MANDATORY_NA_RULE, missingDomains, normaliseLegalBasis,
  parsePriority, parseQuestionMarkdown, parseTypeCell, QuestionParseError, resolveApplicability,
  type QuestionRecord,
} from "./questions.js";

/**
 * One fixture per authored layout (docs/QUESTION_FORMAT.md §Column aliases).
 * Mapping is by HEADER NAME, never position — these fixtures deliberately put
 * the same information in different columns and different orders.
 *
 * The real files are parsed in apps/web/tests/unit/question-bank.test.ts,
 * which checks the whole-bank invariants against what is actually on disk.
 */

const parse = (markdown: string, fileName = "fixture.md") =>
  parseQuestionMarkdown(markdown, { packCode: "TEST_PACK_V1", sourceTag: "university", fileName });

describe("parseTypeCell — one column carrying two different things", () => {
  it("a bare applicability word", () => {
    expect(parseTypeCell("Mandatory")).toEqual({ applicability: "mandatory", triggerText: null, riskTags: [] });
    expect(parseTypeCell("Conditional")).toEqual({ applicability: "conditional", triggerText: null, riskTags: [] });
  });

  it("no applicability word at all defaults to mandatory, keeping the tags", () => {
    expect(parseTypeCell("High-risk")).toEqual({ applicability: "mandatory", triggerText: null, riskTags: ["high_risk"] });
    expect(parseTypeCell("Evidence-heavy")).toEqual({
      applicability: "mandatory", triggerText: null, riskTags: ["evidence_heavy"],
    });
  });

  it("splits applicability from risk tags on '/'", () => {
    expect(parseTypeCell("Mandatory / High-risk")).toEqual({
      applicability: "mandatory", triggerText: null, riskTags: ["high_risk"],
    });
    expect(parseTypeCell("High-risk / Payment-linked")).toEqual({
      applicability: "mandatory", triggerText: null, riskTags: ["high_risk", "payment_linked"],
    });
    expect(parseTypeCell("Conditional / AI-linked")).toEqual({
      applicability: "conditional", triggerText: null, riskTags: ["ai_linked"],
    });
  });

  it("tags come out in the canonical order, whatever order they were authored in", () => {
    expect(parseTypeCell("Payment-linked / High-risk / AI-linked").riskTags).toEqual([
      "ai_linked", "high_risk", "payment_linked",
    ]);
  });

  it("keeps a trigger phrase whole, even when it contains a slash", () => {
    expect(parseTypeCell("Conditional: multi-campus/affiliated structure")).toEqual({
      applicability: "conditional", triggerText: "multi-campus/affiliated structure", riskTags: [],
    });
    expect(parseTypeCell("Trigger: AI/analytics")).toEqual({
      applicability: "conditional", triggerText: "AI/analytics", riskTags: [],
    });
    expect(parseTypeCell("Conditional: minors + AI/analytics").triggerText).toBe("minors + AI/analytics");
  });

  it("'Mandatory if X' and 'Mandatory where X' are CONDITIONAL, not mandatory", () => {
    // A question that applies only when X holds is not mandatory for everyone,
    // and Config's own D13 default applicability agrees.
    expect(parseTypeCell("Mandatory where vendors exist")).toEqual({
      applicability: "conditional", triggerText: "vendors exist", riskTags: [],
    });
    expect(parseTypeCell("Mandatory if cloud/SaaS used")).toEqual({
      applicability: "conditional", triggerText: "cloud/SaaS used", riskTags: [],
    });
    expect(parseTypeCell("Mandatory if GenAI use possible").triggerText).toBe("GenAI use possible");
  });

  it("unrecognised labels are dropped from risk_tags, not invented into it", () => {
    // "Omnichannel", "Logistics" and the rest of the authored long tail are
    // preserved verbatim in typeText instead of diluting the vocabulary.
    expect(parseTypeCell("Conditional / Omnichannel").riskTags).toEqual([]);
    expect(parseTypeCell("High-risk / Logistics").riskTags).toEqual(["high_risk"]);
  });

  it("maps the authored synonyms onto one canonical tag", () => {
    for (const cell of ["Reassessment trigger", "Reassessment", "Reassessment-linked"]) {
      expect(parseTypeCell(cell).riskTags).toEqual(["reassessment_trigger"]);
    }
    for (const cell of ["Advanced", "Improvement"]) {
      expect(parseTypeCell(cell).riskTags).toEqual(["advanced"]);
    }
  });

  it("an empty or missing cell is mandatory", () => {
    for (const cell of ["", "   ", null, undefined]) {
      expect(parseTypeCell(cell).applicability).toBe("mandatory");
    }
  });

  it("strips backticks and trailing punctuation", () => {
    expect(parseTypeCell("`Conditional: LMS used.`").triggerText).toBe("LMS used");
  });
});

describe("resolveApplicability — an unmappable condition is SHOWN, never hidden (D-029.3)", () => {
  const conditional = { applicability: "conditional" as const, triggerText: "placements", riskTags: [] };

  it("keeps conditional when the trigger is machine-evaluable", () => {
    expect(resolveApplicability(conditional, true)).toBe("conditional");
  });

  it("becomes potentially_applicable when it is not", () => {
    expect(resolveApplicability(conditional, false)).toBe("potentially_applicable");
  });

  it("leaves mandatory alone either way", () => {
    const mandatory = { applicability: "mandatory" as const, triggerText: null, riskTags: [] };
    expect(resolveApplicability(mandatory, false)).toBe("mandatory");
    expect(resolveApplicability(mandatory, true)).toBe("mandatory");
  });
});

describe("parseQuestionMarkdown — the seven authored layouts", () => {
  it("University: Code · Question / Check · Trigger · Evidence to verify · Risk if weak · Owner · Priority", () => {
    const [q] = parse(`
## 8.1 Governance — \`GOV\`

| Code | Question / Check | Trigger | Evidence to verify | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| UNI-GOV-001 | Has a DPDP owner been assigned? | Mandatory | Appointment note | No accountable owner | Registrar | P0 |
`);
    expect(q).toMatchObject({
      questionCode: "UNI-GOV-001",
      questionText: "Has a DPDP owner been assigned?",
      domainCode: "GOV",
      secondaryDomainCodes: [],
      applicability: "mandatory",
      typeText: "Mandatory",
      triggerText: null,
      triggerCondition: null,
      evidenceGuidance: "Appointment note",
      riskIfWeak: "No accountable owner",
      suggestedOwner: "Registrar",
      priority: "P0",
      packCode: "TEST_PACK_V1",
      sourceTag: "university",
      version: "1.0",
      status: "draft",
    });
    expect(q!.naRule).toBe(MANDATORY_NA_RULE);
    expect(q!.sourceRef).toBe("fixture.md:6");
  });

  it("EdTech: Code · Assessment question · Type · Evidence to check · Owner · Priority", () => {
    const [q] = parse(`
## 5.6 Consent and withdrawal — \`CONSENT\`

| Code | Assessment question | Type | Evidence to check | Owner | Priority |
|---|---|---|---|---|---|
| EDU-CON-001 | Is consent captured by affirmative action? | Conditional / Children-linked | Consent screenshots | Legal | P1 |
`);
    expect(q).toMatchObject({
      questionCode: "EDU-CON-001",
      domainCode: "CONSENT",
      applicability: "conditional",
      riskTags: ["children_linked"],
      evidenceGuidance: "Consent screenshots",
      suggestedOwner: "Legal",
      priority: "P1",
      riskIfWeak: null,
    });
  });

  it("BFSI: 'Type / trigger' and 'Suggested owner'", () => {
    const [q] = parse(`
## 4.13 Vendor governance — \`VENDOR\`

| Code | Assessment question | Type / trigger | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| BFSI-VEN-001 | Are processors registered? | Trigger: vendors | Vendor register | Procurement | P0 |
`);
    expect(q).toMatchObject({
      questionCode: "BFSI-VEN-001",
      domainCode: "VENDOR",
      applicability: "conditional",
      triggerText: "vendors",
      suggestedOwner: "Procurement",
    });
  });

  it("SaaS: no Type and no Priority column — both stay null, never guessed", () => {
    const [q] = parse(`
## 6.11 Security safeguards — \`SECURITY\`

| Code | Question | Evidence to check | Suggested owner |
|---|---|---|---|
| SAAS-SEC-001 | Is customer data encrypted at rest? | Encryption config | Platform Engineering |
`);
    expect(q!.priority).toBeNull();
    expect(q!.typeText).toBeNull();
    // No Type column means nothing said otherwise: mandatory is the documented default.
    expect(q!.applicability).toBe("mandatory");
    expect(q!.suggestedOwner).toBe("Platform Engineering");
  });

  it("Professional Services: Type is the LAST column, and 'Why it matters' is the risk", () => {
    const [q] = parse(`
## 8.4 Purpose — \`PURPOSE\`

| Code | Assessment question | Why it matters | Evidence to check | Suggested owner | Priority | Type |
|---|---|---|---|---|---|---|
| PS-PUR-001 | Is each engagement's purpose documented? | Scope creep | Engagement letter | Partner | P1 | Mandatory / Evidence-heavy |
`);
    expect(q).toMatchObject({
      questionCode: "PS-PUR-001",
      riskIfWeak: "Scope creep",
      applicability: "mandatory",
      riskTags: ["evidence_heavy"],
      priority: "P1",
    });
  });

  it("Public Sector: a heading that names the domain in WORDS, not by code", () => {
    const [q] = parse(`
## 9.8 Grievance redressal and contact publication

| Code | Question | Why / risk if weak | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|---|
| PS-GRV-001 | Is a privacy contact published? | Citizens cannot complain | Portal screenshot | Nodal Officer | P0 |
`);
    expect(q!.domainCode).toBe("GRIEVANCE");
    expect(q!.riskIfWeak).toBe("Citizens cannot complain");
  });

  it("process packs: an explicit Domain column beats the section heading", () => {
    const [q] = parse(`
## 11. KYC onboarding process pack — \`GOV\`

| Code | Question | Domain | Evidence |
|---|---|---|---|
| BFSI-KYC-001 | Is the KYC purpose documented? | PURPOSE | KYC SOP |
`);
    expect(q!.domainCode).toBe("PURPOSE");
    expect(q!.evidenceGuidance).toBe("KYC SOP");
  });

  it("a multi-domain cell: the FIRST code is primary and the only scoring domain (D-029.2)", () => {
    const [q] = parse(`
## 11. Process pack — \`GOV\`

| Code | Question | Domain | Evidence |
|---|---|---|---|
| BFSI-PRC-001 | Is the purpose inventoried? | PURPOSE / INV | Register |
`);
    expect(q!.domainCode).toBe("PURPOSE");
    expect(q!.secondaryDomainCodes).toEqual(["INV"]);
  });

  it("de-duplicates a Domain cell that repeats itself", () => {
    const [q] = parse(`
| Code | Question | Domain | Evidence |
|---|---|---|---|
| TST-001 | Q | INV / INV | E |
`);
    expect(q!.domainCode).toBe("INV");
    expect(q!.secondaryDomainCodes).toEqual([]);
  });
});

describe("parseQuestionMarkdown — what it refuses and what it ignores", () => {
  it("throws when a row resolves to no domain", () => {
    expect(() =>
      parse(`
## A section with no domain in its name

| Code | Question | Evidence |
|---|---|---|
| TST-001 | Orphan question | E |
`),
    ).toThrow(QuestionParseError);
  });

  it("throws when a row has no question text", () => {
    expect(() =>
      parse(`
## Governance — \`GOV\`

| Code | Question | Evidence |
|---|---|---|
| TST-001 |  | E |
`),
    ).toThrow(/has no question text/);
  });

  it("ignores prose tables, separator rows and rows before any header", () => {
    const records = parse(`
## How to read the question tables — \`GOV\`

| Field | Meaning |
|---|---|
| Code | Stable product question code |

## 8.1 Governance — \`GOV\`

| UNI-GOV-999 | a row before its header is not a question |

| Code | Question | Evidence |
|---|---|---|
|---|---|---|
| UNI-GOV-001 | The only real question here | E |
`);
    expect(records.map((r) => r.questionCode)).toEqual(["UNI-GOV-001"]);
  });

  it("a heading resets the header, so the next table's columns are re-read", () => {
    const records = parse(`
## 8.1 Governance — \`GOV\`

| Code | Question / Check | Trigger | Evidence to verify | Risk if weak | Owner | Priority |
|---|---|---|---|---|---|---|
| TST-101 | First | Mandatory | E1 | R1 | O1 | P0 |

## 8.2 Inventory — \`INV\`

| Code | Question | Domain | Evidence |
|---|---|---|---|
| TST-102 | Second | ROPA | E2 |
`);
    expect(records.map((r) => [r.questionCode, r.domainCode])).toEqual([
      ["TST-101", "GOV"],
      ["TST-102", "ROPA"],
    ]);
    expect(records[1]!.priority).toBeNull();
  });

  it("treats an em-dash or hyphen placeholder as absent, not as content", () => {
    const [q] = parse(`
## Governance — \`GOV\`

| Code | Question | Evidence to check | Suggested owner | Priority |
|---|---|---|---|---|
| TST-001 | Q | — | - | — |
`);
    expect(q!.evidenceGuidance).toBeNull();
    expect(q!.suggestedOwner).toBeNull();
    expect(q!.priority).toBeNull();
  });

  it("a conditional question gets the softer N/A rule; a mandatory one the stricter", () => {
    const records = parse(`
## Governance — \`GOV\`

| Code | Question | Type | Evidence |
|---|---|---|---|
| TST-001 | Mandatory one | Mandatory | E |
| TST-002 | Conditional one | Conditional: LMS used | E |
`);
    expect(records[0]!.naRule).toBe(MANDATORY_NA_RULE);
    expect(records[1]!.naRule).toBe(DEFAULT_NA_RULE);
  });
});

describe("domainFromHeading", () => {
  it("prefers an explicit code, and takes the LAST one when a heading names several", () => {
    expect(domainFromHeading("## 8.16 SDF, DPIA, audit and AI risk — `SDF_AI`")).toBe("SDF_AI");
    expect(domainFromHeading("## Notice and consent — `CONSENT`")).toBe("CONSENT");
  });

  it("falls back to wording", () => {
    expect(domainFromHeading("## Security safeguards for citizen data")).toBe("SECURITY");
    expect(domainFromHeading("## Cross-border transfers")).toBe("CROSSBORDER");
    expect(domainFromHeading("## Children’s data")).toBe("CHILD");
  });

  it("returns null for a heading that names no domain", () => {
    expect(domainFromHeading("## 15. UAT scenario")).toBeNull();
  });
});

describe("never invent content (§13.2)", () => {
  it("the workbook's generic sentence is NOT a legal citation", () => {
    expect(normaliseLegalBasis(LEGAL_BASIS_PLACEHOLDER)).toBeNull();
    expect(normaliseLegalBasis("  ")).toBeNull();
    expect(normaliseLegalBasis(null)).toBeNull();
    expect(normaliseLegalBasis("DPDP Act 2023, s.8(3)")).toBe("DPDP Act 2023, s.8(3)");
  });

  it("the parser never fills in a legal basis or a recommended fix", () => {
    const [q] = parse(`
## Governance — \`GOV\`

| Code | Question | Evidence |
|---|---|---|
| TST-001 | Q | E |
`);
    expect(q!.legalControlBasis).toBeNull();
    expect(q!.recommendedFix).toBeNull();
    expect(q!.criticality).toBeNull();
  });

  it("parsePriority accepts only P0–P3", () => {
    expect(parsePriority("P0")).toBe("P0");
    expect(parsePriority(" p3 ")).toBe("P3");
    expect(parsePriority("P4")).toBeNull();
    expect(parsePriority("High")).toBeNull();
    expect(parsePriority(null)).toBeNull();
  });
});

describe("bank-wide invariants", () => {
  const record = (questionCode: string, sourceRef: string): QuestionRecord => ({
    questionCode, questionText: "Q", packCode: "P", sourceTag: "core", domainCode: "GOV",
    secondaryDomainCodes: [], applicability: "mandatory", typeText: null, triggerText: null,
    triggerCondition: null, riskTags: [], evidenceGuidance: null, riskIfWeak: null,
    suggestedOwner: null, priority: null, criticality: null, legalControlBasis: null,
    recommendedFix: null, truststackModule: null, naRule: MANDATORY_NA_RULE,
    version: "1.0", status: "draft", sourceRef,
  });

  it("a duplicate code anywhere is an error, and the error names both places", () => {
    expect(() => assertUniqueQuestionCodes([record("TST-1", "a.md:1"), record("TST-2", "b.md:2")])).not.toThrow();
    try {
      assertUniqueQuestionCodes([record("TST-1", "a.md:1"), record("TST-1", "b.md:9")]);
      expect.unreachable("expected a duplicate-code error");
    } catch (error) {
      expect(error).toBeInstanceOf(DuplicateQuestionCodeError);
      expect((error as DuplicateQuestionCodeError).questionCode).toBe("TST-1");
      expect((error as DuplicateQuestionCodeError).refs).toEqual(["a.md:1", "b.md:9"]);
    }
  });

  it("missingDomains reports the gap, and counts a secondary tag as coverage", () => {
    expect(missingDomains([record("TST-1", "a:1")])).toHaveLength(15);
    const withSecondary = { ...record("TST-2", "a:2"), secondaryDomainCodes: ["INV" as const] };
    expect(missingDomains([record("TST-1", "a:1"), withSecondary])).not.toContain("INV");
  });
});
