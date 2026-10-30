import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/processors/{vendorId} — one vendor: its contract, documents and every assessment version (organization.read). */
export const GET = withApi(processors.read.options, processors.read.handler);
