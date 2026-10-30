import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/** POST /api/v1/vendor-links/{token}/code — email a one-time code to the address the link was sent to (the public intake's limits). */
export const POST = withApi(vendorLink.sendCode.options, vendorLink.sendCode.handler);
