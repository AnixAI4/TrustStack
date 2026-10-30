import { withApi } from "@/lib/api/guard";
import { vendorLinkStaff } from "@/lib/vendors/link";

export const dynamic = "force-dynamic";

/**
 * POST   /api/v1/organizations/{id}/processors/{vendorId}/assessments/{assessmentId}/link —
 *        email the vendor's respondent a link to answer it (vendor.assess; a draft or
 *        returned assessment; sending again revokes the last link). The sender may not
 *        review the vendor's answers (D-092).
 * DELETE same — revoke the open link; the answers it saved stay (vendor.assess).
 */
export const POST = withApi(vendorLinkStaff.send.options, vendorLinkStaff.send.handler);
export const DELETE = withApi(vendorLinkStaff.revoke.options, vendorLinkStaff.revoke.handler);
