import { PERMISSION_CODES, ROLES } from "@truststack/core";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/me/permissions — permissions in the ACTIVE organisation.
 * Feeds the UI's <Can> wrapper. Hiding a button is not access control: every
 * route re-checks on the server (pitfall 6).
 */
export const GET = withApi(
  { auth: "required", tenant: "active" },
  ({ request, organizationId, membership, permissions }) =>
    ok(
      {
        organizationId,
        role: membership.roleCode,
        roleName: ROLES[membership.roleCode].name,
        permissions: PERMISSION_CODES.filter((p) => permissions.has(p)),
      },
      request,
    ),
);
