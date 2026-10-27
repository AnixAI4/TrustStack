/** Organisation profile - replace before organisational use. */
export const SAMPLE = {
  org: "Acme Digital Solutions Private Limited",
  orgShort: "Acme Digital",
  cin: "U72900MH2019PTC328417",
  address: "Unit 402, Peninsula Business Park, Senapati Bapat Marg, Lower Parel, Mumbai 400013, Maharashtra, India",
  website: "https://www.acmedigital.in",
  privacy: "privacy@acmedigital.in",
  grievanceName: "Priya Sharma",
  grievanceTitle: "Grievance Officer",
  grievanceEmail: "grievance@acmedigital.in",
  grievancePhone: "+91 22 4890 2100",
  dpo: "Rahul Mehta",
  dpoTitle: "Chief Compliance Officer",
  legalEntity: "a company incorporated under the Companies Act, 2013",
};

export const DISCLAIMER =
  "CONFIDENTIAL TEMPLATE - This document contains sample organisational details for illustration only. Replace all references to Acme Digital Solutions Private Limited with your entity's particulars and obtain qualified legal review before execution or publication.";

export const DOC_REGISTRY = {
  "consent-form": { id: "ACME-FRM-001", classification: "External", owner: "Compliance" },
  "rights-request-form": { id: "ACME-FRM-002", classification: "External", owner: "Compliance" },
  "consent-withdrawal": { id: "ACME-FRM-003", classification: "External", owner: "Compliance" },
  "privacy-policy": { id: "ACME-POL-001", classification: "Public", owner: "Legal & Compliance" },
  "data-retention-policy": { id: "ACME-POL-002", classification: "Internal", owner: "Compliance" },
  "data-protection-policy": { id: "ACME-POL-003", classification: "Internal", owner: "Board / Compliance" },
  "cookie-policy": { id: "ACME-POL-004", classification: "Public", owner: "Legal & Compliance" },
  "employee-data-policy": { id: "ACME-POL-005", classification: "Internal", owner: "Human Resources" },
  "dpia": { id: "ACME-REC-001", classification: "Internal - Restricted", owner: "Compliance" },
  "ropa": { id: "ACME-REC-002", classification: "Internal - Restricted", owner: "Compliance" },
  "dpa": { id: "ACME-AGR-001", classification: "Confidential", owner: "Legal" },
  "cross-border-transfer": { id: "ACME-AGR-002", classification: "Confidential", owner: "Legal" },
  "vendor-dpa": { id: "ACME-AGR-003", classification: "Confidential", owner: "Legal" },
  "breach-notice": { id: "ACME-INC-001", classification: "Confidential", owner: "Compliance" },
  "breach-playbook": { id: "ACME-INC-002", classification: "Internal - Restricted", owner: "CISO" },
};

export function buildDocControl(slug, title) {
  const reg = DOC_REGISTRY[slug] ?? { id: "ACME-DOC-000", classification: "Internal", owner: "Compliance" };
  return {
    type: "doccontrol",
    rows: [
      ["Document reference", reg.id],
      ["Document title", title],
      ["Version", "2.0"],
      ["Classification", reg.classification],
      ["Document owner", reg.owner],
      ["Effective date", "01 April 2026"],
      ["Next scheduled review", "01 April 2027"],
      ["Applicable law", "DPDP Act, 2023 · DPDP Rules, 2025"],
    ],
  };
}

export function approvalBlock(signatory = SAMPLE.dpo, title = SAMPLE.dpoTitle) {
  return [
    { type: "divider" },
    { type: "heading", text: "Document approval" },
    {
      type: "table",
      headers: ["Role", "Name", "Signature", "Date"],
      rows: [
        ["Prepared by", "Compliance Team", "", ""],
        ["Reviewed by", `${SAMPLE.grievanceName}, ${SAMPLE.grievanceTitle}`, "", ""],
        ["Approved by", `${signatory}, ${title}`, "", ""],
      ],
    },
  ];
}
