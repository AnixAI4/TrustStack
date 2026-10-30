import { describe, expect, it } from "vitest";
import {
  assertActiveMembership,
  TENANT_ACCESS_DENIED,
  TenantAccessDeniedError,
  type Membership,
} from "./index.js";

const USER_A = "00000000-0000-4000-a000-00000000000a";
const USER_B = "00000000-0000-4000-a000-00000000000b";
const ORG_A = "00000000-0000-4000-b000-00000000000a";
const ORG_B = "00000000-0000-4000-b000-00000000000b";

const memberships: Membership[] = [
  { organizationId: ORG_A, userId: USER_A, status: "active" },
  { organizationId: ORG_B, userId: USER_B, status: "active" },
];

describe("assertActiveMembership", () => {
  it("returns the membership for an organisation the user belongs to", () => {
    expect(assertActiveMembership(memberships, USER_A, ORG_A)).toEqual(memberships[0]);
  });

  it("defaults to the user's first active membership", () => {
    expect(assertActiveMembership(memberships, USER_A).organizationId).toBe(ORG_A);
  });

  it("denies another tenant's organisation, even if that tenant's rows are passed in", () => {
    expect(() => assertActiveMembership(memberships, USER_A, ORG_B)).toThrow(
      TenantAccessDeniedError,
    );
  });

  it("denies a non-active membership", () => {
    const suspended: Membership[] = [{ organizationId: ORG_A, userId: USER_A, status: "suspended" }];
    try {
      assertActiveMembership(suspended, USER_A, ORG_A);
      expect.unreachable();
    } catch (e) {
      expect((e as TenantAccessDeniedError).code).toBe(TENANT_ACCESS_DENIED);
    }
  });

  it("denies a user with no memberships", () => {
    expect(() => assertActiveMembership([], USER_A)).toThrow(TenantAccessDeniedError);
  });
});
