import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { loadQuestionCountsByPack, loadQuestionPacks } from "@/lib/assessments/bank";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/question-packs — every pack with its question count, `draft` and
 * `reference` included (D-029.1).
 *
 * Anix staff only (`question.read_bank`, D-068). To a client the bank is a
 * black box, and since D-071 the DATABASE enforces that too: RLS refuses the
 * bank tables to anyone without the permission, so this route could not leak
 * them even if its guard were wrong. A client reads its questions on its own
 * assessment, never here.
 */
export const GET = withApi(
  { auth: "required", tenant: "active", permission: "question.read_bank" },
  async ({ request, supabase }) => {
    const [packs, counts] = await Promise.all([loadQuestionPacks(supabase), loadQuestionCountsByPack(supabase)]);
    return ok({ packs: packs.map((p) => ({ ...p, questionCount: counts[p.code] ?? 0 })) }, request);
  },
);
