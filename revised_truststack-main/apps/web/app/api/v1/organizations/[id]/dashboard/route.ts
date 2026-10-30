import { withApi } from "@/lib/api/guard";
import { dashboard } from "@/lib/dashboard/read";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/dashboard — the overview in one request: the
 * readiness score (frozen and provisional, never blended), the actions owed
 * across BOTH the assessment and the processing register, and the register's
 * counts. Each section is omitted, never errored, when the caller lacks its
 * permission. Reads only; adds no arithmetic of its own.
 */
export const GET = withApi(dashboard.read.options, dashboard.read.handler);
