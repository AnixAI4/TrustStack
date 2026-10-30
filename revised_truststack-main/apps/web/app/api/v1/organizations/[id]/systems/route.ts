import { withApi } from "@/lib/api/guard";
import { systems } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** GET · POST /api/v1/organizations/{id}/systems — shared register implementation (lib/scope/registers.ts). */
export const GET = withApi(systems.list.options, systems.list.handler);
export const POST = withApi(systems.create.options, systems.create.handler);
