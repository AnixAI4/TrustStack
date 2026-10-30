/**
 * Who the personal data was shared with — the s.11(1)(b) list for an access
 * request (fix after Slice 11, D-139).
 *
 * s.11(1): a Data Principal who gave consent (including under s.7(a)) may
 * obtain "(b) the identities of all other Data Fiduciaries and Data
 * Processors with whom the personal data has been shared by such Data
 * Fiduciary, along with a description of the personal data so shared".
 * s.11(2): (b) does not cover sharing with a fiduciary authorised by law that
 * asked in writing to prevent, detect or investigate offences or cyber
 * incidents, or to prosecute or punish offences.
 *
 * TrustStack compiles the candidate list from the processing register: each
 * record's linked processors (the Slice 2 vendor register) and its free-text
 * "who it is shared with". A rights request is not tied to records, so this is
 * the ORGANISATION's list. A person decides which entries concern the
 * requester and what goes in the reply (s.12(3)-style judgement stays human,
 * D-129.2). Pure: no I/O, the caller supplies rows its own readers returned.
 */
import type { RopaLawfulBasis } from "./ropa.js";
import type { VendorRole } from "./scope.js";

/** The bases s.11(1) reaches: consent (s.6) and a voluntary specified purpose (s.7(a)). */
export const SHARING_IN_SCOPE_BASES = ["consent", "voluntary"] as const satisfies readonly RopaLawfulBasis[];

export interface SharingSourceVendor {
  name: string;
  service: string | null;
  role: VendorRole;
}

export interface SharingSourceRecord {
  recordCode: string;
  name: string;
  /** `draft` · `in_review` · `approved` · `archived`. */
  status: string;
  lawfulBasis: RopaLawfulBasis | null;
  dataCategories: string | null;
  /** Free text: "who it is shared with". */
  sharing: string | null;
  vendors: readonly SharingSourceVendor[];
}

/** How the register classifies a recipient — never inferred beyond what it says. */
export type SharingRecipientKind = "data_processor" | "data_fiduciary" | "not_classified";

export const SHARING_RECIPIENT_KIND_LABEL: Readonly<Record<SharingRecipientKind, string>> = Object.freeze({
  data_processor: "Data Processor",
  data_fiduciary: "Another Data Fiduciary",
  not_classified: "Not yet classified in the processor register",
});

export interface SharingRecord {
  recordCode: string;
  name: string;
  /** The record's own "kinds of personal data" — the description s.11(1)(b) asks for. */
  dataCategories: string | null;
  /** True when the record's lawful basis is not yet decided: s.11 may or may not reach it. */
  basisUndecided: boolean;
  approved: boolean;
}

export interface SharingRecipient {
  name: string;
  kind: SharingRecipientKind;
  service: string | null;
  /** The processing records that share data with this recipient, in record-code order. */
  records: SharingRecord[];
}

export interface SharingNamedText {
  /** The record's "who it is shared with", as written. */
  text: string;
  record: SharingRecord;
}

export interface SharingList {
  /** Recipients from the processor register, by name. */
  recipients: SharingRecipient[];
  /** Records that name recipients only in free text — a person reads these. */
  namedInRecords: SharingNamedText[];
  counts: {
    /** Non-archived records read. */
    recordsRead: number;
    /** Of those, records s.11 reaches (consent, s.7(a)) or may reach (undecided). */
    recordsInScope: number;
    /** In scope but with no decided basis. */
    recordsUndecided: number;
    /** Another s.7 use or an exemption: s.11 does not reach them. */
    recordsOutOfScope: number;
    /** In scope and sharing nothing the register knows of. */
    recordsSharingNothing: number;
  };
}

const KIND_OF: Readonly<Record<VendorRole, SharingRecipientKind>> = Object.freeze({
  data_processor: "data_processor",
  independent: "data_fiduciary",
  unknown: "not_classified",
});

/** "None", "nil", "-" and the like mean no sharing; anything else is read by a person. */
const NOTHING = /^(?:none|nil|no|n\/?a|not shared|no sharing|-+|—)\.?$/i;

function meaningful(text: string | null): string | null {
  const t = text?.trim() ?? "";
  return t === "" || NOTHING.test(t) ? null : t;
}

export function sharingInScope(basis: RopaLawfulBasis | null): boolean {
  return basis === null || (SHARING_IN_SCOPE_BASES as readonly string[]).includes(basis);
}

export function compileSharingList(records: readonly SharingSourceRecord[]): SharingList {
  const live = records.filter((r) => r.status !== "archived").slice().sort((a, b) => a.recordCode.localeCompare(b.recordCode));
  const byName = new Map<string, SharingRecipient>();
  const namedInRecords: SharingNamedText[] = [];
  let recordsInScope = 0;
  let recordsUndecided = 0;
  let recordsSharingNothing = 0;

  for (const r of live) {
    if (!sharingInScope(r.lawfulBasis)) continue;
    recordsInScope += 1;
    const record: SharingRecord = {
      recordCode: r.recordCode,
      name: r.name,
      dataCategories: meaningful(r.dataCategories),
      basisUndecided: r.lawfulBasis === null,
      approved: r.status === "approved",
    };
    if (record.basisUndecided) recordsUndecided += 1;

    let shares = false;
    for (const v of r.vendors) {
      const name = v.name.trim();
      if (name === "") continue;
      shares = true;
      const key = name.toLocaleLowerCase("en-IN");
      const found = byName.get(key);
      if (found) {
        if (!found.records.some((x) => x.recordCode === record.recordCode)) found.records.push(record);
      } else {
        byName.set(key, { name, kind: KIND_OF[v.role] ?? "not_classified", service: v.service?.trim() || null, records: [record] });
      }
    }
    const text = meaningful(r.sharing);
    if (text) {
      shares = true;
      namedInRecords.push({ text, record });
    }
    if (!shares) recordsSharingNothing += 1;
  }

  const recipients = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, "en-IN", { sensitivity: "base" }));
  return {
    recipients,
    namedInRecords,
    counts: {
      recordsRead: live.length,
      recordsInScope,
      recordsUndecided,
      recordsOutOfScope: live.length - recordsInScope,
      recordsSharingNothing,
    },
  };
}

/**
 * The list as plain text, for a person to paste into the reply and then edit.
 * Only names and kinds of data — never a requester's details.
 */
export function sharingListText(list: SharingList): string {
  const lines: string[] = [];
  for (const r of list.recipients) {
    const what = [...new Set(r.records.map((x) => x.dataCategories).filter((x): x is string => x !== null))];
    lines.push(`- ${r.name} (${SHARING_RECIPIENT_KIND_LABEL[r.kind]}${r.service ? `, ${r.service}` : ""}): ${what.length ? what.join("; ") : "[kinds of personal data — to be completed]"}`);
  }
  for (const n of list.namedInRecords) {
    lines.push(`- ${n.text}: ${n.record.dataCategories ?? "[kinds of personal data — to be completed]"}`);
  }
  return lines.join("\n");
}

/** What the panel and the reply must say about s.11(2) — statute, not a TrustStack default. */
export const SHARING_LAW_NOTE =
  "s.11(1)(b): the reply names every other Data Fiduciary and Data Processor the person's data was shared with, and describes the data shared. " +
  "s.11(2): this does not cover sharing with an authority allowed by law that asked in writing to prevent, detect or investigate offences or cyber incidents, or to prosecute or punish offences.";
