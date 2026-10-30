/**
 * Idempotent seed: `pnpm db:seed` any number of times, no duplicates.
 *
 * Tooling, not app runtime: it uses the Supabase admin API (service role) only
 * to create the Auth users that sign-in needs. The web app's single service-role
 * module is apps/web/lib/supabase/admin.ts (D-015).
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import {
  assertDomainWeightsTotal,
  deriveRiskTags,
  DPDP_DOMAINS,
  generateAssessmentQuestions,
  importedRecordFacts,
  mapColumns,
  mapTriggerText,
  ropaCompleteness,
  ropaRisk,
  validateRopaRow,
  scopeFactsFrom,
  selectQuestionPacks,
  type AiUsageType,
  type DataLocation,
  type DataPrincipalCode,
  type HostingModel,
  type RiskInput,
  type RopaLawfulBasis,
  type RopaRetentionTrigger,
  type RopaSafeguard,
  type SystemType,
  type VendorRole,
} from "@truststack/core";
import { createPrismaClient } from "../src/client.js";
import { loadQuestionBank, questionCountsByPack } from "../question-bank/load.js";
import {
  SEED_ASSESSMENTS,
  SEED_BREACHES,
  SEED_RIGHTS_REQUESTS,
  SEED_NOTICE,
  SEED_CONSENT_CONFIG,
  SEED_CONSENT_RECORDS,
  SEED_EVIDENCE,
  SEED_ORGS,
  SEED_RESPONSES,
  SEED_ROPA,
  SEED_SCOPE,
  SEED_USERS,
  SEED_VENDOR_ASSESSMENTS,
  SEED_VENDOR_LINK,
  SEED_VENDOR_DOCUMENTS,
  SEED_RETENTION,
  SEED_AI_SYSTEMS,
  seedEvidencePath,
  type SeedRopaLinks,
  type SeedScope,
  type SeedUser,
} from "./seed-data.js";

loadEnv({ path: path.resolve(import.meta.dirname, "../../../.env.local"), quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const password = required("SEED_USER_PASSWORD");
const admin = createClient(supabaseUrl, required("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});
const prisma = createPrismaClient(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

async function findAuthUserId(email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (data.users.length < 200) return null;
  }
}

async function ensureAuthUser(email: string, fullName: string): Promise<string> {
  const existing = await findAuthUserId(email);
  if (existing) {
    // Keep the password in step with SEED_USER_PASSWORD so tests always sign in.
    const { error } = await admin.auth.admin.updateUserById(existing, { password });
    if (error) throw error;
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  for (const org of Object.values(SEED_ORGS)) {
    const { id, ...fields } = org;
    await prisma.organization.upsert({ where: { id }, create: org, update: fields });
  }

  // Departments first: memberships reference them (composite FK).
  for (const [orgKey, scope] of Object.entries(SEED_SCOPE) as [keyof typeof SEED_ORGS, SeedScope][]) {
    const organizationId = SEED_ORGS[orgKey].id;
    for (const dept of Object.values(scope.departments)) {
      await prisma.department.upsert({
        where: { id: dept.id },
        create: { id: dept.id, organizationId, name: dept.name },
        update: { name: dept.name },
      });
    }
  }

  // Reference data comes from the migration (D-020); fail loudly if it is missing.
  const roles = new Map((await prisma.role.findMany()).map((r) => [r.code, r.id]));
  if (roles.size === 0) throw new Error("roles table is empty — run `pnpm db:migrate` first");

  for (const seedUser of Object.values(SEED_USERS) as SeedUser[]) {
    const authId = await ensureAuthUser(seedUser.email, seedUser.fullName);

    await prisma.user.upsert({
      where: { id: seedUser.id },
      create: {
        id: seedUser.id,
        authProviderUserId: authId,
        email: seedUser.email,
        fullName: seedUser.fullName,
      },
      update: { authProviderUserId: authId, email: seedUser.email, fullName: seedUser.fullName },
    });

    for (const membership of seedUser.memberships) {
      const roleId = roles.get(membership.roleCode);
      if (!roleId) throw new Error(`unknown role ${membership.roleCode}`);
      const orgKey = (Object.keys(SEED_ORGS) as (keyof typeof SEED_ORGS)[]).find(
        (k) => SEED_ORGS[k].id === membership.organizationId,
      )!;
      const departmentId = membership.departmentKey
        ? (SEED_SCOPE[orgKey] as SeedScope).departments[membership.departmentKey]!.id
        : null;
      // `update` resets role and status too, so a test that changed a seeded
      // member is undone by the next seed.
      await prisma.organizationUser.upsert({
        where: { id: membership.id },
        create: {
          id: membership.id,
          organizationId: membership.organizationId,
          userId: seedUser.id,
          roleId,
          departmentId,
          status: "active",
          joinedAt: new Date(),
        },
        update: { roleId, status: "active", departmentId },
      });
    }

    if (seedUser.signInAuditId) {
      const organizationId = seedUser.memberships[0]!.organizationId;
      await prisma.auditLog.upsert({
        where: { id: seedUser.signInAuditId },
        create: {
          id: seedUser.signInAuditId,
          organizationId,
          userId: seedUser.id,
          eventType: "auth.sign_in",
          entityType: "user",
          entityId: seedUser.id,
          description: "Seeded sign-in",
          metadata: { source: "seed" },
        },
        update: {},
      });
    }

    const orgs = seedUser.memberships.map((m) => `${m.organizationId}:${m.roleCode}`).join(", ");
    console.log(`seeded ${seedUser.email} → ${orgs}`);
  }

  await seedScopes();
  await seedQuestionBank();
  await seedAssessments();
  await seedEvidence();
  await seedGaps();
  await seedRopa();
  await seedBreaches();
  await seedRightsRequests();
  await seedConsent();
  await seedVendorAssessments();
  await seedVendorLink();
  await seedRetention();
  await seedAiSystems();
}

/** The RiskInput shape the wizard builds, from a seed fixture. */
function riskInputFor(orgKey: keyof typeof SEED_ORGS): RiskInput {
  const scope = SEED_SCOPE[orgKey] as SeedScope;
  return {
    scope: { ...scope.answers, aiUsageTypes: scope.answers.aiUsageTypes as AiUsageType[] },
    systems: Object.values(scope.systems).map((s) => ({
      name: s.name,
      systemType: s.systemType as SystemType,
      hostingModel: s.hostingModel as HostingModel,
      dataLocation: s.dataLocation as DataLocation,
      processesChildrenData: s.processesChildrenData,
    })),
    vendors: Object.values(scope.vendors).map((v) => ({
      name: v.name,
      vendorRole: v.vendorRole as VendorRole,
      crossBorder: v.crossBorder,
    })),
    dataPrincipalTypes: Object.values(scope.dataPrincipalTypes).map((d) => ({
      code: d.code as DataPrincipalCode,
      label: d.label,
      includesChildren: d.includesChildren,
      estimatedCount: d.estimatedCount,
    })),
    dataPrincipalCountEstimate: SEED_ORGS[orgKey].dataPrincipalCountEstimate,
  };
}

