import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/privacy-notices — a new DRAFT of the privacy
 *      notice in one language (consent.write). The version is the database's;
 *      one draft at a time per language.
 */
export const POST = withApi(consent.createNotice.options, consent.createNotice.handler);
