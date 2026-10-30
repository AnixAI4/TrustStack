import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hashInviteToken, INVITE_TOKEN_PATTERN } from "./token";

export type InviteLookup =
  | { state: "invalid" }
  | { state: "expired" }
  | {
      state: "open";
      id: string;
      organizationId: string;
      organizationName: string;
      email: string;
      roleCode: string;
      roleName: string;
      expiresAt: string;
    };

/**
 * Looks up ONE invitation by the hash of a raw token, BEFORE the caller is
 * authenticated. Service role is required: the invitee is not yet a user, so
 * no JWT exists for RLS to evaluate (D-022). Scope is exactly one row keyed by
 * a 256-bit secret the caller already holds — nothing is enumerable.
 */
export async function lookupInvite(rawToken: string): Promise<InviteLookup> {
  if (!INVITE_TOKEN_PATTERN.test(rawToken)) return { state: "invalid" };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("organization_invites")
    .select("id, organization_id, email, expires_at, accepted_at, organizations(name), roles(code, name)")
    .eq("token_hash", hashInviteToken(rawToken))
    .maybeSingle();
  if (error) throw new Error(`invite lookup failed: ${error.message}`);

  if (!data || data.accepted_at) return { state: "invalid" };
  if (Date.parse(data.expires_at) <= Date.now()) return { state: "expired" };

  return {
    state: "open",
    id: data.id,
    organizationId: data.organization_id,
    organizationName: data.organizations?.name ?? "",
    email: data.email,
    roleCode: data.roles?.code ?? "",
    roleName: data.roles?.name ?? "",
    expiresAt: data.expires_at,
  };
}

/**
 * Creates the invitee's Auth user, already confirmed. Holding an open invite
 * token is the proof of email control here (D-022), so Supabase's confirmation
 * email is skipped. Returns "exists" if the email already has an account —
 * that person must sign in and accept instead.
 */
export async function createInvitedAuthUser(
  email: string,
  password: string,
  fullName: string | undefined,
): Promise<"created" | "exists"> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : {},
  });
  if (!error) return "created";
  if (error.code === "email_exists" || /already (been )?registered/i.test(error.message)) return "exists";
  throw new Error(`could not create invited user: ${error.message}`);
}
