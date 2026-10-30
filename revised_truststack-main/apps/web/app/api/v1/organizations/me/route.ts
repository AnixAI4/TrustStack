import { withApi } from "@/lib/api/guard";
import { fail, ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/me — the caller's ACTIVE organisation.
 *
 * Two independent locks (D-003):
 *  1. API layer — the guard resolves the organisation from the signed active-org
 *     cookie and re-verifies membership before any row is read. Query params
 *     cannot choose the organisation (Slice 0B's `?organizationId=` is gone).
 *  2. RLS — the query runs as the caller, so a bug in (1) returns zero rows.
 */
export const GET = withApi(
  { auth: "required", tenant: "active", permission: "organization.read" },
  async ({ request, supabase, user, organizationId, membership }) => {
    const { data: organization, error } = await supabase
      .from("organizations")
      .select("id, name, legal_name, organization_type, industry_code, parent_organization_id, consultant_assisted")
      .eq("id", organizationId)
      .maybeSingle();
    if (error) throw error;
    if (!organization) {
      // Membership says yes but RLS says no (e.g. soft-deleted). Never leak which.
      return fail(403, "TENANT_ACCESS_DENIED", "You do not have access to this organisation.", request);
    }

    return ok(
      {
        organization: {
          id: organization.id,
          name: organization.name,
          legalName: organization.legal_name,
          organizationType: organization.organization_type,
          industryCode: organization.industry_code,
          parentOrganizationId: organization.parent_organization_id,
          consultantAssisted: organization.consultant_assisted,
        },
        user: { id: user.id, email: user.email, fullName: user.fullName },
        role: membership.roleCode,
      },
      request,
    );
  },
);
