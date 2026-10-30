import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/ropa/gaps — the ROPA-driven gaps and their actions (D-060). */
export const GET = withApi(ropa.gaps.options, ropa.gaps.handler);
