import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/v1/organizations/{id}/retention-schedules/{scheduleId}/actions/{actionId}/evidence/{evidenceId}
 * — detach one artefact from a schedule's action. The artefact itself stays (D-042).
 */
export const DELETE = withApi(retention.unlinkActionEvidence.options, retention.unlinkActionEvidence.handler);
