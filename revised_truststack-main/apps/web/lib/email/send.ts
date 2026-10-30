import "server-only";
import { isReservedTestAddress } from "./address";

/**
 * The only way the app sends email (D-025). Provider: Resend, via its HTTP API
 * — no SDK, so swapping to Amazon SES later touches this file only.
 *
 * Invite emails carry a sign-up credential, so failure is loud: in any
 * production build without a configured provider, sending throws rather than
 * quietly dropping the invitation.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Same key within 24h ⇒ Resend sends once. Protects against double-clicks and retries. */
  idempotencyKey?: string;
}

export type EmailResult =
  | { status: "sent"; provider: "resend"; messageId: string }
  | { status: "suppressed"; reason: "reserved_test_address" }
  | { status: "logged"; reason: "no_provider_in_development" };

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured: set RESEND_API_KEY and INVITE_EMAIL_FROM");
    this.name = "EmailNotConfiguredError";
  }
}

export class EmailDeliveryError extends Error {
  constructor(
    readonly providerStatus: number | null,
    message: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(message: EmailMessage, fetchImpl: typeof fetch = fetch): Promise<EmailResult> {
  if (isReservedTestAddress(message.to)) {
    return { status: "suppressed", reason: "reserved_test_address" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") throw new EmailNotConfiguredError();
    // Local `next dev` only. The message may contain a credential, so log the
    // recipient and subject — the developer reads the link from the DB-backed
    // flow or configures a local key.
    console.info(`[email:dev] not sent (no provider) → ${message.to} · ${message.subject}`);
    return { status: "logged", reason: "no_provider_in_development" };
  }

  let response: Response;
  try {
    response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new EmailDeliveryError(null, `email provider unreachable: ${error instanceof Error ? error.message : error}`);
  }

  const body = (await response.json().catch(() => ({}))) as { id?: string; name?: string; message?: string };
  if (!response.ok || !body.id) {
    throw new EmailDeliveryError(
      response.status,
      `email provider rejected the message (${response.status} ${body.name ?? ""}: ${body.message ?? "no detail"})`,
    );
  }
  return { status: "sent", provider: "resend", messageId: body.id };
}
