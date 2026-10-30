import { withApi } from "@/lib/api/guard";
import { vendors } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** GET · POST /api/v1/organizations/{id}/vendors — shared register implementation (lib/scope/registers.ts). */
export const GET = withApi(vendors.list.options, vendors.list.handler);
export const POST = withApi(vendors.create.options, vendors.create.handler);
