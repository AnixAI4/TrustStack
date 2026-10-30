import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/organizations/{id}/rights-requests — the rights and grievance
 *      register, each request with its response clock and actions, and the
 *      counts (rights.read).
 * POST /api/v1/organizations/{id}/rights-requests — record a Data Principal's
 *      request or grievance, as staff (rights.write). The code and the
 *      respond-by date are the database's.
 */
export const GET = withApi(rights.list.options, rights.list.handler);
export const POST = withApi(rights.create.options, rights.create.handler);
