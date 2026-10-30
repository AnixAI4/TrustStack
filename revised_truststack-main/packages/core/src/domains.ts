/**
 * The 16-domain DPDP Compass model (Slice 3). Pure data + invariants, no I/O.
 *
 * Weights come from the workbook's `Config` sheet, which is authoritative
 * (D-006). The `Question_Bank` sheet also carries a `Domain Weight` column —
 * it is STALE and totals 104. Never seed or score from it.
 *
 * The 100-point total is a DPDP invariant (CLAUDE.md): overlay and process
 * packs add questions to these domains, never a separate score, and the total
 * stays at 100 however many questions a domain gains (D-014).
 */

export const DOMAIN_CODES = [
  "GOV", "INV", "ROPA", "PURPOSE", "NOTICE", "CONSENT", "RIGHTS", "GRIEVANCE",
  "RETENTION", "ACCURACY", "SECURITY", "BREACH", "VENDOR", "CHILD",
  "CROSSBORDER", "SDF_AI",
] as const;
export type DomainCode = (typeof DOMAIN_CODES)[number];

export function isDomainCode(value: string): value is DomainCode {
  return (DOMAIN_CODES as readonly string[]).includes(value);
}

/** Default applicability as authored in `Config`; the assessment may still mark N/A. */
export const DOMAIN_APPLICABILITIES = ["mandatory", "conditional", "mandatory_where_vendors_exist"] as const;
export type DomainApplicability = (typeof DOMAIN_APPLICABILITIES)[number];

export interface DpdpDomain {
  /** `D01`…`D16` — the workbook's identifier, kept for oracle parity (D-007). */
  domainId: string;
  code: DomainCode;
  name: string;
  /** Percentage points of the 100-point model. */
  weight: number;
  defaultApplicability: DomainApplicability;
  defaultOwner: string;
  sortOrder: number;
}

/** `Config` rows D01–D16, verbatim. Order is the report and dashboard order. */
export const DPDP_DOMAINS: readonly DpdpDomain[] = Object.freeze([
  { domainId: "D01", code: "GOV", name: "Governance, accountability and DPDP ownership", weight: 7, defaultApplicability: "mandatory", defaultOwner: "Executive Sponsor / DPDP Owner", sortOrder: 1 },
  { domainId: "D02", code: "INV", name: "Personal data discovery and inventory", weight: 8, defaultApplicability: "mandatory", defaultOwner: "IT + Process Owners", sortOrder: 2 },
  { domainId: "D03", code: "ROPA", name: "ROPA / Records of Processing Activities", weight: 6, defaultApplicability: "mandatory", defaultOwner: "DPDP Owner + Process Owners", sortOrder: 3 },
  { domainId: "D04", code: "PURPOSE", name: "Purpose, lawful basis and data minimisation", weight: 7, defaultApplicability: "mandatory", defaultOwner: "Legal + Process Owners", sortOrder: 4 },
  { domainId: "D05", code: "NOTICE", name: "Notice management", weight: 7, defaultApplicability: "mandatory", defaultOwner: "Legal + IT", sortOrder: 5 },
  { domainId: "D06", code: "CONSENT", name: "Consent and consent withdrawal", weight: 7, defaultApplicability: "conditional", defaultOwner: "Legal + IT + Process Owners", sortOrder: 6 },
  { domainId: "D07", code: "RIGHTS", name: "Data Principal rights", weight: 7, defaultApplicability: "mandatory", defaultOwner: "Legal + Registrar / Customer Ops", sortOrder: 7 },
  { domainId: "D08", code: "GRIEVANCE", name: "Grievance redressal and contact publication", weight: 5, defaultApplicability: "mandatory", defaultOwner: "Legal + DPDP Owner", sortOrder: 8 },
  { domainId: "D09", code: "RETENTION", name: "Retention, erasure and archival", weight: 6, defaultApplicability: "mandatory", defaultOwner: "Legal + Records Owners + IT", sortOrder: 9 },
  { domainId: "D10", code: "ACCURACY", name: "Data accuracy and quality", weight: 4, defaultApplicability: "mandatory", defaultOwner: "Data Owners + IT", sortOrder: 10 },
  { domainId: "D11", code: "SECURITY", name: "Security safeguards", weight: 10, defaultApplicability: "mandatory", defaultOwner: "IT / CISO / Security", sortOrder: 11 },
  { domainId: "D12", code: "BREACH", name: "Personal data breach readiness", weight: 8, defaultApplicability: "mandatory", defaultOwner: "IT/Security + Legal", sortOrder: 12 },
  { domainId: "D13", code: "VENDOR", name: "Vendor / Data Processor governance", weight: 7, defaultApplicability: "mandatory_where_vendors_exist", defaultOwner: "Procurement + Legal + IT", sortOrder: 13 },
  { domainId: "D14", code: "CHILD", name: "Children's data and guardian consent", weight: 4, defaultApplicability: "conditional", defaultOwner: "Admissions + Legal + IT", sortOrder: 14 },
  { domainId: "D15", code: "CROSSBORDER", name: "Cross-border transfer and cloud/SaaS risk", weight: 3, defaultApplicability: "conditional", defaultOwner: "IT + Procurement + Legal", sortOrder: 15 },
  { domainId: "D16", code: "SDF_AI", name: "SDF, DPIA, audit and AI/algorithmic risk readiness", weight: 4, defaultApplicability: "conditional", defaultOwner: "Legal + AI Governance + IT", sortOrder: 16 },
]);

export const DOMAIN_WEIGHT_TOTAL = 100;

/** Spec error code — the name CI reports when the invariant breaks. */
export const DOMAIN_WEIGHT_TOTAL_INVALID = "DOMAIN_WEIGHT_TOTAL_INVALID";

export class DomainWeightTotalError extends Error {
  readonly code = DOMAIN_WEIGHT_TOTAL_INVALID;
  constructor(readonly total: number) {
    super(`${DOMAIN_WEIGHT_TOTAL_INVALID}: active domain weights total ${total}, expected ${DOMAIN_WEIGHT_TOTAL}`);
    this.name = "DomainWeightTotalError";
  }
}

/**
 * Throws unless the weights total exactly 100. Called by the seeder, the
 * migration's mirror test and (from Slice 5) the scoring engine — anything that
 * would silently produce a score out of the wrong denominator.
 */
export function assertDomainWeightsTotal(domains: readonly Pick<DpdpDomain, "weight">[] = DPDP_DOMAINS): void {
  const total = domains.reduce((sum, d) => sum + d.weight, 0);
  // Integer arithmetic today; rounded so a future fractional weight cannot
  // fail on float error alone.
  if (Math.round(total * 100) / 100 !== DOMAIN_WEIGHT_TOTAL) throw new DomainWeightTotalError(total);
}

export function domainByCode(code: string): DpdpDomain | undefined {
  return DPDP_DOMAINS.find((d) => d.code === code);
}

export function domainWeight(code: DomainCode): number {
  return domainByCode(code)!.weight;
}

/** Report/dashboard ordering: domain sort order, then question code. */
export function domainSortOrder(code: DomainCode): number {
  return domainByCode(code)!.sortOrder;
}
