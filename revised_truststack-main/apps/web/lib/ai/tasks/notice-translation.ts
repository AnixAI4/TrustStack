import { AI_TRANSLATION_LANGUAGES, CONSENT_LANGUAGE_LABEL, pickAllowed, type AiTranslationLanguage } from "@truststack/core";
import { z } from "zod";
import { createCleaner, userTurn, type OrganisationRaw, type ShapedContext } from "./shared";

/**
 * "Translate this notice" (SLICE_11 §2.3, §7c.4; Stage 2b) — on a PUBLISHED notice.
 * Read with `consent.read`, decided with `consent.write` (§4.7). Accepting pre-fills
 * a NEW notice in that language; the person saves and publishes it (s.5(3)).
 *
 * Hindi and Marathi only (D-133.2). The translation keeps every purpose's key and
 * the purposes' count — checked by the server (drafts.ts), so a consent given in
 * one language is the same consent in another.
 *
 * What it sends: the published notice as the routes read it (`noticeToApi`): its
 * title, introduction and purposes (key, title, uses, data items) — written by
 * people, so untrusted and scrubbed. Never who published it, or when (§4.6).
 */

export const noticeTranslationBody = z
  .object({
    noticeId: z.uuid(),
    language: z.enum(AI_TRANSLATION_LANGUAGES),
    ask: z.string().trim().max(500).optional(),
  })
  .strict();
export type NoticeTranslationBody = z.infer<typeof noticeTranslationBody>;

export interface NoticeTranslationRaw {
  organisation: OrganisationRaw;
  notice: Record<string, unknown> & { purposes: readonly Record<string, unknown>[] };
  language: AiTranslationLanguage;
  ask: string | null;
}

const ORGANISATION_FIELDS = ["name", "organizationType", "industryName"] as const;

export function shapeNoticeTranslationContext(
  raw: NoticeTranslationRaw,
  target: { noticeId: string },
  untrustedJson: (value: unknown) => string,
): ShapedContext {
  const cleaner = createCleaner();
  const clean = cleaner.clean;
  const org = pickAllowed(raw.organisation, ORGANISATION_FIELDS);
  const organisation = { name: clean(org.name, false), type: org.organizationType, industry: org.industryName ?? null };
  const n = pickAllowed(raw.notice, ["title", "summary", "language"] as const);

  // Keys are the server's to keep: pattern-checked when the notice was saved, sent apart from the text.
  const keys = raw.notice.purposes.map((p) => String(pickAllowed(p, ["key"] as const).key ?? ""));
  const notice = {
    title: clean(n.title, true),
    summary: clean(n.summary, true),
    purposes: raw.notice.purposes.map((p) => {
      const c = pickAllowed(p, ["key", "title", "uses", "dataItems"] as const);
      return {
        key: String(c.key ?? ""),
        title: clean(c.title, true),
        uses: clean(c.uses, true),
        dataItems: (Array.isArray(c.dataItems) ? c.dataItems : []).map((d) => clean(d, true)).filter((d): d is string => d !== null),
      };
    }),
  };
  const languageName = CONSENT_LANGUAGE_LABEL[raw.language];
  const ask = clean(raw.ask, true);

  const context = { task: "notice_translation_draft", organisation, language: raw.language, purposeKeys: keys, untrusted: { notice }, ask };
  const user = userTurn(
    `Translate the organisation's published privacy notice into ${languageName}, faithfully and in clear and plain ${languageName} a person can understand on its own (s.5(3); Rule 3(a)). Translate the title, the introduction and every purpose's title, uses and data items. Keep EVERY purpose, in the same order, with EXACTLY the same key as in <purpose_keys> — the keys are identifiers, never translated. Add nothing the notice does not say and leave nothing out; do not add how to withdraw, how to complain or a contact (TrustStack prints those). Write the one-sentence answer, the law notes and missingInformation in English, for the person who checks it; cite at least one provision (for example s.5(3)). A person and counsel check it and publish it; you publish nothing.`,
    [
      { tag: "organisation", value: organisation },
      { tag: "target_language", value: { code: raw.language, name: languageName } },
      { tag: "purpose_keys", value: keys },
      { tag: "untrusted_data", value: { notice }, untrusted: true },
    ],
    ask,
    untrustedJson,
  );
  return {
    context,
    user,
    injectionFlagged: cleaner.injectionFlagged,
    scrubbed: cleaner.scrubbed,
    target: { type: "privacy_notice", id: target.noticeId, key: raw.language },
    facts: { language: raw.language, sourceKeys: keys },
  };
}
