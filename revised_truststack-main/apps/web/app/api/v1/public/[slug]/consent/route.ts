import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { clientKey } from "@/lib/intake/keys";
import { readPublicWidget, recordPublicConsent } from "@/lib/intake/rpc";
import { consentSchema, intakeDbError, refuse, slugOrNotFound, WIDGET_CORS } from "@/lib/intake/routes";

export const dynamic = "force-dynamic";

/**
 * GET  /api/v1/public/{slug}/consent — the live consent widget version: its
 *      purposes in the words of the published notice it cites, its languages
 *      and its look. 404 (the same as every public page) when the slug is
 *      unknown, closed, or has no published widget version.
 * POST /api/v1/public/{slug}/consent — one choice made in the widget (s.6):
 *      given, refused or withdrawn (s.6(4)). Counted against the limits by
 *      the database; never a verification of a parent or guardian. 201; 404; 429.
 *
 * Called from the organisation's own website, so both answer any origin
 * (`WIDGET_CORS`); neither carries credentials or anything private.
 */
export const GET = withApi({ auth: "public" }, async ({ request, params }) => {
  const widget = await readPublicWidget(slugOrNotFound(params.slug));
  if (!widget) return refuse(request, "not_found", undefined, WIDGET_CORS);
  return ok(widget, request, { headers: WIDGET_CORS });
});

export const POST = withApi({ auth: "public", body: consentSchema }, async ({ request, params, body }) => {
  const result = await recordPublicConsent({
    slug: slugOrNotFound(params.slug),
    clientHash: clientKey(request),
    configId: body.configId,
    identifier: body.identifier,
    action: body.action,
    purposes: body.purposes,
    principalKind: body.principalKind,
    language: body.language,
  }).catch((error) => {
    throw intakeDbError(error);
  });
  if (result.status !== "recorded") return refuse(request, result.status, undefined, WIDGET_CORS);
  return ok(result, request, { status: 201, headers: WIDGET_CORS });
});
