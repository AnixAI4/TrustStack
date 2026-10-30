import { withApi } from "@/lib/api/guard";
import { aiRisk } from "@/lib/ai-risk/routes";

export const dynamic = "force-dynamic";

/** DELETE /api/v1/organizations/{id}/ai-systems/{aiSystemId}/evidence/{evidenceId} — detach a document from an AI system. The artefact stays. */
export const DELETE = withApi(aiRisk.unlinkEvidence.options, aiRisk.unlinkEvidence.handler);
