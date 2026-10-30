import { withApi } from "@/lib/api/guard";
import { dataPrincipalTypes } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** PATCH · DELETE /api/v1/organizations/{id}/data-principal-types/{dataPrincipalTypeId} — the child must belong to {id}, else 404. */
export const PATCH = withApi(dataPrincipalTypes.update.options, dataPrincipalTypes.update.handler);
export const DELETE = withApi(dataPrincipalTypes.remove.options, dataPrincipalTypes.remove.handler);
