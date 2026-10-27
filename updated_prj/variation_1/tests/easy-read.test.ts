import assert from "node:assert/strict";
import test from "node:test";
import { EXTRA_EASY_PAIRS } from "../src/content/easy";
import { fallbackEasyText } from "../src/content/easy-static";

test("fallback glossary keeps defined-role replacements grammatical", () => {
  assert.equal(
    fallbackEasyText("A Data Principal can ask a Data Fiduciary to correct personal data."),
    "A person the data is about can ask an organisation responsible for data to correct personal data.",
  );
  assert.equal(
    fallbackEasyText("Notify affected Data Principals and protect Data Principal rights."),
    "Tell affected people and protect people's rights.",
  );
  assert.equal(
    fallbackEasyText("Every Data Fiduciary must explain the Data Fiduciary's duties."),
    "Every organisation responsible for data must explain the organisation's duties.",
  );
  assert.equal(
    fallbackEasyText("The Data Principal must be told about every personal data breach."),
    "The person the data is about must be told about every personal data leak.",
  );
  assert.equal(
    fallbackEasyText("A breach of the obligation may be reported in the prescribed form and manner."),
    "A failure to meet the duty may be reported in the form and process set out in the rules.",
  );
  assert.equal(
    fallbackEasyText("A regulator checks a vendor after a personal-data breach."),
    "An authority checks an outside partner after a personal-data leak.",
  );
  assert.equal(
    fallbackEasyText("When must a Data Fiduciary notify Data Principals about a breach?"),
    "When must an organisation responsible for data tell people about a data leak?",
  );
  assert.equal(
    fallbackEasyText("The team must audit all third-party vendors every year."),
    "The team must audit all outside partners every year.",
  );
});

test("exact Easy Read pairs contain no known replacement collisions", () => {
  const malformed = [
    /\b(?:a|an|the|each|every|affected)\s+(?:a|an|the)\b/i,
    /\ba (?:organisation|authority|outside partner|allowed use|India-based)\b/i,
    /\b(\w+)\s+\1\b/i,
    /personal data data leak/i,
    /outside outside partner/i,
    /permission permission/i,
    /only only/i,
    /carry outn/i,
    /data leakes/i,
    /using data of/i,
    /failing to protection/i,
    /collections outside partner/i,
    /DPDP using data contract/i,
    /following the law Manager/i,
    /following the law scan/i,
  ];

  const failures = EXTRA_EASY_PAIRS.filter(([, easy]) =>
    malformed.some((pattern) => pattern.test(easy)),
  );
  assert.deepEqual(failures, []);
});

test("exact Easy Read dictionary has unique, meaningful mappings", () => {
  const keys = EXTRA_EASY_PAIRS.map(([normal]) => normal.replace(/\s+/g, " ").trim());
  assert.equal(new Set(keys).size, keys.length);

  const identities = EXTRA_EASY_PAIRS.filter(
    ([normal, easy]) =>
      normal.replace(/\s+/g, " ").trim() === easy.replace(/\s+/g, " ").trim(),
  );
  assert.deepEqual(identities, []);
});