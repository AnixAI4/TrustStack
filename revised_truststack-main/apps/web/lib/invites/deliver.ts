import "server-only";
import { isRoleCode, ROLES } from "@truststack/core";
import type { AuditEvent } from "@/lib/audit/record";
import { ApiError } from "@/lib/api/guard";
import { EmailDeliveryError, EmailNotConfiguredError, sendEmail, type EmailResult } from "@/lib/email/send";
import { renderInviteEmail } from "@/lib/email/templates/invite";
import type { AppSupabaseClient } from "@/lib/supabase/server";

export type DeliveryStatus = EmailResult["status"];

interface DeliverInviteInput {
  request: Request;
  supabase: AppSupabaseClient;
  audit: (events: Omit<AuditEvent, "userId">[]) => Promise<void>;
  organizationId: string;
  inviteId: string;
  email: string;
  roleCode: string;
  rawToken: string;
  tokenHash: string;
  expiresAt: string;
  inviter: { email: string; fullName: string | null };
}

/**
 * Links in emails must point at OUR site. On production we build them from
 * Vercel's fixed production domain, never from the request's Host header, so a
 * forged Host cannot make us email a link to someone else's server. Previews and
 * local runs use the request origin.
 */
export function appOrigin(request: Request): string {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV === "production" && production) return `https://${production}`;
  return new URL(request.url).origin;
}

/**
 * Emails the invite link to the invitee (D-025). The link is never returned to
 * the inviter. Every outcome is audited — sent (with the provider's message
 * id), suppressed (reserved test address) or failed — never the email body.
 *
 * On failure the invite stays pending and the caller gets 502, so the admin
 * can press "Resend", which mints a fresh link.
 */
export async function deliverInvite(input: DeliverInviteInput): Promise<DeliveryStatus> {
  const { data: organization, error } = await input.supabase
    .from("organizations")
    .select("name")
    .eq("id", input.organizationId)
    .maybeSingle();
  if (error) throw error;

  const inviteUrl = new URL("/invites/accept", appOrigin(input.request));
  inviteUrl.searchParams.set("token", input.rawToken);

  const message = renderInviteEmail({
    organizationName: organization?.name ?? "your organisation",
    roleName: isRoleCode(input.roleCode) ? ROLES[input.roleCode].name : input.roleCode,
    inviterName: input.inviter.fullName ?? input.inviter.email,
    inviteUrl: inviteUrl.toString(),
    expiresAt: input.expiresAt,
  });

  const base = { organizationId: input.organizationId, entityType: "organization_invite", entityId: input.inviteId };

  let result: EmailResult;
  try {
    result = await sendEmail({
      to: input.email,
      ...message,
      // One email per token: a retried request cannot send the same link twice.
      idempotencyKey: `invite-${input.inviteId}-${input.tokenHash.slice(0, 16)}`,
    });
  } catch (err) {
    const reason = err instanceof EmailNotConfiguredError ? "not_configured" : "provider_error";
    console.error("[invite email]", err instanceof Error ? err.message : err);
    await input.audit([
      {
        ...base,
        eventType: "organization.invite.email_failed",
        description: "Invitation email could not be sent",
        metadata: {
          reason,
          providerStatus: err instanceof EmailDeliveryError ? err.providerStatus : null,
        },
      },
    ]);
    throw new ApiError(
      502,
      "EMAIL_DELIVERY_FAILED",
      "The invitation was saved but the email could not be sent. Try “Resend” in a few minutes.",
    );
  }

  await input.audit([
    result.status === "sent"
      ? {
          ...base,
          eventType: "organization.invite.email_sent",
          description: "Invitation emailed to the invitee",
          metadata: { provider: result.provider, messageId: result.messageId },
        }
      : {
          ...base,
          eventType: "organization.invite.email_suppressed",
          description: "Invitation email not sent",
          metadata: { reason: result.reason },
        },
  ]);
  return result.status;
}
