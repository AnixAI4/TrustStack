import { withApi } from "@/lib/api/guard";
import { processors } from "@/lib/vendors/routes";

export const dynamic = "force-dynamic";

/** GET /api/v1/organizations/{id}/processors — the processor register: every vendor, its contract, documents and assessments, with counts (organization.read). */
export const GET = withApi(processors.register.options, processors.register.handler);
