import { withApi } from "@/lib/api/guard";
import { gaps } from "@/lib/gaps/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/assessments/{assessmentId}/gaps/generate —
 * derive the gap register from the stored adjusted scores. Takes no body:
 * a gap is never hand-written. 409 once the assessment is finalised.
 */
export const POST = withApi(gaps.generate.options, gaps.generate.handler);
