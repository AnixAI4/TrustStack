import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { readPublicProfile } from "@/lib/intake/rpc";
import { refuse, slugOrNotFound } from "@/lib/intake/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/public/{slug} — the organisation's public header: its name and
 * its published Rule 9 contact. Nothing else, and never its id. An unknown
 * slug and a tenant without public pages answer the same 404 (D-084).
 */
export const GET = withApi({ auth: "public" }, async ({ request, params }) => {
  const organization = await readPublicProfile(slugOrNotFound(params.slug));
  if (!organization) return refuse(request, "not_found");
  return ok({ organization }, request);
});
