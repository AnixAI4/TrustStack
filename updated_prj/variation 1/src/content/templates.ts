export type TemplateCat = "policies" | "agreements" | "forms" | "breach";

export type Template = {
  slug: string;
  title: string;
  summary: string;
  /** Benefit-led description shown on the preview page. */
  overview: string;
  /** When and by whom the document should be used. */
  use: string;
  cat: TemplateCat;
  /** One-time unlock price in INR (view-only). */
  priceInr: number;
  file: string;
  pdf: string;
};

export const TEMPLATE_FILTERS: { key: TemplateCat | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "policies", label: "Policies" },
  { key: "agreements", label: "Agreements" },
  { key: "forms", label: "Forms & notices" },
  { key: "breach", label: "Breach" },
];

export const TEMPLATE_CAT_META: Record<
  TemplateCat,
  { label: string; badge: string }
> = {
  policies: { label: "Policy", badge: "badge-blue" },
  agreements: { label: "Agreement", badge: "badge-gold" },
  forms: { label: "Form", badge: "badge" },
  breach: { label: "Breach", badge: "badge-red" },
};

function tpl(
  entry: Omit<Template, "file" | "pdf">
): Template {
  return {
    ...entry,
    file: `/templates/${entry.slug}.docx`,
    pdf: `/templates/${entry.slug}.pdf`,
  };
}

