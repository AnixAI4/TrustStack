import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/consent — the privacy notices, the consent
 *     widget's versions, the counts over every principal's latest consent and
 *     the latest records (consent.read).
 */
export const GET = withApi(consent.register.options, consent.register.handler);
