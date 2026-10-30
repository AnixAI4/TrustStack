import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/organizations/{id}/ropa/import — a CSV, parsed on the server.
 * `dryRun` proposes a column mapping and reports bad rows; otherwise valid
 * rows become Drafts and bad rows come back with their reasons. A bad row
 * never fails the file; a file with no valid row is a 422.
 */
export const POST = withApi(ropa.import.options, ropa.import.handler);
