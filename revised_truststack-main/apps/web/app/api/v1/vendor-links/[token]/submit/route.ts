import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/vendor-links/{token}/submit — submit for review with the signed
 * declaration. Refused unless complete; the link is then used up. Nothing counts
 * until someone in the organisation accepts it.
 */
export const POST = withApi(vendorLink.submit.options, vendorLink.submit.handler);
