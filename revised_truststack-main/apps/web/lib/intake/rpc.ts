import "server-only";
import {
  EVIDENCE_BUCKET,
  type ConsentAction,
  type ConsentLanguage,
  type IntakeSurface,
  type NoticePurpose,
  type PrincipalKind,
  type PublicContact,
  type RightsCapacity,
  type RightsKind,
  type WidgetPosition,
} from "@truststack/core";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The ONLY door to public intake: four SECURITY DEFINER functions that only
 * `service_role` may execute (migration `20261013000000_public_intake`), and
 * from Stage 3b three more for the privacy notice page and the consent
 * widget (migration `20261014000000_notice_consent`), and from Stage 4b seven
 * for the vendor-facing questionnaire link (migration `20261016000000_vendor_link`).
 *
 * Why the service role, not the anon key (D-086): the anon key is public by
 * design, so a function `anon` may execute can be called straight from
 * PostgREST, past this server — with a code the caller chose and a client
 * key the caller made up. Here the server alone generates and emails the
 * code and hashes the client address. The client calls `.rpc()` and nothing
 * else: no table is read or written through it.
 */

export interface PublicProfile {
  name: string;
  legalName: string | null;
  slug: string;
  contact: PublicContact;
}

export type BeginResult =
  | { status: "pending"; submissionId: string; submittedOn: string; codeExpiresAt: string; organization: PublicProfile }
  | { status: "not_found" }
  | { status: "rate_limited"; limit: "client" | "email" };

export type ResendResult =
  | { status: "sent"; email: string; name: string; kind: RightsKind; codeExpiresAt: string; organization: PublicProfile }
  | { status: "not_found" | "already_confirmed" | "expired" | "locked" }
  | { status: "rate_limited"; limit: "email" };

export type ConfirmResult =
  | {
      status: "confirmed";
      requestCode: string;
      kind: RightsKind;
      receivedOn: string;
      respondBy: string;
      email: string;
      name: string;
      organization: PublicProfile;
    }
  | { status: "wrong_code"; attemptsLeft: number }
  | { status: "not_found" | "already_confirmed" | "expired" | "locked" | "code_expired" };

export interface BeginInput {
  slug: string;
  surface: IntakeSurface;
  submissionId: string;
  clientHash: string;
  codeHash: string;
  kind: RightsKind;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  requesterCapacity: RightsCapacity;
  principalIdentifier: string | null;
  summary: string;
  relatedRequestCode: string | null;
  nomineeName: string | null;
  nomineeContact: string | null;
  nomineeRelationship: string | null;
}

// The generated types say `string` for a nullable SQL argument; PostgREST
// passes JSON null through as SQL NULL, which every function handles.
const n = (v: string | null) => v as string;

type IntakeFunction =
  | "intake_profile"
  | "intake_begin"
  | "intake_resend"
  | "intake_confirm"
  | "consent_notice"
  | "consent_widget"
  | "consent_record_public"
  | "vendor_link_view"
  | "vendor_link_send_code"
  | "vendor_link_confirm"
  | "vendor_link_save"
  | "vendor_link_add_document"
  | "vendor_link_attach_document"
  | "vendor_link_submit";

async function call<T, F extends IntakeFunction>(fn: F, args: Database["public"]["Functions"][F]["Args"]): Promise<T> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export function readPublicProfile(slug: string): Promise<PublicProfile | null> {
  return call<PublicProfile | null, "intake_profile">("intake_profile", { p_slug: slug });
}

export function beginIntake(i: BeginInput): Promise<BeginResult> {
  return call<BeginResult, "intake_begin">("intake_begin", {
    p_slug: i.slug,
    p_surface: i.surface,
    p_submission_id: i.submissionId,
    p_client_hash: i.clientHash,
    p_code_hash: i.codeHash,
    p_kind: i.kind,
    p_requester_name: i.requesterName,
    p_requester_email: i.requesterEmail,
    p_requester_phone: n(i.requesterPhone),
    p_requester_capacity: i.requesterCapacity,
    p_principal_identifier: n(i.principalIdentifier),
    p_summary: i.summary,
    p_related_request_code: n(i.relatedRequestCode),
    p_nominee_name: n(i.nomineeName),
    p_nominee_contact: n(i.nomineeContact),
    p_nominee_relationship: n(i.nomineeRelationship),
  });
}

