import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * PATCH  /api/v1/organizations/{id}/consent-configs/{configId} — edit a draft widget version
 *        (consent.write), or publish it (`status: "published"`, consent.publish; its notice must be published).
 * DELETE /api/v1/organizations/{id}/consent-configs/{configId} — discard a draft (consent.write).
 */
export const PATCH = withApi(consent.updateConfig.options, consent.updateConfig.handler);
export const DELETE = withApi(consent.deleteConfig.options, consent.deleteConfig.handler);
