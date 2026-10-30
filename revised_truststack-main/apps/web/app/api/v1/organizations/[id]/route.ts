import { isCalendarDate, PUBLIC_SLUG_PATTERN, THIRD_SCHEDULE_CLASSES, THIRD_SCHEDULE_CLASS_LABEL, type ThirdScheduleClass } from "@truststack/core";
import { z } from "zod";
import { ApiError, withApi } from "@/lib/api/guard";
import { ok } from "@/lib/api/envelope";
import { todayInIndia } from "@/lib/ropa/shape";
import { scopeDbError } from "@/lib/scope/db-errors";
import type { AppSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COLUMNS =
  "id, name, legal_name, organization_type, industry_code, website, headquarters_city, employee_count, data_principal_count_estimate, consultant_assisted, parent_organization_id, sdf_notified_on, sdf_notification_ref, public_slug, public_contact_name, public_contact_email, public_contact_phone, public_contact_is_dpo, third_schedule_class, ai_enabled, ai_contract_ref, ai_enabled_at, ai_enabled_by";

async function readProfile(supabase: AppSupabaseClient, organizationId: string) {
  const { data, error } = await supabase.from("organizations").select(COLUMNS).eq("id", organizationId).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(403, "TENANT_ACCESS_DENIED", "You do not have access to this organisation.");
  // Stage 1b: who turned the assistant on, by name (A2) — a co-member's row, which RLS lets a member read.
  const { data: enabledBy } = data.ai_enabled_by
    ? await supabase.from("users").select("full_name").eq("id", data.ai_enabled_by).maybeSingle()
    : { data: null };
  return {
    id: data.id,
    name: data.name,
    legalName: data.legal_name,
    organizationType: data.organization_type,
    industryCode: data.industry_code,
    website: data.website,
    headquartersCity: data.headquarters_city,
    employeeCount: data.employee_count,
    dataPrincipalCountEstimate: data.data_principal_count_estimate,
    consultantAssisted: data.consultant_assisted,
    parentOrganizationId: data.parent_organization_id,
    /**
     * Entered by a person with `organization.update`, never inferred (D-028):
     * null means penalty head 4 (s.10) does not apply.
     */
    sdfNotification:
      data.sdf_notified_on === null ? null : { notifiedOn: data.sdf_notified_on, reference: data.sdf_notification_ref },
    /**
     * Slice 10 Stage 5: Rule 8(1)'s Third-Schedule class, entered by a person
     * with `organization.update`, never inferred. Null = none: the three-year
     * period and the 48-hour notice of Rule 8(1)–(2) do not apply.
     */
    thirdScheduleClass:
      data.third_schedule_class === null
        ? null
        : {
            class: data.third_schedule_class as ThirdScheduleClass,
            label: THIRD_SCHEDULE_CLASS_LABEL[data.third_schedule_class as ThirdScheduleClass] ?? data.third_schedule_class,
          },
    /**
     * Slice 11 Stage 1a: the AI assistant's switch (A2). On only with the
     * client's contract (DPA) reference; who and when are stamped by the
     * database (Stage 1b adds who, by name, for Organisation settings). Whether it
     * can answer now (kill switch, holds) is GET …/ai.
     */
    ai: {
      enabled: data.ai_enabled,
      contractRef: data.ai_contract_ref,
      enabledAt: data.ai_enabled_at,
      enabledByName: data.ai_enabled_by ? (enabledBy?.full_name ?? "A former member") : null,
    },
    /**
     * Slice 10 Stage 3a: the public address and the published Rule 9 contact.
     * `slug` null = no public pages. The contact may be kept while the pages are closed.
     */
    publicPages: {
      slug: data.public_slug,
      contact:
        data.public_contact_name === null
          ? null
          : {
              name: data.public_contact_name,
              email: data.public_contact_email ?? "",
              phone: data.public_contact_phone,
              isDpo: data.public_contact_is_dpo,
            },
    },
  };
}

/** GET /api/v1/organizations/{id} — the organisation profile. */
export const GET = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.read" },
  async ({ request, supabase, organizationId }) => ok({ organization: await readProfile(supabase, organizationId) }, request),
);

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    legalName: z.string().trim().max(300).nullable(),
    website: z.url().max(300).nullable(),
    headquartersCity: z.string().trim().max(120).nullable(),
    employeeCount: z.number().int().min(0).max(10_000_000).nullable(),
    /**
     * Slice 9: a Significant Data Fiduciary notification — both fields or
     * null to clear both. Only if the Central Government has notified the
     * organisation; TrustStack never infers it (D-028, SLICE_09 §4.4).
     */
    sdfNotification: z
      .object({
        notifiedOn: z
          .string()
          .refine(isCalendarDate, "Use a date as YYYY-MM-DD.")
          .refine((d) => d >= "2023-08-11", "The DPDP Act was enacted on 11 August 2023.")
          // Not in the future, in India (D-055) — read on each request.
          .refine((d) => d <= todayInIndia(), "A notification date cannot be in the future."),
        reference: z.string().trim().min(1).max(200),
      })
      .strict()
      .nullable(),
    /**
     * Slice 10 Stage 5: the Third-Schedule class (Rule 8(1)) — only if the
     * organisation IS one of the three classes; null clears it. Never inferred
     * from size or sector.
     */
    thirdScheduleClass: z.enum(THIRD_SCHEDULE_CLASSES).nullable(),
    /**
     * Slice 11 Stage 1a (A2): turn the AI assistant on — only with the
     * reference of the client's contract that names the AI sub-processor
     * (s.8(2)) — or off, at once. The database refuses a held industry or an
     * SDF (A4) and stamps who and when.
     */
    ai: z
      .object({
        enabled: z.boolean(),
        contractRef: z
          .string()
          .trim()
          .max(200)
          .nullish()
          .transform((v) => (v ? v : null)),
      })
      .strict()
      .refine((v) => !v.enabled || v.contractRef !== null, {
        message: "Record the contract (DPA) reference that names the AI provider before turning the assistant on.",
        path: ["contractRef"],
      }),
    /**
     * Slice 10 Stage 3a: the public address (`/p/{slug}`) and the Rule 9
     * contact (s.8(9)). A slug needs the contact; slug null closes the pages.
     */
    publicPages: z
      .object({
        slug: z.string().regex(PUBLIC_SLUG_PATTERN, "Use 3–63 lower-case letters, digits and hyphens.").nullable(),
        contact: z
          .object({
            name: z.string().trim().min(1).max(200),
            email: z.email().max(320),
            phone: z
              .string()
              .trim()
              .max(40)
              .nullish()
              .transform((v) => (v ? v : null)),
            isDpo: z.boolean(),
          })
          .strict()
          .nullable(),
      })
      .strict()
      .refine((v) => v.slug === null || v.contact !== null, {
        message: "Publish a contact before opening the public pages (Rule 9).",
        path: ["contact"],
      }),
  })
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: "Provide at least one field." });