/** Registers + scope answers. `risk_tags` is derived with packages/core, never typed in. */
async function seedScopes() {
  for (const [orgKey, scope] of Object.entries(SEED_SCOPE) as [keyof typeof SEED_ORGS, SeedScope][]) {
    const org = SEED_ORGS[orgKey];
    const organizationId = org.id;

    for (const sys of Object.values(scope.systems)) {
      const fields = {
        name: sys.name,
        systemType: sys.systemType,
        hostingModel: sys.hostingModel,
        dataLocation: sys.dataLocation,
        processesChildrenData: sys.processesChildrenData,
        ownerDepartmentId: sys.ownerDepartmentKey ? scope.departments[sys.ownerDepartmentKey]!.id : null,
      };
      await prisma.system.upsert({ where: { id: sys.id }, create: { id: sys.id, organizationId, ...fields }, update: fields });
    }

    for (const vendor of Object.values(scope.vendors)) {
      const { id, systemKeys, ...fields } = vendor;
      await prisma.vendor.upsert({ where: { id }, create: { id, organizationId, ...fields }, update: fields });
      for (const key of systemKeys) {
        const systemId = scope.systems[key]!.id;
        await prisma.vendorSystem.upsert({
          where: { vendorId_systemId: { vendorId: id, systemId } },
          create: { organizationId, vendorId: id, systemId },
          update: {},
        });
      }
    }

    for (const dp of Object.values(scope.dataPrincipalTypes)) {
      const { id, ...fields } = dp;
      await prisma.dataPrincipalType.upsert({ where: { id }, create: { id, organizationId, ...fields }, update: fields });
    }

    const riskTags = deriveRiskTags({
      scope: { ...scope.answers, aiUsageTypes: scope.answers.aiUsageTypes as AiUsageType[] },
      systems: Object.values(scope.systems).map((s) => ({
        name: s.name,
        systemType: s.systemType as SystemType,
        hostingModel: s.hostingModel as HostingModel,
        dataLocation: s.dataLocation as DataLocation,
        processesChildrenData: s.processesChildrenData,
      })),
      vendors: Object.values(scope.vendors).map((v) => ({
        name: v.name,
        vendorRole: v.vendorRole as VendorRole,
        crossBorder: v.crossBorder,
      })),
      dataPrincipalTypes: Object.values(scope.dataPrincipalTypes).map((d) => ({
        code: d.code as DataPrincipalCode,
        label: d.label,
        includesChildren: d.includesChildren,
        estimatedCount: d.estimatedCount,
      })),
      dataPrincipalCountEstimate: org.dataPrincipalCountEstimate,
    });

    const answers = { ...scope.answers, riskTags };
    await prisma.organizationScope.upsert({
      where: { organizationId },
      create: { organizationId, ...answers, derivedAt: new Date() },
      update: answers,
    });
    console.log(`seeded scope ${org.name} → ${riskTags.join(", ") || "(no risk tags)"}`);
  }
}


/**
 * The question bank. The 98 core questions come from the committed JSON the
 * Excel extractor produces; the 1,429 industry questions are parsed from the
 * authored Markdown on every run, so the database cannot drift from the
 * authoring source (D-013).
 *
 * `question_versions` is immutable once a version is APPROVED: the upsert
 * below refuses to rewrite an approved row, so a content change to published
 * material has to become a new version. Draft content may be revised in place
 * while counsel review is still open.
 */
async function seedQuestionBank() {
  // The 16 domains and the 20 packs are reference data from the migration
  // (D-020). Fail loudly rather than seeding around a missing migration.
  const domains = await prisma.dpdpDomain.count();
  if (domains === 0) throw new Error("dpdp_domains is empty — run `pnpm db:migrate` first");
  assertDomainWeightsTotal(DPDP_DOMAINS);

  const bank = loadQuestionBank();
  const seededPacks = new Set((await prisma.questionPack.findMany({ select: { code: true } })).map((p) => p.code));
  for (const pack of bank.packs) {
    if (!seededPacks.has(pack.code)) throw new Error(`question pack ${pack.code} is missing from the migration`);
  }

  // Bulk upsert: 1,527 round trips would make the seed unusable in CI.
  const q = bank.questions;
  await prisma.$executeRaw`
    INSERT INTO public.questions (code, pack_code, source_tag, current_version)
    SELECT * FROM unnest(
      ${q.map((x) => x.questionCode)}::text[], ${q.map((x) => x.packCode)}::text[],
      ${q.map((x) => x.sourceTag)}::text[], ${q.map((x) => x.version)}::text[])
    ON CONFLICT (code) DO UPDATE SET
      pack_code = EXCLUDED.pack_code,
      source_tag = EXCLUDED.source_tag,
      current_version = EXCLUDED.current_version`;

  await prisma.$executeRaw`
    INSERT INTO public.question_versions (
      question_code, version, question_text, domain_code, secondary_domain_codes, applicability,
      type_text, trigger_text, trigger_condition, risk_tags, evidence_guidance, risk_if_weak,
      suggested_owner, priority, criticality, legal_control_basis, recommended_fix,
      truststack_module, na_rule, source_ref, status)
    SELECT
      v.question_code, v.version, v.question_text, v.domain_code,
      string_to_array(nullif(v.secondary_domain_codes, ''), ','), v.applicability,
      v.type_text, v.trigger_text, nullif(v.trigger_condition, '')::jsonb,
      string_to_array(nullif(v.risk_tags, ''), ','), v.evidence_guidance, v.risk_if_weak,
      v.suggested_owner, v.priority, v.criticality, v.legal_control_basis, v.recommended_fix,
      v.truststack_module, v.na_rule, v.source_ref, v.status
    FROM unnest(
      ${q.map((x) => x.questionCode)}::text[], ${q.map((x) => x.version)}::text[],
      ${q.map((x) => x.questionText)}::text[], ${q.map((x) => x.domainCode)}::text[],
      ${q.map((x) => x.secondaryDomainCodes.join(","))}::text[], ${q.map((x) => x.applicability)}::text[],
      ${q.map((x) => x.typeText)}::text[], ${q.map((x) => x.triggerText)}::text[],
      ${q.map((x) => JSON.stringify(mapTriggerText(x.triggerText) ?? null)).map((j) => (j === "null" ? null : j))}::text[],
      ${q.map((x) => x.riskTags.join(","))}::text[], ${q.map((x) => x.evidenceGuidance)}::text[],
      ${q.map((x) => x.riskIfWeak)}::text[], ${q.map((x) => x.suggestedOwner)}::text[],
      ${q.map((x) => x.priority)}::text[], ${q.map((x) => x.criticality)}::text[],
      ${q.map((x) => x.legalControlBasis)}::text[], ${q.map((x) => x.recommendedFix)}::text[],
      ${q.map((x) => x.truststackModule)}::text[], ${q.map((x) => x.naRule)}::text[],
      ${q.map((x) => x.sourceRef)}::text[], ${q.map((x) => x.status)}::text[]
    ) AS v(question_code, version, question_text, domain_code, secondary_domain_codes, applicability,
           type_text, trigger_text, trigger_condition, risk_tags, evidence_guidance, risk_if_weak,
           suggested_owner, priority, criticality, legal_control_basis, recommended_fix,
           truststack_module, na_rule, source_ref, status)
    ON CONFLICT (question_code, version) DO UPDATE SET
      question_text = EXCLUDED.question_text,
      domain_code = EXCLUDED.domain_code,
      secondary_domain_codes = EXCLUDED.secondary_domain_codes,
      applicability = EXCLUDED.applicability,
      type_text = EXCLUDED.type_text,
      trigger_text = EXCLUDED.trigger_text,
      trigger_condition = EXCLUDED.trigger_condition,
      risk_tags = EXCLUDED.risk_tags,
      evidence_guidance = EXCLUDED.evidence_guidance,
      risk_if_weak = EXCLUDED.risk_if_weak,
      suggested_owner = EXCLUDED.suggested_owner,
      priority = EXCLUDED.priority,
      criticality = EXCLUDED.criticality,
      legal_control_basis = EXCLUDED.legal_control_basis,
      recommended_fix = EXCLUDED.recommended_fix,
      truststack_module = EXCLUDED.truststack_module,
      na_rule = EXCLUDED.na_rule,
      source_ref = EXCLUDED.source_ref
    WHERE public.question_versions.status = 'draft'`;

  const counts = questionCountsByPack(bank);
  const summary = Object.entries(counts).filter(([, n]) => n > 0).map(([code, n]) => `${code} ${n}`).join(" · ");
  console.log(`seeded question bank → ${bank.questions.length} questions: ${summary}`);
}

