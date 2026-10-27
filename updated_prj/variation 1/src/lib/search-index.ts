import { ACT_CHAPTERS } from "@/content/act";
import { RULES } from "@/content/rules";
import { CASES } from "@/content/cases";
import { TEMPLATES } from "@/content/templates";

export type SearchEntry = {
  t: string;
  u: string;
  k: string;
  cat: string;
};

const STATIC: SearchEntry[] = [
  { t: "Privacy notice generator", u: "/tools", k: "generator notice document privacy policy", cat: "Tool" },
  { t: "Penalty calculator", u: "/tools", k: "penalty calculator estimate fine crore", cat: "Tool" },
  { t: "Templates & policies", u: "/templates", k: "template policy dpa consent form", cat: "Template" },
  { t: "Certificate course", u: "/certification", k: "course certificate exam practitioner", cat: "Learn" },
  { t: "DPDP quiz", u: "/learn", k: "quiz learn test practice", cat: "Learn" },
  { t: "Your rights", u: "/rights", k: "rights data principal access erasure", cat: "Rights" },
  { t: "Case laws", u: "/cases", k: "case law judgment privacy puttaswamy", cat: "Case" },
  { t: "Industry playbooks", u: "/industries", k: "industry sector bfsi healthcare saas", cat: "Industry" },
  { t: "Compliance scanner", u: "/scanner", k: "scanner cookie scan website audit", cat: "Tool" },
];

function actEntries(): SearchEntry[] {
  return ACT_CHAPTERS.flatMap((ch) =>
    ch.sections.map((s) => ({
      t: `Section ${s.n} - ${s.title}`,
      u: `/section/${s.n}`,
      k: `section ${s.n} ${s.title} ${s.summary} act chapter ${ch.title}`.toLowerCase(),
      cat: "Section",
    }))
  );
}

function ruleEntries(): SearchEntry[] {
  return RULES.map((r) => ({
    t: `Rule ${r.n} - ${r.title}`,
    u: `/rules/${r.n}`,
    k: `rule ${r.n} ${r.title} ${r.summary} ${r.plainEnglish}`.toLowerCase(),
    cat: "Rule",
  }));
}

function caseEntries(): SearchEntry[] {
  return CASES.map((c) => ({
    t: c.title,
    u: `/cases/${c.slug}`,
    k: `${c.title} ${c.shortTitle} ${c.citation} ${c.question} ${c.holding} case judgment`.toLowerCase(),
    cat: "Case",
  }));
}

function templateEntries(): SearchEntry[] {
  return TEMPLATES.map((t) => ({
    t: t.title,
    u: "/templates",
    k: `${t.title} ${t.summary} template policy`.toLowerCase(),
    cat: "Template",
  }));
}

export const DPDP_SEARCH_INDEX: SearchEntry[] = [
  ...STATIC,
  ...actEntries(),
  ...ruleEntries(),
  ...caseEntries(),
  ...templateEntries(),
];

export function searchDPDP(query: string, limit = 8): SearchEntry[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  const scored = DPDP_SEARCH_INDEX.map((e) => {
    let score = 0;
    const title = e.t.toLowerCase();
    if (title === term) score += 100;
    else if (title.startsWith(term)) score += 60;
    else if (title.includes(term)) score += 40;
    if (e.k.includes(term)) score += 20;
    const words = term.split(/\s+/).filter(Boolean);
    for (const w of words) {
      if (w.length < 2) continue;
      if (title.includes(w)) score += 12;
      if (e.k.includes(w)) score += 6;
    }
    return { e, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: SearchEntry[] = [];
  for (const { e } of scored) {
    const key = `${e.u}|${e.t}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}
