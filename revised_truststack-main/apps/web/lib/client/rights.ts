"use client";

import type {
  RightsCapacity,
  RightsChannel,
  RightsClock,
  RightsCounts,
  RightsFamily,
  RightsKind,
  RightsOutcome,
  RightsStatus,
} from "@truststack/core";
import type { RecordedBy } from "./breaches";
import type { EvidenceItem } from "./assessments";
import type { GapAction, GapMember } from "./gaps";

/** Shapes the rights and grievance register API returns (Slice 10, Stage 2). Every date is India's calendar. */

export interface RightsRequest {
  id: string;
  requestCode: string;
  kind: RightsKind;
  kindLabel: string;
  provision: string;
  family: RightsFamily;
  status: RightsStatus;
  statusLabel: string;
  receivedOn: string;
  respondBy: string;
  clock: RightsClock;
  channel: RightsChannel;
  channelLabel: string;
  requester: {
    name: string;
    email: string | null;
    phone: string | null;
    capacity: RightsCapacity;
    capacityLabel: string;
    identifier: string | null;
  };
  summary: string;
  related: { id: string; requestCode: string | null } | null;
  nominee: { name: string; contact: string | null; relationship: string | null } | null;
  ownerUserId: string | null;
  ownerName: string | null;
  identity: { verifiedOn: string; method: string | null; recorded: RecordedBy | null } | null;
  response: { outcome: RightsOutcome; outcomeLabel: string; respondedOn: string; summary: string | null; recorded: RecordedBy | null } | null;
  closureReason: string | null;
  closedAt: string | null;
  closedByName: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  actions: GapAction[];
  /** Documents on the request itself (evidence link type `rights_request`, Stage 6). */
  documents: EvidenceItem[];
}

export interface RightsRegisterPayload {
  organizationId: string;
  today: string;
  counts: RightsCounts;
  clockNote: string;
  requests: RightsRequest[];
}

export interface RightsDetailPayload {
  today: string;
  request: RightsRequest;
  members: GapMember[];
  clockNote: string;
}

export const RIGHTS_STATUS_STYLE: Record<RightsStatus, string> = {
  open: "bg-amber-100 text-amber-900",
  responded: "bg-emerald-100 text-emerald-900",
  withdrawn: "bg-slate-100 text-slate-700",
  void: "bg-slate-100 text-slate-700",
};

/** The Rules' overdue state, and TrustStack's target (a target, not statute). */
export const RIGHTS_CLOCK_STYLE: Record<RightsClock["state"], string> = {
  within_target: "text-slate-800",
  past_target: "text-amber-800 font-medium",
  overdue: "text-red-900 font-semibold",
  responded: "text-emerald-800",
  responded_late: "text-red-800 font-medium",
  not_applicable: "text-slate-500",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-10-03` → `3 Oct 2026` — a calendar date, no time zone involved. */
export function formatDay(day: string): string {
  return `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]} ${day.slice(0, 4)}`;
}

export type { GapMember };
