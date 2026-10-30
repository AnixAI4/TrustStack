import { withApi } from "@/lib/api/guard";
import { systems } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** PATCH · DELETE /api/v1/organizations/{id}/systems/{systemId} — the child must belong to {id}, else 404. */
export const PATCH = withApi(systems.update.options, systems.update.handler);
export const DELETE = withApi(systems.remove.options, systems.remove.handler);
