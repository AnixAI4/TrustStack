import { withApi } from "@/lib/api/guard";
import { responses } from "@/lib/assessments/responses";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/assessments/{assessmentId}/responses — answers with their linked evidence. */
export const GET = withApi(responses.list.options, responses.list.handler);
