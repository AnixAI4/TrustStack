import { isRoleCode, ROLES } from "@truststack/core";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/users — members, plus pending invites for those allowed to see them. */
export const GET = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.users.read" },
  async ({ request, supabase, organizationId, permissions }) => {
    const { data: members, error } = await supabase
      .from("organization_users")
      .select(
        "user_id, status, department_id, joined_at, created_at, roles(code), users!organization_users_user_id_fkey(email, full_name)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    let invites: { id: string; email: string; role: string; expiresAt: string }[] = [];
    if (permissions.has("organization.users.invite")) {
      const { data, error: inviteError } = await supabase
        .from("organization_invites")
        .select("id, email, expires_at, roles(code)")
        .eq("organization_id", organizationId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (inviteError) throw inviteError;
      invites = (data ?? []).map((i) => ({ id: i.id, email: i.email, role: i.roles?.code ?? "", expiresAt: i.expires_at }));
    }

    return ok(
      {
        organizationId,
        members: (members ?? []).map((m) => {
          const role = m.roles?.code ?? "";
          return {
            userId: m.user_id,
            email: m.users?.email ?? null,
            fullName: m.users?.full_name ?? null,
            role,
            roleName: isRoleCode(role) ? ROLES[role].name : role,
            status: m.status,
            departmentId: m.department_id,
            joinedAt: m.joined_at,
          };
        }),
        invites,
      },
      request,
    );
  },
);
