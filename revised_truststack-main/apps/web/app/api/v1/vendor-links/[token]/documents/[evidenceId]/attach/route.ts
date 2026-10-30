import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/** POST /api/v1/vendor-links/{token}/documents/{evidenceId}/attach — the upload finished: attach it to the vendor, pending review. */
export const POST = withApi(vendorLink.attach.options, vendorLink.attach.handler);
