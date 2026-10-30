/**
 * Seed fixtures. Fixed UUIDs make the seed idempotent and let tests address
 * rows directly. Mumbai University grows every slice; Bharat Manufacturing Ltd
 * exists so cross-tenant tests have a real second tenant to fail against.
 *
 * Emails are on example.com (RFC 2606) — no mail is ever sent to them.
 *
 * Roles and permissions are NOT seeded here: they are reference data inserted
 * by the Slice 1 migration (D-020). Memberships name a role by its code.
 */

export const SEED_ORGS = {
  mumbaiUniversity: {
    id: "0b000000-0000-4000-8000-000000000001",
    name: "Mumbai University",
    legalName: "University of Mumbai",
    organizationType: "university",
    industryCode: "university",
    consultantAssisted: true,
    website: "https://mu.example.com",
    headquartersCity: "Mumbai",
    employeeCount: 12000,
    dataPrincipalCountEstimate: 500000,
    // Slice 10 Stage 3a: the published Rule 9 contact. NO public address: the
    // seed also reaches hosted, where a public submission would be a permanent
    // register row on a demo tenant. e2e and the manual test open public pages
    // on disposable tenants only.
    publicContactName: "Data Protection Officer, University of Mumbai",
    publicContactEmail: "dpo@mu.example.com",
    publicContactIsDpo: true,
    // Slice 11 Stage 1a: the AI assistant is on for the demo, under a FICTIONAL
    // contract reference (§4.8, A2). BML stays off — its empty state says why.
    // On hosted the platform kill switch (`AI_ENABLED`) keeps every call off
    // until the sub-processor contracts exist (§6, A1).
    aiEnabled: true,
    aiContractRef: "DEMO-DPA-AI-0001 (fictional, demo tenant)",
  },
  bharatManufacturing: {
    id: "0b000000-0000-4000-8000-000000000002",
    name: "Bharat Manufacturing Ltd",
    legalName: "Bharat Manufacturing Limited",
    organizationType: "company",
    industryCode: "manufacturing",
    consultantAssisted: false,
    website: "https://bml.example.com",
    headquartersCity: "Pune",
    employeeCount: 2400,
    dataPrincipalCountEstimate: 6000,
  },
} as const;

type SeedRoleCode =
  | "consultant"
  | "organization_admin"
  | "executive_sponsor"
  | "dpdp_owner"
  | "department_owner"
  | "legal_user"
  | "it_security_user";

export interface SeedMembership {
  id: string;
  organizationId: string;
  roleCode: SeedRoleCode;
  /** Key into SEED_SCOPE[org].departments. */
  departmentKey?: string;
}

export interface SeedUser {
  id: string;
  email: string;
  fullName: string;
  /** First membership = the user's default organisation. */
  memberships: readonly SeedMembership[];
  /** Slice 0B seeded one sign-in per original user; kept for continuity. */
  signInAuditId?: string;
}

const MU = SEED_ORGS.mumbaiUniversity.id;
const BML = SEED_ORGS.bharatManufacturing.id;

export const SEED_USERS = {
  /** Registrar — the Slice 0B user, now the DPDP Programme Owner. */
  mumbaiUniversity: {
    id: "0b000000-0000-4000-9000-000000000001",
    email: "dpdp.owner@mumbai-university.example.com",
    fullName: "Registrar (DPDP Programme Owner)",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000001", organizationId: MU, roleCode: "dpdp_owner" }],
    signInAuditId: "0b000000-0000-4000-b000-000000000001",
  },
  /** The Slice 0B BML user, still that organisation's DPDP owner. */
  bharatManufacturing: {
    id: "0b000000-0000-4000-9000-000000000002",
    email: "dpdp.owner@bharat-manufacturing.example.com",
    fullName: "BML DPDP Owner",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000002", organizationId: BML, roleCode: "dpdp_owner" }],
    signInAuditId: "0b000000-0000-4000-b000-000000000002",
  },
  muAdmin: {
    id: "0b000000-0000-4000-9000-000000000003",
    email: "it.admin@mumbai-university.example.com",
    fullName: "MU Organisation Admin",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000003", organizationId: MU, roleCode: "organization_admin" }],
  },
  muDean: {
    id: "0b000000-0000-4000-9000-000000000004",
    email: "dean@mumbai-university.example.com",
    fullName: "Dean (Executive Sponsor)",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000004", organizationId: MU, roleCode: "executive_sponsor" }],
  },
  muItSecurity: {
    id: "0b000000-0000-4000-9000-000000000005",
    email: "ciso@mumbai-university.example.com",
    fullName: "MU IT/Security Lead",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000005", organizationId: MU, roleCode: "it_security_user" }],
  },
  muLegal: {
    id: "0b000000-0000-4000-9000-000000000006",
    email: "legal@mumbai-university.example.com",
    fullName: "MU Legal Counsel",
    memberships: [{ id: "0b000000-0000-4000-a000-000000000006", organizationId: MU, roleCode: "legal_user" }],
  },
  muDepartmentOwner: {
    id: "0b000000-0000-4000-9000-000000000007",
    email: "examinations@mumbai-university.example.com",
    fullName: "Controller of Examinations (Department Owner)",
    memberships: [
      { id: "0b000000-0000-4000-a000-000000000007", organizationId: MU, roleCode: "department_owner", departmentKey: "examinations" },
    ],
  },
  /** Anix AI consultant assigned to BOTH tenants — drives the org switcher and cross-tenant tests. */
  consultant: {
    id: "0b000000-0000-4000-9000-000000000008",
    email: "consultant@anix-ai.example.com",
    fullName: "Anix AI Consultant",
    memberships: [
      { id: "0b000000-0000-4000-a000-000000000008", organizationId: MU, roleCode: "consultant" },
      { id: "0b000000-0000-4000-a000-000000000009", organizationId: BML, roleCode: "consultant" },
    ],
  },
  bmlAdmin: {
    id: "0b000000-0000-4000-9000-000000000009",
    email: "admin@bharat-manufacturing.example.com",
    fullName: "BML Organisation Admin",
    memberships: [{ id: "0b000000-0000-4000-a000-00000000000a", organizationId: BML, roleCode: "organization_admin" }],
  },
} as const satisfies Record<string, SeedUser>;

