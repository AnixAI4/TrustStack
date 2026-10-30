import { withApi } from "@/lib/api/guard";
import { ai } from "@/lib/ai/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/ai/drafts/{draftId}/feedback — thumbs up or
 * down on an AI answer, with an optional comment (≤ 500, scrubbed): once, by the
 * person who asked (ai.use + the task's read permission). Slice 11 Stage 1b.
 */
export const POST = withApi(ai.feedback.options, ai.feedback.handler);
