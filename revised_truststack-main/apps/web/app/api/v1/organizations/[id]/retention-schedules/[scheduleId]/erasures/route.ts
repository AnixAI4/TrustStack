import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/retention-schedules/{scheduleId}/erasures —
 * record an erasure (s.8(7)): when, how, and whether the processors were told.
 * Recorded once and never changed; who recorded it is stamped (retention.write).
 */
export const POST = withApi(retention.recordErasure.options, retention.recordErasure.handler);