/**
 * Mumbai University's draft baseline, generated from its seeded scope exactly
 * as the API would. Written as tooling (no JWT), so the audit trigger stays
 * quiet and the RPC's draft check is not the gate here — the seed is not a
 * user action (D-027).
 */
async function seedAssessments() {
  const bank = loadQuestionBank();

  for (const fixture of Object.values(SEED_ASSESSMENTS)) {
    const orgKey = (Object.keys(SEED_ORGS) as (keyof typeof SEED_ORGS)[]).find(
      (k) => SEED_ORGS[k].id === fixture.organizationId,
    )!;
    const org = SEED_ORGS[orgKey];
    const input = riskInputFor(orgKey);
    const facts = scopeFactsFrom(org.industryCode, input);
    const packCodes = selectQuestionPacks({
      industryCode: org.industryCode,
      riskTags: facts.riskTags,
      aiUsageTypes: facts.aiUsageTypes,
    });
    const result = generateAssessmentQuestions(bank, packCodes, facts);

    const creator = await prisma.user.findFirst({ where: { email: fixture.createdByEmail } });
    const scope = await prisma.organizationScope.findUnique({ where: { organizationId: org.id } });

    // Answers first: an assessment with answers cannot return to draft, and
    // the snapshot below cannot be rewritten underneath them (D-041). The
    // seed is the source of truth for this row, so its answers go too — the
    // response trigger removes their evidence links with them.
    await prisma.assessmentResponse.deleteMany({ where: { assessmentId: fixture.id } });

    const fields = {
      name: fixture.name,
      assessmentType: fixture.assessmentType,
      // Snapshotted as a draft; seedEvidence() answers it, which moves it on.
      status: "draft",
      industryCode: org.industryCode,
      riskTags: [...facts.riskTags],
      packCodes: result.packCodes,
      scopeDerivedAt: scope?.derivedAt ?? null,
      generatedAt: new Date(),
      createdBy: creator?.id ?? null,
    };
    await prisma.assessment.upsert({
      where: { id: fixture.id },
      create: { id: fixture.id, organizationId: org.id, ...fields },
      update: fields,
    });

    // Re-snapshot from scratch: the seed is the source of truth for this row.
    await prisma.assessmentQuestion.deleteMany({ where: { assessmentId: fixture.id } });
    await prisma.assessmentQuestion.createMany({
      data: result.questions.map((question) => ({
        organizationId: org.id,
        assessmentId: fixture.id,
        questionCode: question.questionCode,
        questionVersion: question.questionVersion,
        questionText: question.questionText,
        domainCode: question.domainCode,
        domainWeight: question.domainWeight,
        applicability: question.applicability,
        priority: question.priority,
        evidenceGuidance: question.evidenceGuidance,
        suggestedOwner: question.suggestedOwner,
        packCode: question.packCode,
        sortOrder: question.sortOrder,
        includedReason: question.includedReason,
      })),
    });

    console.log(
      `seeded assessment ${fixture.name} → ${result.questions.length} questions ` +
        `(${result.coverage.mapped} on a mapped trigger, ${result.coverage.unresolved} Potentially Applicable — ` +
        `${result.coverage.unstatedConditions} of those name no condition at all)`,
    );
    if (result.coverage.unresolvedPhrases.length > 0) {
      console.log(`  unresolved trigger phrases: ${result.coverage.unresolvedPhrases.join(" · ")}`);
    }
    if (result.skippedPacks.length > 0) {
      console.log(`  packs skipped: ${result.skippedPacks.map((p) => `${p.code} (${p.reason})`).join(" · ")}`);
    }
  }
}

/**
 * Slice 4: one answered question with one STORED artefact, reviewed by
 * someone other than its uploader. Everything derived — the evidence level
 * on the response, the adjusted score, the move to in_progress — is left to
 * the database triggers, exactly as for a user.
 */
