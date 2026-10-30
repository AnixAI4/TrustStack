import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/**
 * GET   /api/v1/vendor-links/{token} — the link's header; the questionnaire once this
 *       browser entered the emailed code. Unknown, expired, revoked, used or locked:
 *       the same 404.
 * PATCH same — save answers, as the vendor's respondent (`answered_by` NULL).
 */
export const GET = withApi(vendorLink.view.options, vendorLink.view.handler);
export const PATCH = withApi(vendorLink.save.options, vendorLink.save.handler);
