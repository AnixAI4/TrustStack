import "server-only";
import {
  CONSENT_ACTION_LABEL,
  CONSENT_LANGUAGE_LABEL,
  CONSENT_SOURCE_LABEL,
  NOTICE_STATUS_LABEL,
  noticeDataItems,
  noticePurposeProblems,
  PRINCIPAL_KIND_LABEL,
  VERIFICATION_METHOD_LABEL,
  WIDGET_POSITION_LABEL,
  type ConsentAction,
  type ConsentCounts,
  type ConsentLanguage,
  type ConsentSource,
  type ExposureConsentInput,
  type NoticePurpose,
  type NoticeStatus,
  type PrincipalKind,
  type VerificationMethod,
  type WidgetPosition,
} from "@truststack/core";
import { namesFor, type Member } from "@/lib/gaps/shape";
import type { AppSupabaseClient } from "@/lib/supabase/server";

/**
 * Row → API shapes for the privacy notice, the consent widget's versions and
 * the consent register (Slice 10, Stage 3b), and the ONE reader the routes,
 * the exposure model and the reports share (D-069).
 *
 * Versions and publishing stamps are the database's (migration
 * 20261014000000_notice_consent). The counts are counted in SQL over every
 * principal's LATEST record (`consent_register_facts`) — one JSON value, so no
 * row limit can truncate them — exactly as core's `countConsents` defines.
 *
 * A record carries a pseudonymous key, never the person's identifier: the
 * register shows its first twelve characters.
 */

export const NOTICE_COLUMNS =
  "id, organization_id, language, version, status, title, summary, purposes, withdraw_means, rights_means, complaint_means, published_at, published_by, created_by, updated_by, created_at, updated_at" as const;

export const CONFIG_COLUMNS =
  "id, organization_id, version, status, notice_id, purposes, languages, position, primary_color, published_at, published_by, created_by, updated_by, created_at, updated_at" as const;

export const RECORD_COLUMNS =
  "id, organization_id, config_id, principal_key, action, purposes, principal_kind, verification_method, language, source, reference, recorded_by, recorded_at" as const;

