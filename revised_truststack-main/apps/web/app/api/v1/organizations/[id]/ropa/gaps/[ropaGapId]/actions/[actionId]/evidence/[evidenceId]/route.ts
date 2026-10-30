import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/ropa/gaps/{ropaGapId}/actions/{actionId}/evidence/{evidenceId} — detach evidence from a ROPA action. */
export const DELETE = withApi(ropa.unlinkActionEvidence.options, ropa.unlinkActionEvidence.handler);
