import { assertActiveMembership } from "@truststack/core";
import { z } from "zod";
import { activeOrganizationCookie, encodeActiveOrganization } from "@/lib/auth/active-organization";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ organizationId: z.uuid() });

/**
 * POST /api/v1/auth/switch-organization — sets the signed active-org cookie.
 * Membership is verified here AND again on every later request (pitfall 7).
 * Rule 6(c): the switch is audited in the organisation being entered.
 */
export const POST = withApi(
  { auth: "required", body: bodySchema },
  async ({ request, supabase, user, memberships, activeOrganizationId, body, audit }) => {
    const target = assertActiveMembership(memberships, user.id, body.organizationId);

    const { data: organization, error } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", target.organizationId)
      .maybeSingle();
    if (error) throw error;
    if (!organization) throw new Error("membership without a visible organisation");

    const cookie = activeOrganizationCookie(encodeActiveOrganization(user.id, organization.id));

    await audit([
      {
        organizationId: organization.id,
        eventType: "auth.organization_switched",
        entityType: "organization",
        entityId: organization.id,
        description: "Switched active organisation",
        metadata: { from: activeOrganizationId },
      },
    ]);

    const response = ok({ organization: { id: organization.id, name: organization.name } }, request);
    response.cookies.set(cookie);
    return response;
  },
);
