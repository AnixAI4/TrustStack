import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { APP_VERSION } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Public liveness probe — the ONLY declared-public route. Touches no database and no tenant data. */
export const GET = withApi({ auth: "public" }, ({ request }) =>
  ok({ status: "ok", version: APP_VERSION, timestamp: new Date().toISOString() }, request),
);