export const TEMPLATES: Template[] = [
  tpl({
    slug: "consent-form",
    title: "Consent form for data processing",
    summary: "Section 6-ready consent capture form with purpose and withdrawal",
    overview:
      "A Section 6-ready form that captures free, specific and informed consent for each purpose separately, with itemised opt-ins, the data categories involved and a clear withdrawal route.",
    use: "Use at sign-up, KYC or any point you collect personal data on a consent basis - online or on paper.",
    cat: "forms",
    priceInr: 99,
  }),
  tpl({
    slug: "rights-request-form",
    title: "Data subject rights request form",
    summary: "Intake form for access, correction, erasure and nomination requests",
    overview:
      "A single intake form for access, correction, erasure and nomination requests, with identity-verification steps and an office-use tracking block built in.",
    use: "Publish on your privacy page and give to your Grievance Officer to log and action every Data Principal request.",
    cat: "forms",
    priceInr: 99,
  }),
  tpl({
    slug: "consent-withdrawal",
    title: "Consent withdrawal request",
    summary: "A simple form letting principals withdraw consent as easily as giving it",
    overview:
      "A plain-language notice that lets a Data Principal withdraw consent as easily as they gave it, spelling out the exact actions and timelines you must honour.",
    use: "Offer wherever you collect consent so withdrawal is one form away, as the Act requires.",
    cat: "forms",
    priceInr: 49,
  }),
  tpl({
    slug: "privacy-policy",
    title: "Privacy policy template",
    summary: "A complete website privacy policy aligned to Section 5 notice duties",
    overview:
      "A complete, Section 5-compliant website and app privacy notice - data collected, purposes, lawful bases, sharing, cross-border transfers, retention and rights - ready to publish.",
    use: "Adapt for your website, app and product to meet the itemised notice duty under Section 5.",
    cat: "policies",
    priceInr: 99,
  }),
  tpl({
    slug: "data-retention-policy",
    title: "Data retention policy",
    summary: "Storage-limitation schedule with erasure timelines by data category",
    overview:
      "A storage-limitation schedule mapping every data category to a retention period, legal basis and erasure method, plus a six-step deletion workflow and exceptions.",
    use: "Adopt internally to prove Section 8(5) storage limitation and drive automated purge jobs.",
    cat: "policies",
    priceInr: 99,
  }),
  tpl({
    slug: "data-protection-policy",
    title: "Data protection policy",
    summary: "An organisation-wide policy covering governance, roles and safeguards",
    overview:
      "An organisation-wide governance policy covering roles, data-protection principles, lawful processing, security safeguards, breach handling, training and SDF obligations.",
    use: "Use as your master internal policy that every employee, contractor and processor is bound by.",
    cat: "policies",
    priceInr: 199,
  }),
  tpl({
    slug: "cookie-policy",
    title: "Cookie policy template",
    summary: "Disclose cookies and trackers with consent categories",
    overview:
      "A cookie and tracker disclosure with a full inventory table, consent categories, retention per cookie and browser-control guidance.",
    use: "Pair with your consent banner to disclose every cookie and honour consent-first tracking.",
    cat: "policies",
    priceInr: 49,
  }),
  tpl({
    slug: "employee-data-policy",
    title: "Employee data protection policy",
    summary: "How employee personal data is collected, used and retained",
    overview:
      "How employee, contractor and applicant data is collected, monitored, shared and retained - including workplace monitoring limits and exit procedures.",
    use: "Give to HR and issue to staff to govern employee personal data lawfully.",
    cat: "policies",
    priceInr: 99,
  }),
  tpl({
    slug: "dpia",
    title: "DPIA template",
    summary: "A Data Protection Impact Assessment for high-risk processing",
    overview:
      "A worked Data Protection Impact Assessment - processing description, risk matrix, mitigations and sign-off - modelled on a real high-risk AI use case, with a blank version to reuse.",
    use: "Run before launching high-risk or large-scale processing, especially as a Significant Data Fiduciary.",
    cat: "policies",
    priceInr: 199,
  }),
  tpl({
    slug: "ropa",
    title: "Record of Processing (RoPA)",
    summary: "An inventory of what data you process, why, and with whom",
    overview:
      "A Record of Processing Activities register: a live inventory of what you process, why, on what basis, with whom, for how long and where it flows, plus a processor register.",
    use: "Maintain and review quarterly as your core accountability record under the Act.",
    cat: "policies",
    priceInr: 199,
  }),
  tpl({
    slug: "dpa",
    title: "Data Processing Agreement (DPA)",
    summary: "Controller-processor terms with security and sub-processor clauses",
    overview:
      "Controller-processor terms covering processing scope, security measures, sub-processor controls, breach notice, audit rights and deletion - including worked annexes.",
    use: "Sign with any vendor that processes personal data on your documented instructions.",
    cat: "agreements",
    priceInr: 149,
  }),
  tpl({
    slug: "cross-border-transfer",
    title: "Cross-border transfer agreement",
    summary: "Contractual safeguards for processing personal data outside India",
    overview:
      "Contractual safeguards for moving personal data outside India, aligned to Section 16, with a transfer register and equivalent-protection obligations on the importer.",
    use: "Put in place before any international or intra-group transfer of personal data.",
    cat: "agreements",
    priceInr: 149,
  }),
  tpl({
    slug: "vendor-dpa",
    title: "Vendor / sub-processor DPA",
    summary: "Flow-down obligations for vendors handling personal data on your behalf",
    overview:
      "Flow-down data-protection obligations for vendors and sub-processors, with a security schedule, sub-processor register and breach and deletion clauses.",
    use: "Attach to vendor and MSA contracts where a supplier handles personal data for you.",
    cat: "agreements",
    priceInr: 149,
  }),
  tpl({
    slug: "breach-notice",
    title: "Notice of data breach",
    summary: "Templates to inform affected principals and the Data Protection Board",
    overview:
      "A ready notification pack - a completed sample plus blank templates - to inform the Data Protection Board and affected Data Principals with the right detail.",
    use: "Keep on hand to notify the Board and individuals quickly and correctly when a breach occurs.",
    cat: "breach",
    priceInr: 149,
  }),
  tpl({
    slug: "breach-playbook",
    title: "Breach response playbook",
    summary: "A step-by-step runbook for triaging and reporting a data breach",
    overview:
      "A four-phase incident runbook - detect, assess, notify, recover - with roles, escalation triggers and a post-incident review template.",
    use: "Adopt as your standing breach-response procedure and rehearse it with your team.",
    cat: "breach",
    priceInr: 199,
  }),
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
