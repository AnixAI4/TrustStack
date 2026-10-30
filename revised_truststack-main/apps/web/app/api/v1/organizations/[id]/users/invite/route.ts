import { assertCanAssignRole, ROLE_CODES } from "@truststack/core";
import { z } from "zod";
import { ApiError, rpcError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { deliverInvite } from "@/lib/invites/deliver";
import { generateInviteToken, hashInviteToken } from "@/lib/invites/token";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.email().max(254).transform((e) => e.trim().toLowerCase()),
  role: z.enum(ROLE_CODES),
});

/**
 * POST /api/v1/organizations/{id}/users/invite
 *
 * Creates the invite (RPC re-checks permission, escalation and membership, and
 * audits), then EMAILS the link to the invitee. The link is never returned to
 * the inviter (D-025) — only the invitee's mailbox can use it. The database
 * only ever sees the token's SHA-256.
 */
export const POST = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.users.invite", body: bodySchema },
  async ({ request, supabase, organizationId, permissions, body, user, audit }) => {
    assertCanAssignRole(permissions, body.role);

    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);
    const { data, error } = await supabase
      .rpc("create_organization_invite", {
        p_organization_id: organizationId,
        p_email: body.email,
        p_role_code: body.role,
        p_token_hash: tokenHash,
      })
      .single();
    if (error) throw rpcError(error) ?? error;
    if (!data) throw new ApiError(500, "INTERNAL_ERROR", "Invite was not created.");

    const delivery = await deliverInvite({
      request,
      supabase,
      audit,
      organizationId,
      inviteId: data.invite_id,
      email: body.email,
      roleCode: body.role,
      rawToken: token,
      tokenHash,
      expiresAt: data.expires_at,
      inviter: user,
    });

    return ok(
      { invite: { id: data.invite_id, email: body.email, role: body.role, expiresAt: data.expires_at }, delivery },
      request,
      { status: 201 },
    );
  },
);
