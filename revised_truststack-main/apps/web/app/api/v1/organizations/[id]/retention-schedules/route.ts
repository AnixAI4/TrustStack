import { withApi } from "@/lib/api/guard";
import { retention } from "@/lib/retention/routes";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/organizations/{id}/retention-schedules — the retention register,
 *      each schedule with its derived end date, erasures, documents and actions,
 *      and the counts (retention.read).
 * POST /api/v1/organizations/{id}/retention-schedules — a schedule for one
 *      processing activity (retention.write). The end date is the database's.
 */
export const GET = withApi(retention.list.options, retention.list.handler);
export const POST = withApi(retention.create.options, retention.create.handler);
