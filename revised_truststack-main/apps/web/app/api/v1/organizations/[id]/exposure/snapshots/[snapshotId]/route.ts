import { withApi } from "@/lib/api/guard";
import { exposureSnapshots } from "@/lib/exposure/snapshots";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/exposure/snapshots/{snapshotId} — one stored
 * snapshot in full: every head with its position and reasons, and the
 * forecast as it stood. Read-only; snapshots are immutable.
 */
export const GET = withApi(exposureSnapshots.read.options, exposureSnapshots.read.handler);
