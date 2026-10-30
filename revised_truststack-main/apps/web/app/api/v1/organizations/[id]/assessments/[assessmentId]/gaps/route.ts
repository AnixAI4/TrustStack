import { withApi } from "@/lib/api/guard";
import { gaps } from "@/lib/gaps/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/assessments/{assessmentId}/gaps — the gap
 * register with each gap's remediation action, its evidence, and whether the
 * register is still in step with the answers.
 */
export const GET = withApi(gaps.list.options, gaps.list.handler);
