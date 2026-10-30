/**
 * Roles and permissions — the matrix as data (docs/spec/02_*.md §API Permissions
 * Matrix). The Slice 1 migration inserts exactly these rows; a test in
 * apps/web/tests/unit fails if the two ever differ.
 *
 * Roles are GLOBAL. `organization_users.role_id` is what scopes a role to one
 * tenant, so a consultant can be `consultant` in two organisations and nothing
 * anywhere else.
 */

export const ROLE_CODES = [
  "super_admin",
  "consultant",
  "organization_admin",
  "executive_sponsor",
  "dpdp_owner",
  "department_owner",
  "legal_user",
  "it_security_user",
  "procurement_user",
  "auditor_reviewer",
] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_CODES = [
  "organization.read",
  "organization.update",
  "organization.users.read",
  "organization.users.invite",
  "organization.users.update",
  "scope.write",
  "question.read",
  // The WHOLE bank — every pack, draft and reference included, with its
  // codes and triggers. Anix staff only: to a client the bank is a black box
  // and they see the packs their own assessments were generated from (D-040, D-068).
  "question.read_bank",
  "admin.question.update",
  "assessment.read",
  "assessment.write",
  "assessment.finalise",
  "response.read",
  "response.write",
  "evidence.read",
  "evidence.write",
  "evidence.review",
  "ropa.read",
  "ropa.write",
  // Slice 10 — the breach register (s.8(6), Rule 7). Reading is everyone's;
  // recording a breach or an intimation is for the roles that write registers.
  "breach.read",
  "breach.write",
  // Slice 10, Stage 2 — the rights and grievance register (s.11–14, Rule 14).
  // As the breach register: reading is everyone's, recording the register writers'.
  "rights.read",
  "rights.write",
  // Slice 10, Stage 3b — the privacy notice, the consent widget and the consent
  // register (s.5, s.6, s.9, Rules 3, 10–11). Reading and recording as the
  // registers; PUBLISHING a notice or a widget version — the organisation's
  // public word — is for its leads and its lawyers.
  "consent.read",
  "consent.write",
  "consent.publish",
  // Slice 10, Stage 4a — the processor register's questionnaire (s.8(2),
  // Rule 6(1)(f)). Reading is the vendor register's (organization.read);
  // entering and submitting an assessment is the register writers'; ACCEPTING
  // or returning one — what makes it count — is for the programme leads,
  // Procurement and Legal, and never the person who entered it (D-043's rule).
  "vendor.assess",
  "vendor.review",
  // Slice 10, Stage 5 — the retention register (s.8(7), Rule 8). As the
  // rights register: reading is everyone's, recording the register writers'.
  // The AI risk register beside it is written with ropa.write (D-094.2).
  "retention.read",
  "retention.write",
  "score.read",
  "score.calculate",
  "gap.read",
  "gap.write",
  "report.read",
  "report.generate",
  "report.download",
  "ai.use",
  "audit.read",
  "audit.read_summary",
  "audit.read_own",
] as const;
export type PermissionCode = (typeof PERMISSION_CODES)[number];

export interface RoleDefinition {
  code: RoleCode;
  name: string;
  description: string;
  /** Platform roles are Anix-operated and can never be granted by invitation. */
  isPlatformRole: boolean;
}

export const ROLES: Readonly<Record<RoleCode, RoleDefinition>> = {
  super_admin: {
    code: "super_admin",
    name: "Super Admin",
    description: "Platform operator. Full access within organisations they are a member of.",
    isPlatformRole: true,
  },
  consultant: {
    code: "consultant",
    name: "Anix AI Consultant",
    description: "Runs assessments for the client organisations they are assigned to.",
    isPlatformRole: false,
  },
  organization_admin: {
    code: "organization_admin",
    name: "Organisation Admin",
    description: "Manages the organisation's users, roles and profile.",
    isPlatformRole: false,
  },
  executive_sponsor: {
    code: "executive_sponsor",
    name: "Executive Sponsor",
    description: "Board-level sponsor. Reads scores, gaps and reports.",
    isPlatformRole: false,
  },
  dpdp_owner: {
    code: "dpdp_owner",
    name: "DPDP Programme Owner",
    description: "Owns the DPDP programme: assessments, evidence review and reports.",
    isPlatformRole: false,
  },
  department_owner: {
    code: "department_owner",
    name: "Department Owner",
    description: "Answers and evidences the questions assigned to their department.",
    isPlatformRole: false,
  },
  legal_user: {
    code: "legal_user",
    name: "Legal User",
    description: "Answers and evidences legal, notice and contract questions.",
    isPlatformRole: false,
  },
  it_security_user: {
    code: "it_security_user",
    name: "IT/Security User",
    description: "Answers and evidences security and breach-readiness questions.",
    isPlatformRole: false,
  },
  procurement_user: {
    code: "procurement_user",
    name: "Procurement User",
    description: "Answers and evidences vendor and processor questions.",
    isPlatformRole: false,
  },
  auditor_reviewer: {
    code: "auditor_reviewer",
    name: "Auditor/Reviewer",
    description: "Independent reviewer. Read-only access plus the audit log.",
    isPlatformRole: false,
  },
};