// ---------------------------------------------------------------------------
// Slice 2 — scope. Ids use variant nibble 8 (RFC 4122) so API UUID validation
// accepts them; the second group encodes the table:
// 0b000002 departments · 0b000003 systems · 0b000004 vendors · 0b000005 DP types.
// ---------------------------------------------------------------------------

type Tri = "yes" | "no" | "unknown";

export interface SeedScope {
  departments: Record<string, { id: string; name: string }>;
  systems: Record<
    string,
    {
      id: string;
      name: string;
      systemType: string;
      hostingModel: string;
      dataLocation: string;
      processesChildrenData: Tri;
      ownerDepartmentKey?: string;
    }
  >;
  vendors: Record<
    string,
    {
      id: string;
      name: string;
      service: string;
      vendorRole: string;
      contractExists: Tri;
      dpdpClauses: Tri;
      crossBorder: Tri;
      subProcessorsKnown: Tri;
      systemKeys: string[];
    }
  >;
  dataPrincipalTypes: Record<
    string,
    { id: string; code: string; label: string; includesChildren: Tri; estimatedCount: number | null }
  >;
  answers: {
    childrenData: Tri;
    /** Slice 9: persons with disability who have a lawful guardian (s.9(1)). */
    guardianData: Tri;
    usesDataProcessors: Tri;
    aiUsageTypes: string[];
    marketingTracking: Tri;
    crossBorder: Tri;
    multiLocation: boolean;
    publicFacingPortal: Tri;
    sensitiveDocuments: Tri;
  };
}

