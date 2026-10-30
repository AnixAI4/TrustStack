import { withApi } from "@/lib/api/guard";
import { vendorLink } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/** POST /api/v1/vendor-links/{token}/documents — register a document and return its signed upload URL (at most ten per link). */
export const POST = withApi(vendorLink.addDocument.options, vendorLink.addDocument.handler);
