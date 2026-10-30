import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/ai/drafts/{draftId}/accept — `{ output }`, the
 * person's edited draft: kept on the draft row, once, by a holder of the
 * register's write permission (D-129.3). Writes NO register row — the page
 * pre-fills the register's own form and the person saves. Slice 11 Stage 2a.
 */
export const POST = withApi(ai.accept.options, ai.accept.handler);
