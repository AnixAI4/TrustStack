import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/processors/{vendorId}/assessments/{assessmentId}/submit —
 *      submit for review: refused by the database unless every scored question is
 *      answered or marked not applicable, and the source is stated (vendor.assess).
 */
export const POST = withApi(processors.submit.options, processors.submit.handler);
