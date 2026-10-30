import "server-only";
import {
  GAP_SEVERITY_LABEL,
  THIRD_SCHEDULE_CLASS_LABEL,
  type LegalPositionInput,
  type ProcessorExposureInput,
  type ReportBreachLine,
  type ReportProcessorLine,
  type RopaRegisterCounts,
  type SecurityBreachInput,
  type ThirdScheduleClass,
  type TriState,
  type VendorRole,
} from "@truststack/core";
import type { TenantContext } from "@/lib/api/guard";
import { readAiRegister } from "@/lib/ai-risk/shape";
import { readBreaches, type BreachApi } from "@/lib/breach/shape";
import { readConsentRegister } from "@/lib/consent/shape";
import { breachSection, retentionSection, rightsSection } from "@/lib/dashboard/read";
import type { Member } from "@/lib/gaps/shape";
import { readRetention } from "@/lib/retention/shape";
import { readRights } from "@/lib/rights/shape";
import { todayInIndia } from "@/lib/ropa/shape";
import { readProcessorRegister, type ProcessorApi } from "@/lib/vendors/shape";

/**
 * What the three stakeholder reports read of the registers (Slice 10, Stage
 * 6) — through each register's OWN reader, and its headline through the same
 * function the overview or the register's route uses (D-069), so a report and
 * the page it summarises can never disagree. Only shapes change here: no
 * figure is computed, and nothing personal leaves a register (a request is
 * named by code and kind; a vendor link's respondent is never read).
 */

type Ctx = TenantContext<unknown, unknown>;

function breachLine(b: BreachApi): ReportBreachLine {
  return {
    incidentCode: b.incidentCode,
    title: b.title,
    natureLabel: b.natureLabel,
    severityLabel: GAP_SEVERITY_LABEL[b.severity],
    statusLabel: b.statusLabel,
    awareAt: b.awareAt,
    boardClock: { state: b.board.clock.state, label: b.board.clock.label },
    extensionUntil: b.board.extension?.until ?? null,
    boardInitialAt: b.board.initial?.at ?? null,
    boardReportAt: b.board.report?.at ?? null,
    principalsAt: b.principals?.at ?? null,
    documents: b.documents.length,
  };
}

/** The CISO's: every incident, and the overview's own breach counts over them. */
export async function readSecurityRegisters(ctx: Ctx, members: readonly Member[]): Promise<Pick<SecurityBreachInput, "breaches">> {
  const now = new Date().toISOString();
  const incidents = await readBreaches(ctx.supabase, ctx.organizationId, members, now);
  return { breaches: { counts: breachSection(incidents, now).counts, incidents: incidents.map(breachLine) } };
}

/** Counsel's: rights and grievance, notice and consent, retention, and the AI register's note. */
export async function readLegalRegisters(
  ctx: Ctx,
  members: readonly Member[],
  today: string,
  register: RopaRegisterCounts,
): Promise<Pick<LegalPositionInput, "rights" | "consent" | "register" | "retention" | "ai">> {
  const { supabase, organizationId } = ctx;
  const [requests, consent, schedules, ai, org] = await Promise.all([
    readRights(supabase, organizationId, members, today),
    readConsentRegister(supabase, organizationId, members),
    readRetention(supabase, organizationId, members, today),
    readAiRegister(supabase, organizationId, members, today),
    // Never inferred: a Third-Schedule class is recorded by the organisation (D-095.3).
    supabase.from("organizations").select("third_schedule_class").eq("id", organizationId).maybeSingle(),
  ]);
  if (org.error) throw org.error;
  const rights = rightsSection(requests, today);
  const retention = retentionSection(schedules, today);
  const cls = (org.data?.third_schedule_class ?? null) as ThirdScheduleClass | null;
  const live = consent.configs.find((c) => c.id === consent.liveConfigId) ?? null;

  return {
    rights: {
      counts: rights.counts,
      attention: rights.attention.map((r) => ({ requestCode: r.requestCode, kindLabel: r.kindLabel, clockLabel: r.clock.label, overdue: r.clock.state === "overdue" })),
    },
    consent: {
      counts: consent.counts,
      notices: consent.notices
        .filter((n) => n.status === "published")
        .map((n) => ({ languageLabel: n.languageLabel, version: n.version, publishedOn: n.publishedAt ? todayInIndia(new Date(n.publishedAt)) : null })),
      liveWidgetVersion: live?.version ?? null,
    },
    register,
    retention: { counts: retention.counts, overdue: retention.overdue, thirdScheduleLabel: cls ? THIRD_SCHEDULE_CLASS_LABEL[cls] : null },
    ai: { counts: ai.counts, sdfNotified: ai.sdfNotified },
  };
}

function processorLine(v: ProcessorApi): ReportProcessorLine {
  return {
    name: v.name,
    service: v.service,
    role: v.vendorRole as VendorRole,
    isProcessor: v.isProcessor,
    contractExists: v.contractExists as TriState,
    dpdpClauses: v.dpdpClauses as TriState,
    crossBorder: v.crossBorder as TriState,
    contractGap: v.contractGap,
    contractReviewPassed: v.contractReviewPassed,
    current: v.current
      ? { riskScore: v.current.riskScore, riskTierLabel: v.current.riskTierLabel, reviewBy: v.current.reviewBy, outOfDate: v.current.outOfDate }
      : null,
    open: v.open ? { statusLabel: v.open.statusLabel, withVendor: v.open.withVendor } : null,
    documents: v.documents.length,
  };
}

/** Procurement's: the processor register and its own counts. */
export async function readProcessorRegisters(ctx: Ctx, members: readonly Member[], today: string): Promise<Pick<ProcessorExposureInput, "processors">> {
  const register = await readProcessorRegister(ctx.supabase, ctx.organizationId, members, today);
  return { processors: { counts: register.counts, vendors: register.vendors.map(processorLine) } };
}
