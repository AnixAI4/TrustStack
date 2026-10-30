import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/rights-requests/{requestId}/actions — add a
 * remedial action to a request or grievance, on the one action table
 * (rights.write + gap.write, D-067).
 */
export const POST = withApi(rights.addAction.options, rights.addAction.handler);
