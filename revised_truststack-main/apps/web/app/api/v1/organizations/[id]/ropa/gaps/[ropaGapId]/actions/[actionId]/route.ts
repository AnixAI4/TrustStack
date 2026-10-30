import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/organizations/{id}/ropa/gaps/{ropaGapId}/actions/{actionId}
 * — the same action edit as an assessment gap's, on the same table, under
 * the same closing rule (D-056, D-060).
 */
export const PATCH = withApi(ropa.updateAction.options, ropa.updateAction.handler);
