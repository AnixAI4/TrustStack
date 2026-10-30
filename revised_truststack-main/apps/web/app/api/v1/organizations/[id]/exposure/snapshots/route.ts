import { withApi } from "@/lib/api/guard";
import { exposureSnapshots } from "@/lib/exposure/snapshots";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/organizations/{id}/exposure/snapshots — exposure history, newest
 *      first: the headline and each head's status and band (score.read).
 * POST /api/v1/organizations/{id}/exposure/snapshots — record one now
 *      (score.calculate). No body: every value is derived in SQL by
 *      `record_exposure_snapshot`, the mirror of core's model (D-072.1).
 */
export const GET = withApi(exposureSnapshots.list.options, exposureSnapshots.list.handler);
export const POST = withApi(exposureSnapshots.record.options, exposureSnapshots.record.handler);
