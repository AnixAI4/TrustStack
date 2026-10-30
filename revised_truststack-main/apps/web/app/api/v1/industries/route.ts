import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/industries — global reference data (not tenant-scoped). The
 * overlay pack each industry maps to is Anix's working detail; the column is
 * not granted to client roles at all (D-071).
 */
export const GET = withApi({ auth: "required" }, async ({ request, supabase }) => {
  const { data, error } = await supabase.from("industries").select("code, name").order("name");
  if (error) throw error;
  return ok({ industries: (data ?? []).map((i) => ({ code: i.code, name: i.name })) }, request);
});
