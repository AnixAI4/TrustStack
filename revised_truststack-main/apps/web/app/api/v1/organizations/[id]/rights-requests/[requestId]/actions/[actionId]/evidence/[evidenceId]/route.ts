import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/organizations/{id}/rights-requests/{requestId}/actions/{actionId}/evidence/{evidenceId}
 * — detach one artefact from a request's action. The artefact itself stays (D-042).
 */
export const DELETE = withApi(rights.unlinkActionEvidence.options, rights.unlinkActionEvidence.handler);
