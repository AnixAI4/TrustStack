import { withApi } from "@/lib/api/guard";
import { assessments } from "@/lib/assessments/routes";

export const dynamic = "force-dynamic";

/** GET · POST /api/v1/organizations/{id}/assessments */
export const GET = withApi(assessments.list.options, assessments.list.handler);
export const POST = withApi(assessments.create.options, assessments.create.handler);
