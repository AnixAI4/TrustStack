import { z } from "zod";
import { ApiError, rpcError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { deliverInvite } from "@/lib/invites/deliver";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/invites/{inviteId}/resend
 *
 * Only the token's hash is stored, so the old link cannot be re-sent. This
 * mints a new token, swaps the hash (the old link dies immediately), restarts
 * the 7-day expiry, and emails the new link.
 */
export const POST = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.users.invite" },
  async ({ request, supabase, organizationId, params, user, audit }) => {
    const inviteId = z.uuid().safeParse(params.inviteId);
    if (!inviteId.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid invitation id.", [{ field: "inviteId", issue: "must be a UUID" }]);
    }

    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);
    const { data, error } = await supabase
      .rpc("reissue_organization_invite", {
        p_organization_id: organizationId,
        p_invite_id: inviteId.data,
        p_token_hash: tokenHash,
      })
      .single();
    if (error) throw rpcError(error) ?? error;
    if (!data) throw new ApiError(404, "NOT_FOUND", "Invitation not found or already accepted.");

    const delivery = await deliverInvite({
      request,
      supabase,
      audit,
      organizationId,
      inviteId: data.invite_id,
      email: data.email,
      roleCode: data.role_code,
      rawToken: token,
      tokenHash,
      expiresAt: data.expires_at,
      inviter: user,
    });

    return ok(
      { invite: { id: data.invite_id, email: data.email, role: data.role_code, expiresAt: data.expires_at }, delivery },
      request,
    );
  },
);
