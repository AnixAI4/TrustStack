import { withApi } from "@/lib/api/guard";
import { reports } from "@/lib/reports/routes";

export const dynamic = "force-dynamic";
/** Generation runs inside the request (decision 8); give it room on Vercel. */
export const maxDuration = 60;

/** POST /api/v1/organizations/{id}/reports/{reportId}/regenerate — a NEW version; the old one is never touched. */
export const POST = withApi(reports.regenerate.options, reports.regenerate.handler);
