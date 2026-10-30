import "server-only";
import { createHash, createHmac, randomInt } from "node:crypto";
import { INTAKE_CODE_LENGTH } from "@truststack/core";

/**
 * The client address, as the limits see it: a KEYED hash, never the address.
 * The key is the server's cookie secret with a purpose prefix (domain
 * separation), so the attempts table cannot be reversed to addresses by
 * hashing the IPv4 space, and no new secret has to be provisioned.
 *
 * On Vercel the platform sets `x-forwarded-for` (a client-sent value is
 * overwritten); the first entry is the client. Locally there may be none: all
 * local requests then share one key.
 */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function clientKey(request: Request): string {
  const secret = process.env.ACTIVE_ORG_COOKIE_SECRET;
  if (!secret || secret.length < 32) throw new Error("ACTIVE_ORG_COOKIE_SECRET is not set (min 32 chars)");
  return createHmac("sha256", secret).update(`intake-client:${clientAddress(request)}`).digest("hex");
}

/** Six random digits, zero-padded (crypto.randomInt, never Math.random). */
export function generateIntakeCode(): string {
  return String(randomInt(0, 10 ** INTAKE_CODE_LENGTH)).padStart(INTAKE_CODE_LENGTH, "0");
}

/**
 * Only this is stored. Salted with the submission id (as the old app's
 * `dsr_otp` was), so one hash cannot be matched against another submission.
 */
export function hashIntakeCode(submissionId: string, code: string): string {
  return createHash("sha256").update(`${submissionId}:${code}`).digest("hex");
}
