import { withApi } from "@/lib/api/guard";
import { exposure } from "@/lib/exposure/read";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/exposure — the live DPDP exposure model
 * (Slice 9): per penalty head of the Schedule, whether it applies, its status,
 * an indicative position within the statutory ceiling and the reasons, plus
 * the headline ceilings at stake and the s.37 flag. Both caveats travel with
 * it. Reads only; the model is `exposureFor` in packages/core.
 */
export const GET = withApi(exposure.read.options, exposure.read.handler);
