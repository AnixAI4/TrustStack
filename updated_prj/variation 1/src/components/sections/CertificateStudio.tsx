"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Award, Lock, ShieldCheck, Pencil } from "lucide-react";
import { makeCertId } from "@/lib/pdf";
import { certificateSealSvg } from "@/lib/seal";
import { cn } from "@/lib/cn";

// ── Brand palette (kept in sync with the print/PDF ink) ────────────────────
const PAPER = "#fbf8f0";
const NAVY = "#101f3a";
const GOLD = "#ad8a3a";
const MUTED = "#6e7480";

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

/* ─────────────────────────────────────────────────────────────────────────
 *  Deterministic security artwork - every pattern is generated from index
 *  math (never Math.random) so the server- and client-rendered SVG match and
 *  React does not throw a hydration mismatch.
 * ──────────────────────────────────────────────────────────────────────── */

/** Engine-turned guilloché rosette - the single biggest "this is real" cue. */
function Guilloche() {
  const petals = 40;
  const rings = 30;
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09]"
      viewBox="0 0 1000 707"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="none" stroke={GOLD} strokeWidth="0.5">
        {Array.from({ length: petals }).map((_, i) => (
          <ellipse key={`p${i}`} cx="500" cy="353" rx="150" ry="340" transform={`rotate(${(i * 360) / petals} 500 353)`} />
        ))}
      </g>
      <g fill="none" stroke={NAVY} strokeWidth="0.4">
        {Array.from({ length: rings }).map((_, i) => (
          <ellipse key={`r${i}`} cx="500" cy="353" rx="330" ry="110" transform={`rotate(${(i * 360) / rings} 500 353)`} />
        ))}
      </g>
      <circle cx="500" cy="353" r="150" fill="none" stroke={GOLD} strokeWidth="0.5" />
      <circle cx="500" cy="353" r="92" fill="none" stroke={NAVY} strokeWidth="0.4" />
    </svg>
  );
}

/** Hairline border that is actually repeated microtext - an anti-forgery cue. */
function MicrotextBorder() {
  const unit = "TRUSTSTACK · DPDP PRACTITIONER · VERIFIED · ";
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 707" aria-hidden>
      <defs>
        <path id="cert-microtext-path" d="M20 20 H980 V687 H20 Z" fill="none" />
      </defs>
      <rect x="20" y="20" width="960" height="667" fill="none" stroke={NAVY} strokeWidth="0.4" opacity="0.35" />
      <text fill={NAVY} fontFamily="Georgia, 'Times New Roman', serif" fontSize="8" letterSpacing="1" opacity="0.6">
        <textPath href="#cert-microtext-path" startOffset="0">
          {unit.repeat(18)}
        </textPath>
      </text>
    </svg>
  );
}

/** Ornamental gold corner flourish - placed four times with CSS rotation. */
function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("pointer-events-none absolute", className)} aria-hidden>
      <g fill="none" stroke={GOLD} strokeLinecap="round">
        <path d="M8 46 Q8 8 46 8" strokeWidth="1.8" />
        <path d="M14 50 Q14 14 50 14" strokeWidth="0.9" opacity="0.65" />
        <path d="M8 8 H26 M8 8 V26" strokeWidth="2.4" />
        <path d="M20 34 Q34 20 52 20" strokeWidth="0.8" opacity="0.6" />
        <circle cx="33" cy="33" r="2.6" fill={GOLD} stroke="none" />
      </g>
    </svg>
  );
}

/** Large, very faint Ashoka-wheel watermark centred behind the text. */
function Watermark() {
  const spokes = 24;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
      <svg viewBox="0 0 200 200" className="w-[42%] opacity-[0.05]">
        <circle cx="100" cy="100" r="88" fill="none" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke={NAVY} strokeWidth="1.6" />
        {Array.from({ length: spokes }).map((_, i) => {
          const a = ((i * 360) / spokes - 90) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={(100 + 70 * Math.cos(a)).toFixed(2)}
              y2={(100 + 70 * Math.sin(a)).toFixed(2)}
              stroke={NAVY}
              strokeWidth="1.3"
            />
          );
        })}
        <circle cx="100" cy="100" r="11" fill={NAVY} />
      </svg>
    </div>
  );
}

