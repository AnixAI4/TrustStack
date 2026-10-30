import { withApi } from "@/lib/api/guard";
import { aiRisk } from "@/lib/ai-risk/routes";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/organizations/{id}/ai-systems — the AI risk register and the
 *      scope's systems a row may name (organization.read).
 * POST /api/v1/organizations/{id}/ai-systems — add an AI system or AI use
 *      (ropa.write, D-094.2). Enabling, never a status (D-073).
 */
export const GET = withApi(aiRisk.list.options, aiRisk.list.handler);
export const POST = withApi(aiRisk.create.options, aiRisk.create.handler);
