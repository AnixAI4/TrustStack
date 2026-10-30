import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/organizations/{id}/rights-requests/{requestId}/actions/{actionId}
 * — the same action edit as every other parent's, on the same table, under
 * the same closing rule (D-056).
 */
export const PATCH = withApi(rights.updateAction.options, rights.updateAction.handler);
