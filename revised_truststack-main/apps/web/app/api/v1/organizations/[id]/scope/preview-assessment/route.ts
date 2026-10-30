import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { loadScopeState, previewFor } from "@/lib/scope/risk";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/scope/preview-assessment
 *
 * Read-only: derives risk tags (with reasons) and the question packs from the
 * CURRENT answers and registers. No writes. Slice 3 turns pack codes into questions.
 * The pack codes are Anix's working detail (D-068, D-071): only a caller with
 * `question.read_bank` receives `questionPacks`.
 */
export const POST = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.read" },
  async ({ request, supabase, organizationId, permissions }) => {
    const state = await loadScopeState(supabase, organizationId);
    return ok({ organizationId, ...previewFor(state, permissions) }, request);
  },
);
