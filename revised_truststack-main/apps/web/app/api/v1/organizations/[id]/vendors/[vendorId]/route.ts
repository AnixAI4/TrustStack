import { withApi } from "@/lib/api/guard";
import { vendors } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** PATCH · DELETE /api/v1/organizations/{id}/vendors/{vendorId} — the child must belong to {id}, else 404. */
export const PATCH = withApi(vendors.update.options, vendors.update.handler);
export const DELETE = withApi(vendors.remove.options, vendors.remove.handler);
