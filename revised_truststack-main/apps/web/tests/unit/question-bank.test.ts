/**
 * The bank as it actually is on disk, and the reference data as the migration
 * actually inserts it.
 *
 * packages/core's own tests use fixtures, one per authored layout. This file
 * parses the REAL ten industry files and the REAL core-pack JSON, so an edit to
 * authored content that breaks an invariant fails the build here — and it
 * compares the migration's SQL against packages/core, the D-020 mirror rule.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assertDomainWeightsTotal, DOMAIN_CODES, DPDP_DOMAINS, missingDomains, QUESTION_PACKS,
  UNIVERSITY_BASELINE_QUESTIONS, UNIVERSITY_CONDITIONAL_PACK, UNIVERSITY_OVERLAY_PACK,
  UNIVERSITY_PROCTORING_PACK, UNIVERSITY_REFERENCE_PACK,
} from "@truststack/core";
import {
  INDUSTRY_FILES, loadCorePack, loadIndustryPack, loadQuestionBank, questionCountsByPack,
} from "@truststack/db/question-bank";
import { describe, expect, it } from "vitest";

const bank = loadQuestionBank();
const counts = questionCountsByPack(bank);

/** The authored totals. Changing content changes these numbers on purpose. */
const CORE_QUESTIONS = 98;
const INDUSTRY_QUESTIONS = 1429;
const BANK_QUESTIONS = CORE_QUESTIONS + INDUSTRY_QUESTIONS;

