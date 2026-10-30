import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/ropa/{ropaId}/evidence/{evidenceId} — detach an artefact from a record. The artefact stays. */
export const DELETE = withApi(ropa.unlinkEvidence.options, ropa.unlinkEvidence.handler);