/** A script-style issuer signature drawn as a single vector path. */
function Signature() {
  return (
    <svg viewBox="0 0 210 60" className="h-7 w-auto" aria-hidden>
      <path
        d="M6 42 C 16 10, 30 8, 28 32 C 27 46, 40 46, 44 26 C 47 12, 56 12, 54 34 C 53 46, 64 44, 72 28 C 80 12, 92 16, 86 34 C 82 46, 96 44, 104 30 C 116 10, 132 14, 126 34 C 122 47, 138 46, 150 30 C 162 14, 176 16, 172 34"
        fill="none"
        stroke={NAVY}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M150 47 Q180 41 203 49" fill="none" stroke={GOLD} strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

type ArtworkState = "locked" | "draft" | "issued";

/**
 * The credential itself - one renderer shared by the locked teaser, the live
 * draft, and the issued certificate. No download path: it lives on screen and
 * "leaves" only via the printed ID / verification QR.
 */
function CertificateArtwork({
  state,
  name,
  designation,
  org,
  score,
  certId,
  issueDate,
  validUntil,
  qr,
}: {
  state: ArtworkState;
  name: string;
  designation: string;
  org: string;
  score?: number;
  certId: string;
  issueDate: string;
  validUntil: string;
  qr: string;
}) {
  const issued = state === "issued";
  const hasScore = typeof score === "number" && !Number.isNaN(score);
  const trimmed = name.trim();
  const displayName = state === "locked" ? "Your Name Here" : trimmed || "Your name here";
  const nameIsPlaceholder = state === "locked" || !trimmed;
  const idText = certId || (state === "locked" ? "CDP-••••-••••" : "\u2014");

  const nameLen = displayName.length;
  const nameFont =
    nameLen > 40
      ? "clamp(12px,2.7vw,22px)"
      : nameLen > 28
        ? "clamp(14px,3.2vw,26px)"
        : nameLen > 18
          ? "clamp(16px,3.8vw,30px)"
          : "clamp(18px,4.4vw,36px)";

  const foil: CSSProperties = {
    backgroundImage: "linear-gradient(92deg,#7a5e21 0%,#d8bf78 28%,#ad8a3a 52%,#f0dfa8 72%,#ad8a3a 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };

  return (
    <div
      className="cert-print-artwork relative mx-auto w-full max-w-[720px] select-none overflow-hidden rounded-[8px] text-center shadow-[0_18px_40px_-12px_rgba(16,31,58,0.35)]"
      style={{ aspectRatio: "297 / 210", backgroundColor: PAPER }}
    >
      <Guilloche />
      <Watermark />
      <MicrotextBorder />

      {/* Engraved twin frame */}
      <div className="pointer-events-none absolute inset-[3.6%] rounded-[3px] border-[1.5px]" style={{ borderColor: NAVY }} />
      <div className="pointer-events-none absolute inset-[4.6%] rounded-[2px] border" style={{ borderColor: GOLD }} />

      <CornerFlourish className="left-[3%] top-[3.6%] w-[8.5%]" />
      <CornerFlourish className="right-[3%] top-[3.6%] w-[8.5%] rotate-90" />
      <CornerFlourish className="right-[3%] bottom-[3.6%] w-[8.5%] rotate-180" />
      <CornerFlourish className="left-[3%] bottom-[3.6%] w-[8.5%] -rotate-90" />

      {issued && <div className="cert-shimmer pointer-events-none absolute inset-0 z-20" aria-hidden />}

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col px-[8%] py-[5.4%]">
        {/* Header */}
        <div>
          <p className="font-display text-[clamp(11px,2.4vw,17px)] font-bold tracking-[0.34em]" style={foil}>
            TRUSTSTACK
          </p>
          <p className="mt-1 text-[clamp(5px,1.05vw,8px)] tracking-[0.3em]" style={{ color: MUTED }}>
            PRIVACY · GOVERNANCE · COMPLIANCE
          </p>
          <div className="mx-auto my-[1.8%] flex w-[62%] items-center justify-center gap-2">
            <span className="h-px flex-1" style={{ background: `linear-gradient(90deg,transparent,${GOLD})` }} />
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: GOLD }} />
            <span className="h-px flex-1" style={{ background: `linear-gradient(90deg,${GOLD},transparent)` }} />
          </div>
          <p className="text-[clamp(6px,1.35vw,10px)] font-semibold tracking-[0.24em]" style={{ color: NAVY }}>
            CERTIFICATE OF ACHIEVEMENT
          </p>
        </div>

        {/* Recipient */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="font-serif text-[clamp(7px,1.5vw,12px)] italic" style={{ color: MUTED }}>
            This certificate is proudly presented to
          </p>
          <p
            className="mt-[1.2%] line-clamp-2 max-w-[86%] break-words font-serif font-bold italic leading-tight"
            style={{ fontSize: nameFont, color: nameIsPlaceholder ? "rgba(16,31,58,0.32)" : NAVY }}
          >
            {displayName}
          </p>
          {!nameIsPlaceholder && (designation || org) && (
            <p className="mt-[0.6%] text-[clamp(6px,1.3vw,10px)] font-medium tracking-wide" style={{ color: MUTED }}>
              {[designation, org].filter(Boolean).join(" · ")}
            </p>
          )}
          <div
            className="mx-auto mt-[1.4%] h-px w-[58%]"
            style={{ background: `linear-gradient(90deg,transparent,${GOLD},transparent)` }}
          />
          <p className="mt-[1.6%] font-serif text-[clamp(6px,1.4vw,11px)] italic" style={{ color: MUTED }}>
            has successfully completed the certification programme
          </p>
          <p className="mt-[0.8%] font-serif text-[clamp(11px,2.7vw,22px)] font-bold" style={{ color: GOLD }}>
            Certified DPDP Practitioner
          </p>
          <p className="mt-[0.4%] text-[clamp(5px,1.05vw,9px)]" style={{ color: "rgba(16,31,58,0.72)" }}>
            Digital Personal Data Protection Act, 2023 &amp; DPDP Rules 2025
          </p>
          {hasScore && (
            <p className="mt-[1.4%] text-[clamp(6px,1.35vw,11px)] font-semibold" style={{ color: NAVY }}>
              <span className="tracking-[0.18em]">EXAMINATION SCORE</span>
              <span className="ml-1.5 font-mono tabular-nums" style={{ color: GOLD }}>
                {Math.round(score!)}%
              </span>
            </p>
          )}
        </div>

        {/* Credential footer band */}
        <div>
          <div
            className="mx-auto mb-[1.4%] flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[clamp(4.5px,0.95vw,7.5px)] tracking-wide"
            style={{ color: MUTED }}
          >
            <span>Issued {issueDate}</span>
            <span aria-hidden style={{ color: GOLD }}>·</span>
            <span>Valid until {validUntil}</span>
            <span aria-hidden style={{ color: GOLD }}>·</span>
            <span className="font-mono tabular-nums" style={{ color: NAVY }}>{idText}</span>
          </div>

          <div className="grid grid-cols-[1fr_1.2fr_1fr] items-end gap-2">
            {/* Verify / QR */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="grid place-items-center overflow-hidden rounded-[3px] border bg-white"
                style={{ width: "clamp(28px,6.4vw,54px)", height: "clamp(28px,6.4vw,54px)", borderColor: "rgba(16,31,58,0.25)" }}
              >
                {issued && qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt="Certificate verification QR code" className="h-full w-full object-contain" />
                ) : (
                  <span className="px-1 text-center text-[clamp(3px,0.72vw,5px)] leading-tight" style={{ color: MUTED }}>
                    QR on claim
                  </span>
                )}
              </div>
              <span className="text-[clamp(3.5px,0.8vw,6px)] tracking-wide" style={{ color: MUTED }}>
                Scan to verify
              </span>
            </div>

            {/* Signature */}
            <div className="flex flex-col items-center">
              <Signature />
              <div className="mt-0.5 h-px w-[80%]" style={{ background: NAVY, opacity: 0.5 }} />
              <span className="mt-1 text-[clamp(4px,0.9vw,7px)] font-semibold tracking-[0.2em]" style={{ color: MUTED }}>
                PROGRAMME DIRECTOR
              </span>
              <span className="text-[clamp(4px,0.85vw,6.5px)]" style={{ color: NAVY }}>
                TrustStack
              </span>
            </div>

            {/* Embossed seal */}
            <div className="flex justify-center">
              <div
                aria-hidden
                className="w-[62%] max-w-[78px] drop-shadow-[0_3px_5px_rgba(16,31,58,0.28)] [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: certificateSealSvg() }}
              />
            </div>
          </div>

          <p className="mt-[1.2%] text-[clamp(4px,0.9vw,7px)] tracking-wide" style={{ color: MUTED }}>
            Verify at dpdp.in/certification · Certificate ID:{" "}
            <span className="font-mono" style={{ color: NAVY }}>{idText}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const CERT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  .cert-print-root, .cert-print-root * { visibility: visible !important; }
  .cert-print-root {
    position: absolute !important; inset: 0 !important;
    margin: 0 !important; border: 0 !important; padding: 0 !important;
    background: #fff !important;
  }
  .cert-no-print { display: none !important; }
  .cert-print-frame { border: 0 !important; background: #fff !important; padding: 0 !important; }
  .cert-print-artwork { width: 100% !important; max-width: 100% !important; box-shadow: none !important; }
  html, body { background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
@keyframes certSweep {
  0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
  16%  { opacity: 0.5; }
  100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
}
.cert-shimmer {
  background: linear-gradient(100deg, transparent 34%, rgba(255,255,255,0.55) 50%, transparent 66%);
  animation: certSweep 1.5s ease-out 0.15s 1;
}
@media (prefers-reduced-motion: reduce) {
  .cert-shimmer { display: none !important; }
}
`;

/**
 * On-screen, verifiable DPDP Practitioner credential.
 *
 * - `locked` renders a non-interactive teaser (no inputs, no buttons) for the
 *   exam intro - you cannot mint a credential you have not earned.
 * - Unlocked (only inside the result screen's `passed` block) it collects the
 *   holder's identity and, on claim, issues the certificate with a QR verify
 *   link. There is deliberately no download / save / print-to-PDF button.
 */
export function CertificateStudio({
  score,
  presetCertId,
  locked = false,
  className,
}: {
  score?: number;
  presetCertId?: string;
  locked?: boolean;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [org, setOrg] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [qr, setQr] = useState("");
  const [origin, setOrigin] = useState("");
  // Generate the random ID on the CLIENT only. Calling makeCertId() during
  // render produces a different value on the server vs the client and triggers
  // a hydration mismatch, so SSR starts empty and the client fills it in.
  const [certId, setCertId] = useState<string>(presetCertId ?? "");
  useEffect(() => {
    if (!presetCertId) setCertId(makeCertId());
  }, [presetCertId]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const now = useMemo(() => new Date(), []);
  const issueDate = useMemo(() => fmtDate(now), [now]);
  const validUntil = useMemo(() => {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() + 2);
    return fmtDate(d);
  }, [now]);

  // Build the verification QR only once the credential is claimed. `qrcode` is
  // dynamically imported so it stays client-only and code-split (like jsPDF).
  useEffect(() => {
    if (!claimed || !certId) return;
    let alive = true;
    (async () => {
      try {
        const QR = await import("qrcode");
        const verifyUrl = `${origin}/certification/verify?id=${encodeURIComponent(certId)}`;
        const url = await QR.toDataURL(verifyUrl, {
          margin: 1,
          width: 240,
          errorCorrectionLevel: "M",
          color: { dark: "#101f3aff", light: "#ffffffff" },
        });
        if (alive) setQr(url);
      } catch {
        /* the QR is an enhancement - the printed ID remains the fallback */
      }
    })();
    return () => {
      alive = false;
    };
  }, [claimed, certId, origin]);

  const hasScore = typeof score === "number" && !Number.isNaN(score);
  const artworkState: ArtworkState = locked ? "locked" : claimed ? "issued" : "draft";

  // ---------- LOCKED TEASER (exam intro) ----------
  if (locked) {
    return (
      <div className={cn("rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-7", className)}>
        <div className="relative overflow-hidden rounded-xl border border-line bg-line/40 p-3 sm:p-5">
          <div className="relative">
            <CertificateArtwork
              state="locked"
              name=""
              designation=""
              org=""
              score={hasScore ? score : undefined}
              certId=""
              issueDate={issueDate}
              validUntil={validUntil}
              qr=""
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full border border-accent/50 bg-bg/85 text-accent shadow-lg backdrop-blur-sm">
                <Lock className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-text-muted">
          Pass the exam to unlock and claim your certificate.
        </p>
      </div>
    );
  }

  // ---------- EARNED (draft → issued), result screen only ----------
  return (
    <div className={cn("cert-print-root rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-7", className)}>
      <style dangerouslySetInnerHTML={{ __html: CERT_STYLES }} />

      <div className="cert-no-print flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
          {claimed ? <ShieldCheck className="h-5 w-5" /> : <Award className="h-5 w-5" />}
        </span>
        <div>
          <p className="font-display font-semibold text-text">
            {claimed ? "Your certificate is issued" : "Claim your certificate"}
          </p>
          <p className="text-sm text-text-muted">
            {claimed
              ? "A verifiable, on-screen credential - press Ctrl/Cmd + P to keep a copy."
              : "Enter your name as it should appear on the credential."}
          </p>
        </div>
      </div>

      <div className="cert-print-frame mt-5 overflow-hidden rounded-xl border border-line bg-line/40 p-3 sm:p-5">
        <CertificateArtwork
          state={artworkState}
          name={name}
          designation={designation}
          org={org}
          score={hasScore ? score : undefined}
          certId={certId}
          issueDate={issueDate}
          validUntil={validUntil}
          qr={qr}
        />
      </div>

      {claimed ? (
        <div className="cert-no-print mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex flex-wrap items-center gap-x-1.5 text-sm text-text-muted">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Verify at <span className="font-mono text-text">dpdp.in/certification</span> · ID
            <span className="font-mono text-text">{certId}</span>
          </p>
          <button
            type="button"
            onClick={() => setClaimed(false)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-muted transition-colors hover:border-accent/50 hover:text-text"
          >
            <Pencil className="h-4 w-4" /> Edit details
          </button>
        </div>
      ) : (
        <form
          className="cert-no-print mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) setClaimed(true);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label htmlFor="cert-name" className="mb-1.5 block text-sm text-text-muted">
                Full legal name <span className="text-accent">*</span>
              </label>
              <input
                id="cert-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                maxLength={60}
                className="w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50"
              />
            </div>
            <div>
              <label htmlFor="cert-designation" className="mb-1.5 block text-sm text-text-muted">
                Designation / role
              </label>
              <input
                id="cert-designation"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Data Protection Officer"
                maxLength={48}
                className="w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cert-org" className="mb-1.5 block text-sm text-text-muted">
                Organisation
              </label>
              <input
                id="cert-org"
                type="text"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. Acme Pvt Ltd"
                maxLength={48}
                className="w-full rounded-lg border border-line bg-bg-2/60 px-3 py-2.5 text-sm text-text outline-none placeholder:text-text-faint focus:border-accent/50"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={!name.trim()} className="btn btn-accent shrink-0 disabled:opacity-50">
              <ShieldCheck className="h-4 w-4" /> Claim certificate
            </button>
            <span className="text-xs text-text-faint">
              Your details stay on this device - no account, no sign-up.
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
