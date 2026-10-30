import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/consent-configs — a new DRAFT widget version
 *      citing a notice of this organisation, offering only its purposes (consent.write).
 */
export const POST = withApi(consent.createConfig.options, consent.createConfig.handler);