async function seedEvidence() {
  const userId = async (email: string) => {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) throw new Error(`seed user ${email} missing`);
    return user.id;
  };

  for (const fixture of Object.values(SEED_EVIDENCE)) {
    const storagePath = seedEvidencePath(fixture);
    // The artefact itself. upsert: tooling may overwrite; users never can
    // (no UPDATE policy on storage.objects — D-042).
    const { error } = await admin.storage
      .from("evidence")
      .upload(storagePath, new Blob([fixture.body], { type: fixture.contentType }), {
        upsert: true,
        contentType: fixture.contentType,
      });
    if (error) throw new Error(`evidence upload failed for ${storagePath}: ${error.message}`);

    const fields = {
      storagePath,
      fileName: fixture.fileName,
      contentType: fixture.contentType,
      byteSize: Buffer.byteLength(fixture.body),
      uploadedBy: await userId(fixture.uploadedByEmail),
      reviewStatus: fixture.reviewStatus,
      evidenceLevel: fixture.evidenceLevel,
      reviewedBy: await userId(fixture.reviewedByEmail),
      reviewedAt: new Date(),
      reviewNotes: fixture.reviewNotes,
    };
    await prisma.evidence.upsert({
      where: { id: fixture.id },
      create: { id: fixture.id, organizationId: fixture.organizationId, ...fields },
      update: fields,
    });
  }

  for (const [key, fixture] of Object.entries(SEED_RESPONSES)) {
    await prisma.assessmentResponse.create({
      data: {
        id: fixture.id,
        organizationId: fixture.organizationId,
        assessmentId: fixture.assessmentId,
        questionCode: fixture.questionCode,
        applicabilityDecision: fixture.applicabilityDecision,
        claimedMaturity: fixture.claimedMaturity,
        notes: fixture.notes,
        answeredBy: await userId(fixture.answeredByEmail),
      },
    });
    for (const evidence of Object.values(SEED_EVIDENCE).filter((e) => e.linkedResponseKey === key)) {
      await prisma.evidenceLink.create({
        data: {
          id: evidence.linkId,
          organizationId: evidence.organizationId,
          evidenceId: evidence.id,
          linkedEntityType: "assessment_response",
          linkedEntityId: fixture.id,
          linkedBy: await userId(evidence.uploadedByEmail),
        },
      });
    }

    const scored = await prisma.assessmentResponse.findUniqueOrThrow({ where: { id: fixture.id } });
    const assessment = await prisma.assessment.findUniqueOrThrow({ where: { id: fixture.assessmentId } });
    console.log(
      `seeded response ${fixture.questionCode}: claimed ${scored.claimedMaturity} · evidence E${scored.evidenceLevel} ` +
        `→ adjusted ${scored.adjustedScore} · assessment ${assessment.status}`,
    );
  }
}

/**
 * Slice 6: the gap register for each seeded assessment, generated by the same
 * SQL the API's RPC and `finalise_assessment` call — never written by hand.
 * MU's baseline has ONE answer (G1.2, adjusted 3), so it has exactly one gap
 * and one action: enough to prove the journey, and honest about the data.
 * Tooling, so no audit row and no permission check (D-027).
 */
async function seedGaps() {
  for (const fixture of Object.values(SEED_ASSESSMENTS)) {
    await prisma.$queryRaw`SELECT app.refresh_assessment_gaps(${fixture.organizationId}::uuid, ${fixture.id}::uuid)`;
    const gaps = await prisma.assessmentGap.findMany({
      where: { assessmentId: fixture.id },
      include: { actions: true },
      orderBy: { questionCode: "asc" },
    });
    const summary = gaps
      .map((g) => `${g.questionCode} ${g.severity}/${g.priority} (adjusted ${g.adjustedScore}, ${g.actions.length} action)`)
      .join(" · ");
    console.log(`seeded gap register ${fixture.name} → ${gaps.length} gap(s)${summary ? `: ${summary}` : ""}`);
  }
}

/**
 * Slice 7: the workbook's ten processing records become Mumbai University's
 * register — through the SAME column mapping and row validation an import
 * uses, so the seed proves the importer reads the workbook's own layout.
 *
 * Completeness and risk are derived by the database trigger, never written
 * here. The workbook's hand-entered Risk Rating is kept only where it RAISES
 * the derived one (an assessor may raise, never lower — D-061); the log says
 * which hand ratings the rules disagree with. Idempotent: a re-run resets each
 * record to the fixture, as a Draft with no owner.
 */