/**
 * PATCH /api/v1/organizations/{id} — profile fields, the SDF notification, the public pages and the AI switch
 * (organization.update), each guarded again by `app.guard_organization_update`.
 * Industry and Data Principal scale belong to the scope wizard (scope.write,
 * PUT …/scope); a DB trigger enforces the same split (D-026). Audited by trigger.
 */
export const PATCH = withApi(
  { auth: "required", tenant: "fromParam", permission: "organization.update", body: patchSchema },
  async ({ request, supabase, organizationId, body }) => {
    const patch = {
      name: body.name,
      legal_name: body.legalName,
      website: body.website,
      headquarters_city: body.headquartersCity,
      employee_count: body.employeeCount,
      ...(body.sdfNotification === undefined
        ? {}
        : {
            sdf_notified_on: body.sdfNotification?.notifiedOn ?? null,
            sdf_notification_ref: body.sdfNotification?.reference ?? null,
          }),
      ...(body.thirdScheduleClass === undefined ? {} : { third_schedule_class: body.thirdScheduleClass }),
      ...(body.ai === undefined ? {} : { ai_enabled: body.ai.enabled, ai_contract_ref: body.ai.contractRef }),
      ...(body.publicPages === undefined
        ? {}
        : {
            public_slug: body.publicPages.slug,
            public_contact_name: body.publicPages.contact?.name ?? null,
            public_contact_email: body.publicPages.contact?.email ?? null,
            public_contact_phone: body.publicPages.contact?.phone ?? null,
            public_contact_is_dpo: body.publicPages.contact?.isDpo ?? false,
          }),
    };
    const { error } = await supabase.from("organizations").update(patch).eq("id", organizationId);
    if (error?.code === "23505" && body.publicPages) {
      throw new ApiError(409, "CONFLICT", "That public address is already taken — choose another.");
    }
    if (error) throw scopeDbError(error, "update");
    return ok({ organization: await readProfile(supabase, organizationId) }, request);
  },
);
