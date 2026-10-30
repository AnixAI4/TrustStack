import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/consent-records/lookup — one person's consent
 *      history, newest first, found by the identifier the organisation holds
 *      (consent.read). POST, so the identifier never travels in a URL.
 */
export const POST = withApi(consent.lookup.options, consent.lookup.handler);
