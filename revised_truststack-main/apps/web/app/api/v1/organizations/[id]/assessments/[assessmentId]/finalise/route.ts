import { withApi } from "@/lib/api/guard";
import { score } from "@/lib/assessments/score";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/assessments/{assessmentId}/finalise —
 * freeze an immutable score snapshot. 409 with the outstanding count while
 * any question is unanswered (D-041).
 */
export const POST = withApi(score.finalise.options, score.finalise.handler);
