import { withApi } from "@/lib/api/guard";
import { responses } from "@/lib/assessments/responses";

export const dynamic = "force-dynamic";

/**
 * PUT /api/v1/organizations/{id}/assessments/{assessmentId}/responses/{questionCode}
 * Answer (claimed 0–5) or mark Not Applicable with a reason. The adjusted score
 * is computed by the database; the first answer moves a draft to in_progress (D-041).
 */
export const PUT = withApi(responses.put.options, responses.put.handler);
