import { assertActiveMembership, TenantAccessDeniedError } from "@truststack/core";
import { describe, expect, it } from "vitest";

describe("@truststack/core from apps/web", () => {
  it("is importable and behaves", () => {
    const m = { organizationId: "org-a", userId: "user-a", status: "active" as const };
    expect(assertActiveMembership([m], "user-a")).toBe(m);
    expect(() => assertActiveMembership([m], "user-a", "org-b")).toThrow(TenantAccessDeniedError);
  });
});