export function resendIntakeCode(slug: string, submissionId: string, clientHash: string, codeHash: string): Promise<ResendResult> {
  return call<ResendResult, "intake_resend">("intake_resend", {
    p_slug: slug,
    p_submission_id: submissionId,
    p_client_hash: clientHash,
    p_code_hash: codeHash,
  });
}

export function confirmIntake(slug: string, submissionId: string, codeHash: string): Promise<ConfirmResult> {
  return call<ConfirmResult, "intake_confirm">("intake_confirm", { p_slug: slug, p_submission_id: submissionId, p_code_hash: codeHash });
}

// ---------------------------------------------------------------------------
// Stage 3b — the privacy notice page and the consent widget
// ---------------------------------------------------------------------------

export interface PublicNotice {
  language: ConsentLanguage;
  version: number;
  title: string;
  summary: string | null;
  purposes: NoticePurpose[];
  withdrawMeans: string | null;
  rightsMeans: string | null;
  complaintMeans: string | null;
  publishedAt: string;
}

export interface PublicNoticePage {
  organization: PublicProfile;
  notice: PublicNotice;
  /** Every language a version is published in. */
  languages: ConsentLanguage[];
}

export interface PublicWidget {
  organization: PublicProfile;
  config: {
    id: string;
    version: number;
    languages: ConsentLanguage[];
    position: WidgetPosition;
    primaryColor: string;
    notice: { language: ConsentLanguage; version: number };
    /** In the widget version's order, in the words of the notice it cites. */
    purposes: NoticePurpose[];
  };
}

export type PublicConsentResult =
  | { status: "recorded"; action: ConsentAction; purposes: string[]; recordedAt: string }
  | { status: "not_found" }
  | { status: "rate_limited"; limit: "client" | "principal" };

export interface PublicConsentInput {
  slug: string;
  clientHash: string;
  configId: string;
  identifier: string;
  action: ConsentAction;
  purposes: string[];
  principalKind: PrincipalKind;
  language: ConsentLanguage;
}

/** The latest published notice in `language` (else English, else the newest), or null — the same 404 as every public page. */
export function readPublicNotice(slug: string, language: string | null): Promise<PublicNoticePage | null> {
  return call<PublicNoticePage | null, "consent_notice">("consent_notice", { p_slug: slug, p_language: n(language) });
}

/** The live widget version, or null when none is published. */
export function readPublicWidget(slug: string): Promise<PublicWidget | null> {
  return call<PublicWidget | null, "consent_widget">("consent_widget", { p_slug: slug });
}

/** A choice made in the widget, counted against the limits. Never a verification. */
export function recordPublicConsent(i: PublicConsentInput): Promise<PublicConsentResult> {
  return call<PublicConsentResult, "consent_record_public">("consent_record_public", {
    p_slug: i.slug,
    p_client_hash: i.clientHash,
    p_config_id: i.configId,
    p_identifier: i.identifier,
    p_action: i.action,
    p_purposes: i.purposes,
    p_principal_kind: i.principalKind,
    p_language: i.language,
  });
}


// ---------------------------------------------------------------------------
// Stage 4b — the vendor-facing questionnaire link
// ---------------------------------------------------------------------------

/** Whose questionnaire, about which vendor — what every step of the link shows. */
export interface VendorLinkHeader {
  organization: { name: string; legalName: string | null };
  vendor: { name: string; service: string | null };
  version: number;
  respondentName: string;
  /** The server masks it before it reaches the page. */
  respondentEmail: string;
  expiresAt: string;
}

export interface VendorLinkAnswer {
  code: string;
  answer: string | null;
  notApplicable: boolean;
  naReason: string | null;
  /** A document uploaded through this link, cited on the answer. */
  evidenceId: string | null;
  /** A document the organisation already holds is cited — never named to the vendor. */
  documentOnFile: boolean;
}

export interface VendorLinkDocument {
  id: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  uploadedAt: string;
  /** Linked to the vendor — the upload finished. */
  attached: boolean;
}

export interface VendorLinkBody {
  answers: VendorLinkAnswer[];
  documents: VendorLinkDocument[];
  missing: string[];
}

export type VendorLinkView =
  | { status: "not_found" }
  | ({ status: "unconfirmed" } & VendorLinkHeader)
  | ({ status: "open" } & VendorLinkHeader & VendorLinkBody);

export type VendorLinkCodeResult =
  | ({ status: "sent"; codeExpiresAt: string } & VendorLinkHeader)
  | { status: "not_found" }
  | { status: "rate_limited"; limit: "email" };

