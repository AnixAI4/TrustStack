import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/breaches/{breachId}/evidence/{evidenceId} — detach a document from a breach. The artefact stays. */
export const DELETE = withApi(breaches.unlinkEvidence.options, breaches.unlinkEvidence.handler);
