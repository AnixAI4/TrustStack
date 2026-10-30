import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/ai/drafts?targetId=…[&task=…][&status=…] — the
 * drafts about one breach or request, newest first: the accepted Rule 7(2)
 * intimation on the breach's step, the accepted response letter on the request's
 * (ai.use + the task's read permission, by RLS). Slice 11 Stage 2a (D-129).
 */
export const GET = withApi(ai.drafts.options, ai.drafts.handler);
