import { randomUUID } from "node:crypto";
import { surfaceOf } from "@truststack/core";
import { withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { clientKey, generateIntakeCode, hashIntakeCode } from "@/lib/intake/keys";
import { beginIntake } from "@/lib/intake/rpc";
import { emailCode, intakeDbError, maskEmail, refuse, slugOrNotFound, submissionSchema } from "@/lib/intake/routes";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/public/{slug}/submissions — a public rights request or
 * grievance (Rule 14(1)–(3)). Held apart, NOT in the register, until the
 * emailed code is entered; counted against the limits by the database.
 * 202 with the masked address; 404 (unknown slug or no public pages); 429.
 */
export const POST = withApi({ auth: "public", body: submissionSchema }, async ({ request, params, body }) => {
  const slug = slugOrNotFound(params.slug);
  const submissionId = randomUUID();
  const code = generateIntakeCode();
  const codeHash = hashIntakeCode(submissionId, code);

  const result = await beginIntake({
    slug,
    surface: surfaceOf(body.kind),
    submissionId,
    clientHash: clientKey(request),
    codeHash,
    kind: body.kind,
    requesterName: body.requesterName,
    requesterEmail: body.requesterEmail,
    requesterPhone: body.requesterPhone,
    requesterCapacity: body.requesterCapacity,
    principalIdentifier: body.principalIdentifier,
    summary: body.summary,
    relatedRequestCode: body.relatedRequestCode,
    nomineeName: body.nominee?.name ?? null,
    nomineeContact: body.nominee?.contact ?? null,
    nomineeRelationship: body.nominee?.relationship ?? null,
  }).catch((error) => {
    throw intakeDbError(error);
  });

  if (result.status !== "pending") return refuse(request, result.status);

  const emailed = await emailCode({
    to: body.requesterEmail,
    submissionId,
    codeHash,
    code,
    kind: body.kind,
    organization: result.organization,
  });
  return ok(
    {
      submissionId,
      email: maskEmail(body.requesterEmail),
      codeExpiresAt: result.codeExpiresAt,
      emailed,
    },
    request,
    { status: 202 },
  );
});
