import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { clientKey, generateIntakeCode, hashIntakeCode } from "@/lib/intake/keys";
import { resendIntakeCode } from "@/lib/intake/rpc";
import { emailCode, maskEmail, refuse, slugOrNotFound, submissionIdOrNotFound } from "@/lib/intake/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/public/{slug}/submissions/{submissionId}/resend — a new code
 * for a waiting submission; the old one stops working. The email limits
 * apply; wrong entries are not forgiven. A submission of another
 * organisation answers the same 404 as one that does not exist.
 */
export const POST = withApi({ auth: "public" }, async ({ request, params }) => {
  const slug = slugOrNotFound(params.slug);
  const submissionId = submissionIdOrNotFound(params.submissionId);
  const code = generateIntakeCode();
  const codeHash = hashIntakeCode(submissionId, code);

  const result = await resendIntakeCode(slug, submissionId, clientKey(request), codeHash);
  if (result.status !== "sent") return refuse(request, result.status);

  const emailed = await emailCode({
    to: result.email,
    submissionId,
    codeHash,
    code,
    kind: result.kind,
    organization: result.organization,
  });
  return ok({ email: maskEmail(result.email), codeExpiresAt: result.codeExpiresAt, emailed }, request, { status: 202 });
});