const READ_ONLY_WORK: readonly PermissionCode[] = [
  "organization.read",
  "question.read",
  "assessment.read",
  "response.read",
  "evidence.read",
  "ropa.read",
  "breach.read",
  "rights.read",
  "consent.read",
  "retention.read",
  "score.read",
  "gap.read",
  "report.read",
];

/**
 * "Assigned" in the spec matrix = contributes to work assigned to them. The
 * *which records* part of "assigned" (department / question ownership) is
 * enforced from Slice 2–4; the *which actions* part is this list.
 */
const CONTRIBUTOR: readonly PermissionCode[] = [
  ...READ_ONLY_WORK,
  "response.write",
  "evidence.write",
  "ropa.write",
  "breach.write",
  "rights.write",
  "consent.write",
  "vendor.assess",
  "retention.write",
  "gap.write",
  "ai.use",
  "audit.read_own",
];

/** Everything an organisation-level lead does on the assessment itself. */
const PROGRAMME: readonly PermissionCode[] = [
  ...READ_ONLY_WORK,
  "organization.users.read",
  // Scope wizard + registers. Granted to the DPDP Programme Owner by Aniket, 2026-09-15 (D-026).
  "scope.write",
  "assessment.write",
  "assessment.finalise",
  "response.write",
  "evidence.write",
  "evidence.review",
  "ropa.write",
  "breach.write",
  "rights.write",
  "consent.write",
  "consent.publish",
  "vendor.assess",
  "vendor.review",
  "retention.write",
  "score.calculate",
  "gap.write",
  "report.generate",
  "report.download",
  "ai.use",
  "audit.read",
  // audit.read covers these; held explicitly so a lead can grant the roles that carry them.
  "audit.read_summary",
  "audit.read_own",
];

const ALL_EXCEPT = (...excluded: PermissionCode[]): PermissionCode[] =>
  PERMISSION_CODES.filter((p) => !excluded.includes(p));

export const ROLE_PERMISSIONS: Readonly<Record<RoleCode, readonly PermissionCode[]>> = {
  super_admin: [...PERMISSION_CODES],
  // Users "Limited": may see and invite, never change roles (so never escalate).
  consultant: [...PROGRAMME, "organization.update", "organization.users.invite", "question.read_bank"],
  // Questions/admin is "Read" for every role but Super Admin. The whole bank
  // is Anix's view, not the client's (D-068).
  organization_admin: ALL_EXCEPT("admin.question.update", "question.read_bank"),
  executive_sponsor: [...READ_ONLY_WORK, "report.download", "ai.use", "audit.read_summary"],
  dpdp_owner: PROGRAMME,
  department_owner: CONTRIBUTOR,
  // Not in the spec matrix: modelled as Department Owners for their domain (D-020).
  legal_user: [...CONTRIBUTOR, "consent.publish", "vendor.review"],
  it_security_user: CONTRIBUTOR,
  procurement_user: [...CONTRIBUTOR, "vendor.review"],
  auditor_reviewer: [...READ_ONLY_WORK, "report.download", "ai.use", "audit.read"],
};

export function isRoleCode(value: string): value is RoleCode {
  return (ROLE_CODES as readonly string[]).includes(value);
}

export function isPermissionCode(value: string): value is PermissionCode {
  return (PERMISSION_CODES as readonly string[]).includes(value);
}

/** The one permission check. Unknown strings in the set never grant anything. */
export function can(permissions: ReadonlySet<string>, required: PermissionCode): boolean {
  return permissions.has(required);
}

export interface PermissionOverrides {
  grant?: readonly PermissionCode[];
  revoke?: readonly PermissionCode[];
}

/** Role defaults, then grants, then revokes — a revoke always wins. */
export function resolveEffectivePermissions(
  roleCode: RoleCode,
  overrides: PermissionOverrides = {},
): Set<PermissionCode> {
  const effective = new Set<PermissionCode>(ROLE_PERMISSIONS[roleCode]);
  for (const p of overrides.grant ?? []) effective.add(p);
  for (const p of overrides.revoke ?? []) effective.delete(p);
  return effective;
}

export const FORBIDDEN = "FORBIDDEN" as const;