const id = (table: number, n: number) =>
  `0b00000${table}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export const SEED_SCOPE = {
  mumbaiUniversity: {
    departments: {
      admissions: { id: id(2, 1), name: "Admissions" },
      examinations: { id: id(2, 2), name: "Examinations" },
      academic: { id: id(2, 3), name: "Academic Affairs (LMS)" },
      hr: { id: id(2, 4), name: "Human Resources" },
      it: { id: id(2, 5), name: "IT" },
      hostel: { id: id(2, 6), name: "Hostel" },
      library: { id: id(2, 7), name: "Library" },
      finance: { id: id(2, 8), name: "Finance" },
    },
    systems: {
      admissionPortal: { id: id(3, 1), name: "Admission portal", systemType: "website", hostingModel: "saas", dataLocation: "india", processesChildrenData: "yes", ownerDepartmentKey: "admissions" },
      sis: { id: id(3, 2), name: "Student ERP / SIS", systemType: "sis", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "yes", ownerDepartmentKey: "academic" },
      lms: { id: id(3, 3), name: "LMS", systemType: "lms", hostingModel: "saas", dataLocation: "unknown", processesChildrenData: "yes", ownerDepartmentKey: "academic" },
      exam: { id: id(3, 4), name: "Examination system", systemType: "exam", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "yes", ownerDepartmentKey: "examinations" },
      hrms: { id: id(3, 5), name: "HRMS", systemType: "hrms", hostingModel: "cloud", dataLocation: "india", processesChildrenData: "no", ownerDepartmentKey: "hr" },
      payroll: { id: id(3, 6), name: "Payroll", systemType: "payroll", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "no", ownerDepartmentKey: "finance" },
      website: { id: id(3, 7), name: "University website", systemType: "website", hostingModel: "cloud", dataLocation: "india", processesChildrenData: "unknown", ownerDepartmentKey: "it" },
      payments: { id: id(3, 8), name: "Payment gateway", systemType: "payment", hostingModel: "saas", dataLocation: "india", processesChildrenData: "no", ownerDepartmentKey: "finance" },
      proctoring: { id: id(3, 9), name: "AI proctoring", systemType: "ai", hostingModel: "saas", dataLocation: "unknown", processesChildrenData: "yes", ownerDepartmentKey: "examinations" },
    },
    vendors: {
      lmsProvider: { id: id(4, 1), name: "LMS provider", service: "Learning management platform", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "no", crossBorder: "unknown", subProcessorsKnown: "no", systemKeys: ["lms"] },
      paymentGateway: { id: id(4, 2), name: "Payment gateway provider", service: "Fee collection", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "yes", crossBorder: "no", subProcessorsKnown: "yes", systemKeys: ["payments", "admissionPortal"] },
      proctoringVendor: { id: id(4, 3), name: "AI proctoring vendor", service: "Remote exam proctoring", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "unknown", crossBorder: "unknown", subProcessorsKnown: "unknown", systemKeys: ["proctoring"] },
    },
    dataPrincipalTypes: {
      applicants: { id: id(5, 1), code: "applicant", label: "Applicants", includesChildren: "yes", estimatedCount: 150000 },
      students: { id: id(5, 2), code: "student", label: "Students", includesChildren: "yes", estimatedCount: 300000 },
      parents: { id: id(5, 3), code: "parent_guardian", label: "Parents / guardians", includesChildren: "no", estimatedCount: null },
      faculty: { id: id(5, 4), code: "faculty", label: "Faculty", includesChildren: "no", estimatedCount: 4000 },
      employees: { id: id(5, 5), code: "employee", label: "Non-teaching employees", includesChildren: "no", estimatedCount: 8000 },
      alumni: { id: id(5, 6), code: "alumni", label: "Alumni", includesChildren: "no", estimatedCount: null },
    },
    answers: {
      childrenData: "yes",
      // Not yet asked of MU's consultant — and a university may well hold it.
      guardianData: "unknown",
      usesDataProcessors: "yes",
      aiUsageTypes: ["proctoring"],
      marketingTracking: "unknown",
      crossBorder: "unknown",
      multiLocation: true,
      publicFacingPortal: "yes",
      sensitiveDocuments: "yes",
    },
  },
  bharatManufacturing: {
    departments: {
      hr: { id: id(2, 101), name: "Human Resources" },
      plantOps: { id: id(2, 102), name: "Plant Operations" },
    },
    systems: {
      hrms: { id: id(3, 101), name: "HRMS", systemType: "hrms", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "no", ownerDepartmentKey: "hr" },
      erp: { id: id(3, 102), name: "ERP", systemType: "erp", hostingModel: "on_premise", dataLocation: "india", processesChildrenData: "no", ownerDepartmentKey: "plantOps" },
    },
    vendors: {
      payrollBureau: { id: id(4, 101), name: "Payroll bureau", service: "Payroll processing", vendorRole: "data_processor", contractExists: "yes", dpdpClauses: "yes", crossBorder: "no", subProcessorsKnown: "yes", systemKeys: ["hrms"] },
    },
    dataPrincipalTypes: {
      employees: { id: id(5, 101), code: "employee", label: "Employees", includesChildren: "no", estimatedCount: 2400 },
      contractors: { id: id(5, 102), code: "contractor", label: "Contract workers", includesChildren: "no", estimatedCount: 3600 },
    },
    answers: {
      childrenData: "no",
      guardianData: "no",
      usesDataProcessors: "yes",
      aiUsageTypes: [],
      marketingTracking: "no",
      crossBorder: "no",
      multiLocation: false,
      publicFacingPortal: "no",
      sensitiveDocuments: "yes",
    },
  },
} satisfies Record<keyof typeof SEED_ORGS, SeedScope>;

/**
 * Mumbai University's baseline assessment (Slice 3). Fixed id so tests can
 * address it. Bharat Manufacturing deliberately gets none, so the empty-state
 * UI is exercised by a real tenant.
 *
 * `in_progress` since Slice 4: it holds one answer (SEED_RESPONSES), and the
 * first answer moves a draft to in_progress (D-041). The seed snapshots it as
 * a draft and the answer moves it on, exactly as the application would.
 */
export const SEED_ASSESSMENTS = {
  muBaseline: {
    id: id(6, 1),
    organizationId: SEED_ORGS.mumbaiUniversity.id,
    name: "Mumbai University DPDP Compass Baseline",
    assessmentType: "baseline",
    status: "in_progress",
    /** The consultant who runs MU's assessment. */
    createdByEmail: "consultant@anix-ai.example.com",
  },
} as const;

// ---------------------------------------------------------------------------
// Slice 4 — the keystone. ONE answered question, G1.2, with one stored
// artefact, so the answering UI and the domain tile have real data. The
// artefact is a synthetic sample, labelled as such inside the file.
// 0b000007 responses · 0b000008 evidence · 0b000009 evidence links.
// ---------------------------------------------------------------------------

export const SEED_RESPONSES = {
  muG12: {
    id: id(7, 1),
    organizationId: SEED_ORGS.mumbaiUniversity.id,
    assessmentId: SEED_ASSESSMENTS.muBaseline.id,
    questionCode: "G1.2",
    applicabilityDecision: "applicable",
    claimedMaturity: 5,
    notes: "The Registrar was nominated DPDP Programme Owner by office order.",
    /** The client answers its own questions; the consultant reviews. */
    answeredByEmail: "dpdp.owner@mumbai-university.example.com",
  },
} as const;

export const SEED_EVIDENCE = {
  muG12OfficeOrder: {
    id: id(8, 1),
    organizationId: SEED_ORGS.mumbaiUniversity.id,
    fileName: "office-order-dpdp-owner-SAMPLE.txt",
    contentType: "text/plain",
    body:
      "SAMPLE ARTEFACT - seeded demonstration data, not a real document.\n\n" +
      "Office order (illustrative): the Registrar is nominated as the DPDP Programme Owner for the University.\n" +
      "It names no deputy and does not define the role's authority or reporting line.\n",
    uploadedByEmail: "dpdp.owner@mumbai-university.example.com",
    /** Reviewed by someone OTHER than the uploader — no self-review (D-043). */
    reviewedByEmail: "consultant@anix-ai.example.com",
    reviewStatus: "partial",
    evidenceLevel: 3,
    reviewNotes: "Nomination is documented; no deputy, authority or reporting line.",
    linkId: id(9, 1),
    linkedResponseKey: "muG12",
  },
} as const;

/**
 * Where a seeded artefact lives — the same layout the API writes
 * (packages/core evidenceStoragePath), spelled out so tests can use it
 * without building core first.
 */
export const seedEvidencePath = (e: { organizationId: string; id: string; fileName: string }) =>
  `organizations/${e.organizationId}/evidence/${e.id}/${e.fileName}`;

// ---------------------------------------------------------------------------
// Slice 7 — the ROPA register. The ten workbook records ARE Mumbai
// University's seed register (`packages/db/question-bank/ropa-register.json`,
// extracted from the workbook, loaded through the same validation an import
// uses). Bharat Manufacturing gets none: its empty register is the empty state.
// 0b00000a ropa records.
// ---------------------------------------------------------------------------

const ropaId = (n: number) => `0b00000a-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export interface SeedRopaLinks {
  id: string;
  /**
   * D-065 structure, as SEED JUDGEMENT read only from what the workbook's own
   * text states: a lawful ground only where the basis cell names one; a
   * retention trigger only where the rule says what ends it; Rule 6 ticks
   * only for safeguards the cell lists. Nothing is guessed — the rest stays
   * undecided, and the register shows it as a gap.
   */
  lawfulBasis?: string;
  retentionTrigger?: string;
  safeguards: readonly string[];
  /** Key into SEED_SCOPE.mumbaiUniversity.departments, or null when no seeded department fits. */
  departmentKey: string | null;
  systemKeys: readonly string[];
  vendorKeys: readonly string[];
}

