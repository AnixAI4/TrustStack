import { withApi } from "@/lib/api/guard";
import { breaches } from "@/lib/breach/routes";

export const dynamic = "force-dynamic";

/**
 * GET   /api/v1/organizations/{id}/breaches/{breachId} — one incident (breach.read).
 * PATCH /api/v1/organizations/{id}/breaches/{breachId} — its narrative, its
 *       Rule 7 timeline (each fact stamped with who recorded it), the Board's
 *       extension and its lifecycle (breach.write).
 */
export const GET = withApi(breaches.read.options, breaches.read.handler);
export const PATCH = withApi(breaches.update.options, breaches.update.handler);
