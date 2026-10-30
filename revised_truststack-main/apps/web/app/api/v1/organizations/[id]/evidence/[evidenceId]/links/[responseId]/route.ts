import { withApi } from "@/lib/api/guard";
import { evidence } from "@/lib/evidence/routes";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/organizations/{id}/evidence/{evidenceId}/links/{responseId}
 * — detach a stored artefact from one answer, which re-derives that answer's
 * evidence level and adjusted score. The artefact itself is never deleted.
 */
export const DELETE = withApi(evidence.unlink.options, evidence.unlink.handler);
