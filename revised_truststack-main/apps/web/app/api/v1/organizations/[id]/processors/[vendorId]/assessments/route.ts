import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/processors/{vendorId}/assessments — start the
 *      vendor's next assessment version, a draft carrying forward the answers of
 *      its latest accepted one (vendor.assess).
 */
export const POST = withApi(processors.start.options, processors.start.handler);
