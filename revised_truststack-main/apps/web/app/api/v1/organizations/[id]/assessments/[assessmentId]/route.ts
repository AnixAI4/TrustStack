import { withApi } from "@/lib/api/guard";
import { assessments } from "@/lib/assessments/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/assessments/{assessmentId} — 404 if it is not {id}'s. */
export const GET = withApi(assessments.read.options, assessments.read.handler);
