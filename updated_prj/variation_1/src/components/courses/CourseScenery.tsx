"use client";
import type { ReactNode } from "react";
import { Scenery, Building, windowsFor } from "@/components/site/Scenery";

const COURSE_ACCENT: Record<string, string> = {
  citizens: "var(--green-rgb)", founders: "var(--accent-rgb)", practitioner: "var(--gold-rgb)",
  legal: "var(--blue-rgb)", engineering: "var(--brand-rgb)", students: "var(--amber-rgb)",
};

export function CourseScenery({ slug }: { slug: string }) {
  return <Scenery accent={COURSE_ACCENT[slug] ?? "var(--accent-rgb)"} landmark={courseLandmark(slug)} sceneKey={slug} />;
}

function courseLandmark(slug: string): ReactNode {
  switch (slug) {
    case "citizens": return citizensLandmark();
    case "founders": return foundersLandmark();
    case "practitioner": return practitionerLandmark();
    case "legal": return legalLandmark();
    case "engineering": return engineeringLandmark();
    case "students": return studentsLandmark();
    default: return null;
  }
}

/* ── citizens (green) - cosy neighbourhood ─────────────────────────────────── */
function citizensLandmark() {
  return (
    <g>
      {/* left: two houses with pitched roofs + chimney + a small school */}
      <rect x="130" y="230" width="86" height="70" fill="rgb(var(--c) / 0.15)" />
      <path d="M120 230 L173 198 L226 230 Z" fill="rgb(var(--c) / 0.2)" />
      <rect x="198" y="202" width="10" height="18" fill="rgb(var(--c) / 0.2)" />
      <rect x="150" y="252" width="20" height="48" fill="rgb(var(--c) / 0.22)" />
      {windowsFor(180, 238, 34, 0.13)}
      <rect x="236" y="246" width="72" height="54" fill="rgb(var(--c) / 0.13)" />
      <path d="M228 246 L272 220 L316 246 Z" fill="rgb(var(--c) / 0.18)" />
      <Building x={54} w={46} top={196} tone={0.14} roof="pitch" />
      <rect x="75" y="156" width="2" height="24" fill="rgb(var(--c) / 0.24)" />
      <path d="M77 158 L95 164 L77 170 Z" fill="rgb(var(--c) / 0.24)" />
      {/* right: community hall + a family silhouette (motif) */}
      <Building x={1150} w={96} top={214} tone={0.15} roof="flat" />
      <path d="M1150 214 L1198 192 L1246 214 Z" fill="rgb(var(--c) / 0.2)" />
      <g fill="rgb(var(--c) / 0.26)">
        <circle cx="1300" cy="268" r="7" /><rect x="1294" y="276" width="12" height="24" rx="4" />
        <circle cx="1320" cy="270" r="6.5" /><rect x="1314" y="278" width="12" height="22" rx="4" />
        <circle cx="1336" cy="282" r="5" /><rect x="1332" y="288" width="9" height="12" rx="3" />
      </g>
      {/* kite */}
      <path d="M1084 118 l10 -8 l10 8 l-10 10 Z" fill="rgb(var(--c) / 0.16)" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
      <path d="M1094 128 q4 8 -2 16" fill="none" stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" />
    </g>
  );
}

