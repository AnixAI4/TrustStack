import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/**
 * GET    /api/v1/organizations/{id}/processors/{vendorId}/assessments/{assessmentId} — the questionnaire and its review (organization.read).
 * PATCH  …                                — save answers and where they came from; a draft or a returned assessment only (vendor.assess).
 * DELETE …                                — discard a draft or a returned assessment (vendor.assess).
 */
export const GET = withApi(processors.readAssessment.options, processors.readAssessment.handler);
export const PATCH = withApi(processors.save.options, processors.save.handler);
export const DELETE = withApi(processors.discard.options, processors.discard.handler);
