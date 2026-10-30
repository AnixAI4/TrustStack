import { withApi } from "@/lib/api/guard";
import { evidence } from "@/lib/evidence/routes";

export const dynamic = "force-dynamic";

/** POST /api/v1/organizations/{id}/evidence/{evidenceId}/link — attach a STORED artefact to an answer. */
export const POST = withApi(evidence.link.options, evidence.link.handler);