/**
 * Which seeded department, systems and vendors each record is linked to.
 * SEED JUDGEMENT, not the workbook: the workbook names them in free text
 * ("Admission portal, ERP"), and that text is kept on the record as typed.
 * Only the obvious matches are linked; a record whose text names something
 * the seeded registers do not hold (a chatbot, a CRM) stays text-only, which
 * is exactly the case the vendor-mapping gap exists for.
 */
export const SEED_ROPA = {
  organizationKey: "mumbaiUniversity",
  records: {
    "ROPA-001": { id: ropaId(1), safeguards: ["encryption", "access_control", "logging", "backups"], departmentKey: "admissions", systemKeys: ["admissionPortal", "sis"], vendorKeys: [] },
    "ROPA-002": { id: ropaId(2), safeguards: ["access_control", "logging", "backups"], departmentKey: "examinations", systemKeys: ["exam", "sis"], vendorKeys: [] },
    "ROPA-003": { id: ropaId(3), safeguards: ["access_control", "logging", "backups"], departmentKey: null, systemKeys: ["sis"], vendorKeys: [] },
    "ROPA-004": { id: ropaId(4), safeguards: ["access_control", "logging"], departmentKey: "academic", systemKeys: ["lms"], vendorKeys: ["lmsProvider"] },
    "ROPA-005": { id: ropaId(5), lawfulBasis: "employment", safeguards: ["encryption", "access_control", "logging"], departmentKey: "hr", systemKeys: ["hrms", "payroll"], vendorKeys: [] },
    "ROPA-006": { id: ropaId(6), safeguards: ["encryption", "access_control", "logging"], departmentKey: null, systemKeys: ["sis"], vendorKeys: [] },
    "ROPA-007": { id: ropaId(7), safeguards: ["access_control", "logging"], departmentKey: null, systemKeys: ["sis"], vendorKeys: [] },
    "ROPA-008": { id: ropaId(8), safeguards: ["encryption", "access_control", "logging"], departmentKey: "it", systemKeys: [], vendorKeys: [] },
    "ROPA-009": { id: ropaId(9), retentionTrigger: "purpose_served", safeguards: ["access_control"], departmentKey: null, systemKeys: [], vendorKeys: [] },
    "ROPA-010": { id: ropaId(10), retentionTrigger: "consent_withdrawn", safeguards: ["access_control"], departmentKey: null, systemKeys: [], vendorKeys: [] },
  } satisfies Record<string, SeedRopaLinks>,
} as const;

// ---------------------------------------------------------------------------
// Slice 10, Stage 1 — the breach register. Mumbai University has ONE past
// breach, handled in time: aware, the Board told the same day and the
// detailed report filed inside 72 hours, the students intimated, closed. It
// exercises the register, the actions view (one remedial action still open)
// and s.33(2)(c) repetition — a breach in the last 24 months counts even when
// it was handled well. SEED JUDGEMENT, fictional. Bharat Manufacturing gets
// none: its empty register is the empty state. 0b000010 breaches.
// ---------------------------------------------------------------------------

