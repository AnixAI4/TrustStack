import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Invite tokens (D-022). 32 random bytes, base64url. Only the SHA-256 hex digest
 * is sent to the database; the raw token exists in the invite link and nowhere
 * else. Hashing lives here, not in packages/core, so core stays runtime-agnostic.
 */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Shape check before hashing — rejects junk without a database round trip. */
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