/* ── founders (orange) - startup quarter ───────────────────────────────────── */
function foundersLandmark() {
  return (
    <g>
      {/* left: startup loft with big studio windows + a coffee cart */}
      <Building x={44} w={44} top={150} tone={0.14} roof="tank" />
      <rect x="120" y="196" width="150" height="104" fill="rgb(var(--c) / 0.15)" />
      <rect x="120" y="196" width="150" height="5" fill="rgb(var(--c) / 0.2)" />
      <g fill="rgb(var(--c) / 0.24)">
        <rect x="132" y="210" width="34" height="26" rx="2" />
        <rect x="178" y="210" width="34" height="26" rx="2" />
        <rect x="224" y="210" width="34" height="26" rx="2" />
        <rect x="132" y="248" width="34" height="26" rx="2" />
        <rect x="224" y="248" width="34" height="26" rx="2" />
      </g>
      {/* one loft window lit - working late */}
      <rect x="178" y="248" width="34" height="26" rx="2" fill="rgb(var(--c) / 0.4)" />
      {/* coffee cart */}
      <path d="M278 258 L286 244 L324 244 L332 258 Z" fill="rgb(var(--c) / 0.22)" />
      <rect x="284" y="258" width="42" height="36" rx="2" fill="rgb(var(--c) / 0.2)" />
      <circle cx="293" cy="298" r="4" fill="rgb(var(--c) / 0.22)" />
      <circle cx="317" cy="298" r="4" fill="rgb(var(--c) / 0.22)" />
      <g stroke="rgb(var(--c) / 0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M300 242 q-4 -6 0 -12" /><path d="M310 242 q4 -6 0 -12" />
      </g>
      {/* right: co-working block + a slim tower */}
      <Building x={1150} w={104} top={150} tone={0.15} roof="setback" />
      <rect x="1168" y="176" width="70" height="12" rx="2" fill="rgb(var(--c) / 0.2)" />
      <Building x={1264} w={52} top={196} tone={0.14} roof="antenna" />
      {/* rocket + trail (motif) */}
      <g fill="rgb(var(--c) / 0.2)">
        <path d="M1206 58 q10 -22 20 0 q0 18 -10 26 q-10 -8 -10 -26 Z" />
        <circle cx="1216" cy="76" r="4" fill="rgb(var(--c) / 0.3)" />
        <path d="M1206 90 l6 -6 l4 10 Z" /><path d="M1226 90 l-6 -6 l-4 10 Z" />
      </g>
      <path d="M1216 98 q-6 30 -18 58" stroke="rgb(var(--c) / 0.14)" strokeWidth="6" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ── practitioner (gold) - compliance district ─────────────────────────────── */
function practitionerLandmark() {
  return (
    <g>
      {/* left: compliance HQ (with shield emblem) + a clock tower */}
      <Building x={44} w={46} top={150} tone={0.14} roof="flat" />
      <rect x="120" y="206" width="120" height="94" fill="rgb(var(--c) / 0.15)" />
      <rect x="120" y="206" width="120" height="4" fill="rgb(var(--c) / 0.2)" />
      {windowsFor(120, 206, 120, 0.13)}
      <rect x="250" y="168" width="40" height="132" fill="rgb(var(--c) / 0.14)" />
      <rect x="250" y="168" width="40" height="4" fill="rgb(var(--c) / 0.2)" />
      <circle cx="270" cy="190" r="11" fill="rgb(var(--c) / 0.2)" />
      <circle cx="270" cy="190" r="11" fill="none" stroke="rgb(var(--c) / 0.3)" strokeWidth="1.5" />
      <path d="M270 190 l0 -7 M270 190 l5 3" stroke="rgb(var(--c) / 0.34)" strokeWidth="1.5" strokeLinecap="round" />
      {/* shield emblem (motif) */}
      <path d="M168 206 l24 -8 l24 8 v20 q0 20 -24 30 q-24 -10 -24 -30 Z" fill="rgb(var(--c) / 0.2)" />
      <path d="M180 224 l8 8 l16 -16" fill="none" stroke="rgb(var(--c) / 0.34)" strokeWidth="3" strokeLinecap="round" />
      {/* right: checklist billboard + audit office + a slim tower */}
      <rect x="1104" y="206" width="66" height="56" rx="3" fill="rgb(var(--c) / 0.16)" />
      <rect x="1104" y="206" width="66" height="56" rx="3" fill="none" stroke="rgb(var(--c) / 0.26)" strokeWidth="1.5" />
      <g stroke="rgb(var(--c) / 0.34)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M1114 222 l4 4 l7 -8" /><path d="M1114 236 l4 4 l7 -8" /><path d="M1114 250 l4 4 l7 -8" />
      </g>
      <g fill="rgb(var(--c) / 0.24)">
        <rect x="1132" y="220" width="30" height="4" rx="2" />
        <rect x="1132" y="234" width="30" height="4" rx="2" />
        <rect x="1132" y="248" width="30" height="4" rx="2" />
      </g>
      <rect x="1114" y="262" width="4" height="38" fill="rgb(var(--c) / 0.18)" />
      <rect x="1158" y="262" width="4" height="38" fill="rgb(var(--c) / 0.18)" />
      <Building x={1184} w={96} top={176} tone={0.15} roof="tank" />
      <Building x={1290} w={44} top={200} tone={0.14} roof="antenna" />
    </g>
  );
}

/* ── legal (blue) - law district ───────────────────────────────────────────── */
function legalLandmark() {
  return (
    <g>
      {/* left: courthouse - columns + pediment + steps + scales of justice */}
      <rect x="120" y="214" width="188" height="86" fill="rgb(var(--c) / 0.15)" />
      <rect x="106" y="288" width="216" height="12" fill="rgb(var(--c) / 0.13)" />
      <g fill="rgb(var(--c) / 0.2)">
        {[140, 166, 192, 218, 244, 270].map((c) => <rect key={c} x={c} y="222" width="11" height="62" />)}
      </g>
      <path d="M110 214 L214 168 L318 214 Z" fill="rgb(var(--c) / 0.2)" />
      <g stroke="rgb(var(--c) / 0.28)" strokeWidth="2">
        <line x1="214" y1="150" x2="214" y2="176" /><line x1="190" y1="156" x2="238" y2="156" />
        <path d="M190 156 l-8 12 h16 Z" fill="rgb(var(--c) / 0.2)" /><path d="M238 156 l-8 12 h16 Z" fill="rgb(var(--c) / 0.2)" />
      </g>
      <Building x={40} w={44} top={158} tone={0.14} roof="antenna" />
      {/* right: law library + a gavel (motif) */}
      <Building x={1150} w={100} top={188} tone={0.15} roof="setback" />
      <g stroke="rgb(var(--c) / 0.26)" strokeWidth="3" fill="rgb(var(--c) / 0.2)" strokeLinecap="round">
        <rect x="1288" y="248" width="26" height="12" rx="3" transform="rotate(-28 1301 254)" />
        <line x1="1300" y1="260" x2="1322" y2="284" /><rect x="1286" y="286" width="46" height="8" rx="3" />
      </g>
    </g>
  );
}

/* ── engineering (indigo) - data district ──────────────────────────────────── */
function engineeringLandmark() {
  return (
    <g>
      {/* left: data-centre with server racks + status lights + a </> billboard */}
      <Building x={40} w={44} top={158} tone={0.14} roof="antenna" />
      <rect x="120" y="196" width="176" height="104" rx="2" fill="rgb(var(--c) / 0.15)" />
      <rect x="120" y="196" width="176" height="4" fill="rgb(var(--c) / 0.2)" />
      <g fill="rgb(var(--c) / 0.11)">
        <rect x="132" y="212" width="32" height="80" rx="2" />
        <rect x="172" y="212" width="32" height="80" rx="2" />
        <rect x="212" y="212" width="32" height="80" rx="2" />
        <rect x="252" y="212" width="32" height="80" rx="2" />
      </g>
      <g fill="rgb(var(--c) / 0.2)">
        {[218, 230, 242, 254, 266, 278].map((y) => (
          <g key={y}>
            <rect x="136" y={y} width="24" height="4" rx="1" />
            <rect x="176" y={y} width="24" height="4" rx="1" />
            <rect x="216" y={y} width="24" height="4" rx="1" />
            <rect x="256" y={y} width="24" height="4" rx="1" />
          </g>
        ))}
      </g>
      <g fill="rgb(var(--c) / 0.42)">
        <circle cx="158" cy="220" r="2.5" /><circle cx="198" cy="232" r="2.5" />
        <circle cx="238" cy="220" r="2.5" /><circle cx="278" cy="244" r="2.5" />
      </g>
      <rect x="152" y="140" width="72" height="30" rx="3" fill="rgb(var(--c) / 0.12)" />
      <rect x="152" y="140" width="72" height="30" rx="3" fill="none" stroke="rgb(var(--c) / 0.24)" strokeWidth="1.5" />
      <g fill="none" stroke="rgb(var(--c) / 0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M172 150 l-10 8 l10 8" /><path d="M204 150 l10 8 l-10 8" />
        <line x1="194" y1="149" x2="182" y2="169" />
      </g>
      <rect x="185" y="170" width="6" height="26" fill="rgb(var(--c) / 0.14)" />
      {/* right: circuit-board-facade block + rooftop satellite dish */}
      <rect x="1150" y="150" width="92" height="150" rx="2" fill="rgb(var(--c) / 0.15)" />
      <rect x="1150" y="150" width="92" height="4" fill="rgb(var(--c) / 0.2)" />
      <g fill="none" stroke="rgb(var(--c) / 0.22)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1164 174 h20 v20 h24" /><path d="M1220 168 v26 h-16" />
        <path d="M1164 214 h30 v24" /><path d="M1228 216 v30 h-24 v18" />
        <path d="M1170 264 h26 v22" />
      </g>
      <g fill="rgb(var(--c) / 0.34)">
        <circle cx="1184" cy="194" r="3" /><circle cx="1204" cy="194" r="3" />
        <circle cx="1194" cy="238" r="3" /><circle cx="1204" cy="264" r="3" /><circle cx="1220" cy="168" r="3" />
      </g>
      <Building x={1256} w={54} top={192} tone={0.14} roof="tank" />
      <g stroke="rgb(var(--c) / 0.24)" strokeWidth="2" fill="rgb(var(--c) / 0.2)">
        <ellipse cx="1214" cy="150" rx="16" ry="9" transform="rotate(-28 1214 150)" />
        <line x1="1214" y1="150" x2="1214" y2="168" /><circle cx="1204" cy="143" r="2.5" />
      </g>
      {/* node links (motif) */}
      <g stroke="rgb(var(--c) / 0.18)" strokeWidth="1.5">
        <line x1="640" y1="72" x2="712" y2="52" /><line x1="712" y1="52" x2="772" y2="88" />
        <line x1="772" y1="88" x2="680" y2="106" /><line x1="680" y1="106" x2="640" y2="72" />
      </g>
      <g fill="rgb(var(--c) / 0.3)">
        <circle cx="640" cy="72" r="3.5" /><circle cx="712" cy="52" r="3.5" />
        <circle cx="772" cy="88" r="3.5" /><circle cx="680" cy="106" r="3.5" />
      </g>
    </g>
  );
}

/* ── students (amber) - campus ─────────────────────────────────────────────── */
function studentsLandmark() {
  return (
    <g>
      {/* left: domed library with columns + a bell/clock tower */}
      <Building x={44} w={44} top={168} tone={0.14} roof="pitch" />
      <rect x="126" y="292" width="120" height="8" fill="rgb(var(--c) / 0.13)" />
      <rect x="132" y="200" width="108" height="92" fill="rgb(var(--c) / 0.15)" />
      <path d="M150 200 A36 36 0 0 1 222 200 Z" fill="rgb(var(--c) / 0.2)" />
      <rect x="182" y="164" width="8" height="12" fill="rgb(var(--c) / 0.22)" />
      <g fill="rgb(var(--c) / 0.2)">
        <rect x="146" y="230" width="9" height="62" />
        <rect x="168" y="230" width="9" height="62" />
        <rect x="190" y="230" width="9" height="62" />
        <rect x="212" y="230" width="9" height="62" />
      </g>
      {/* bell/clock tower */}
      <rect x="252" y="172" width="42" height="128" fill="rgb(var(--c) / 0.14)" />
      <path d="M252 172 L273 150 L294 172 Z" fill="rgb(var(--c) / 0.2)" />
      <circle cx="273" cy="200" r="11" fill="rgb(var(--c) / 0.2)" />
      <circle cx="273" cy="200" r="11" fill="none" stroke="rgb(var(--c) / 0.3)" strokeWidth="1.5" />
      <path d="M273 200 l0 -7 M273 200 l4 4" stroke="rgb(var(--c) / 0.34)" strokeWidth="1.5" strokeLinecap="round" />
      {/* right: graduation cap on a plinth (motif) + a stack of books + a dorm */}
      <g fill="rgb(var(--c) / 0.22)">
        <path d="M1150 232 L1188 220 L1226 232 L1188 244 Z" /><circle cx="1188" cy="262" r="4" />
      </g>
      <path d="M1188 244 L1188 260" stroke="rgb(var(--c) / 0.24)" strokeWidth="3" fill="none" />
      <rect x="1172" y="266" width="32" height="34" fill="rgb(var(--c) / 0.14)" />
      <g fill="rgb(var(--c) / 0.18)">
        <rect x="1240" y="272" width="46" height="10" /><rect x="1244" y="260" width="40" height="10" /><rect x="1238" y="248" width="48" height="10" />
      </g>
      <Building x={1298} w={46} top={196} tone={0.15} roof="flat" />
    </g>
  );
}
