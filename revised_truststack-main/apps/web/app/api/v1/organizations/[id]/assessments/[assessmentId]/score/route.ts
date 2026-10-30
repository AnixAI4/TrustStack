import { withApi } from "@/lib/api/guard";
import { score } from "@/lib/assessments/score";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/assessments/{assessmentId}/score — all
 * sixteen domains and the overall score. `?domain=GOV` narrows it to one.
 * A finalised assessment returns its stored snapshot, never a recomputation.
 */
export const GET = withApi(score.read.options, score.read.handler);
