import { withApi } from "@/lib/api/guard";
import { consent } from "@/lib/consent/routes";

export const dynamic = "force-dynamic";

/**
 * GET    /api/v1/organizations/{id}/privacy-notices/{noticeId} — one version (consent.read).
 * PATCH  /api/v1/organizations/{id}/privacy-notices/{noticeId} — edit a draft (consent.write),
 *        or publish it (`status: "published"`, consent.publish). A published version never changes.
 * DELETE /api/v1/organizations/{id}/privacy-notices/{noticeId} — discard a draft (consent.write).
 */
export const GET = withApi(consent.readNotice.options, consent.readNotice.handler);
export const PATCH = withApi(consent.updateNotice.options, consent.updateNotice.handler);
export const DELETE = withApi(consent.deleteNotice.options, consent.deleteNotice.handler);
