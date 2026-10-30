import { withApi } from "@/lib/api/guard";
import { dataPrincipalTypes } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** GET · POST /api/v1/organizations/{id}/data-principal-types — shared register implementation (lib/scope/registers.ts). */
export const GET = withApi(dataPrincipalTypes.list.options, dataPrincipalTypes.list.handler);
export const POST = withApi(dataPrincipalTypes.create.options, dataPrincipalTypes.create.handler);
