import { withApi } from "@/lib/api/guard";
import { departments } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** PATCH · DELETE /api/v1/organizations/{id}/departments/{departmentId} — the child must belong to {id}, else 404. */
export const PATCH = withApi(departments.update.options, departments.update.handler);
export const DELETE = withApi(departments.remove.options, departments.remove.handler);
