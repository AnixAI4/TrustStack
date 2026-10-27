import { ACT_CHAPTERS, type ActSection } from "@/content/act";
import { MODULES } from "@/content/curriculum";
import { SECTION_PLAIN } from "@/content/section-plain";

export type SectionDetail = ActSection & {
  chapter: string;
  chapterN: number;
  plainEnglish: string;
  highlights: string[];
  example?: string;
};

const ALL = ACT_CHAPTERS.flatMap((ch) =>
  ch.sections.map((s) => ({ ...s, chapter: ch.title, chapterN: ch.n }))
);

function sectionNumsFromRef(ref: string): number[] {
  const nums = new Set<number>();
  const range = ref.match(/Section\s+(\d+)\s*[--]\s*(\d+)/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    for (let i = Math.min(a, b); i <= Math.max(a, b); i++) nums.add(i);
    return [...nums];
  }
  const single = ref.match(/Section\s+(\d+)/gi);
  if (single) {
    for (const m of single) {
      const n = Number(m.replace(/\D/g, ""));
      if (n) nums.add(n);
    }
  }
  return [...nums];
}

function lessonsForSection(n: number) {
  return MODULES.flatMap((m) => m.lessons).filter((l) => {
    if (!l.ref) return false;
    return sectionNumsFromRef(l.ref).includes(n);
  });
}

export function getSection(n: number): SectionDetail | undefined {
  const sec = ALL.find((s) => s.n === n);
  if (!sec) return undefined;

  const authored = SECTION_PLAIN[n];

  const lessons = lessonsForSection(n);
  const plainParts = lessons
    .map((l) => l.plainEnglish)
    .filter((p): p is string => Boolean(p));
  const bullets = lessons.flatMap((l) => l.bullets ?? []);

  const plainEnglish =
    authored?.plainEnglish ??
    (plainParts.length > 0
      ? plainParts.join(" ")
      : `${sec.summary}. This section is part of Chapter ${sec.chapterN} (${sec.chapter}) of the DPDP Act, 2023.`);

  const highlights =
    authored?.keyPoints ??
    (bullets.length > 0
      ? bullets.slice(0, 5)
      : [sec.summary, `Chapter ${sec.chapterN}: ${sec.chapter}`]);

  return { ...sec, plainEnglish, highlights, example: authored?.example };
}

export function getAllSections(): SectionDetail[] {
  return ALL.map((s) => getSection(s.n)!);
}
