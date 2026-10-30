import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/retention-schedules/{scheduleId}/actions — add
 * an action to a schedule whose erasure is owed, on the one action table
 * (retention.write + gap.write, D-067).
 */
export const POST = withApi(retention.addAction.options, retention.addAction.handler);