describe("the bank on disk", () => {
  it(`is ${BANK_QUESTIONS} questions: ${CORE_QUESTIONS} core + ${INDUSTRY_QUESTIONS} industry`, () => {
    expect(bank.questions).toHaveLength(BANK_QUESTIONS);
    expect(loadCorePack()).toHaveLength(CORE_QUESTIONS);
    expect(counts.CORE_DPDP_V1).toBe(CORE_QUESTIONS);
  });

  it("has no duplicate question code anywhere across the ten files and the workbook", () => {
    const codes = bank.questions.map((q) => q.questionCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every question names a pack that is reference data", () => {
    const packCodes = new Set(QUESTION_PACKS.map((p) => p.code));
    for (const q of bank.questions) expect(packCodes, q.questionCode).toContain(q.packCode);
  });

  it("every question's primary domain is one of the 16", () => {
    for (const q of bank.questions) expect(DOMAIN_CODES, q.questionCode).toContain(q.domainCode);
  });

  it("a secondary domain is never also the primary — it is a cross-reference, not a second score (D-029.2)", () => {
    for (const q of bank.questions) {
      expect(q.secondaryDomainCodes, q.questionCode).not.toContain(q.domainCode);
    }
  });

  it("each of the ten industry files still covers all 16 domains", () => {
    for (const file of INDUSTRY_FILES) {
      const records = loadIndustryPack(file.fileName, file.sourceTag);
      expect(missingDomains(records), file.fileName).toEqual([]);
      expect(records.length, file.fileName).toBeGreaterThan(100);
    }
  });

  it("the core pack covers all 16 domains too", () => {
    expect(missingDomains(loadCorePack())).toEqual([]);
  });
});

describe("the bank never invents content (§13.2)", () => {
  it("no question carries the workbook's placeholder legal basis", () => {
    const placeholder = bank.questions.filter((q) =>
      (q.legalControlBasis ?? "").includes("operational readiness requirement"),
    );
    expect(placeholder).toEqual([]);
  });

  it("no question has a legal basis at all yet — required before GA, not before the MU pilot (D-013)", () => {
    expect(bank.questions.filter((q) => q.legalControlBasis !== null)).toEqual([]);
  });

  it("priority is null exactly where the authored file has no Priority column", () => {
    const withoutPriority = bank.questions.filter((q) => q.priority === null);
    // SaaS (156) has no Priority column; BFSI §11 and Healthcare §13 process
    // rows lack one (46 + 32). The core pack derives priority from the
    // workbook's Criticality, so none of its 98 are null.
    expect(withoutPriority).toHaveLength(156 + 46 + 32);
    expect(withoutPriority.every((q) => q.sourceTag !== "core")).toBe(true);
    for (const q of withoutPriority.filter((q) => q.sourceTag === "saas")) {
      expect(q.priority).toBeNull();
    }
  });

  it("every priority that IS set is P0–P3", () => {
    for (const q of bank.questions) {
      if (q.priority !== null) expect(["P0", "P1", "P2", "P3"], q.questionCode).toContain(q.priority);
    }
  });

  it("criticality comes only from the workbook, so only core questions have one", () => {
    for (const q of bank.questions) {
      if (q.criticality !== null) expect(q.sourceTag, q.questionCode).toBe("core");
    }
    expect(loadCorePack().filter((q) => q.criticality === null)).toEqual([]);
  });
});

describe("applicability is resolved in the bank, once per question", () => {
  it("a conditional question always has both an authored condition and an expression", () => {
    for (const q of bank.questions.filter((x) => x.applicability === "conditional")) {
      expect(q.triggerText, q.questionCode).toBeTruthy();
      expect(q.triggerCondition, q.questionCode).not.toBeNull();
    }
  });

  it("a Potentially Applicable question carries no expression — that is what makes it shown, not hidden", () => {
    for (const q of bank.questions.filter((x) => x.applicability === "potentially_applicable")) {
      expect(q.triggerCondition, q.questionCode).toBeNull();
    }
  });

  it("a mandatory question has no condition", () => {
    for (const q of bank.questions.filter((x) => x.applicability === "mandatory")) {
      expect(q.triggerText, q.questionCode).toBeNull();
    }
  });

  it("the core pack's six vendor questions are conditional on vendors existing, not mandatory", () => {
    const vendor = loadCorePack().filter((q) => q.questionCode.startsWith("V1."));
    expect(vendor).toHaveLength(6);
    for (const q of vendor) {
      expect(q.applicability).toBe("conditional");
      expect(q.triggerText).toBe("vendors exist");
      expect(q.triggerCondition).not.toBeNull();
    }
  });
});

describe("the University pack is split by D-029.1", () => {
  it("108 questions across four packs: 10 baseline, 1 proctoring, 19 conditional, 78 reference", () => {
    expect(counts[UNIVERSITY_OVERLAY_PACK]).toBe(10);
    expect(counts[UNIVERSITY_PROCTORING_PACK]).toBe(1);
    expect(counts[UNIVERSITY_CONDITIONAL_PACK]).toBe(19);
    expect(counts[UNIVERSITY_REFERENCE_PACK]).toBe(78);
    const total =
      counts[UNIVERSITY_OVERLAY_PACK]! +
      counts[UNIVERSITY_PROCTORING_PACK]! +
      counts[UNIVERSITY_CONDITIONAL_PACK]! +
      counts[UNIVERSITY_REFERENCE_PACK]!;
    expect(total).toBe(108);
  });

  it("the baseline pack holds exactly the ten confirmed codes", () => {
    const seeded = bank.questions
      .filter((q) => q.packCode === UNIVERSITY_OVERLAY_PACK)
      .map((q) => q.questionCode)
      .sort();
    expect(seeded).toEqual([...UNIVERSITY_BASELINE_QUESTIONS].sort());
  });

  it("98 core + 10 University overlay = the 108 the PRD and the proposal quote", () => {
    expect(counts.CORE_DPDP_V1! + counts[UNIVERSITY_OVERLAY_PACK]!).toBe(108);
  });

  it("every code named in packs.ts actually exists in the authored file", () => {
    const university = new Set(
      bank.questions.filter((q) => q.sourceTag === "university").map((q) => q.questionCode),
    );
    expect(university.size).toBe(108);
    for (const code of UNIVERSITY_BASELINE_QUESTIONS) expect(university, code).toContain(code);
  });

  it("the nine other industry overlays hold every question in their file", () => {
    const expected: Record<string, number> = {
      EDTECH_OVERLAY_V1: 162,
      BFSI_OVERLAY_V1: 201,
      HEALTHCARE_OVERLAY_V1: 195,
      SAAS_TECH_OVERLAY_V1: 156,
      MANUFACTURING_OVERLAY_V1: 121,
      RETAIL_ECOMMERCE_OVERLAY_V1: 128,
      PROFESSIONAL_SERVICES_OVERLAY_V1: 122,
      PUBLIC_SECTOR_OVERLAY_V1: 121,
      GENERAL_ORGANISATION_V1: 115,
    };
    for (const [code, n] of Object.entries(expected)) expect(counts[code], code).toBe(n);
    expect(Object.values(expected).reduce((a, b) => a + b, 0)).toBe(INDUSTRY_QUESTIONS - 108);
  });

  it("the six cross-industry conditional packs have no authored questions yet", () => {
    for (const code of [
      "CHILDREN_DATA_V1", "VENDOR_PROCESSOR_V1", "CLOUD_CROSSBORDER_V1",
      "AI_RISK_V1", "MARKETING_TRACKING_V1", "SDF_READINESS_V1",
    ]) {
      expect(counts[code], code).toBe(0);
    }
  });
});

describe("migration reference data == packages/core (D-020)", () => {
  const migrationsDir = path.resolve(import.meta.dirname, "../../../../packages/db/prisma/migrations");
  const sql = readdirSync(migrationsDir)
    .filter((d) => /^\d{14}_/.test(d))
    .sort()
    .map((d) => readFileSync(path.join(migrationsDir, d, "migration.sql"), "utf8"))
    .join("\n");

  it("dpdp_domains: the same 16 rows, with the same weights", () => {
    const rows = [
      ...sql.matchAll(
        /\('([A-Z_]+)', '(D\d{2})', '((?:[^']|'')*)', ([\d.]+), '([a-z_]+)', '((?:[^']|'')*)', (\d+)\)/g,
      ),
    ].map(([, code, domainId, name, weight, applicability, owner, sortOrder]) => ({
      code,
      domainId,
      name: name!.replace(/''/g, "'"),
      weight: Number(weight),
      defaultApplicability: applicability,
      defaultOwner: owner!.replace(/''/g, "'"),
      sortOrder: Number(sortOrder),
    }));

    expect(rows).toHaveLength(16);
    expect(rows).toEqual(DPDP_DOMAINS.map((d) => ({ ...d })));
    expect(() => assertDomainWeightsTotal(rows)).not.toThrow();
    expect(rows.reduce((n, d) => n + d.weight, 0)).toBe(100);
  });

  it("question_packs: the same 20 rows, with the same tiers and statuses", () => {
    const block = sql.slice(
      sql.indexOf("INSERT INTO public.question_packs (code, tier, industry_code, name, version, status, source_file) VALUES"),
    );
    const rows = [
      ...block.slice(0, block.indexOf(";\n")).matchAll(
        /\('([A-Z0-9_]+)', '([a-z]+)', (?:'([a-z_]+)'|NULL), '((?:[^']|'')*)', '([\d.]+)', '([a-z]+)', (?:'([^']*)'|NULL)\)/g,
      ),
    ].map(([, code, tier, industryCode, name, version, status, sourceFile]) => ({
      code,
      tier,
      industryCode: industryCode ?? null,
      name: name!.replace(/''/g, "'"),
      version,
      status,
      sourceFile: sourceFile ?? null,
    }));

    expect(rows).toHaveLength(20);
    expect(rows).toEqual(QUESTION_PACKS.map((p) => ({ ...p })));
  });

  it("the migration asserts the 100-point total itself, not only in application code", () => {
    expect(sql).toContain("DOMAIN_WEIGHT_TOTAL_INVALID");
    expect(sql).toContain("CREATE CONSTRAINT TRIGGER dpdp_domains_weight_total");
  });

  it("the snapshot table has no UPDATE or DELETE grant, and the bank has no write grant", () => {
    expect(sql).toContain("GRANT SELECT ON public.assessment_questions TO authenticated;");
    expect(sql).toContain(
      "GRANT SELECT ON public.dpdp_domains, public.question_packs, public.questions,\n  public.question_versions TO authenticated;",
    );
    expect(sql).not.toMatch(/GRANT[^;]*(INSERT|UPDATE|DELETE)[^;]*ON public\.question_versions/);
    expect(sql).not.toMatch(/GRANT[^;]*(INSERT|UPDATE|DELETE)[^;]*ON public\.assessment_questions/);
  });
});
