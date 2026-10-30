import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/dpdp-domains — the 16-domain model. Global reference data, but
 * only a member of some organisation may read it, so the permission is checked
 * against the active membership.
 */
export const GET = withApi(
  { auth: "required", tenant: "active", permission: "question.read" },
  async ({ request, supabase }) => {
    const { data, error } = await supabase
      .from("dpdp_domains")
      .select("code, domain_id, name, weight, default_applicability, default_owner, sort_order")
      .order("sort_order");
    if (error) throw error;

    const domains = (data ?? []).map((d) => ({
      code: d.code,
      domainId: d.domain_id,
      name: d.name,
      weight: Number(d.weight),
      defaultApplicability: d.default_applicability,
      defaultOwner: d.default_owner,
      sortOrder: d.sort_order,
    }));
    // Reported, not asserted: a 500 here would hide the model from the UI.
    // The migration, a constraint trigger, CI and a unit test all enforce it.
    const weightTotal = domains.reduce((sum, d) => sum + d.weight, 0);
    return ok({ domains, weightTotal }, request);
  },
);