export interface NoticeRow {
  id: string;
  organization_id: string;
  language: string;
  version: number;
  status: string;
  title: string;
  summary: string | null;
  purposes: unknown;
  withdraw_means: string | null;
  rights_means: string | null;
  complaint_means: string | null;
  published_at: string | null;
  published_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConfigRow {
  id: string;
  organization_id: string;
  version: number;
  status: string;
  notice_id: string;
  purposes: string[];
  languages: string[];
  position: string;
  primary_color: string;
  published_at: string | null;
  published_by: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordRow {
  id: string;
  organization_id: string;
  config_id: string;
  principal_key: string;
  action: string;
  purposes: string[];
  principal_kind: string;
  verification_method: string | null;
  language: string;
  source: string;
  reference: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

const name = (names: ReadonlyMap<string, string>, id: string | null) => (id ? (names.get(id) ?? "A former member") : null);

export function noticeToApi(row: NoticeRow, names: ReadonlyMap<string, string>) {
  const purposes = (row.purposes ?? []) as NoticePurpose[];
  const status = row.status as NoticeStatus;
  return {
    id: row.id,
    language: row.language as ConsentLanguage,
    languageLabel: CONSENT_LANGUAGE_LABEL[row.language as ConsentLanguage] ?? row.language,
    version: row.version,
    status,
    statusLabel: NOTICE_STATUS_LABEL[status],
    title: row.title,
    summary: row.summary,
    purposes,
    /** Rule 3(b)(i): the itemised personal data across every purpose. */
    dataItems: noticeDataItems(purposes),
    withdrawMeans: row.withdraw_means,
    rightsMeans: row.rights_means,
    complaintMeans: row.complaint_means,
    /** What stops a draft being published, in words; empty for a published notice. */
    problems: status === "draft" ? noticePurposeProblems(purposes) : [],
    publishedAt: row.published_at,
    publishedByName: name(names, row.published_by),
    createdByName: name(names, row.created_by),
    updatedAt: row.updated_at,
  };
}
export type NoticeApi = ReturnType<typeof noticeToApi>;

export function configToApi(row: ConfigRow, notices: ReadonlyMap<string, NoticeApi>, names: ReadonlyMap<string, string>) {
  const notice = notices.get(row.notice_id);
  const status = row.status as NoticeStatus;
  return {
    id: row.id,
    version: row.version,
    status,
    statusLabel: NOTICE_STATUS_LABEL[status],
    notice: notice
      ? { id: notice.id, language: notice.language, languageLabel: notice.languageLabel, version: notice.version, status: notice.status }
      : null,
    purposes: row.purposes,
    languages: row.languages as ConsentLanguage[],
    position: row.position as WidgetPosition,
    positionLabel: WIDGET_POSITION_LABEL[row.position as WidgetPosition],
    primaryColor: row.primary_color,
    publishedAt: row.published_at,
    publishedByName: name(names, row.published_by),
    updatedAt: row.updated_at,
  };
}
export type ConfigApi = ReturnType<typeof configToApi>;

export function recordToApi(row: RecordRow, configVersions: ReadonlyMap<string, number>, names: ReadonlyMap<string, string>) {
  const action = row.action as ConsentAction;
  const kind = row.principal_kind as PrincipalKind;
  const method = row.verification_method as VerificationMethod | null;
  const source = row.source as ConsentSource;
  return {
    id: row.id,
    /** The first twelve characters of the pseudonymous key — enough to tell two people apart on a screen. */
    principal: row.principal_key.slice(0, 12),
    action,
    actionLabel: CONSENT_ACTION_LABEL[action],
    purposes: row.purposes,
    principalKind: kind,
    principalKindLabel: PRINCIPAL_KIND_LABEL[kind],
    verificationMethod: method,
    verificationLabel: method ? VERIFICATION_METHOD_LABEL[method] : null,
    language: row.language as ConsentLanguage,
    source,
    sourceLabel: CONSENT_SOURCE_LABEL[source],
    reference: row.reference,
    recordedByName: name(names, row.recorded_by),
    recordedAt: row.recorded_at,
    configVersion: configVersions.get(row.config_id) ?? null,
  };
}
export type RecordApi = ReturnType<typeof recordToApi>;

interface RegisterFacts {
  counts: ConsentCounts;
  modelFacts: ExposureConsentInput[];
}

/** The counts over every principal's latest record, and the model's facts (1.3.0) — as the caller (RLS applies). */
export async function readConsentFacts(supabase: AppSupabaseClient, organizationId: string): Promise<RegisterFacts> {
  const { data, error } = await supabase.rpc("consent_register_facts", { p_organization_id: organizationId });
  if (error) throw error;
  const facts = data as unknown as RegisterFacts;
  const counts = Object.fromEntries(Object.entries(facts.counts).map(([k, v]) => [k, Number(v)])) as unknown as ConsentCounts;
  return { counts, modelFacts: facts.modelFacts };
}

/** How many recent records the register lists; the counts cover every one. */
export const RECENT_RECORDS = 50;

/** The whole register as the consent page shows it: every notice and widget version, the counts, and the latest records. */
export async function readConsentRegister(supabase: AppSupabaseClient, organizationId: string, members: readonly Member[]) {
  const [notices, configs, records, facts, org] = await Promise.all([
    supabase
      .from("privacy_notices")
      .select(NOTICE_COLUMNS)
      .eq("organization_id", organizationId)
      .order("language")
      .order("version", { ascending: false }),
    supabase.from("consent_configs").select(CONFIG_COLUMNS).eq("organization_id", organizationId).order("version", { ascending: false }),
    supabase
      .from("consent_records")
      .select(RECORD_COLUMNS)
      .eq("organization_id", organizationId)
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(RECENT_RECORDS),
    readConsentFacts(supabase, organizationId),
    supabase.from("organizations").select("public_slug").eq("id", organizationId).maybeSingle(),
  ]);
  for (const r of [notices, configs, records, org]) if (r.error) throw r.error;
  const noticeRows = (notices.data ?? []) as NoticeRow[];
  const configRows = (configs.data ?? []) as ConfigRow[];
  const recordRows = (records.data ?? []) as RecordRow[];

  const names = await namesFor(supabase, members, [
    ...noticeRows.flatMap((n) => [n.published_by, n.created_by]),
    ...configRows.map((c) => c.published_by),
    ...recordRows.map((r) => r.recorded_by),
  ]);
  const noticeApis = noticeRows.map((n) => noticeToApi(n, names));
  const byId = new Map(noticeApis.map((n) => [n.id, n]));
  const configApis = configRows.map((c) => configToApi(c, byId, names));
  const versions = new Map(configRows.map((c) => [c.id, c.version]));
  return {
    organizationId,
    /** Null until the Organisation page opens public pages: the widget and the notice page need the address. */
    publicSlug: (org.data?.public_slug as string | null | undefined) ?? null,
    notices: noticeApis,
    configs: configApis,
    /** The widget version the public widget serves: the newest published. */
    liveConfigId: configApis.find((c) => c.status === "published")?.id ?? null,
    counts: facts.counts,
    recent: recordRows.map((r) => recordToApi(r, versions, names)),
  };
}
export type ConsentRegister = Awaited<ReturnType<typeof readConsentRegister>>;