export const SEED_BREACHES = {
  examMarksLink: {
    id: "0b000010-0000-4000-8000-000000000001",
    organizationKey: "mumbaiUniversity",
    incidentCode: "BRH-2026-001",
    title: "Examination marks list shared through a public link",
    description:
      "A results spreadsheet for one semester was shared from the examinations folder with an 'anyone with the link' setting and the link was forwarded to a student group.",
    nature: "accidental_disclosure",
    severity: "high",
    occurredAt: "2026-03-13T12:00:00.000Z",
    awareAt: "2026-03-14T04:50:00.000Z",
    location: "Examination results folder (examination system), Mumbai",
    principalsAffected: 1840,
    dataCategories: "Student names, seat numbers, subject marks",
    likelyImpact: "Marks of one semester's students visible to anyone holding the link for about 22 hours; no contact, identity or financial data exposed.",
    containmentMeasures: "Link revoked, link sharing disabled on the results folder, access logs reviewed.",
    boardInitialAt: "2026-03-14T09:30:00.000Z",
    boardReportAt: "2026-03-16T11:00:00.000Z",
    boardReportRef: "MU-BR-2026-01 (internal reference)",
    principalsIntimatedAt: "2026-03-15T06:00:00.000Z",
    principalsIntimationMethod: "Email to each student's registered address, and a notice on the student portal",
    closedAt: "2026-04-02T07:00:00.000Z",
    recordedByKey: "muItSecurity",
    action: {
      id: "0b000010-0000-4000-8000-0000000000a1",
      title: "Review link-sharing settings on every examinations folder",
      ownerKey: "muItSecurity",
      dueDate: "2026-11-30",
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Slice 10, Stage 2 — the rights and grievance register. Mumbai University
// has two requests, both answered inside the ninety days: a student's access
// request (s.11), identified and fulfilled; and a parent's grievance (s.13)
// about a correction that never reached the examination system, resolved —
// with one remedial action still open, so the register shows in the one
// actions view. Both are answered, so neither moves the model on any day.
// SEED JUDGEMENT, fictional people at example.com. Bharat Manufacturing has
// none: its empty register is the empty state. 0b000012 rights requests.
// ---------------------------------------------------------------------------

export const SEED_RIGHTS_REQUESTS = {
  marksAccess: {
    id: "0b000012-0000-4000-8000-000000000001",
    organizationKey: "mumbaiUniversity",
    requestCode: "DPR-2026-001",
    kind: "access",
    receivedOn: "2026-08-03",
    channel: "email",
    requesterName: "Student (seed)",
    requesterEmail: "student.seed@example.com",
    requesterCapacity: "self",
    principalIdentifier: "Seat number 2026-EX-0412",
    summary:
      "Asks for a summary of the personal data the University holds about her, what it is used for, and who it has been shared with (s.11).",
    ownerKey: "muLegal",
    identityVerifiedOn: "2026-08-04",
    identityMethod: "Matched the registered email address and the seat number",
    outcome: "fulfilled",
    respondedOn: "2026-08-21",
    responseSummary:
      "Sent the summary of personal data held, the processing activities, and the processors and other fiduciaries it is shared with.",
    recordedByKey: "muLegal",
  },
  surnameGrievance: {
    id: "0b000012-0000-4000-8000-000000000002",
    organizationKey: "mumbaiUniversity",
    requestCode: "GRV-2026-001",
    kind: "grievance",
    receivedOn: "2026-09-02",
    channel: "email",
    requesterName: "Parent (seed)",
    requesterEmail: "parent.seed@example.com",
    requesterCapacity: "guardian",
    principalIdentifier: "Enrolment number MU-2025-55817",
    summary:
      "A surname corrected in the student record in July still appears wrongly on the hall ticket and the marks statement.",
    ownerKey: "muDepartmentOwner",
    identityVerifiedOn: null,
    identityMethod: null,
    outcome: "fulfilled",
    respondedOn: "2026-09-24",
    responseSummary: "Corrected in the examination system and the hall ticket reissued.",
    recordedByKey: "muLegal",
    action: {
      id: "0b000012-0000-4000-8000-0000000000a1",
      title: "Make corrections in the student record flow to the examination system",
      ownerKey: "muDepartmentOwner",
      dueDate: "2026-12-15",
    },
  },
} as const;

/**
 * Slice 10 Stage 3b: Mumbai University's privacy notice (version 1, English,
 * published), its consent widget (version 1, published), and the consents of
 * two adult Data Principals recorded by staff — one given, one given and then
 * withdrawn. No child's consent: that would change MU's head 3, and the manual
 * test records one on the LOCAL stack to show it. MU has no public address, so
 * nothing here is public (the seed reaches hosted).
 */
export const SEED_NOTICE = {
  id: "0b000013-0000-4000-8000-000000000001",
  organizationKey: "mumbaiUniversity",
  language: "en",
  version: 1,
  title: "How the University of Mumbai uses your personal data",
  summary:
    "This notice explains what personal data the University processes about students, applicants and alumni, why, and how you can withdraw consent, exercise your rights and complain.",
  purposes: [
    {
      key: "admissions",
      title: "Admissions",
      uses: "Processing your application for a place, and telling you the outcome.",
      dataItems: ["Name", "Date of birth", "Email address", "Mobile number", "Qualifying examination marks"],
    },
    {
      key: "alumni_updates",
      title: "Alumni updates",
      uses: "Sending you news of alumni events and the University's work after you graduate.",
      dataItems: ["Name", "Email address", "Year of graduation"],
    },
    {
      key: "event_photos",
      title: "Photographs at University events",
      uses: "Publishing photographs of convocation and campus events on the University's website and social media.",
      dataItems: ["Photograph", "Name"],
    },
  ],
  withdrawMeans: "Write to the Data Protection Officer at dpo@mu.example.com, or visit the Registrar's office.",
  rightsMeans: null,
  complaintMeans: null,
  publishedOn: "2026-09-01",
  publishedByKey: "muLegal",
} as const;

export const SEED_CONSENT_CONFIG = {
  id: "0b000013-0000-4000-8000-000000000002",
  organizationKey: "mumbaiUniversity",
  version: 1,
  purposes: ["alumni_updates", "event_photos"],
  languages: ["en", "hi", "mr"],
  position: "bottom_bar",
  primaryColor: "#1e3a8a",
  publishedOn: "2026-09-02",
  publishedByKey: "muLegal",
} as const;

/** Each identifier is hashed by the database (`app.consent_principal_key`) — never stored. */
export const SEED_CONSENT_RECORDS = {
  studentGiven: {
    id: "0b000013-0000-4000-8000-000000000011",
    identifier: "seed-student-0412@example.com",
    action: "given",
    purposes: ["alumni_updates", "event_photos"],
    recordedAt: "2026-09-10T05:30:00.000Z",
    reference: "Consent form CF-2026-0412",
  },
  alumnusGiven: {
    id: "0b000013-0000-4000-8000-000000000012",
    identifier: "seed-alumnus-0007@example.com",
    action: "given",
    purposes: ["alumni_updates"],
    recordedAt: "2026-09-12T05:30:00.000Z",
    reference: "Consent form CF-2026-0007",
  },
  alumnusWithdrawn: {
    id: "0b000013-0000-4000-8000-000000000013",
    identifier: "seed-alumnus-0007@example.com",
    action: "withdrawn",
    purposes: [],
    recordedAt: "2026-09-20T05:30:00.000Z",
    reference: "Email to the DPO, 20 Sep 2026",
  },
} as const;

// ---------------------------------------------------------------------------
// Slice 10 Stage 4a — processor assessments. 0b000014. For Mumbai University:
// the payment gateway's ACCEPTED assessment (entered by the CISO, accepted by
// Legal, with its signed contract and ISO certificate as documents) and the
// LMS provider's SUBMITTED one awaiting review (entered by the Registrar) —
// so the manual test shows both, and that the Registrar cannot review it.
// Scores, stamps and the frozen state are the database's; the seed only
// writes what a person would have entered.
// ---------------------------------------------------------------------------

const vendorDocId = (n: number) => `0b000014-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export const SEED_VENDOR_DOCUMENTS = {
  paymentsContract: {
    id: vendorDocId(1),
    linkId: vendorDocId(0x11),
    organizationId: MU,
    vendorKey: "paymentGateway",
    fileName: "payment-gateway-dpa-SAMPLE.txt",
    contentType: "text/plain",
    body:
      "SAMPLE ARTEFACT - seeded demonstration data, not a real document.\n\n" +
      "Data Processing Agreement (illustrative) between the University and its payment gateway provider, signed 1 Aug 2026.\n" +
      "Clause 7: the processor processes personal data only on the University's documented instructions.\n" +
      "Clause 9: the processor maintains reasonable security safeguards and notifies the University of a breach within 24 hours.\n",
    uploadedByKey: "muItSecurity",
    /** Reviewed by someone other than its uploader (D-043). */
    reviewedByKey: "consultant",
    reviewStatus: "adequate",
    evidenceLevel: 3,
  },
  paymentsIso: {
    id: vendorDocId(2),
    linkId: vendorDocId(0x12),
    organizationId: MU,
    vendorKey: "paymentGateway",
    fileName: "payment-gateway-iso27001-certificate-SAMPLE.txt",
    contentType: "text/plain",
    body:
      "SAMPLE ARTEFACT - seeded demonstration data, not a real document.\n\n" +
      "ISO/IEC 27001:2022 certificate (illustrative) for the payment gateway provider, valid to 30 Jun 2028.\n",
    uploadedByKey: "muItSecurity",
    reviewedByKey: null,
    reviewStatus: "pending",
    evidenceLevel: null,
  },
} as const;

/** An answer, a "not applicable" with its reason, or an answer citing one of the vendor's documents. */
export type SeedVendorAnswer = string | { na: string } | { answer: string; documentKey: keyof typeof SEED_VENDOR_DOCUMENTS };

export const SEED_VENDOR_ASSESSMENTS = {
  paymentsAccepted: {
    id: vendorDocId(0x21),
    organizationId: MU,
    vendorKey: "paymentGateway",
    version: 1,
    status: "accepted",
    sourceNote: "The vendor's completed security questionnaire of 2 Sep 2026, and its signed DPA",
    enteredByKey: "muItSecurity",
    createdAt: "2026-09-08T05:30:00.000Z",
    submittedAt: "2026-09-10T05:30:00.000Z",
    reviewedByKey: "muLegal",
    reviewedAt: "2026-09-15T05:30:00.000Z",
    reviewBy: "2027-09-15",
    answers: {
      A1: "Example Payments Private Limited (SAMPLE)", A2: "gt5", A3: { answer: "yes", documentKey: "paymentsIso" }, A4: "no", A5: "yes", A6: "yes",
      B1: "100kto1m", B2: "yes", B3: "yes", B4: "yes", B5: "no", B6: "partial", B7: "yes",
      // C4 is claimed with no penetration-test summary attached: it scores as the risky answer.
      C1: "yes", C2: "yes", C3: "yes", C4: "yes", C5: "yes", C6: "yes", C7: "yes", C8: "yes",
      D1: "yes", D2: "no", D3: "yes", D4: "yes", D5: "partial", D6: "no",
      E1: "yes", E2: "india", E3: "no", E4: { na: "No cross-border transfer: our data is stored and processed in India only." }, E5: "yes", E6: "yes",
      F1: "yes", F2: "le24", F3: "yes", F4: "no", F5: "yes", F6: "partial",
      G1: { answer: "yes", documentKey: "paymentsContract" }, G2: "yes", G3: "yes", G4: "yes", G5: "partial", G6: "yes",
    } satisfies Record<string, SeedVendorAnswer>,
  },
  lmsSubmitted: {
    id: vendorDocId(0x22),
    organizationId: MU,
    vendorKey: "lmsProvider",
    version: 1,
    status: "submitted",
    sourceNote: "Call with the LMS provider's account manager, 8 Oct 2026",
    enteredByKey: "mumbaiUniversity",
    createdAt: "2026-10-08T05:30:00.000Z",
    submittedAt: "2026-10-09T05:30:00.000Z",
    reviewedByKey: null,
    reviewedAt: null,
    reviewBy: null,
    // Three claims with no document (A3, C4, G1), and three flags for the reviewer: G1 against the
    // register's "no DPDP clauses", D1 against "sub-processors not known", E1 against E2.
    answers: {
      A1: "LMS provider (SAMPLE)", A2: "2to5", A3: "yes", A4: "no", A5: "no", A6: "yes",
      B1: "gt1m", B2: "yes", B3: "yes", B4: "partial", B5: "no", B6: "no", B7: "no",
      C1: "yes", C2: "yes", C3: "no", C4: "partial", C5: "partial", C6: "yes", C7: "yes", C8: "partial",
      D1: "no", D2: { na: "The vendor says it engages no sub-processors." }, D3: { na: "The vendor says it engages no sub-processors." }, D4: "yes",
      D5: { na: "The vendor says it engages no sub-processors." }, D6: "no",
      E1: "yes", E2: "apac", E3: "no", E4: "partial", E5: "yes", E6: "no",
      F1: "yes", F2: "le72", F3: "yes", F4: "no", F5: "partial", F6: "no",
      G1: "yes", G2: "yes", G3: "yes", G4: "yes", G5: "partial", G6: "yes",
    } satisfies Record<string, SeedVendorAnswer>,
  },
} as const;

/**
 * Slice 10 Stage 4b: MU's AI proctoring vendor answered its own questionnaire
 * through a link — started and SENT by Legal, so Legal may not review it
 * (D-092); awaiting review by a third person. The respondent uploaded one
 * document (a SOC 2 summary, cited on A4); A3 and D2 are claimed with none.
 * The link's token is random and never stored in the clear: nobody can open
 * it, and it is used up.
 */
export const SEED_VENDOR_LINK = {
  assessmentId: vendorDocId(0x23),
  linkId: vendorDocId(0x31),
  organizationId: MU,
  vendorKey: "proctoringVendor",
  sentByKey: "muLegal",
  respondentName: "Priya Menon (SAMPLE)",
  respondentEmail: "privacy@proctoring-vendor.example.com",
  sentAt: "2026-10-12T05:30:00.000Z",
  confirmedAt: "2026-10-13T04:30:00.000Z",
  submittedAt: "2026-10-13T06:30:00.000Z",
  declaredRole: "Information Security Manager (SAMPLE)",
  document: {
    id: vendorDocId(3),
    linkId: vendorDocId(0x13),
    organizationId: MU,
    fileName: "proctoring-vendor-soc2-summary-SAMPLE.txt",
    contentType: "text/plain",
    body:
      "SAMPLE ARTEFACT - seeded demonstration data, not a real document.\n\n" +
      "SOC 2 Type II report summary (illustrative) for the AI proctoring vendor, period 1 Apr 2025 - 31 Mar 2026.\n",
  },
  // B2 yes (children's data), stored outside India (E1 no, E2 global), sub-processors engaged
  // with a partial list and no document (D2), ISO claimed with no certificate (A3), no signed
  // contract with DPDP clauses (G1 no).
  answers: {
    A1: "AI proctoring vendor (SAMPLE)", A2: "2to5", A3: "yes", A4: "vendor_document", A5: "yes", A6: "yes",
    B1: "100kto1m", B2: "yes", B3: "yes", B4: "partial", B5: "no", B6: "partial", B7: "yes",
    C1: "yes", C2: "yes", C3: "yes", C4: "no", C5: "partial", C6: "yes", C7: "yes", C8: "yes",
    D1: "yes", D2: "partial", D3: "yes", D4: "yes", D5: "no", D6: "yes",
    E1: "no", E2: "global", E3: "no", E4: "partial", E5: "no", E6: "no",
    F1: "yes", F2: "le48", F3: "yes", F4: "no", F5: "yes", F6: "no",
    G1: "no", G2: "yes", G3: "yes", G4: "yes", G5: "yes", G6: "yes",
  } as Record<string, string>,
} as const;

const scopes: SeedScope[] = Object.values(SEED_SCOPE);
// ---------------------------------------------------------------------------
// Slice 10, Stage 5 — the retention register and the AI risk register. 0b000016.
// Mumbai University: a schedule for each of its ten ROPA records. SEED
// JUDGEMENT, fictional — every period is at least Rule 8(3)'s year, and a law
// named here is marked SAMPLE (not legal advice). Three states are shown:
//   * ROPA-009's event registrations: purpose served on 15 Feb 2025, kept a
//     year — past its end with NO erasure recorded → head 7 Exposed (1.5.0),
//     with one open action to erase them;
//   * ROPA-008's chatbot logs: ended 30 Jun 2026, erased on 10 Jul 2026 by IT;
//   * ROPA-003's SIS records: the purpose is still being served, so no end is
//     recorded — a reason on head 7, never a status (D-094.1).
// The AI proctoring system is in the AI risk register, never reviewed (it
// monitors children's behaviour under the A3 exemption — D-096): MU is
// not a Significant Data Fiduciary, so head 4 does not apply and the row
// changes no status. Bharat Manufacturing gets none: its empty registers are
// the empty state.
// ---------------------------------------------------------------------------

const retentionId = (n: number) => `0b000016-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export interface SeedRetentionSchedule {
  id: string;
  basis: "purpose_served" | "consent_withdrawn" | "fixed_period" | "legal_requirement";
  periodMonths: number;
  lawName: string | null;
  startsOn: string | null;
  notes: string | null;
}

export const SEED_RETENTION = {
  organizationKey: "mumbaiUniversity",
  recordedByKey: "muLegal",
  schedules: {
    "ROPA-001": { id: retentionId(1), basis: "fixed_period", periodMonths: 36, lawName: null, startsOn: "2025-08-31", notes: "Applications of the 2025 admission cycle, counted from its close." },
    "ROPA-002": { id: retentionId(2), basis: "legal_requirement", periodMonths: 120, lawName: "University examination record ordinance (SAMPLE)", startsOn: "2026-06-30", notes: null },
    "ROPA-003": { id: retentionId(3), basis: "purpose_served", periodMonths: 84, lawName: null, startsOn: null, notes: "Students still enrolled: the purpose is still being served." },
    "ROPA-004": { id: retentionId(4), basis: "fixed_period", periodMonths: 24, lawName: null, startsOn: "2025-05-31", notes: null },
    "ROPA-005": { id: retentionId(5), basis: "legal_requirement", periodMonths: 96, lawName: "Income-tax Act, 1961 — books of account (SAMPLE)", startsOn: "2026-03-31", notes: null },
    "ROPA-006": { id: retentionId(6), basis: "fixed_period", periodMonths: 60, lawName: null, startsOn: "2026-03-31", notes: null },
    "ROPA-007": { id: retentionId(7), basis: "fixed_period", periodMonths: 36, lawName: null, startsOn: "2026-06-30", notes: null },
    "ROPA-008": { id: retentionId(8), basis: "fixed_period", periodMonths: 12, lawName: null, startsOn: "2025-06-30", notes: "Chatbot conversation logs for the 2025 pilot." },
    "ROPA-009": { id: retentionId(9), basis: "purpose_served", periodMonths: 12, lawName: null, startsOn: "2025-02-15", notes: "Registrations for the February 2025 webinar series." },
    "ROPA-010": { id: retentionId(10), basis: "consent_withdrawn", periodMonths: 12, lawName: null, startsOn: "2026-09-01", notes: null },
  } satisfies Record<string, SeedRetentionSchedule>,
  erasure: {
    id: retentionId(0x21),
    recordCode: "ROPA-008",
    erasedOn: "2026-07-10",
    method: "deleted",
    processorsTold: "not_applicable",
    recordedByKey: "muItSecurity",
  },
  action: {
    id: retentionId(0x31),
    recordCode: "ROPA-009",
    title: "Erase the February 2025 webinar registrations from the events mailing tool and the shared drive",
    ownerKey: "muItSecurity",
    dueDate: "2026-11-15",
  },
} as const;

export const SEED_AI_SYSTEMS = {
  proctoring: {
    id: retentionId(0x41),
    organizationKey: "mumbaiUniversity",
    systemKey: "proctoring",
    usageType: "proctoring",
    name: "AI proctoring",
    purpose: "Remote invigilation of online examinations: flags possible malpractice for an examiner to review.",
    personalData: "Webcam video and audio, screen activity, an identity photograph, name and seat number.",
    // s.9(3): it monitors examinees' behaviour, some of them under 18; MU relies on
    // the Fourth Schedule's educational-institution exemption, A3 (D-096, R5).
    childTracking: "yes",
    childExemption: "education",
    humanReview: "An examiner reviews every flag before any action is taken against a student.",
    recordedByKey: "muLegal",
  },
} as const;

const count = (pick: (s: SeedScope) => object) => scopes.reduce((n, s) => n + Object.keys(pick(s)).length, 0);

/** Expected row counts after seeding — CI's idempotency step asserts these. */
export const SEED_COUNTS = {
  organizations: Object.keys(SEED_ORGS).length,
  users: Object.keys(SEED_USERS).length,
  memberships: Object.values(SEED_USERS).reduce((n, u) => n + u.memberships.length, 0),
  departments: count((s) => s.departments),
  systems: count((s) => s.systems),
  vendors: count((s) => s.vendors),
  vendorSystems: scopes.reduce((n, s) => n + Object.values(s.vendors).reduce((m, v) => m + v.systemKeys.length, 0), 0),
  dataPrincipalTypes: count((s) => s.dataPrincipalTypes),
  scopes: scopes.length,
  assessments: Object.keys(SEED_ASSESSMENTS).length,
  responses: Object.keys(SEED_RESPONSES).length,
  /** Slice 4's artefact, (Slice 10 Stage 4a) the payment gateway's two documents, and (4b) the proctoring vendor's own upload. */
  evidence: Object.keys(SEED_EVIDENCE).length + Object.keys(SEED_VENDOR_DOCUMENTS).length + 1,
  evidenceLinks: Object.keys(SEED_EVIDENCE).length + Object.keys(SEED_VENDOR_DOCUMENTS).length + 1,
  /**
   * Slice 5 seeds NO finalised score, on purpose. Finalising requires every
   * question answered (D-041), and MU's baseline has one answer out of 124 —
   * a half-answered "finalised" baseline would be a lie about what was
   * assessed. The e2e suite finalises its own throwaway assessments instead.
   */
  scoreSnapshots: 0,
  domainScores: 0,
  /**
   * Slice 6: one gap and one action, DERIVED from the one seeded answer
   * (G1.2: claim 5, E3 → adjusted 3 → Low / P3). Not a full register — MU's
   * baseline has one answer out of 124, and seeding 98 gaps would be a lie
   * about what was assessed.
   */
  gaps: Object.keys(SEED_RESPONSES).length,
  gapActions:
    Object.keys(SEED_RESPONSES).length +
    Object.keys(SEED_BREACHES).length +
    Object.values(SEED_RIGHTS_REQUESTS).filter((r) => "action" in r).length +
    1, // Slice 10 Stage 5: ROPA-009's overdue erasure
  /** Slice 7: the ten workbook records, for Mumbai University only. */
  ropaRecords: Object.keys(SEED_ROPA.records).length,
  ropaSystems: Object.values(SEED_ROPA.records).reduce((n, r: SeedRopaLinks) => n + r.systemKeys.length, 0),
  ropaVendors: Object.values(SEED_ROPA.records).reduce((n, r: SeedRopaLinks) => n + r.vendorKeys.length, 0),
  /**
   * No ROPA gap is seeded. They are generated on request (D-062), and one of
   * the twelve rules — "review overdue" — depends on today's date, so a seeded
   * count would change on the day the workbook's review dates pass.
   */
  ropaGaps: 0,
  /** Slice 10: MU's one past breach and its one remedial action (in the gap_actions count above, too). */
  breachIncidents: Object.keys(SEED_BREACHES).length,
  /** Slice 10 Stage 2: MU's access request and grievance, and the grievance's one action (in gapActions too). */
  rightsRequests: Object.keys(SEED_RIGHTS_REQUESTS).length,
  /** Slice 10 Stage 3b: MU's notice v1, its widget v1, and three staff-recorded consents (two people). */
  privacyNotices: 1,
  consentConfigs: 1,
  consentRecords: Object.keys(SEED_CONSENT_RECORDS).length,
  /** Slice 10 Stage 4a: MU's payment gateway (accepted) and LMS provider (awaiting review); 4b: the proctoring vendor's, answered by the vendor. */
  vendorAssessments: Object.keys(SEED_VENDOR_ASSESSMENTS).length + 1,
  vendorAssessmentAnswers:
    Object.values(SEED_VENDOR_ASSESSMENTS).reduce((n, a) => n + Object.keys(a.answers).length, 0) + Object.keys(SEED_VENDOR_LINK.answers).length,
  /** Slice 10 Stage 4b: the one link, used up by the vendor's submission. */
  vendorAssessmentLinks: 1,
  /** Slice 10 Stage 5: a schedule for each of MU's ten records, one erasure, and the AI proctoring row. */
  retentionSchedules: Object.keys(SEED_RETENTION.schedules).length,
  retentionErasures: 1,
  aiSystems: Object.keys(SEED_AI_SYSTEMS).length,
} as const;
