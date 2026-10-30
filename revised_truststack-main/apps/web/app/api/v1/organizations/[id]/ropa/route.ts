import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/ropa — the processing activity register, with its counts. */
export const GET = withApi(ropa.list.options, ropa.list.handler);

/** POST /api/v1/organizations/{id}/ropa — a new Draft record. Completeness and risk are derived by the database. */
export const POST = withApi(ropa.create.options, ropa.create.handler);
