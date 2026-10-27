/**
 * Official-style certification seal for TrustStack DPDP Practitioner credentials.
 * Inspired by the Ashoka Chakra (24 spokes) and conventional embossed seals - * vector-only, no AI stock artwork, rasterises cleanly for PDF export.
 */

const NAVY = "#0c1a33";
const INK = "#101f3a";
const GOLD = "#9a7b2e";
const GOLD_LIGHT = "#c9a84c";

/** 24-spoke Ashoka-style wheel (simplified for seal scale). */
function chakraSpokes(cx: number, cy: number, r: number): string {
  const spokes: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * 15 - 90) * (Math.PI / 180);
    const x2 = cx + r * Math.cos(a);
    const y2 = cy + r * Math.sin(a);
    spokes.push(
      `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${NAVY}" stroke-width="1.35" stroke-linecap="round"/>`
    );
  }
  return spokes.join("");
}

export function certificateSealSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="TrustStack DPDP Practitioner certification seal">
  <defs>
    <radialGradient id="ts-seal-body" cx="38%" cy="32%" r="72%">
      <stop offset="0%" stop-color="#faf6eb"/>
      <stop offset="55%" stop-color="#efe4c8"/>
      <stop offset="100%" stop-color="#d4bc82"/>
    </radialGradient>
    <path id="ts-seal-top" d="M 28,100 A 72,72 0 0,1 172,100" fill="none"/>
    <path id="ts-seal-bot" d="M 28,100 A 72,72 0 0,0 172,100" fill="none"/>
  </defs>

  <!-- serrated outer rim -->
  <circle cx="100" cy="100" r="92" fill="none" stroke="${GOLD}" stroke-width="4.5" stroke-dasharray="2.2 4.8" stroke-linecap="butt"/>
  <circle cx="100" cy="100" r="87" fill="url(#ts-seal-body)" stroke="${GOLD_LIGHT}" stroke-width="1.2"/>
  <circle cx="100" cy="100" r="84" fill="none" stroke="${INK}" stroke-width="2.2"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="${GOLD}" stroke-width="0.9"/>

  <!-- curved band lettering -->
  <text fill="${INK}" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="9.2" letter-spacing="1.4">
    <textPath href="#ts-seal-top" startOffset="50%" text-anchor="middle">CERTIFIED DPDP PRACTITIONER</textPath>
  </text>
  <text fill="${INK}" font-family="Georgia,'Times New Roman',serif" font-weight="700" font-size="9.5" letter-spacing="2">
    <textPath href="#ts-seal-bot" startOffset="50%" text-anchor="middle">TRUSTSTACK · PUBLIC INTEREST</textPath>
  </text>

  <!-- side pins -->
  <circle cx="26" cy="100" r="3.2" fill="${GOLD_LIGHT}" stroke="${INK}" stroke-width="0.8"/>
  <circle cx="174" cy="100" r="3.2" fill="${GOLD_LIGHT}" stroke="${INK}" stroke-width="0.8"/>

  <!-- inner field -->
  <circle cx="100" cy="100" r="58" fill="#f7f0dc" stroke="${INK}" stroke-width="1.4"/>
  <circle cx="100" cy="100" r="54" fill="none" stroke="${GOLD}" stroke-width="0.7"/>

  <!-- Ashoka chakra -->
  <circle cx="100" cy="100" r="34" fill="none" stroke="${NAVY}" stroke-width="1.6"/>
  <circle cx="100" cy="100" r="28" fill="none" stroke="${NAVY}" stroke-width="1"/>
  ${chakraSpokes(100, 100, 28)}
  <circle cx="100" cy="100" r="5.5" fill="${NAVY}"/>
  <circle cx="100" cy="100" r="2.2" fill="#f7f0dc"/>

  <!-- centre legend -->
  <text x="100" y="148" text-anchor="middle" fill="${INK}" font-family="Georgia,serif" font-size="8" font-weight="700" letter-spacing="0.8">DPDP ACT 2023</text>
  <text x="100" y="158" text-anchor="middle" fill="${GOLD}" font-family="Georgia,serif" font-size="7" letter-spacing="1.2">EST. 2023</text>
</svg>`;
}
