import { z } from "zod";
import { activeOrganizationCookie, encodeActiveOrganization } from "@/lib/auth/active-organization";
import { ApiError, rpcError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { createInvitedAuthUser, lookupInvite } from "@/lib/invites/lookup";
import { hashInviteToken, INVITE_TOKEN_PATTERN } from "@/lib/invites/token";
import { createSupabaseServerClient, type AppSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  token: z.string().regex(INVITE_TOKEN_PATTERN, "Invalid invitation token."),
  /** Only when signed out and creating an account. */
  password: z.string().min(12, "Use at least 12 characters.").max(128).optional(),
  fullName: z.string().trim().min(1).max(200).optional(),
});

/**
 * POST /api/v1/invites/accept
 *
 *  - Signed in  → accept as the caller (their email must match the invite).
 *  - Signed out → with `password`, create the invitee's confirmed account,
 *    sign them in, then accept as them (D-022).
 *
 * Either way the membership and its audit row are written by the SECURITY
 * DEFINER RPC running AS the invitee — the only way a not-yet-member can join.
 */
export const POST = withApi({ auth: "optional", body: bodySchema }, async (ctx) => {
  const { request, body } = ctx;
  let supabase: AppSupabaseClient;
  let authUserId: string;

  if (ctx.authUser) {
    supabase = ctx.supabase;
    authUserId = ctx.authUser.id;
  } else {
    const invite = await lookupInvite(body.token);
    if (invite.state === "invalid") {
      throw new ApiError(404, "INVITE_INVALID", "This invitation is not valid or has already been used.");
    }
    if (invite.state === "expired") {
      throw new ApiError(410, "INVITE_EXPIRED", "This invitation has expired. Ask for a new one.");
    }
    if (!body.password) {
      throw new ApiError(401, "UNAUTHENTICATED", "Sign in, or choose a password to create your account.");
    }
    if ((await createInvitedAuthUser(invite.email, body.password, body.fullName)) === "exists") {
      throw new ApiError(409, "CONFLICT", "An account already exists for this email. Sign in to accept.");
    }

    supabase = await createSupabaseServerClient(); // sets the session cookies on this response
    const { data: session, error } = await supabase.auth.signInWithPassword({
      email: invite.email,
      password: body.password,
    });
    if (error || !session.user) throw new Error(`sign-in after account creation failed: ${error?.message}`);
    authUserId = session.user.id;
  }

  const { data, error } = await supabase
    .rpc("accept_organization_invite", { p_token_hash: hashInviteToken(body.token) })
    .single();
  if (error) {
    const mapped = rpcError(error);
    if (mapped?.code === "NOT_FOUND") throw new ApiError(404, "INVITE_INVALID", mapped.message);
    throw mapped ?? error;
  }
  if (!data) throw new Error("accept returned no row");

  // Land the new member in the organisation they just joined.
  const { data: me } = await supabase.from("users").select("id").eq("auth_provider_user_id", authUserId).maybeSingle();
  const response = ok({ organizationId: data.organization_id, role: data.role_code }, request);
  if (me) {
    try {
      response.cookies.set(activeOrganizationCookie(encodeActiveOrganization(me.id, data.organization_id)));
    } catch {
      // No cookie secret configured: the guard falls back to the first membership.
    }
  }
  return response;
});
