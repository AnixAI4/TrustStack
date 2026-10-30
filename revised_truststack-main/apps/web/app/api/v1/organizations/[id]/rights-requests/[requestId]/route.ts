import { withApi } from "@/lib/api/guard";
import { rights } from "@/lib/rights/routes";

export const dynamic = "force-dynamic";

/**
 * GET   /api/v1/organizations/{id}/rights-requests/{requestId} — one request (rights.read).
 * PATCH /api/v1/organizations/{id}/rights-requests/{requestId} — its details,
 *       the identity check, the response and its lifecycle, each recorded fact
 *       stamped with who recorded it (rights.write).
 */
export const GET = withApi(rights.read.options, rights.read.handler);
export const PATCH = withApi(rights.update.options, rights.update.handler);
