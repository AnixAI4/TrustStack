export const SECURITY_LEGAL_REFERENCE_IDS = [
  "DPDP_ACT_S8",
  "DPDP_ACT_S8_1",
  "DPDP_ACT_S8_5",
  "DPDP_ACT_S8_6",
  "DPDP_RULE_6",
  "DPDP_RULE_7",
] as const;

export type LegalReferenceId = (typeof SECURITY_LEGAL_REFERENCE_IDS)[number];

type SecurityLegalReference = {
  label: string;
  href: "/section/8" | "/rules/6" | "/rules/7";
  summary: string;
};

export const SECURITY_LEGAL_REFS = {
  DPDP_ACT_S8: {
    label: "DPDP Act, Section 8",
    href: "/section/8",
    summary:
      "General obligations of a Data Fiduciary, including accountability, safeguards, breach response and contactability.",
  },
  DPDP_ACT_S8_1: {
    label: "DPDP Act, Section 8(1)",
    href: "/section/8",
    summary:
      "The Data Fiduciary remains responsible for obligations, including processing undertaken on its behalf.",
  },
  DPDP_ACT_S8_5: {
    label: "DPDP Act, Section 8(5)",
    href: "/section/8",
    summary:
      "Reasonable security safeguards must be taken to prevent a personal data breach.",
  },
  DPDP_ACT_S8_6: {
    label: "DPDP Act, Section 8(6)",
    href: "/section/8",
    summary:
      "A personal data breach must be notified to the Board and affected Data Principals in the prescribed form and manner.",
  },
  DPDP_RULE_6: {
    label: "DPDP Rules, Rule 6",
    href: "/rules/6",
    summary:
      "Reasonable security safeguards, including relevant technical and organisational measures.",
  },
  DPDP_RULE_7: {
    label: "DPDP Rules, Rule 7",
    href: "/rules/7",
    summary:
      "Intimation requirements following a personal data breach, including the Board timeline.",
  },
} as const satisfies Record<LegalReferenceId, SecurityLegalReference>;

export const SECURITY_LEGAL_REFERENCE_OPTIONS = SECURITY_LEGAL_REFERENCE_IDS.map((id) => ({
  id,
  label: SECURITY_LEGAL_REFS[id].label,
  summary: SECURITY_LEGAL_REFS[id].summary,
}));