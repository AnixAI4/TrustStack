import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The active organisation travels in a signed, httpOnly, SameSite=Lax cookie
 * (D-021). The signature only proves WE issued it for THIS user; it is still a
 * claim, never a fact — the guard re-verifies membership on every request, so a
 * valid cookie for an organisation the user has since left grants nothing.
 */

export const ACTIVE_ORG_COOKIE = "ts_active_org";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string | null {
  const value = process.env.ACTIVE_ORG_COOKIE_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export class ActiveOrgSecretMissingError extends Error {
  constructor() {
    super("ACTIVE_ORG_COOKIE_SECRET is not set (min 32 chars)");
    this.name = "ActiveOrgSecretMissingError";
  }
}

/** `payload.signature`, where payload binds the organisation to the user. */
export function encodeActiveOrganization(userId: string, organizationId: string): string {
  const key = secret();
  if (!key) throw new ActiveOrgSecretMissingError();
  const payload = Buffer.from(JSON.stringify({ u: userId, o: organizationId })).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/**
 * Returns the organisation id only if the signature is valid AND the cookie was
 * issued to `userId`. Anything else — tampered, re-signed, another user's
 * cookie, no secret configured — is ignored (returns null), never an error.
 */
export function decodeActiveOrganization(value: string | undefined, userId: string): string | null {
  const key = secret();
  if (!key || !value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u?: unknown; o?: unknown };
    return parsed.u === userId && typeof parsed.o === "string" ? parsed.o : null;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export function activeOrganizationCookie(value: string) {
  return {
    name: ACTIVE_ORG_COOKIE,
    value,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
