import { withApi } from "@/lib/api/guard";
import { reports } from "@/lib/reports/routes";

export const dynamic = "force-dynamic";
/** Rendering runs inside the request (decision 8); give it room on Vercel. */
export const maxDuration = 60;

/** POST /api/v1/organizations/{id}/reports/{reportId}/narrate — version N's figures with an accepted narrative, as version N+1 (D-133.1). */
export const POST = withApi(reports.narrate.options, reports.narrate.handler);
