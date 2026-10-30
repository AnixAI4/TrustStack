import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/ai/drafts/{draftId} — one draft and, once
 * accepted, the person's edited text: what the new-record form pre-fills from
 * (ai.use + the task's read permission, by RLS). Slice 11 Stage 2a (D-129).
 */
export const GET = withApi(ai.draft.options, ai.draft.handler);
