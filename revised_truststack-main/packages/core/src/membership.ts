import type { OrganizationUser, Uuid } from "./types.js";

export type Membership = Pick<OrganizationUser, "organizationId" | "userId" | "status">;

/** Error code from the spec's API error catalogue (docs/spec/02_*.md). */
export const TENANT_ACCESS_DENIED = "TENANT_ACCESS_DENIED" as const;

export class TenantAccessDeniedError extends Error {
  readonly code = TENANT_ACCESS_DENIED;

  constructor(
    readonly userId: Uuid,
    readonly organizationId: Uuid | null,
  ) {
    super(
      organizationId === null
        ? "You are not an active member of any organisation."
        : "You do not have access to this organisation.",
    );
    this.name = "TenantAccessDeniedError";
  }
}

/**
 * The API-layer tenant lock. RLS is the second lock, never the only one (D-003).
 *
 * Returns the active membership of `userId` in `organizationId`. When
 * `organizationId` is omitted, returns the user's first active membership.
 * Throws `TenantAccessDeniedError` otherwise. Memberships belonging to a
 * different user are ignored, so a caller cannot pass someone else's rows in.
 */
export function assertActiveMembership(
  memberships: readonly Membership[],
  userId: Uuid,
  organizationId?: Uuid | null,
): Membership {
  const active = memberships.filter((m) => m.userId === userId && m.status === "active");
  const match =
    organizationId == null
      ? active[0]
      : active.find((m) => m.organizationId === organizationId);

  if (!match) {
    throw new TenantAccessDeniedError(userId, organizationId ?? null);
  }
  return match;
}

/** True when `userId` is an ACTIVE member of `organizationId`. */
export function isMemberOf(
  memberships: readonly Membership[],
  userId: Uuid,
  organizationId: Uuid,
): boolean {
  try {
    assertActiveMembership(memberships, userId, organizationId);
    return true;
  } catch (error) {
    if (error instanceof TenantAccessDeniedError) return false;
    throw error;
  }
}
