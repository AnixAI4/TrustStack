import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/consent-records — record a choice as staff
 *      (a paper form, a counter), or how a parent or guardian was verified, as
 *      a NEW record (consent.write). The identifier is hashed by the database
 *      and never stored; the record is never changed.
 */
export const POST = withApi(consent.record.options, consent.record.handler);
