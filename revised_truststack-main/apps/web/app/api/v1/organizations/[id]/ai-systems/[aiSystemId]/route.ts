import { withApi } from "@/lib/api/guard";
import { aiRisk } from "@/lib/ai-risk/routes";

export const dynamic = "force-dynamic";

/**
 * GET   /api/v1/organizations/{id}/ai-systems/{aiSystemId} — one row (organization.read).
 * PATCH /api/v1/organizations/{id}/ai-systems/{aiSystemId} — its details, its status
 *       and its last review; a recorded review is corrected, never removed (ropa.write).
 */
export const GET = withApi(aiRisk.read.options, aiRisk.read.handler);
export const PATCH = withApi(aiRisk.update.options, aiRisk.update.handler);
