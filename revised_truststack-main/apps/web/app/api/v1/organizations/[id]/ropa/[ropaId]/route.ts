import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/ropa/{ropaId} — one record, its links, evidence and gaps. */
export const GET = withApi(ropa.read.options, ropa.read.handler);

/**
 * PATCH /api/v1/organizations/{id}/ropa/{ropaId} — edit, link, and move
 * through the lifecycle. Approval needs a reviewer who is not the owner.
 */
export const PATCH = withApi(ropa.update.options, ropa.update.handler);

/** DELETE /api/v1/organizations/{id}/ropa/{ropaId} — ARCHIVES the record. Nothing is ever removed. */
export const DELETE = withApi(ropa.archive.options, ropa.archive.handler);
