import { withApi } from "@/lib/api/guard";
import { gaps } from "@/lib/gaps/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/organizations/{id}/assessments/{assessmentId}/gaps/{gapId}/actions/{actionId}
 * — owner, due date, status, notes. Closing needs reviewed evidence on the
 * action or a reviewer who is not its owner (D-056).
 */
export const PATCH = withApi(gaps.updateAction.options, gaps.updateAction.handler);