export class ForbiddenError extends Error {
  readonly code = FORBIDDEN;

  constructor(message = "You do not have permission to do that.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * No privilege escalation: an actor may only grant a role whose every
 * permission they already hold, and never a platform role. A consultant
 * (who cannot change roles) therefore cannot mint an Organisation Admin.
 */
export function assertCanAssignRole(actorPermissions: ReadonlySet<string>, roleCode: RoleCode): void {
  const role = ROLES[roleCode];
  if (role.isPlatformRole) {
    throw new ForbiddenError(`${role.name} cannot be granted from within an organisation.`);
  }
  const missing = ROLE_PERMISSIONS[roleCode].filter((p) => !actorPermissions.has(p));
  if (missing.length > 0) {
    throw new ForbiddenError(`You cannot grant ${role.name}: it has permissions you do not hold.`);
  }
}

export const LAST_ORGANIZATION_ADMIN = "LAST_ORGANIZATION_ADMIN" as const;

export class LastOrganizationAdminError extends Error {
  readonly code = LAST_ORGANIZATION_ADMIN;

  constructor(readonly self: boolean) {
    super(
      self
        ? "You are the last Organisation Admin — appoint another before stepping down."
        : "An organisation must keep at least one active Organisation Admin.",
    );
    this.name = "LastOrganizationAdminError";
  }
}

export interface MemberRoleState {
  userId: string;
  roleCode: RoleCode;
  status: "active" | "invited" | "suspended";
}

export interface MemberChange {
  roleCode?: RoleCode;
  status?: "active" | "suspended";
}

/**
 * The last active `organization_admin` may not be demoted or suspended — by
 * themselves or anyone else. Named for the common case (self-demotion); the
 * rule is about the organisation never being left without an admin.
 */
export function assertNotSelfDemotion(
  actor: { userId: string },
  target: MemberRoleState,
  change: MemberChange,
  activeOrgAdminCount: number,
): void {
  const isActiveAdmin = target.roleCode === "organization_admin" && target.status === "active";
  if (!isActiveAdmin) return;

  const losesAdmin =
    (change.roleCode !== undefined && change.roleCode !== "organization_admin") ||
    (change.status !== undefined && change.status !== "active");
  if (losesAdmin && activeOrgAdminCount <= 1) {
    throw new LastOrganizationAdminError(actor.userId === target.userId);
  }
}

/**
 * The roles an actor may grant — exactly the ones `assertCanAssignRole`
 * accepts, so a role list shows the server's rule instead of letting an admin
 * discover it by a refusal (Slice 10.5 B1, F1.8; D-068: an Organisation Admin
 * never sees "Anix AI Consultant"). Presentation only: the API still checks.
 */
export function assignableRoles(actorPermissions: ReadonlySet<string>): RoleCode[] {
  return ROLE_CODES.filter((roleCode) => {
    try {
      assertCanAssignRole(actorPermissions, roleCode);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenError) return false;
      throw error;
    }
  });
}

/**
 * "What can each role do?" in plain words (F1.8), read from the matrix above —
 * a line shows only when the role holds its permission, so the fold-out can
 * never promise more than `can()` allows. Which records (a department's
 * questions) is enforced elsewhere; these lines say what kind of work.
 */
const CAPABILITY_LINES: readonly { permission: PermissionCode; text: string }[] = [
  { permission: "score.read", text: "See the readiness score, gaps, registers and reports" },
  { permission: "response.write", text: "Answer assessment questions and upload evidence" },
  { permission: "ropa.write", text: "Record entries in the registers (processing, breaches, rights, retention)" },
  { permission: "gap.write", text: "Work on remediation actions" },
  { permission: "evidence.review", text: "Review other people's evidence" },
  { permission: "scope.write", text: "Set the organisation's scope" },
  { permission: "assessment.write", text: "Start and run assessments" },
  { permission: "assessment.finalise", text: "Finalise an assessment" },
  { permission: "consent.publish", text: "Publish privacy notices and consent forms" },
  { permission: "vendor.review", text: "Accept or return a processor's questionnaire" },
  { permission: "report.generate", text: "Generate reports" },
  { permission: "report.download", text: "Download reports" },
  { permission: "organization.update", text: "Edit the organisation's profile and settings" },
  { permission: "organization.users.invite", text: "Invite people" },
  { permission: "organization.users.update", text: "Change people's roles" },
  { permission: "audit.read", text: "Read the audit log" },
];

export function roleCapabilities(roleCode: RoleCode): string[] {
  const held = new Set<string>(ROLE_PERMISSIONS[roleCode]);
  return CAPABILITY_LINES.filter((line) => held.has(line.permission)).map((line) => line.text);
}