async function seedRopa() {
  const file = JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, "../question-bank/ropa-register.json"), "utf8"),
  ) as { columns: string[]; records: Record<string, string>[] };

  const mapping = mapColumns(file.columns);
  if (mapping.missingRequired.length > 0 || mapping.unmapped.length > 0) {
    throw new Error(`the importer cannot read the workbook's ROPA columns: ${[...mapping.missingRequired, ...mapping.unmapped].join(", ")}`);
  }

  const orgKey = SEED_ROPA.organizationKey;
  const organizationId = SEED_ORGS[orgKey].id;
  const scope = SEED_SCOPE[orgKey] as SeedScope;
  const lines: string[] = [];

  // Back to the fixture: no ROPA gaps (they are generated on request, D-062),
  // so none survives from an earlier run. Their actions go with them.
  const seededIds = Object.values(SEED_ROPA.records).map((r) => r.id);
  await prisma.ropaGap.deleteMany({
    where: { organizationId, OR: [{ ropaRecordId: { in: seededIds } }, { ropaRecordId: null }] },
  });

  for (const row of file.records) {
    const cells = Object.fromEntries(
      Object.entries(mapping.fields).map(([field, index]) => [field, row[file.columns[index!]!] ?? ""]),
    );
    const result = validateRopaRow(cells);
    if (!result.ok) {
      throw new Error(`workbook ROPA row ${row["ROPA ID"]} is invalid: ${result.errors.map((e) => `${e.field}: ${e.issue}`).join("; ")}`);
    }
    const record = result.record;
    const links = SEED_ROPA.records[record.recordCode as keyof typeof SEED_ROPA.records] as SeedRopaLinks | undefined;
    if (!links) throw new Error(`no seed links for ${record.recordCode}`);

    const departmentId = links.departmentKey ? scope.departments[links.departmentKey]!.id : null;
    const facts = {
      ...importedRecordFacts(record),
      departmentId,
      systemLinkCount: links.systemKeys.length,
      vendorLinkCount: links.vendorKeys.length,
      lawfulBasis: (links.lawfulBasis ?? null) as RopaLawfulBasis | null,
      retentionTrigger: (links.retentionTrigger ?? null) as RopaRetentionTrigger | null,
      safeguards: links.safeguards as RopaSafeguard[],
      vendorContractGaps: 0,
    };
    const risk = ropaRisk(facts, record.riskRating);
    const date = (iso: string | null) => (iso === null ? null : new Date(`${iso}T00:00:00Z`));

    const content = {
      name: record.name,
      description: record.text.description ?? null,
      departmentId,
      departmentText: record.text.departmentText ?? null,
      ownerUserId: null,
      dataPrincipalTypes: record.text.dataPrincipalTypes ?? null,
      dataCategories: record.text.dataCategories ?? null,
      estimatedDataPrincipals: record.estimatedDataPrincipals,
      purpose: record.text.purpose ?? null,
      legalBasisNote: record.text.legalBasisNote ?? null,
      collectionSource: record.text.collectionSource ?? null,
      systemsText: record.text.systemsText ?? null,
      vendorsText: record.text.vendorsText ?? null,
      sharing: record.text.sharing ?? null,
      retentionRule: record.text.retentionRule ?? null,
      securitySafeguards: record.text.securitySafeguards ?? null,
      noticeLinked: record.text.noticeLinked ?? null,
      consentLinked: record.text.consentLinked ?? null,
      rightsWorkflow: record.text.rightsWorkflow ?? null,
      grievanceLinked: record.text.grievanceLinked ?? null,
      childrenData: record.childrenData,
      crossBorder: record.crossBorder,
      aiProcessing: record.aiProcessing,
      highRiskDocuments: record.highRiskDocuments,
      evidenceNote: record.text.evidenceNote ?? null,
      lawfulBasis: links.lawfulBasis ?? null,
      childParentalConsent: "unknown",
      childExemption: null,
      childTracking: "unknown",
      retentionTrigger: links.retentionTrigger ?? null,
      retentionLaw: null,
      safeguards: [...links.safeguards],
      riskRatingAssessor: risk.assessor,
      riskRatingAssessorReason: risk.assessor ? "Rated by hand in the workbook's ROPA_Register; the rules rate it lower." : null,
      lastReviewedAt: date(record.lastReviewedAt),
      nextReviewAt: date(record.nextReviewAt),
    };
    await prisma.ropaRecord.upsert({
      where: { id: links.id },
      create: { id: links.id, organizationId, recordCode: record.recordCode!, ...content },
      // Back to the fixture: a Draft with no owner, whatever a test did to it.
      update: { ...content, status: "draft" },
    });

    const systemIds = links.systemKeys.map((k) => scope.systems[k]!.id);
    const vendorIds = links.vendorKeys.map((k) => scope.vendors[k]!.id);
    await prisma.ropaSystem.deleteMany({ where: { ropaRecordId: links.id, systemId: { notIn: systemIds } } });
    await prisma.ropaVendor.deleteMany({ where: { ropaRecordId: links.id, vendorId: { notIn: vendorIds } } });
    for (const systemId of systemIds) {
      await prisma.ropaSystem.upsert({
        where: { ropaRecordId_systemId: { ropaRecordId: links.id, systemId } },
        create: { organizationId, ropaRecordId: links.id, systemId },
        update: {},
      });
    }
    for (const vendorId of vendorIds) {
      await prisma.ropaVendor.upsert({
        where: { ropaRecordId_vendorId: { ropaRecordId: links.id, vendorId } },
        create: { organizationId, ropaRecordId: links.id, vendorId },
        update: {},
      });
    }

    const stored = await prisma.ropaRecord.findUniqueOrThrow({ where: { id: links.id } });
    const expected = ropaCompleteness(facts);
    if (stored.completenessScore !== expected.score || stored.riskRating !== risk.rating) {
      throw new Error(
        `${record.recordCode}: the database derived ${stored.completenessScore}/${stored.riskRating}, packages/core ${expected.score}/${risk.rating}`,
      );
    }
    const hand = record.riskRating ?? "none";
    const verdict = hand === risk.derived ? "agrees" : risk.assessor ? `raised by the hand rating to ${risk.assessor}` : `hand rating ${hand} ignored (would lower)`;
    lines.push(`${record.recordCode} ${stored.completenessScore}/100 ${stored.completenessBand} · risk ${risk.derived} (${risk.points} pts) — ${verdict}`);
  }
  console.log(`seeded ROPA register ${SEED_ORGS[orgKey].name} → ${file.records.length} records:\n  ${lines.join("\n  ")}`);
}

/**
 * Slice 10: the breach register. Idempotent — a re-run resets each incident
 * and its action to the fixture. The due time is derived by the database
 * trigger (aware + 72 h), never written here; the code is fixed so tests can
 * name it. Tooling: no audit row, no permission check (D-027).
 */
async function seedBreaches() {
  for (const b of Object.values(SEED_BREACHES)) {
    const organizationId = SEED_ORGS[b.organizationKey].id;
    const recordedBy = SEED_USERS[b.recordedByKey].id;
    const facts = {
      title: b.title,
      description: b.description,
      nature: b.nature,
      severity: b.severity,
      status: "closed",
      occurredAt: new Date(b.occurredAt),
      awareAt: new Date(b.awareAt),
      location: b.location,
      principalsAffected: b.principalsAffected,
      dataCategories: b.dataCategories,
      likelyImpact: b.likelyImpact,
      containmentMeasures: b.containmentMeasures,
      dismissalReason: null,
      boardExtensionUntil: null,
      boardExtensionRef: null,
      boardExtensionRecordedBy: null,
      boardExtensionRecordedAt: null,
      boardInitialAt: new Date(b.boardInitialAt),
      boardInitialRecordedBy: recordedBy,
      boardInitialRecordedAt: new Date(b.boardInitialAt),
      boardReportAt: new Date(b.boardReportAt),
      boardReportRef: b.boardReportRef,
      boardReportRecordedBy: recordedBy,
      boardReportRecordedAt: new Date(b.boardReportAt),
      principalsIntimatedAt: new Date(b.principalsIntimatedAt),
      principalsIntimationMethod: b.principalsIntimationMethod,
      principalsRecordedBy: recordedBy,
      principalsRecordedAt: new Date(b.principalsIntimatedAt),
      closedAt: new Date(b.closedAt),
      closedBy: recordedBy,
      createdBy: recordedBy,
      updatedBy: recordedBy,
      // Overwritten by the trigger — the column is NOT NULL, the value is the database's.
      boardReportDueAt: new Date(b.awareAt),
    };
    await prisma.breachIncident.upsert({
      where: { id: b.id },
      create: { id: b.id, organizationId, incidentCode: b.incidentCode, ...facts },
      update: facts,
    });
    const action = {
      title: b.action.title,
      ownerUserId: SEED_USERS[b.action.ownerKey].id,
      ownerRole: null,
      status: "open",
      dueDate: new Date(`${b.action.dueDate}T00:00:00.000Z`),
      notes: null,
      closedAt: null,
      closedBy: null,
      closureBasis: null,
    };
    await prisma.gapAction.upsert({
      where: { id: b.action.id },
      create: { id: b.action.id, organizationId, breachIncidentId: b.id, ...action },
      update: action,
    });
    const stored = await prisma.breachIncident.findUniqueOrThrow({ where: { id: b.id } });
    console.log(
      `seeded breach ${b.incidentCode} (${SEED_ORGS[b.organizationKey].name}) → ${stored.status}, report due ${stored.boardReportDueAt.toISOString()}, 1 action`,
    );
  }
}

