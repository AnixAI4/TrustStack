import { withApi } from "@/lib/api/guard";
import { evidence } from "@/lib/evidence/routes";

export const dynamic = "force-dynamic";

/** POST /api/v1/organizations/{id}/evidence/upload-url — registers the artefact and returns a signed upload URL (audited). */
export const POST = withApi(evidence.uploadUrl.options, evidence.uploadUrl.handler);
