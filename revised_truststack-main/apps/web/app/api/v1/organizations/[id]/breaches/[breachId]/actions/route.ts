import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/breaches/{breachId}/actions — add a remedial
 * action to a breach, on the one action table (breach.write + gap.write, D-067).
 */
export const POST = withApi(breaches.addAction.options, breaches.addAction.handler);
