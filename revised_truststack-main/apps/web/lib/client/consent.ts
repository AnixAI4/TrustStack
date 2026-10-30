"use client";

import type {
  ConsentAction,
  ConsentCounts,
  ConsentLanguage,
  ConsentSource,
  NoticePurpose,
  NoticeStatus,
  PrincipalKind,
  VerificationMethod,
  WidgetPosition,
} from "@truststack/core";

/** Shapes the notice and consent API returns (Slice 10, Stage 3b). Times are instants; show them in India. */

export interface Notice {
  id: string;
  language: ConsentLanguage;
  languageLabel: string;
  version: number;
  status: NoticeStatus;
  statusLabel: string;
  title: string;
  summary: string | null;
  purposes: NoticePurpose[];
  dataItems: string[];
  withdrawMeans: string | null;
  rightsMeans: string | null;
  complaintMeans: string | null;
  problems: string[];
  publishedAt: string | null;
  publishedByName: string | null;
  createdByName: string | null;
  updatedAt: string;
}

export interface WidgetVersion {
  id: string;
  version: number;
  status: NoticeStatus;
  statusLabel: string;
  notice: { id: string; language: ConsentLanguage; languageLabel: string; version: number; status: NoticeStatus } | null;
  purposes: string[];
  languages: ConsentLanguage[];
  position: WidgetPosition;
  positionLabel: string;
  primaryColor: string;
  publishedAt: string | null;
  publishedByName: string | null;
  updatedAt: string;
}

export interface ConsentRecordView {
  id: string;
  principal: string;
  action: ConsentAction;
  actionLabel: string;
  purposes: string[];
  principalKind: PrincipalKind;
  principalKindLabel: string;
  verificationMethod: VerificationMethod | null;
  verificationLabel: string | null;
  language: ConsentLanguage;
  source: ConsentSource;
  sourceLabel: string;
  reference: string | null;
  recordedByName: string | null;
  recordedAt: string;
  configVersion: number | null;
}

export interface ConsentRegisterPayload {
  organizationId: string;
  publicSlug: string | null;
  notices: Notice[];
  configs: WidgetVersion[];
  liveConfigId: string | null;
  counts: ConsentCounts;
  recent: ConsentRecordView[];
}

export interface ConsentHistoryPayload {
  principal: string;
  records: ConsentRecordView[];
}

/** An instant, in India. */
export function formatInstant(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export const CONSENT_ACTION_STYLE: Record<ConsentAction, string> = {
  given: "bg-emerald-50 text-emerald-800",
  refused: "bg-slate-100 text-slate-700",
  withdrawn: "bg-amber-50 text-amber-800",
};
