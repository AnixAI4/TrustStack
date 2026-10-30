import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** POST /api/v1/organizations/{id}/ropa/gaps/generate — derive the ROPA gaps from the register, in SQL. */
export const POST = withApi(ropa.generateGaps.options, ropa.generateGaps.handler);
