import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/** POST /api/v1/vendor-links/{token}/confirm — the code; sets this browser's session (five wrong codes lock the link). */
export const POST = withApi(vendorLink.confirm.options, vendorLink.confirm.handler);