export type VendorLinkConfirmResult =
  | { status: "confirmed"; expiresAt: string }
  | { status: "wrong_code"; attemptsLeft: number }
  | { status: "not_found" | "code_expired" | "locked" };

/** Every step after the code: refused alike when the link is gone, or the code was not entered in this browser. */
type Gone = { status: "not_found" | "unconfirmed" };

export type VendorLinkSaveResult = ({ status: "saved"; answersChanged: number; answersCleared: number } & VendorLinkHeader & VendorLinkBody) | Gone;
export type VendorLinkAddDocumentResult = { status: "registered"; storagePath: string } | { status: "too_many_documents" } | Gone;
export type VendorLinkAttachResult = { status: "attached" } | Gone;
export type VendorLinkSubmitResult = ({ status: "submitted"; submittedAt: string; declaredAt: string } & VendorLinkHeader) | Gone;

export interface VendorLinkEntry {
  code: string;
  answer: string | null;
  notApplicable: boolean;
  naReason: string | null;
  /** Absent keeps the document cited now; null clears it. */
  evidenceId?: string | null;
}

/** The link, by its token's hash — and the questionnaire once the session (this browser's code) holds. */
export function viewVendorLink(tokenHash: string, sessionHash: string | null): Promise<VendorLinkView> {
  return call<VendorLinkView, "vendor_link_view">("vendor_link_view", { p_token_hash: tokenHash, p_session_hash: n(sessionHash) });
}

export function sendVendorLinkCode(tokenHash: string, clientHash: string, codeHash: string): Promise<VendorLinkCodeResult> {
  return call<VendorLinkCodeResult, "vendor_link_send_code">("vendor_link_send_code", {
    p_token_hash: tokenHash,
    p_client_hash: clientHash,
    p_code_hash: codeHash,
  });
}

export function confirmVendorLink(tokenHash: string, codeHash: string, sessionHash: string): Promise<VendorLinkConfirmResult> {
  return call<VendorLinkConfirmResult, "vendor_link_confirm">("vendor_link_confirm", {
    p_token_hash: tokenHash,
    p_code_hash: codeHash,
    p_session_hash: sessionHash,
  });
}

export function saveVendorLink(tokenHash: string, sessionHash: string | null, answers: VendorLinkEntry[]): Promise<VendorLinkSaveResult> {
  return call<VendorLinkSaveResult, "vendor_link_save">("vendor_link_save", {
    p_token_hash: tokenHash,
    p_session_hash: n(sessionHash),
    p_answers: answers as unknown as Database["public"]["Functions"]["vendor_link_save"]["Args"]["p_answers"],
  });
}

export function addVendorLinkDocument(
  tokenHash: string,
  sessionHash: string | null,
  d: { evidenceId: string; fileName: string; contentType: string; byteSize: number },
): Promise<VendorLinkAddDocumentResult> {
  return call<VendorLinkAddDocumentResult, "vendor_link_add_document">("vendor_link_add_document", {
    p_token_hash: tokenHash,
    p_session_hash: n(sessionHash),
    p_evidence_id: d.evidenceId,
    p_file_name: d.fileName,
    p_content_type: d.contentType,
    p_byte_size: d.byteSize,
  });
}

export function attachVendorLinkDocument(tokenHash: string, sessionHash: string | null, evidenceId: string): Promise<VendorLinkAttachResult> {
  return call<VendorLinkAttachResult, "vendor_link_attach_document">("vendor_link_attach_document", {
    p_token_hash: tokenHash,
    p_session_hash: n(sessionHash),
    p_evidence_id: evidenceId,
  });
}

export function submitVendorLink(tokenHash: string, sessionHash: string | null, declaredName: string, declaredRole: string): Promise<VendorLinkSubmitResult> {
  return call<VendorLinkSubmitResult, "vendor_link_submit">("vendor_link_submit", {
    p_token_hash: tokenHash,
    p_session_hash: n(sessionHash),
    p_declared_name: declaredName,
    p_declared_role: declaredRole,
  });
}

/**
 * The signed upload URL for a document the respondent registered: minted with
 * the service role, because the bucket's INSERT policy signs only for a path
 * registered to its uploader (D-042) and a respondent is nobody's user. The
 * database registered the path; nothing else is reachable through this.
 */
export async function signVendorUpload(storagePath: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage.from(EVIDENCE_BUCKET).createSignedUploadUrl(storagePath);
  if (error || !data) return null;
  return data.signedUrl;
}
