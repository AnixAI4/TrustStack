import { withApi } from "@/lib/api/guard";
import { gaps } from "@/lib/gaps/routes";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/organizations/{id}/assessments/{assessmentId}/gaps/{gapId}/actions/{actionId}/evidence/{evidenceId}
 * — detach a stored artefact from one action. The artefact is never deleted,
 * and no answer's score is re-derived.
 */
export const DELETE = withApi(gaps.unlinkEvidence.options, gaps.unlinkEvidence.handler);
