import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/organizations/{id}/breaches/{breachId}/actions/{actionId}/evidence/{evidenceId}
 * — detach one artefact from a breach's action. The artefact itself stays (D-042).
 */
export const DELETE = withApi(breaches.unlinkActionEvidence.options, breaches.unlinkActionEvidence.handler);
