import { pickAllowed } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Draft a record from a description" (SLICE_11 §2.3, §7b.4; Stage 2a) — on the
 * processing register. Read with `ropa.read`, decided with `ropa.write` (§4.7,
 * D-129.3). The person describes an activity in their own words; the model
 * drafts the create form's text fields; accepting pre-fills
 * `/dashboard/ropa/new` and the person saves through the register's own route.
 *
 * What it sends: the person's description (untrusted, scrubbed), the
 * organisation, and the NAMES of its departments and data-principal types (so
 * the draft uses the organisation's own words). Never: a person's name, an
 * owner, a record's free text, a system's or vendor's details (§4.6).
 */

export const ropaDraftBody = z
  .object({
    description: z.string().trim().min(20, "Describe the activity in a sentence or two.").max(2000),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type RopaDraftBody = z.infer<typeof ropaDraftBody>;

export interface RopaDraftRaw {
  organisation: OrganisationRaw;
  departments: readonly Record<string, unknown>[];
  dataPrincipalTypes: readonly Record<string, unknown>[];
  description: string;
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;

export function shapeRopaDraftContext(raw: RopaDraftRaw, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  // Names only, and few: the organisation's own words for its parts and its people.
  const departments = raw.departments
    .slice(0, 40)
    .map((d) => clean(pickAllowed(d, ["name"] as const).name, false))
    .filter((n): n is string => n !== null);
  const principalTypes = raw.dataPrincipalTypes
    .slice(0, 40)
    .map((p) => {
      const t = pickAllowed(p, ["label", "includesChildren"] as const);
      return { label: clean(t.label, false), includesChildren: t.includesChildren === true };
    })
    .filter((p) => p.label !== null);
  const untrusted = { description: clean(raw.description, true) };
  const ask = clean(raw.ask, true);

  const context = { task: "ropa_draft", organisation, departments, dataPrincipalTypes: principalTypes, untrusted, ask };
  const user = userTurn(
    "Draft ONE entry for the organisation's processing register (its record of processing activities) from the person's description. Fill only what the description supports; leave a field an empty string, or 'unknown', where it does not say — never invent a system, a vendor, a retention period or a safeguard. Use the organisation's own department and data-principal-type names where they fit. The lawful basis is only a suggestion for counsel to confirm (s.4, s.6, s.7) — choose 'not_sure' when the description does not make it clear. Mark childrenData 'yes' if children's data may be involved (s.9). A person checks every field and saves the record; you save nothing. Put what a person must still add in missingInformation.",
    [
      { tag: "organisation", value: organisation },
      { tag: "departments", value: departments },
      { tag: "data_principal_types", value: principalTypes },
      { tag: "untrusted_data", value: untrusted, untrusted: true },
    ],
    ask,
    untrustedJson,
  );
  return {
    context,
    user,
    injectionFlagged: cleaner.injectionFlagged,
    scrubbed: cleaner.scrubbed,
    target: { type: "ropa_new", id: null, key: null },
  };
}
