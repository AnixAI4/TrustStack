import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/ai/drafts/{draftId}/discard — once, by a holder
 * of the register's write permission (D-129.3). Slice 11 Stage 2a.
 */
export const POST = withApi(ai.discard.options, ai.discard.handler);
