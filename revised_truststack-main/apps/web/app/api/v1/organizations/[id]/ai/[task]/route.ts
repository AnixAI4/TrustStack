import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";
/** A model call runs in the request (§4.12): one minute at most. */
export const maxDuration = 60;

/**
 * POST /api/v1/organizations/{id}/ai/{task} — run one AI helper and keep its
 * answer as a draft for a person (ai.use + the task's read permission).
 * Stage 1b: `question_helper` and `evidence_helper` — { assessmentId, questionCode, ask? };
 * `gap_helper` — { assessmentId, gapId, ask? } or { actionId, ask? }; `score_helper` —
 * { assessmentId, domainCode, ask? }.
 */
export const POST = withApi(ai.run.options, ai.run.handler);
