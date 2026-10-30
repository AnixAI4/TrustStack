/**
 * Loads the question bank from its two authored sources.
 *
 * The 1,429 industry questions are parsed FROM THE MARKDOWN at load time
 * (D-013), so the database can never drift from the authoring source — there is
 * no generated copy of them to go stale. The 98 core questions come from
 * `core-pack.json`, which `tools/extract_core_pack.py` regenerates from the
 * Excel MVP and CI checks for freshness.
 *
 * File I/O lives here and not in `packages/core`: the parser is framework-free
 * (D-004), the reading of files is privileged tooling (D-015).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertDomainWeightsTotal, assertUniqueQuestionCodes, DEFAULT_NA_RULE, DPDP_DOMAINS,
  MANDATORY_NA_RULE, mapTriggerText, missingDomains, packForQuestion, parseQuestionMarkdown,
  QUESTION_PACKS, resolveApplicability,
  type Applicability, type Criticality, type DomainCode, type Priority, type QuestionBank,
  type QuestionRecord, type SourceTag,
} from "@truststack/core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const INDUSTRY_DIR = path.join(REPO_ROOT, "docs", "question_packs", "industry");
const CORE_PACK_JSON = path.join(HERE, "core-pack.json");

/** The authored files, with the `source_tag` each carries. Order fixes seed order. */
export const INDUSTRY_FILES: readonly { fileName: string; sourceTag: SourceTag }[] = Object.freeze([
  { fileName: "01_University_Higher_Education_DPDP_Questions.md", sourceTag: "university" },
  { fileName: "02_EdTech_Online_Learning_DPDP_Questions.md", sourceTag: "edtech" },
  { fileName: "03_BFSI_DPDP_Questions.md", sourceTag: "bfsi" },
  { fileName: "04_Healthcare_DPDP_Questions.md", sourceTag: "healthcare" },
  { fileName: "05_SaaS_Technology_DPDP_Questions.md", sourceTag: "saas" },
  { fileName: "06_Manufacturing_DPDP_Questions.md", sourceTag: "manufacturing" },
  { fileName: "07_Retail_Ecommerce_DPDP_Questions.md", sourceTag: "retail_ecommerce" },
  { fileName: "08_Professional_Services_DPDP_Questions.md", sourceTag: "professional_services" },
  { fileName: "09_Public_Sector_DPDP_Questions.md", sourceTag: "public_sector" },
  { fileName: "10_General_Organisation_DPDP_Questions.md", sourceTag: "general" },
]);

interface CorePackJson {
  packCode: string;
  sourceTag: SourceTag;
  version: string;
  status: QuestionRecord["status"];
  domains: { domainId: string; code: DomainCode; name: string; weight: number; sortOrder: number }[];
  questions: {
    questionCode: string;
    questionText: string;
    domainCode: DomainCode;
    secondaryDomainCodes: DomainCode[];
    applicability: Applicability;
    typeText: string | null;
    triggerText: string | null;
    riskTags: never[];
    evidenceGuidance: string | null;
    riskIfWeak: string | null;
    suggestedOwner: string | null;
    priority: Priority | null;
    criticality: Criticality | null;
    legalControlBasis: string | null;
    recommendedFix: string | null;
    truststackModule: string | null;
    naRule: string;
  }[];
}

/** The core pack as canonical records. Also re-checks the workbook's weights. */
export function loadCorePack(): QuestionRecord[] {
  const raw = JSON.parse(readFileSync(CORE_PACK_JSON, "utf8")) as CorePackJson;

  // The extractor already refuses a total other than 100; this catches a
  // hand-edited JSON, and proves core and the workbook still agree (D-006).
  assertDomainWeightsTotal(raw.domains);
  for (const domain of DPDP_DOMAINS) {
    const fromExcel = raw.domains.find((d) => d.code === domain.code);
    if (!fromExcel) throw new Error(`core-pack.json is missing domain ${domain.code}`);
    if (fromExcel.weight !== domain.weight) {
      throw new Error(
        `domain ${domain.code} weight ${fromExcel.weight} in core-pack.json != ${domain.weight} in packages/core`,
      );
    }
  }

  return raw.questions.map((q) =>
    resolveTrigger({
      ...q,
      packCode: raw.packCode,
      sourceTag: raw.sourceTag,
      riskTags: [],
      triggerCondition: null,
      naRule: q.naRule || (q.applicability === "mandatory" ? MANDATORY_NA_RULE : DEFAULT_NA_RULE),
      version: raw.version,
      status: raw.status,
      sourceRef: "Question_Bank",
    }),
  );
}

/** One authored industry file, with every question assigned to its pack. */
export function loadIndustryPack(fileName: string, sourceTag: SourceTag): QuestionRecord[] {
  const markdown = readFileSync(path.join(INDUSTRY_DIR, fileName), "utf8");
  // The pack code on the parse is a placeholder: University questions are
  // re-assigned per question by `packForQuestion` (D-029.1).
  const records = parseQuestionMarkdown(markdown, {
    packCode: packForQuestion(sourceTag, ""),
    sourceTag,
    fileName,
  });
  const missing = missingDomains(records);
  if (missing.length > 0) throw new Error(`${fileName} no longer covers: ${missing.join(", ")}`);
  return records.map((r) => resolveTrigger({ ...r, packCode: packForQuestion(sourceTag, r.questionCode) }));
}

/**
 * Attaches the machine-evaluable trigger and settles the applicability the
 * BANK stores.
 *
 * Whether a condition can be evaluated depends on the question and our
 * reviewed mapping table, not on any one organisation — so it is decided once,
 * here, and not per assessment. A conditional question whose phrase has no
 * mapping becomes `potentially_applicable`: shown to the assessor, answered or
 * marked N/A with a reason, never silently dropped (D-029.3).
 */
function resolveTrigger(record: QuestionRecord): QuestionRecord {
  const triggerCondition = mapTriggerText(record.triggerText);
  return {
    ...record,
    triggerCondition,
    applicability: resolveApplicability(
      { applicability: record.applicability, triggerText: record.triggerText, riskTags: record.riskTags },
      triggerCondition !== null,
    ),
  };
}

/**
 * The whole bank: 98 core + 1,429 industry questions across the packs in
 * `QUESTION_PACKS`. Throws on a duplicate code anywhere, or if an industry file
 * stops covering all 16 domains.
 */
export function loadQuestionBank(): QuestionBank {
  const questions = [
    ...loadCorePack(),
    ...INDUSTRY_FILES.flatMap((f) => loadIndustryPack(f.fileName, f.sourceTag)),
  ];
  assertUniqueQuestionCodes(questions);
  const packCodes = new Set(QUESTION_PACKS.map((p) => p.code));
  for (const question of questions) {
    if (!packCodes.has(question.packCode)) {
      throw new Error(`question ${question.questionCode} names unknown pack ${question.packCode}`);
    }
  }
  return { packs: QUESTION_PACKS, questions };
}

/** Questions per pack, for the seed-count assertions and the sync step. */
export function questionCountsByPack(bank: QuestionBank): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pack of bank.packs) counts[pack.code] = 0;
  for (const question of bank.questions) counts[question.packCode] = (counts[question.packCode] ?? 0) + 1;
  return counts;
}
