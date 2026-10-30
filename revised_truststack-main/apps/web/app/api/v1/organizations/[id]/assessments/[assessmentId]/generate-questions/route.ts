import { withApi } from "@/lib/api/guard";
import { assessments } from "@/lib/assessments/routes";

export const dynamic = "force-dynamic";

/** POST /api/v1/organizations/{id}/assessments/{assessmentId}/generate-questions — drafts only. */
export const POST = withApi(assessments.generate.options, assessments.generate.handler);
