import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ActiveOrgSecretMissingError,
  decodeActiveOrganization,
  encodeActiveOrganization,
  readCookie,
} from "@/lib/auth/active-organization";
import { resolveActiveOrganizationId } from "@/lib/api/guard";
import { hashInviteToken, generateInviteToken, INVITE_TOKEN_PATTERN } from "@/lib/invites/token";

const USER_A = "0b000000-0000-4000-9000-000000000003";
const USER_B = "0b000000-0000-4000-9000-000000000009";
const ORG_A = "0b000000-0000-4000-8000-000000000001";
const ORG_B = "0b000000-0000-4000-8000-000000000002";

const original = process.env.ACTIVE_ORG_COOKIE_SECRET;
beforeEach(() => {
  process.env.ACTIVE_ORG_COOKIE_SECRET = "unit-test-secret-unit-test-secret-0123456789";
});
afterEach(() => {
  process.env.ACTIVE_ORG_COOKIE_SECRET = original;
});

describe("signed active-organisation cookie", () => {
  it("round-trips for the user it was issued to", () => {
    expect(decodeActiveOrganization(encodeActiveOrganization(USER_A, ORG_A), USER_A)).toBe(ORG_A);
  });

  it("is ignored when replayed by a different user", () => {
    expect(decodeActiveOrganization(encodeActiveOrganization(USER_B, ORG_B), USER_A)).toBeNull();
  });

  it("is ignored when the payload is swapped to another organisation", () => {
    const [, signature] = encodeActiveOrganization(USER_A, ORG_A).split(".");
    const forged = Buffer.from(JSON.stringify({ u: USER_A, o: ORG_B })).toString("base64url");
    expect(decodeActiveOrganization(`${forged}.${signature}`, USER_A)).toBeNull();
  });

  it("is ignored when signed with another key", () => {
    const cookie = encodeActiveOrganization(USER_A, ORG_B);
    process.env.ACTIVE_ORG_COOKIE_SECRET = "a-different-secret-a-different-secret-000";
    expect(decodeActiveOrganization(cookie, USER_A)).toBeNull();
  });

  it("ignores junk", () => {
    for (const junk of [undefined, "", "abc", "a.b.c", ".", `${"x".repeat(40)}.`]) {
      expect(decodeActiveOrganization(junk, USER_A)).toBeNull();
    }
  });

  it("refuses to issue without a secret, and ignores cookies without one", () => {
    const cookie = encodeActiveOrganization(USER_A, ORG_A);
    process.env.ACTIVE_ORG_COOKIE_SECRET = "";
    expect(() => encodeActiveOrganization(USER_A, ORG_A)).toThrow(ActiveOrgSecretMissingError);
    expect(decodeActiveOrganization(cookie, USER_A)).toBeNull();
  });

  it("reads a named cookie from the header", () => {
    const req = new Request("http://x", { headers: { cookie: "a=1; ts_active_org=v%2E1; b=2" } });
    expect(readCookie(req, "ts_active_org")).toBe("v.1");
    expect(readCookie(req, "missing")).toBeUndefined();
  });
});

describe("resolveActiveOrganizationId — the cookie is a claim, membership is the fact", () => {
  const consultant = [
    { organizationId: ORG_A, userId: USER_A, status: "active" as const },
    { organizationId: ORG_B, userId: USER_A, status: "active" as const },
  ];

  it("uses the cookie org when it is an active membership", () => {
    expect(resolveActiveOrganizationId(consultant, USER_A, ORG_B)).toBe(ORG_B);
  });

  it("falls back to the first membership for a non-member org", () => {
    expect(resolveActiveOrganizationId([consultant[0]!], USER_A, ORG_B)).toBe(ORG_A);
  });

  it("falls back when that membership is suspended", () => {
    const suspended = [consultant[0]!, { ...consultant[1]!, status: "suspended" as const }];
    expect(resolveActiveOrganizationId(suspended, USER_A, ORG_B)).toBe(ORG_A);
  });

  it("null when the user has no active membership", () => {
    expect(resolveActiveOrganizationId([], USER_A, ORG_A)).toBeNull();
  });
});

describe("invite tokens", () => {
  it("are 256-bit base64url and hash to 64 hex chars", () => {
    const token = generateInviteToken();
    expect(token).toMatch(INVITE_TOKEN_PATTERN);
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).not.toContain(token);
    expect(generateInviteToken()).not.toBe(token);
  });
});
