/**
 * Domain types for the tenancy tables (Slice 0B + Slice 1). Shapes mirror
 * packages/db/prisma/schema.prisma, in camelCase. Dates are ISO strings at the
 * domain boundary so these types survive JSON transport unchanged.
 */

export type Uuid = string;

export type OrganizationType =
  | "university"
  | "company"
  | "government"
  | "non_profit"
  | "other";

export interface Organization {
  id: Uuid;
  name: string;
  legalName: string | null;
  organizationType: OrganizationType;
  industryCode: string | null;
  /** Affiliated colleges hang off a parent university (D-008). */
  parentOrganizationId: Uuid | null;
  consultantAssisted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface User {
  id: Uuid;
  /** Identity-provider subject (today: Supabase Auth user id). Never the PK (D-008). */
  authProviderUserId: string;
  email: string;
  fullName: string | null;
  createdAt: string;
  updatedAt: string;
}

export const MEMBERSHIP_STATUSES = ["active", "invited", "suspended"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export interface OrganizationUser {
  id: Uuid;
  organizationId: Uuid;
  userId: Uuid;
  roleId: Uuid;
  /** Nullable until departments become a managed entity (Slice 2). */
  departmentId: Uuid | null;
  status: MembershipStatus;
  invitedBy: Uuid | null;
  invitedAt: string | null;
  joinedAt: string | null;
  createdAt: string;
}

export interface OrganizationInvite {
  id: Uuid;
  organizationId: Uuid;
  email: string;
  roleId: Uuid;
  /** SHA-256 of the raw token. The raw token is never stored. */
  tokenHash: string;
  invitedBy: Uuid;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: Uuid;
  organizationId: Uuid;
  userId: Uuid | null;
  eventType: string;
  entityType: string;
  entityId: Uuid | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}
