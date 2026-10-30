import "server-only";
import {
  QUESTION_PACK_CODES,
  type DomainCode, type PackStatus, type PackTier, type QuestionBank, type QuestionRecord,
  type SourceTag, type TriggerCondition,
} from "@truststack/core";
import { rpcError } from "@/lib/api/guard";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Reads the question bank FROM THE DATABASE, as the caller. Since D-071 RLS
 * lets only `question.read_bank` holders (Anix staff) read the bank tables;
 * generation goes through `bank_for_generation`, which checks
 * `assessment.write` and returns only approved, generatable packs.
 *
 * Deliberately not from the authored Markdown: `packages/db/question-bank`
 * parses those files at SEED time, and the seeded rows are the runtime source
 * of truth. A serverless request has no repo checkout to read, and a question
 * set must come from what was actually seeded, not from whatever happens to be
 * on a filesystem.
 */

/** One literal string: Supabase types a `select()` from the literal, not a concatenation. */
const QUESTION_SELECT =
  "code, pack_code, source_tag, current_version, question_versions(question_code, version, question_text, domain_code, secondary_domain_codes, applicability, type_text, trigger_text, trigger_condition, risk_tags, evidence_guidance, risk_if_weak, suggested_owner, priority, criticality, legal_control_basis, recommended_fix, truststack_module, na_rule, source_ref, status)" as const;

export async function loadQuestionPacks(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("question_packs")
    .select("code, tier, industry_code, name, version, status, source_file")
    .order("code");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    code: p.code,
    tier: p.tier as PackTier,
    industryCode: p.industry_code,
    name: p.name,
    version: p.version,
    status: p.status as PackStatus,
    sourceFile: p.source_file,
  }));
}

/**
 * Question counts per pack, as an embedded aggregate.
 *
 * NOT by listing `questions` and tallying in JavaScript: PostgREST caps a
 * response at 1,000 rows, and the bank is 1,527 — the tally would silently
 * miss whole packs. This asks the database to count.
 */
export async function loadQuestionCountsByPack(supabase: AppSupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("question_packs").select("code, questions(count)");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.code] = row.questions?.[0]?.count ?? 0;
  return counts;
}

/**
 * PostgREST caps a response at 1,000 rows, so anything that can exceed that
 * pages through explicitly. A silently truncated question bank would produce a
 * silently incomplete assessment.
 */
const PAGE = 500;

async function allRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await fetchPage(from, from + PAGE - 1);
    if (error) throw error;
    const page = data ?? [];
    out.push(...page);
    if (page.length < PAGE) return out;
  }
}

/**
 * Only the packs asked for — a generation never needs all 1,527 questions.
 * Read through ONE SECURITY DEFINER function (D-071): it checks
 * `assessment.write` in this organisation and returns only approved,
 * generatable packs, whatever codes are named. One jsonb value, so the
 * 1,000-row cap can never truncate it.
 */
export async function loadBankForPacks(
  supabase: AppSupabaseClient,
  organizationId: string,
  packCodes: readonly string[],
): Promise<QuestionBank> {
  // Guard against a pack code that is not reference data at all.
  const wanted = packCodes.filter((c) => (QUESTION_PACK_CODES as readonly string[]).includes(c));
  const { data, error } = await supabase.rpc("bank_for_generation", {
    p_organization_id: organizationId,
    p_pack_codes: wanted,
  });
  if (error) throw rpcError(error) ?? error;
  const payload = data as unknown as {
    packs: { code: string; tier: string; industry_code: string | null; name: string; version: string; status: string; source_file: string | null }[];
    questions: (VersionRow & { code: string; pack_code: string; source_tag: string })[];
  };
  return {
    packs: payload.packs.map((p) => ({
      code: p.code,
      tier: p.tier as PackTier,
      industryCode: p.industry_code,
      name: p.name,
      version: p.version,
      status: p.status as PackStatus,
      sourceFile: p.source_file,
    })),
    questions: payload.questions.map((q) => toRecord(q.code, q.pack_code, q.source_tag as SourceTag, q)),
  };
}

/** One pack's questions for the read-only bank browser. */
export async function loadPackQuestions(
  supabase: AppSupabaseClient,
  packCode: string,
): Promise<QuestionRecord[]> {
  const rows = await allRows((from, to) =>
    supabase.from("questions").select(QUESTION_SELECT).eq("pack_code", packCode).order("code").range(from, to),
  );

  return rows.flatMap((row) => {
    const version = (row.question_versions ?? []).find((v) => v.version === row.current_version);
    return version ? [toRecord(row.code, row.pack_code, row.source_tag as SourceTag, version)] : [];
  });
}

type VersionRow = {
  version: string;
  question_text: string;
  domain_code: string;
  secondary_domain_codes: string[] | null;
  applicability: string;
  type_text: string | null;
  trigger_text: string | null;
  trigger_condition: unknown;
  risk_tags: string[] | null;
  evidence_guidance: string | null;
  risk_if_weak: string | null;
  suggested_owner: string | null;
  priority: string | null;
  criticality: string | null;
  legal_control_basis: string | null;
  recommended_fix: string | null;
  truststack_module: string | null;
  na_rule: string;
  source_ref: string | null;
  status: string;
};

function toRecord(code: string, packCode: string, sourceTag: SourceTag, v: VersionRow): QuestionRecord {
  return {
    questionCode: code,
    questionText: v.question_text,
    packCode,
    sourceTag,
    domainCode: v.domain_code as DomainCode,
    secondaryDomainCodes: (v.secondary_domain_codes ?? []) as DomainCode[],
    applicability: v.applicability as QuestionRecord["applicability"],
    typeText: v.type_text,
    triggerText: v.trigger_text,
    triggerCondition: (v.trigger_condition ?? null) as TriggerCondition | null,
    riskTags: (v.risk_tags ?? []) as QuestionRecord["riskTags"],
    evidenceGuidance: v.evidence_guidance,
    riskIfWeak: v.risk_if_weak,
    suggestedOwner: v.suggested_owner,
    priority: v.priority as QuestionRecord["priority"],
    criticality: v.criticality as QuestionRecord["criticality"],
    legalControlBasis: v.legal_control_basis,
    recommendedFix: v.recommended_fix,
    truststackModule: v.truststack_module,
    naRule: v.na_rule,
    version: v.version,
    status: v.status as QuestionRecord["status"],
    sourceRef: v.source_ref,
  };
}
