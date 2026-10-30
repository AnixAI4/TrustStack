import { withApi } from "@/lib/api/guard";
import { reports } from "@/lib/reports/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/reports/{reportId} — one stored report's record. */
export const GET = withApi(reports.read.options, reports.read.handler);
