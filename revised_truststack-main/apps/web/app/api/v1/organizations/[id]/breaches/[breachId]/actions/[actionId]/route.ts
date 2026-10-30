import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/organizations/{id}/breaches/{breachId}/actions/{actionId}
 * — the same action edit as every other parent's, on the same table, under
 * the same closing rule (D-056).
 */
export const PATCH = withApi(breaches.updateAction.options, breaches.updateAction.handler);
