import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/rights-requests/{requestId}/sharing — for an
 *     access request, who the organisation shared personal data with and the
 *     kinds of data, from the processing register (s.11(1)(b), D-139; rights.read).
 */
export const GET = withApi(rights.sharing.options, rights.sharing.handler);
