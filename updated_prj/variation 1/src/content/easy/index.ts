/**
 * Aggregator for all per-page "Easy read" dictionaries.
 *
 * Each page/domain gets its own file (./solutions, ./home, ...) exporting a
 * `PAIRS: [normal, easy][]` array. Splitting by page lets full-site coverage be
 * filled in file-by-file (one route at a time) without merge conflicts, per the
 * Easy Read master prompt (docs/easy-read-master-prompt.md).
 *
 * The combined list is consumed by src/content/easy-static.ts, which builds the
 * runtime lookup used by EasyTextRuntime.
 */
import { PAIRS as common } from "./common";
import { PAIRS as solutions } from "./solutions";
import { PAIRS as home } from "./home";
import { PAIRS as framework } from "./framework";
import { PAIRS as tools } from "./tools";
import { PAIRS as rights } from "./rights";
import { PAIRS as act } from "./act";
import { PAIRS as rules } from "./rules";
import { PAIRS as cases } from "./cases";
import { PAIRS as learn } from "./learn";
import { PAIRS as courses } from "./courses";
import { PAIRS as certification } from "./certification";
import { PAIRS as blog } from "./blog";
import { PAIRS as templates } from "./templates";
import { PAIRS as legal } from "./legal";
import { PAIRS as security } from "./security";
import { PAIRS as blogDepth } from "./blog-depth";
import { PAIRS as casesDepth } from "./cases-depth";
import { PAIRS as coursesDepth } from "./courses-depth";
import { PAIRS as certificationDepth } from "./certification-depth";
import { PAIRS as templatesDepth } from "./templates-depth";
import { PAIRS as assessmentsDepth } from "./assessments-depth";
import { PAIRS as lawDepth } from "./law-depth";
import { PAIRS as advisorChatDepth } from "./advisor-chat-depth";
import { PAIRS as servicesSecurityDepth } from "./services-security-depth";

export const EXTRA_EASY_PAIRS: [string, string][] = [
  ...common,
  ...solutions,
  ...home,
  ...framework,
  ...tools,
  ...rights,
  ...act,
  ...rules,
  ...cases,
  ...learn,
  ...courses,
  ...certification,
  ...blog,
  ...templates,
  ...legal,
  ...security,
  ...blogDepth,
  ...casesDepth,
  ...coursesDepth,
  ...certificationDepth,
  ...templatesDepth,
  ...assessmentsDepth,
  ...lawDepth,
  ...advisorChatDepth,
  ...servicesSecurityDepth,
];
