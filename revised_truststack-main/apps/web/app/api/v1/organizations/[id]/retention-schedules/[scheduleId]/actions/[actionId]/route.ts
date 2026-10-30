import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/organizations/{id}/retention-schedules/{scheduleId}/actions/{actionId}
 * — the same action edit as every other parent's, on the same table, under the
 * same closing rule — plus the recorded erasure (D-056, D-095).
 */
export const PATCH = withApi(retention.updateAction.options, retention.updateAction.handler);
