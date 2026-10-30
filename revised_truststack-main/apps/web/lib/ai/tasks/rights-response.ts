import {
  AI_RIGHTS_APPLIES_PLACEHOLDER,
  AI_RIGHTS_CONTACT_PLACEHOLDER,
  pickAllowed,
  rightsKindNeedsConsentBasis,
  RIGHTS_CHANNEL_LABEL,
  RIGHTS_KIND_LABEL,
  RIGHTS_KIND_PROVISION,
  type RightsChannel,
  type RightsKind,
} from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Draft a response" (SLICE_11 §2.3, §7b.4; Stage 2a) — on a rights request's
 * Response step. Read with `rights.read`, decided with `rights.write` (§4.7,
 * D-129.3), through the register's own reader (`readRights`, D-069); shaped
 * here, pure.
 *
 * What it sends: the request's kind and the provision it rests on, its status,
 * when it was received and the respond-by date (both India's calendar), the
 * channel, whether identity was verified (yes / no — never how, or by whom),
 * and the request's summary as untrusted data, scrubbed. Never the requester's
 * name, email, phone or identifier, a nominee, or the capacity they wrote in
 * (§4.6). The letter carries [Name], [reference] and [date] placeholders, and
 * never states the outcome: a person decides it (D-129.2). D-137: it carries the
 * Rule 9 contact placeholder, and — for an s.11/s.12 right, which exists only for
 * consent-based processing — a "does this right apply" placeholder, never a claim.
 */

export const rightsResponseBody = z
  .object({
    requestId: z.uuid(),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type RightsResponseBody = z.infer<typeof rightsResponseBody>;

export interface RightsResponseRaw {
  organisation: OrganisationRaw;
  request: Record<string, unknown> & { identity?: unknown };
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;
const REQUEST_FIELDS = ["kind", "status", "receivedOn", "respondBy", "channel", "summary"] as const;

export function shapeRightsResponseContext(raw: RightsResponseRaw, target: { requestId: string }, untrustedJson: (value: unknown) => string): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const r = pickAllowed(raw.request, REQUEST_FIELDS);

  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const kind = r.kind as RightsKind;
  const request = {
    kind: RIGHTS_KIND_LABEL[kind] ?? null,
    provision: RIGHTS_KIND_PROVISION[kind] ?? null,
    status: typeof r.status === "string" ? r.status : null,
    receivedOn: typeof r.receivedOn === "string" ? r.receivedOn : null,
    // The database's: receipt + ninety days (Rule 14(3)).
    respondBy: typeof r.respondBy === "string" ? r.respondBy : null,
    channel: RIGHTS_CHANNEL_LABEL[r.channel as RightsChannel] ?? null,
    identityVerified: raw.request.identity !== null && raw.request.identity !== undefined,
  };
  const untrusted = { requestSummary: clean(r.summary, true) };
  // D-137 (F2): access and the s.12 rights exist only for consent-based processing (incl. s.7(a)).
  const appliesOnlyToConsent = rightsKindNeedsConsentBasis(kind);
  const ask = clean(raw.ask, true);

  const context = { task: "rights_response_draft", organisation, request, untrusted, ask };
  const user = userTurn(
    `Draft the organisation's response letter to this request from a Data Principal (the person the data is about), and a one-paragraph summary of it for the rights register. Begin the letter 'Dear [Name],' and include 'Our reference: [reference]' and '[date]': you do not know who the person is and must not guess. Say what the person asked for and which provision gives the right, in plain words. ${
      appliesOnlyToConsent
        ? `That right (s.11 or s.12) applies only to personal data the person gave consent for, including under s.7(a) (s.11(1), s.12(1)); it does not apply where the data is processed for another legitimate use under s.7, such as employment (s.7(i)). You do not know the basis, so do not say the right applies: write the line '${AI_RIGHTS_APPLIES_PLACEHOLDER}' where the letter would say so. `
        : ""
    }Include, exactly, the line '${AI_RIGHTS_CONTACT_PLACEHOLDER}' — every response to a rights request gives the business contact of the Data Protection Officer or a person who can answer questions about the processing (Rule 9). Do NOT state or imply the outcome — whether the request is fulfilled, partly fulfilled or declined is a person's decision (for an erasure, retention may be necessary for the specified purpose or for compliance with a law, s.12(3) — a legal judgement). Where the letter must say what was done or decided, write a placeholder such as "[What we did — to be completed by the person handling this request]". If identity was not verified, the letter may ask for the particulars needed to identify the person (Rule 14(1)(b), (2)). The law sets no period for answering this request — the ninety days of Rule 14(3) are for grievances; the respond-by date is TrustStack's outer limit and thirty days TrustStack's target, neither the law. A person and counsel check it before it is sent; you send nothing.`,
    [
      { tag: "organisation", value: organisation },
      { tag: "request", value: request },
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
    target: { type: "rights_request", id: target.requestId, key: null },
    facts: { rightsKind: kind },
  };
}
