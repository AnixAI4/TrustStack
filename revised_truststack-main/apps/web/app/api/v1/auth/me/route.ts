import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";

export const dynamic = "force-dynamic";

/** GET /api/v1/auth/me — the signed-in user and their active organisation id. */
export const GET = withApi({ auth: "required" }, ({ request, user, activeOrganizationId }) =>
  ok({ user, activeOrganizationId }, request),
);