/**
 * Slice 10, Stage 2: the rights and grievance register. Idempotent — a re-run
 * resets each request and its action to the fixture. The respond-by date is
 * derived by the database trigger (receipt + 90 days), never written here;
 * the code is fixed so tests can name it. Tooling: no audit row, no
 * permission check (D-027).
 */
async function seedRightsRequests() {
  const day = (d: string) => new Date(`${d}T00:00:00.000Z`);
  for (const r of Object.values(SEED_RIGHTS_REQUESTS)) {
    const organizationId = SEED_ORGS[r.organizationKey].id;
    const recordedBy = SEED_USERS[r.recordedByKey].id;
    const respondedAt = new Date(`${r.respondedOn}T11:00:00.000Z`);
    const facts = {
      kind: r.kind,
      status: "responded",
      receivedOn: day(r.receivedOn),
      channel: r.channel,
      requesterName: r.requesterName,
      requesterEmail: r.requesterEmail,
      requesterPhone: null,
      requesterCapacity: r.requesterCapacity,
      principalIdentifier: r.principalIdentifier,
      summary: r.summary,
      relatedRequestId: null,
      nomineeName: null,
      nomineeContact: null,
      nomineeRelationship: null,
      ownerUserId: SEED_USERS[r.ownerKey].id,
      identityVerifiedOn: r.identityVerifiedOn === null ? null : day(r.identityVerifiedOn),
      identityMethod: r.identityMethod,
      identityRecordedBy: r.identityVerifiedOn === null ? null : recordedBy,
      identityRecordedAt: r.identityVerifiedOn === null ? null : new Date(`${r.identityVerifiedOn}T06:00:00.000Z`),
      outcome: r.outcome,
      respondedOn: day(r.respondedOn),
      responseSummary: r.responseSummary,
      responseRecordedBy: recordedBy,
      responseRecordedAt: respondedAt,
      closureReason: null,
      closedAt: respondedAt,
      closedBy: recordedBy,
      createdBy: recordedBy,
      updatedBy: recordedBy,
      // Overwritten by the trigger — the column is NOT NULL, the value is the database's.
      respondBy: day(r.receivedOn),
    };
    await prisma.rightsRequest.upsert({
      where: { id: r.id },
      create: { id: r.id, organizationId, requestCode: r.requestCode, ...facts },
      update: facts,
    });
    if ("action" in r) {
      const action = {
        title: r.action.title,
        ownerUserId: SEED_USERS[r.action.ownerKey].id,
        ownerRole: null,
        status: "open",
        dueDate: day(r.action.dueDate),
        notes: null,
        closedAt: null,
        closedBy: null,
        closureBasis: null,
      };
      await prisma.gapAction.upsert({
        where: { id: r.action.id },
        create: { id: r.action.id, organizationId, rightsRequestId: r.id, ...action },
        update: action,
      });
    }
    const stored = await prisma.rightsRequest.findUniqueOrThrow({ where: { id: r.id } });
    console.log(
      `seeded rights request ${r.requestCode} (${SEED_ORGS[r.organizationKey].name}) → ${stored.status}, respond by ${stored.respondBy.toISOString().slice(0, 10)}${"action" in r ? ", 1 action" : ""}`,
    );
  }
}

/**
 * Slice 10 Stage 3b: MU's published notice and widget version, and three
 * staff-recorded consents. Tooling: versions and publishing dates are fixed
 * so tests can name them; a published row is never changed (an identical
 * upsert is no change). A consent record is never updated, so it is inserted
 * once and left alone; its principal key is the database's.
 */
async function seedConsent() {
  const n = SEED_NOTICE;
  const organizationId = SEED_ORGS[n.organizationKey].id;
  const notice = {
    language: n.language,
    version: n.version,
    status: "published",
    title: n.title,
    summary: n.summary,
    purposes: n.purposes as unknown as object,
    withdrawMeans: n.withdrawMeans,
    rightsMeans: n.rightsMeans,
    complaintMeans: n.complaintMeans,
    publishedAt: new Date(`${n.publishedOn}T05:30:00.000Z`),
    publishedBy: SEED_USERS[n.publishedByKey].id,
    createdBy: SEED_USERS[n.publishedByKey].id,
    updatedBy: SEED_USERS[n.publishedByKey].id,
  };
  await prisma.privacyNotice.upsert({ where: { id: n.id }, create: { id: n.id, organizationId, ...notice }, update: notice });

  const c = SEED_CONSENT_CONFIG;
  const config = {
    version: c.version,
    status: "published",
    noticeId: n.id,
    purposes: [...c.purposes],
    languages: [...c.languages],
    position: c.position,
    primaryColor: c.primaryColor,
    publishedAt: new Date(`${c.publishedOn}T05:30:00.000Z`),
    publishedBy: SEED_USERS[c.publishedByKey].id,
    createdBy: SEED_USERS[c.publishedByKey].id,
    updatedBy: SEED_USERS[c.publishedByKey].id,
  };
  await prisma.consentConfig.upsert({ where: { id: c.id }, create: { id: c.id, organizationId, ...config }, update: config });

  const recordedBy = SEED_USERS.muLegal.id;
  for (const r of Object.values(SEED_CONSENT_RECORDS)) {
    await prisma.$executeRaw`
      INSERT INTO public.consent_records (id, organization_id, config_id, principal_key, action, purposes, principal_kind,
        language, source, reference, recorded_by, recorded_at)
      VALUES (${r.id}::uuid, ${organizationId}::uuid, ${c.id}::uuid, app.consent_principal_key(${organizationId}::uuid, ${r.identifier}),
        ${r.action}, ${[...r.purposes]}::text[], 'self', 'en', 'staff', ${r.reference}, ${recordedBy}::uuid, ${r.recordedAt}::timestamptz)
      ON CONFLICT (id) DO NOTHING`;
  }
  console.log(`seeded privacy notice v${n.version} and widget v${c.version} (${SEED_ORGS[n.organizationKey].name}), ${Object.keys(SEED_CONSENT_RECORDS).length} consent records`);
}

