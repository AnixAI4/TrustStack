import { withApi } from "@/lib/api/guard";
import { evidence } from "@/lib/evidence/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/evidence/{evidenceId}/download-url — 60-second signed URL, audited every time. */
export const GET = withApi(evidence.downloadUrl.options, evidence.downloadUrl.handler);
