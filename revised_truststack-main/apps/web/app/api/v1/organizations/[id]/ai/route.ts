import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/ai — whether the AI assistant can answer in
 * this organisation and, if not, why (kill switch, sector or SDF hold, or the
 * organisation's switch) (ai.use).
 */
export const GET = withApi(ai.status.options, ai.status.handler);
