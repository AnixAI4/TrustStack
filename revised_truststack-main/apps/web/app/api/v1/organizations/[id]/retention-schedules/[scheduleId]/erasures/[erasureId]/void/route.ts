import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/retention-schedules/{scheduleId}/erasures/{erasureId}/void —
 * mark an erasure as recorded in error (D-096): once, with a reason, by someone
 * other than the person who recorded it. The erasure stays; it no longer
 * counts (retention.write).
 */
export const POST = withApi(retention.voidErasure.options, retention.voidErasure.handler);
