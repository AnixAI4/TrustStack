import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/ropa/export — the register as CSV. Audited every time. */
export const GET = withApi(ropa.export.options, ropa.export.handler);
