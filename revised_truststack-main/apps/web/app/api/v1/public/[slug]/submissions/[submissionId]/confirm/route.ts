import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { hashIntakeCode } from "@/lib/intake/keys";
import { confirmIntake } from "@/lib/intake/rpc";
import { confirmSchema, emailReceipt, refuse, slugOrNotFound, submissionIdOrNotFound } from "@/lib/intake/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/public/{slug}/submissions/{submissionId}/confirm — the emailed
 * code. On the right code the database creates the request in the register
 * (`web_form`), received the day it was SUBMITTED (D-084), and the person is
 * emailed its reference and respond-by date with the Rule 9 contact. Single
 * use; five wrong entries lock the submission.
 */
export const POST = withApi({ auth: "public", body: confirmSchema }, async ({ request, params, body }) => {
  const slug = slugOrNotFound(params.slug);
  const submissionId = submissionIdOrNotFound(params.submissionId);

  const result = await confirmIntake(slug, submissionId, hashIntakeCode(submissionId, body.code));
  if (result.status === "wrong_code") return refuse(request, "wrong_code", result.attemptsLeft);
  if (result.status !== "confirmed") return refuse(request, result.status);

  const emailed = await emailReceipt({
    to: result.email,
    submissionId,
    requestCode: result.requestCode,
    kind: result.kind,
    receivedOn: result.receivedOn,
    respondBy: result.respondBy,
    organization: result.organization,
  });
  return ok(
    {
      requestCode: result.requestCode,
      kind: result.kind,
      receivedOn: result.receivedOn,
      respondBy: result.respondBy,
      emailed,
    },
    request,
    { status: 201 },
  );
});
