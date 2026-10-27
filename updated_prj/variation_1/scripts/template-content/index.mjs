import forms from "./forms.mjs";
import policies from "./policies.mjs";
import agreements from "./agreements.mjs";
import breach from "./breach.mjs";
import { buildDocControl, approvalBlock } from "./org.mjs";

const POLICY_SLUGS = new Set([
  "privacy-policy",
  "data-retention-policy",
  "data-protection-policy",
  "cookie-policy",
  "employee-data-policy",
]);

const AGREEMENT_SLUGS = new Set(["dpa", "cross-border-transfer", "vendor-dpa"]);

function wrap(slug, { title, sections }) {
  const out = {
    title,
    sections: [buildDocControl(slug, title), ...sections],
  };
  if (POLICY_SLUGS.has(slug)) {
    out.sections.push(...approvalBlock());
  }
  if (AGREEMENT_SLUGS.has(slug)) {
    out.sections.push(
      { type: "divider" },
      { type: "heading", text: "Execution" },
      {
        type: "table",
        headers: ["Party", "Authorised signatory", "Designation", "Signature", "Date"],
        rows: [
          ["Data Fiduciary", "", "Director / Authorised Representative", "", ""],
          ["Data Processor / Counterparty", "", "Director / Authorised Representative", "", ""],
        ],
      }
    );
  }
  return out;
}

const raw = { ...forms, ...policies, ...agreements, ...breach };

export const TEMPLATE_CONTENT = Object.fromEntries(
  Object.entries(raw).map(([slug, body]) => [slug, wrap(slug, body)])
);
