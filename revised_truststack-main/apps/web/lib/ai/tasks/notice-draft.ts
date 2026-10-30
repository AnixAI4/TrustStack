import { AI_NOTICE_SOURCE_RECORDS, isNoticeSource, pickAllowed, ROPA_LAWFUL_BASES, type RopaLawfulBasis } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Draft a notice from the processing register" (SLICE_11 §2.3, §7c.4; Stage 2b) — on
 * the Notice and consent page. Read with `consent.read`, decided with `consent.write`
 * (§4.7); the person saves and publishes through the notice's own routes.
 *
 * s.5(1): a notice accompanies a request for CONSENT. So it is drafted from the
 * records whose lawful basis is consent or not yet decided (D-133.3) — never an s.7
 * legitimate use or an s.17 exemption. Rule 3(b) is drafted (the itemised data, the
 * purposes and what they enable); Rule 3(c)'s withdrawal and Board texts are
 * TrustStack's fixed words and the contact is printed by TrustStack — never drafted.
 *
 * What it sends, per record: its name, purpose, kinds of personal data, the NAMES of
 * whose data (the kinds of people, never a person), the lawful basis, and whether
 * children's data is involved — free text as untrusted data, scrubbed. And the
 * current published notice's purpose keys and titles, so a purpose already consented
 * to keeps its key. Never: an owner, a department head, a system's or a vendor's
 * details, an approver, counts of people (§4.6).
 */

export const noticeDraftBody = z
  .object({
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type NoticeDraftBody = z.infer<typeof noticeDraftBody>;

export interface NoticeDraftRaw {
  organisation: OrganisationRaw;
  /** The register's own rows (`readAllRecords`); this builder keeps the consent-based, live ones. */
  records: readonly (Record<string, unknown> & { lawful_basis: string | null; status: string })[];
  /** The newest published notice in English, if any: its purposes' keys and titles. */
  currentPurposes: readonly Record<string, unknown>[];
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const RECORD_FIELDS = ["record_code", "name", "purpose", "data_categories", "data_principal_types", "lawful_basis", "children_data", "status"] as const;

/** Which records a notice is drafted from: consent or undecided, not archived, at most thirty. */
export function noticeSourceRecords<T extends { lawful_basis: string | null; status: string }>(records: readonly T[]): T[] {
  return records
    .filter((r) => r.status !== "archived" && isNoticeSource(r.lawful_basis as RopaLawfulBasis | null))
    .slice(0, AI_NOTICE_SOURCE_RECORDS);
}

export function shapeNoticeDraftContext(raw: NoticeDraftRaw, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };

  const records = noticeSourceRecords(raw.records).map((row) => {
    const r = pickAllowed(row, RECORD_FIELDS);
    const basis = r.lawful_basis as RopaLawfulBasis | null;
    return {
      lawfulBasis: basis ? (ROPA_LAWFUL_BASES.find((b) => b.code === basis)?.label ?? null) : "Not yet decided — a note for counsel",
      childrenData: r.children_data === "yes",
      // The register's free text — written by people.
      name: clean(r.name, true),
      purpose: clean(r.purpose, true),
      dataCategories: clean(r.data_categories, true),
      whoseData: clean(r.data_principal_types, true),
    };
  });
  const currentPurposes = raw.currentPurposes.slice(0, 20).map((p) => {
    const c = pickAllowed(p, ["key", "title"] as const);
    return { key: typeof c.key === "string" ? c.key : null, title: clean(c.title, true) };
  });
  const untrusted = { records: records.map(({ lawfulBasis: _b, childrenData: _c, ...text }) => text), currentPurposes };
  const facts = records.map((r, i) => ({ record: i + 1, lawfulBasis: r.lawfulBasis, childrenData: r.childrenData }));
  const ask = clean(raw.ask, true);

  const context = { task: "notice_draft", organisation, recordFacts: facts, untrusted, ask };
  const user = userTurn(
    "Draft the organisation's privacy notice — the notice that accompanies its request for consent (s.5(1), s.6; Rule 3) — from these processing records, which are the ones that rely on consent or whose basis is not yet decided. Write in clear and plain English that a person can understand on its own (Rule 3(a)). Make one purpose for each specified purpose consent is asked for; say what it provides or enables, and itemise the personal data it needs (Rule 3(b)). Where a current purpose already covers the same thing, KEEP ITS KEY: people have consented under that key. Never describe a legitimate use under s.7 as needing consent. Do NOT write how to withdraw consent, how to complain to the Board, or a contact: TrustStack prints those on every notice in fixed words. Never name a person, an email address or a phone number. In law, cite at least one provision the notice rests on (for example s.5(1) and Rule 3). Keep each missingInformation note to one or two sentences. Where a record involves children's data, say in that purpose's uses that a parent's or lawful guardian's verifiable consent is asked for (s.9(1)). A person and counsel check it and publish it; you publish nothing.",
    [
      { tag: "organisation", value: organisation },
      { tag: "record_facts", value: facts },
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
    target: { type: "notice_new", id: null, key: null },
  };
}
