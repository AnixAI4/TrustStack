import {
  assertCanAssignRole,
  assertNotSelfDemotion,
  isRoleCode,
  ROLE_CODES,
} from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    role: z.enum(ROLE_CODES).optional(),
    status: z.enum(["active", "suspended"]).optional(),
  })
  .refine((b) => b.role !== undefined || b.status !== undefined, { message: "Provide role and/or status." });

/**
 * PATCH /api/v1/organizations/{id}/users/{userId} — change a member's role or status.
 * Checked here with packages/core, then again inside the RPC (two locks, D-003).
 */
export const PATCH = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.users.update", body: bodySchema },
  async ({ request, supabase, organizationId, user, permissions, params, body }) => {
    const targetUserId = z.uuid().safeParse(params.userId);
    if (!targetUserId.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid user id.", [{ field: "userId", issue: "must be a UUID" }]);
    }

    const { data: rows, error } = await supabase
      .from("organization_users")
      .select("user_id, status, roles(code)")
      .eq("organization_id", organizationId);
    if (error) throw error;

    const target = rows?.find((r) => r.user_id === targetUserId.data);
    const targetRole = target?.roles?.code;
    if (!target || !targetRole || !isRoleCode(targetRole)) {
      throw new ApiError(404, "NOT_FOUND", "Member not found.");
    }

    assertCanAssignRole(permissions, targetRole);
    if (body.role) assertCanAssignRole(permissions, body.role);

    const activeAdmins = (rows ?? []).filter((r) => r.roles?.code === "organization_admin" && r.status === "active").length;
    assertNotSelfDemotion(
      { userId: user.id },
      { userId: target.user_id, roleCode: targetRole, status: target.status as "active" | "invited" | "suspended" },
      { roleCode: body.role, status: body.status },
      activeAdmins,
    );

    const { data, error: rpcFailure } = await supabase
      .rpc("update_organization_member", {
        p_organization_id: organizationId,
        p_user_id: target.user_id,
        p_role_code: body.role,
        p_status: body.status,
      })
      .single();
    if (rpcFailure) throw rpcError(rpcFailure) ?? rpcFailure;

    return ok({ member: { userId: target.user_id, role: data?.role_code, status: data?.status } }, request);
  },
);
