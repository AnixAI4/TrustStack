import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * GET   /api/v1/organizations/{id}/retention-schedules/{scheduleId} — one schedule (retention.read).
 * PATCH /api/v1/organizations/{id}/retention-schedules/{scheduleId} — what ends the
 *       retention, the period, the law, the start of the clock (retention.write).
 */
export const GET = withApi(retention.read.options, retention.read.handler);
export const PATCH = withApi(retention.update.options, retention.update.handler);
