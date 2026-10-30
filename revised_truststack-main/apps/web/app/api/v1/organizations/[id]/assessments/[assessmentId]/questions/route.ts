import { withApi } from "@/lib/api/guard";
import { assessments } from "@/lib/assessments/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/assessments/{assessmentId}/questions — the snapshot. */
export const GET = withApi(assessments.questions.options, assessments.questions.handler);
