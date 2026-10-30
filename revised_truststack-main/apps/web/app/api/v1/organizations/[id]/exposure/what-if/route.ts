import { withApi } from "@/lib/api/guard";
import { exposure } from "@/lib/exposure/read";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/exposure/what-if — `{ actionIds }` (≤ 50):
 * the exposure model and the forecast again, with those actions treated as
 * closed. READ-ONLY: it changes no action and stores nothing.
 */
export const POST = withApi(exposure.whatIf.options, exposure.whatIf.handler);
