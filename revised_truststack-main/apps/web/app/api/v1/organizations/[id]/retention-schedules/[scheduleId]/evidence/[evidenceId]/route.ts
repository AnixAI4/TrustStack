import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/retention-schedules/{scheduleId}/evidence/{evidenceId} — detach a document from a schedule. The artefact stays. */
export const DELETE = withApi(retention.unlinkEvidence.options, retention.unlinkEvidence.handler);
