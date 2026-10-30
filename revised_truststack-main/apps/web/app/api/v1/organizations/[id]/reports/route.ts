import { withApi } from "@/lib/api/guard";
import { reports } from "@/lib/reports/routes";

export const dynamic = "force-dynamic";
/** Generation runs inside the request (decision 8); give it room on Vercel. */
export const maxDuration = 60;

/** GET /api/v1/organizations/{id}/reports — the stored reports, newest first, every version. */
export const GET = withApi(reports.list.options, reports.list.handler);

/** POST /api/v1/organizations/{id}/reports — generate one; an exposure report records a fresh snapshot first. */
export const POST = withApi(reports.create.options, reports.create.handler);
