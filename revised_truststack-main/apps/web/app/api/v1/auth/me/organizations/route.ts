import { ROLES } from "@truststack/core";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/** GET /api/v1/auth/me/organizations — organisations the caller is an ACTIVE member of. */
export const GET = withApi({ auth: "required" }, async ({ request, supabase, memberships, activeOrganizationId }) => {
  const active = memberships.filter((m) => m.status === "active");
  const ids = active.map((m) => m.organizationId);

  // RLS filters this too; the .in() list comes from the caller's own memberships.
  const { data, error } = ids.length
    ? await supabase.from("organizations").select("id, name, organization_type").in("id", ids)
    : { data: [], error: null };
  if (error) throw error;
  const byId = new Map((data ?? []).map((o) => [o.id, o]));

  return ok(
    {
      activeOrganizationId,
      organizations: active.flatMap((m) => {
        const org = byId.get(m.organizationId);
        return org
          ? [
              {
                id: org.id,
                name: org.name,
                organizationType: org.organization_type,
                role: m.roleCode,
                roleName: ROLES[m.roleCode].name,
                isActive: org.id === activeOrganizationId,
              },
            ]
          : [];
      }),
    },
    request,
  );
});
