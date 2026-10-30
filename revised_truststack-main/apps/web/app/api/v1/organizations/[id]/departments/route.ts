import { withApi } from "@/lib/api/guard";
import { departments } from "@/lib/scope/registers";

export const dynamic = "force-dynamic";

/** GET · POST /api/v1/organizations/{id}/departments — shared register implementation (lib/scope/registers.ts). */
export const GET = withApi(departments.list.options, departments.list.handler);
export const POST = withApi(departments.create.options, departments.create.handler);
