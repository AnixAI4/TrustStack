import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/rights-requests/{requestId}/evidence/{evidenceId} — detach a document from a request. The artefact stays. */
export const DELETE = withApi(rights.unlinkEvidence.options, rights.unlinkEvidence.handler);
