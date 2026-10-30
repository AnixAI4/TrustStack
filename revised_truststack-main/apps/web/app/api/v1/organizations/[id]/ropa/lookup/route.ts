import { withApi } from "@/lib/api/guard";
import { ropa } from "@/lib/ropa/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/organizations/{id}/ropa/lookup — read-only questions of the
 * register (D-066): `?principal=` what we hold about a kind of person (the
 * s.11(1) access answer); `?systemId=` or `?vendorId=` which activities a
 * system or processor touches (the first question in a breach, Rule 7).
 */
export const GET = withApi(ropa.lookup.options, ropa.lookup.handler);