/**
 * Slice 10 Stage 4a: the payment gateway's two documents (stored, linked to the
 * vendor) and MU's two processor assessments. Tooling, so no audit row and no
 * permission check; the score is the database's own (`app.vendor_assessment_risk`),
 * read after the answers are in, exactly as `submit_vendor_assessment` reads it.
 * An accepted assessment never changes, so an assessment already present is
 * left alone — a second run is no change.
 */
async function seedVendorAssessments() {
  const vendorId = (key: string) => (SEED_SCOPE.mumbaiUniversity.vendors as Record<string, { id: string }>)[key]!.id;
  for (const d of Object.values(SEED_VENDOR_DOCUMENTS)) {
    const storagePath = seedEvidencePath(d);
    const { error } = await admin.storage
      .from("evidence")
      .upload(storagePath, new Blob([d.body], { type: d.contentType }), { upsert: true, contentType: d.contentType });
    if (error) throw new Error(`evidence upload failed for ${storagePath}: ${error.message}`);
    const fields = {
      storagePath,
      fileName: d.fileName,
      contentType: d.contentType,
      byteSize: Buffer.byteLength(d.body),
      uploadedBy: SEED_USERS[d.uploadedByKey].id,
      reviewStatus: d.reviewStatus,
      evidenceLevel: d.evidenceLevel,
      reviewedBy: d.reviewedByKey ? SEED_USERS[d.reviewedByKey].id : null,
      reviewedAt: d.reviewedByKey ? new Date("2026-09-09T05:30:00.000Z") : null,
    };
    await prisma.evidence.upsert({ where: { id: d.id }, create: { id: d.id, organizationId: d.organizationId, ...fields }, update: fields });
    await prisma.$executeRaw`
      INSERT INTO public.evidence_links (id, organization_id, evidence_id, linked_entity_type, linked_entity_id, linked_by)
      VALUES (${d.linkId}::uuid, ${d.organizationId}::uuid, ${d.id}::uuid, 'vendor', ${vendorId(d.vendorKey)}::uuid, ${SEED_USERS[d.uploadedByKey].id}::uuid)
      ON CONFLICT (id) DO NOTHING`;
  }

  for (const a of Object.values(SEED_VENDOR_ASSESSMENTS)) {
    if (await prisma.vendorAssessment.findUnique({ where: { id: a.id } })) continue;
    const enteredBy = SEED_USERS[a.enteredByKey].id;
    await prisma.vendorAssessment.create({
      data: {
        id: a.id,
        organizationId: a.organizationId,
        vendorId: vendorId(a.vendorKey),
        version: a.version,
        status: "draft",
        source: "staff",
        sourceNote: a.sourceNote,
        createdBy: enteredBy,
        createdAt: new Date(a.createdAt),
      },
    });
    await prisma.vendorAssessmentAnswer.createMany({
      data: Object.entries(a.answers).map(([code, value]) => {
        const na = typeof value === "object" && "na" in value ? value.na : null;
        const answer = typeof value === "string" ? value : "answer" in value ? value.answer : null;
        const evidenceId = typeof value === "object" && "documentKey" in value ? SEED_VENDOR_DOCUMENTS[value.documentKey].id : null;
        return {
          organizationId: a.organizationId,
          assessmentId: a.id,
          questionCode: code,
          answer,
          notApplicable: na !== null,
          naReason: na,
          evidenceId,
          answeredBy: enteredBy,
          answeredAt: new Date(a.createdAt),
        };
      }),
    });
    const scored = await prisma.$queryRaw<{ risk: { score: number; tier: string; unevidenced: string[] } }[]>`
      SELECT app.vendor_assessment_risk(${a.organizationId}::uuid, ${a.id}::uuid) AS risk`;
    const risk = scored[0]!.risk;
    await prisma.vendorAssessment.update({
      where: { id: a.id },
      data: {
        status: "submitted",
        submittedBy: enteredBy,
        submittedAt: new Date(a.submittedAt),
        riskScore: risk.score,
        riskTier: risk.tier,
        unevidenced: risk.unevidenced,
      },
    });
    if (a.status === "accepted") {
      await prisma.vendorAssessment.update({
        where: { id: a.id },
        data: {
          status: "accepted",
          reviewedBy: SEED_USERS[a.reviewedByKey!].id,
          reviewedAt: new Date(a.reviewedAt!),
          reviewBy: new Date(`${a.reviewBy}T00:00:00.000Z`),
        },
      });
    }
    console.log(`seeded processor assessment v${a.version} (${a.vendorKey}): ${a.status}, risk ${risk.score} (${risk.tier}), unevidenced ${risk.unevidenced.join(", ") || "none"}`);
  }
}

/**
 * Slice 10 Stage 4b: the proctoring vendor's v1, answered by the vendor's
 * respondent through a link Legal sent — awaiting review (Legal may not review
 * it, D-092). Tooling, so no audit row: the rows are written as the link's
 * functions would leave them — answers by nobody in the organisation, the
 * respondent's own document pending review, the declaration, the link used up.
 * The token and session are random hashes no one holds. A second run is no change.
 */
