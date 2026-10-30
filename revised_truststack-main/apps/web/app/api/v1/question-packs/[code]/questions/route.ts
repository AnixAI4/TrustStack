import { questionPack } from "@truststack/core";
import { ApiError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { loadPackQuestions } from "@/lib/assessments/bank";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/question-packs/{code}/questions — read-only bank browser, Anix
 * staff only (`question.read_bank`, D-068; enforced by RLS too, D-071).
 *
 * Returns the authored record as stored: a null priority or legal basis stays
 * null, because the UI showing "—" is the truthful answer (§13.2).
 */
export const GET = withApi(
  { auth: "required", tenant: "active", permission: "question.read_bank" },
  async ({ request, supabase, params }) => {
    const code = params.code ?? "";
    if (!questionPack(code)) throw new ApiError(404, "NOT_FOUND", "No such question pack.");

    const questions = await loadPackQuestions(supabase, code);
    questions.sort((a, b) => a.questionCode.localeCompare(b.questionCode, "en"));

    return ok({ packCode: code, questionCount: questions.length, questions }, request);
  },
);
