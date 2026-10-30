import { withApi } from "@/lib/api/guard";
import { reports } from "@/lib/reports/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/reports/{reportId}/download-url — 60-second signed URL, audited every time. */
export const GET = withApi(reports.downloadUrl.options, reports.downloadUrl.handler);