async function seedVendorLink() {
  const l = SEED_VENDOR_LINK;
  if (await prisma.vendorAssessment.findUnique({ where: { id: l.assessmentId } })) return;
  const vendorId = SEED_SCOPE.mumbaiUniversity.vendors.proctoringVendor.id;
  const sender = SEED_USERS[l.sentByKey].id;
  const d = l.document;

  const storagePath = seedEvidencePath(d);
  const { error } = await admin.storage
    .from("evidence")
    .upload(storagePath, new Blob([d.body], { type: d.contentType }), { upsert: true, contentType: d.contentType });
  if (error) throw new Error(`evidence upload failed for ${storagePath}: ${error.message}`);
  const fields = { storagePath, fileName: d.fileName, contentType: d.contentType, byteSize: Buffer.byteLength(d.body), uploadedBy: null, uploadedAt: new Date(l.confirmedAt) };
  await prisma.evidence.upsert({ where: { id: d.id }, create: { id: d.id, organizationId: d.organizationId, ...fields }, update: fields });
  await prisma.$executeRaw`
    INSERT INTO public.evidence_links (id, organization_id, evidence_id, linked_entity_type, linked_entity_id)
    VALUES (${d.linkId}::uuid, ${d.organizationId}::uuid, ${d.id}::uuid, 'vendor', ${vendorId}::uuid)
    ON CONFLICT (id) DO NOTHING`;

  await prisma.vendorAssessment.create({
    data: { id: l.assessmentId, organizationId: l.organizationId, vendorId, version: 1, status: "draft", source: "vendor", createdBy: sender, createdAt: new Date(l.sentAt) },
  });
  await prisma.vendorAssessmentLink.create({
    data: {
      id: l.linkId,
      organizationId: l.organizationId,
      assessmentId: l.assessmentId,
      tokenHash: randomBytes(32).toString("hex"),
      respondentName: l.respondentName,
      respondentEmail: l.respondentEmail,
      expiresAt: new Date(new Date(l.sentAt).getTime() + 14 * 86_400_000),
      codesSent: 1,
      sessionHash: randomBytes(32).toString("hex"),
      confirmedAt: new Date(l.confirmedAt),
      createdBy: sender,
      createdAt: new Date(l.sentAt),
    },
  });
  await prisma.vendorLinkDocument.create({ data: { organizationId: l.organizationId, linkId: l.linkId, evidenceId: d.id, createdAt: new Date(l.confirmedAt) } });
  await prisma.vendorAssessmentAnswer.createMany({
    data: Object.entries(l.answers).map(([code, value]) => ({
      organizationId: l.organizationId,
      assessmentId: l.assessmentId,
      questionCode: code,
      answer: value === "vendor_document" ? "yes" : value,
      evidenceId: value === "vendor_document" ? d.id : null,
      answeredBy: null,
      answeredAt: new Date(l.submittedAt),
    })),
  });

  const scored = await prisma.$queryRaw<{ risk: { score: number; tier: string; unevidenced: string[] } }[]>`
    SELECT app.vendor_assessment_risk(${l.organizationId}::uuid, ${l.assessmentId}::uuid) AS risk`;
  const risk = scored[0]!.risk;
  await prisma.vendorAssessment.update({
    where: { id: l.assessmentId },
    data: {
      status: "submitted",
      submittedBy: null,
      submittedAt: new Date(l.submittedAt),
      sourceNote: "Answered by the vendor through the questionnaire link sent on 12 Oct 2026",
      declaredName: l.respondentName,
      declaredRole: l.declaredRole,
      declaredAt: new Date(l.submittedAt),
      riskScore: risk.score,
      riskTier: risk.tier,
      unevidenced: risk.unevidenced,
    },
  });
  await prisma.vendorAssessmentLink.update({ where: { id: l.linkId }, data: { submittedAt: new Date(l.submittedAt) } });
  console.log(`seeded processor assessment v1 (${l.vendorKey}): answered by the vendor, awaiting review, risk ${risk.score} (${risk.tier}), unevidenced ${risk.unevidenced.join(", ") || "none"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

/**
 * Slice 10 Stage 5: MU's retention schedules, one erasure, one action, and the
 * AI proctoring row. Tooling: no audit row, no permission check (D-027); the
 * end date and the inform-by date are the trigger's, never written here — the
 * column is overwritten on every write. Idempotent: a re-run resets each
 * schedule and the action to the fixture; the erasure, which is never changed,
 * is inserted once and left alone.
 */
async function seedRetention() {
  const r = SEED_RETENTION;
  const organizationId = SEED_ORGS[r.organizationKey].id;
  const recordedBy = SEED_USERS[r.recordedByKey].id;
  const day = (d: string) => new Date(`${d}T00:00:00.000Z`);
  const records = SEED_ROPA.records as Record<string, { id: string }>;
  for (const [code, sched] of Object.entries(r.schedules)) {
    const facts = {
      ropaRecordId: records[code]!.id,
      basis: sched.basis,
      periodMonths: sched.periodMonths,
      lawName: sched.lawName,
      startsOn: sched.startsOn === null ? null : day(sched.startsOn),
      notes: sched.notes,
      createdBy: recordedBy,
      updatedBy: recordedBy,
    };
    await prisma.retentionSchedule.upsert({ where: { id: sched.id }, create: { id: sched.id, organizationId, ...facts }, update: facts });
  }
  const e = r.erasure;
  const scheduleId = r.schedules[e.recordCode].id;
  await prisma.$executeRaw`
    INSERT INTO public.retention_erasures (id, organization_id, retention_schedule_id, erased_on, method, processors_told, recorded_by, recorded_at)
    VALUES (${e.id}::uuid, ${organizationId}::uuid, ${scheduleId}::uuid, ${e.erasedOn}::date, ${e.method}, ${e.processorsTold},
      ${SEED_USERS[e.recordedByKey].id}::uuid, ${`${e.erasedOn}T11:00:00.000Z`}::timestamptz)
    ON CONFLICT (id) DO NOTHING`;
  const a = r.action;
  const action = {
    title: a.title,
    ownerUserId: SEED_USERS[a.ownerKey].id,
    ownerRole: null,
    status: "open",
    dueDate: day(a.dueDate),
    notes: null,
    closedAt: null,
    closedBy: null,
    closureBasis: null,
  };
  await prisma.gapAction.upsert({
    where: { id: a.id },
    create: { id: a.id, organizationId, retentionScheduleId: r.schedules[a.recordCode].id, ...action },
    update: action,
  });
  const stored = await prisma.retentionSchedule.findMany({ where: { organizationId }, select: { endsOn: true } });
  console.log(
    `seeded retention register ${SEED_ORGS[r.organizationKey].name} → ${stored.length} schedules (${stored.filter((x) => x.endsOn === null).length} with no end), 1 erasure, 1 action`,
  );
}

/** Slice 10 Stage 5: the AI risk register — MU's proctoring system, never reviewed. Tooling. */
async function seedAiSystems() {
  for (const a of Object.values(SEED_AI_SYSTEMS)) {
    const organizationId = SEED_ORGS[a.organizationKey].id;
    const recordedBy = SEED_USERS[a.recordedByKey].id;
    const facts = {
      systemId: (SEED_SCOPE[a.organizationKey] as SeedScope).systems[a.systemKey]!.id,
      usageType: a.usageType,
      name: a.name,
      purpose: a.purpose,
      personalData: a.personalData,
      childTracking: a.childTracking,
      childExemption: a.childExemption,
      humanReview: a.humanReview,
      status: "in_use",
      lastReviewedOn: null,
      reviewRecordedBy: null,
      reviewRecordedAt: null,
      createdBy: recordedBy,
      updatedBy: recordedBy,
    };
    await prisma.aiSystem.upsert({ where: { id: a.id }, create: { id: a.id, organizationId, ...facts }, update: facts });
    console.log(`seeded AI risk register ${SEED_ORGS[a.organizationKey].name} → ${a.name} (in use, never reviewed)`);
  }
}
