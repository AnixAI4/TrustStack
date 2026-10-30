import { withApi } from "@/lib/api/guard";
import { evidence } from "@/lib/evidence/routes";

export const dynamic = "force-dynamic";

/** PATCH /api/v1/organizations/{id}/evidence/{evidenceId}/review — evidence.review only, never the uploader (D-043). */
export const PATCH = withApi(evidence.review.options, evidence.review.handler);
