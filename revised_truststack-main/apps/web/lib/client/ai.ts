"use client";

import type { AiTask } from "@truststack/core";
import { useEffect, useState } from "react";
import { apiFetch } from "./api";

/** `GET …/ai` — whether the assistant can answer here, and why not (D-125.5). */
export interface AiStatus {
  available: boolean;
  offReason: "platform" | "organisation" | "sector" | "sdf" | null;
  message: string | null;
  platformEnabled: boolean;
  organisation: { enabled: boolean; contractRef: string | null; enabledAt: string | null };
}

export type AiNextStepPage = "answer_question" | "add_evidence" | "view_gaps" | "none";

/** The answer's one shape (§4.13), as `POST …/ai/{task}` returns it — the server set every flag. */
export interface AiAnswer {
  task: AiTask;
  answer: string;
  whyItMatters: string;
  nextStep: { label: string; page: AiNextStepPage };
  moreDetail: string;
  law: { citation: string; point: string; source: "statute" | "truststack_default" }[];
  suggestedEvidence: string[];
  missingInformation: string[];
  counselToConfirm: boolean;
  confidence: "high" | "medium" | "low";
  sourceReferences: string[];
  requiresHumanReview: true;
  legalReviewRequired: boolean;
  caveat: string;
  reviewNote: string;
  counselNote: string | null;
}

export interface AiDraft {
  id: string;
  task: AiTask;
  status: "draft";
  createdAt: string;
  model: string;
  injectionFlagged: boolean;
  citationFlags: { citation: string; reason: string }[];
  answer: AiAnswer;
}

/** A drafting task's answer (Stage 2a, D-129) — the server set every flag, (iv) and (vi) of an intimation. */
export interface AiDraftAnswer {
  task: AiTask;
  kind: "draft";
  answer: string;
  /** A register draft's fields; a notice's `purposes` and a narrative's `paragraphs` / `bullets` are lists (Stage 2b). */
  draft: Record<string, unknown>;
  law: { citation: string; point: string; source: "statute" | "truststack_default" }[];
  sourceReferences: string[];
  missingInformation: string[];
  counselToConfirm: boolean;
  confidence: "high" | "medium" | "low";
  requiresHumanReview: true;
  legalReviewRequired: boolean;
  caveat: string;
  reviewNote: string;
  counselNote: string | null;
}

/** `POST …/ai/{draftTask}` — a draft for a person to edit, then accept or discard. */
export interface AiRegisterDraft {
  id: string;
  task: AiTask;
  status: "draft";
  createdAt: string;
  model: string;
  injectionFlagged: boolean;
  citationFlags: { citation: string; reason: string }[];
  answer: AiDraftAnswer;
}

/** `GET …/ai/drafts…` and the accept/discard routes: a stored draft and its decision. */
export interface AiStoredDraft {
  id: string;
  task: AiTask;
  status: "draft" | "accepted" | "discarded";
  target: { type: string; id: string | null; key: string | null };
  createdAt: string;
  model: string;
  answer: AiDraftAnswer | null;
  acceptedOutput: Record<string, unknown> | null;
  decidedAt: string | null;
  decidedByName: string | null;
}

/**
 * One status read per organisation per page load, shared by every Explain
 * button on the page (a question list renders dozens). Cleared when the switch
 * changes in Organisation settings.
 */
const statusCache = new Map<string, Promise<AiStatus | null>>();

export function readAiStatus(organizationId: string): Promise<AiStatus | null> {
  let pending = statusCache.get(organizationId);
  if (!pending) {
    pending = apiFetch<{ ai: AiStatus }>(`/api/v1/organizations/${organizationId}/ai`).then((r) => (r.success ? r.data.ai : null));
    statusCache.set(organizationId, pending);
  }
  return pending;
}

export function forgetAiStatus(organizationId: string): void {
  statusCache.delete(organizationId);
}

/** The assistant's status here; null while loading or when it cannot be read. */
export function useAiStatus(organizationId: string | null): AiStatus | null {
  const [status, setStatus] = useState<AiStatus | null>(null);
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    void readAiStatus(organizationId).then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  return status;
}
