import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/organizations/{id}/breaches — the breach register, each incident
 *      with its Rule 7 clock and actions, and the counts (breach.read).
 * POST /api/v1/organizations/{id}/breaches — record a personal data breach
 *      (breach.write). The code and the Board report's due time are the database's.
 */
export const GET = withApi(breaches.list.options, breaches.list.handler);
export const POST = withApi(breaches.create.options, breaches.create.handler);
