import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/processors/{vendorId}/assessments/{assessmentId}/review —
 *      accept it (it counts, is frozen, and is current until its review-by date)
 *      or return it with a reason (vendor.review; never anyone who entered it).
 */
export const POST = withApi(processors.review.options, processors.review.handler);
