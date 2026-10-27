import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  Globe2,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { TRUSTSTACK_ASSURANCE } from '@/content/truststack-assurance'

export const metadata: Metadata = {
  title: 'TrustStack assurance evidence',
  description:
    'Dated TrustStack release evidence: DPDP Scanner results, policy corpus, methodology, negative controls and verification boundaries.',
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference

  return (
    <div
      className="relative grid h-36 w-36 shrink-0 place-items-center"
      role="img"
      aria-label={`Release self-assessment score ${score} out of 100`}
    >
      <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--green)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>
      <div className="absolute text-center">
        <strong className="font-display text-4xl font-semibold leading-none text-text">{score}</strong>
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">of 100</span>
      </div>
    </div>
  )
}

export default function AssurancePage() {
  const evidence = TRUSTSTACK_ASSURANCE

  return (
    <section className="section pb-20 pt-10 sm:pt-14">
      <div className="container-x max-w-6xl">
        <header className="border-b border-line pb-8">
          <span className="eyebrow">
            <ShieldCheck className="h-3.5 w-3.5" /> Public assurance record
          </span>
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-text sm:text-5xl">
                TrustStack assurance
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-muted">
                Dated evidence for this release&apos;s publicly observable DPDP readiness, including the policy corpus,
                scanner methodology and controls that prevent an automatic perfect score.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/scanner" prefetch={false} className="btn btn-accent inline-flex items-center gap-2">
                <ScanSearch className="h-4 w-4" /> Run your own scan
              </Link>
              <Link href="/privacy" className="btn btn-ghost inline-flex items-center gap-2">
                Review our privacy policy <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        <div className="grid border-b border-line lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
          <section className="flex flex-col gap-7 py-8 lg:border-r lg:border-line lg:pr-10" aria-labelledby="release-result-title">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <ScoreGauge score={evidence.checks.productionHttpsReadiness} />
              <div>
                <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-green">
                  Release self-assessment passed
                </p>
                <h2 id="release-result-title" className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
                  Public controls and policy documents met every scanner check
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
                  Verified on {evidence.verifiedOn} using {evidence.engine}. This result covers the release candidate;
                  the live domain must be rescanned after deployment before it is described as live-verified.
                </p>
              </div>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              <div className="bg-bg-2 p-4 sm:p-5">
                <dt className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
                  <Globe2 className="h-4 w-4 text-accent" /> URL readiness
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-text">
                  {evidence.checks.productionHttpsReadiness}<span className="text-base font-normal text-text-faint">/100</span>
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">Production-HTTPS simulation, linked policies, consent and visible headers.</p>
              </div>
              <div className="bg-bg-2 p-4 sm:p-5">
                <dt className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
                  <FileCheck2 className="h-4 w-4 text-accent" /> Document readiness
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-text">
                  {evidence.checks.documentReadiness}<span className="text-base font-normal text-text-faint">/100</span>
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">Complete privacy, terms and cookie text assessed in document mode.</p>
              </div>
            </dl>
          </section>

          <aside className="py-8 lg:pl-10" aria-labelledby="verification-status-title">
            <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Verification status</p>
            <h2 id="verification-status-title" className="mt-2 font-display text-xl font-semibold text-text">Release passed; live recheck pending</h2>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green" />
                <div><p className="text-sm font-semibold text-text">Release evidence recorded</p><p className="mt-0.5 text-xs leading-relaxed text-text-muted">Both supported scanner modes passed their complete check set.</p></div>
              </div>
              <div className="flex gap-3">
                <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber" />
                <div><p className="text-sm font-semibold text-text">Deployment is a separate claim</p><p className="mt-0.5 text-xs leading-relaxed text-text-muted">Hosting, headers and deployed content can differ from a release candidate.</p></div>
              </div>
            </div>
            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-text-faint">
              This is TrustStack&apos;s own reproducible scanner evidence. It is not certification by the Data Protection Board,
              a regulator, or an independent auditor.
            </p>
          </aside>
        </div>

        <section className="border-b border-line py-9" aria-labelledby="policy-evidence-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Policy corpus</p>
              <h2 id="policy-evidence-title" className="mt-1 font-display text-2xl font-semibold text-text">Inspect the evidence directly</h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-text-muted">Word counts are extraction evidence, not a quality claim. Open each document and judge whether it matches our actual practices.</p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {evidence.policies.map((policy) => (
              <Link
                key={policy.kind}
                href={policy.href}
                className="group flex min-h-32 flex-col justify-between rounded-lg border border-line bg-bg-2 p-4 shadow-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/40"
              >
                <FileCheck2 className="h-5 w-5 text-accent" />
                <div className="mt-5">
                  <p className="font-display text-base font-semibold text-text group-hover:text-accent">{policy.kind}</p>
                  <p className="mt-1 flex items-center justify-between text-xs text-text-faint">
                    {policy.words.toLocaleString('en-IN')} extracted words <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-b border-line py-9 lg:grid-cols-2" aria-labelledby="methodology-title">
          <div>
            <p className="font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">Methodology</p>
            <h2 id="methodology-title" className="mt-1 font-display text-2xl font-semibold text-text">What the result actually measures</h2>
            <ol className="mt-6 space-y-5">
              {[
                ['01', 'Public URL inspection', 'Checks discoverable policies, consent signals, HTTPS and externally visible response headers.'],
                ['02', 'Full-document analysis', 'Reads complete policy text for consent, rights, retention, grievance, security and sharing disclosures.'],
                ['03', 'Strict pass condition', 'Requires every weighted category to score 100 and rejects any unresolved high, medium or low finding.'],
              ].map(([number, title, description]) => (
                <li key={number} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 font-mono text-xs font-semibold text-accent">{number}</span>
                  <div><p className="text-sm font-semibold text-text">{title}</p><p className="mt-1 text-sm leading-relaxed text-text-muted">{description}</p></div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-line pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="flex items-center gap-2 font-mono text-label font-semibold uppercase tracking-[var(--tracking-label)] text-text-faint">
              <FlaskConical className="h-4 w-4 text-accent" /> Negative controls
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-text">A perfect score is not automatic</h2>
            <div className="mt-5 divide-y divide-line border-y border-line">
              <div className="flex items-center justify-between gap-4 py-4">
                <div><p className="text-sm font-semibold text-text">Deliberately weak policy</p><p className="mt-0.5 text-xs text-text-muted">Missing substantive DPDP disclosures.</p></div>
                <strong className="font-display text-2xl text-red">{evidence.controls.weakPolicyScore}/100</strong>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <div><p className="text-sm font-semibold text-text">Complete set without privacy policy</p><p className="mt-0.5 text-xs text-text-muted">All other disclosure signals retained.</p></div>
                <strong className="font-display text-2xl text-amber">{evidence.controls.missingPrivacyScore}/100</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-9 flex flex-col gap-5 rounded-lg border border-amber/25 bg-amber/8 p-5 sm:flex-row sm:items-start sm:p-6" aria-labelledby="scope-boundary-title">
          <TriangleAlert className="h-6 w-6 shrink-0 text-amber" />
          <div className="min-w-0 flex-1">
            <h2 id="scope-boundary-title" className="font-display text-lg font-semibold text-text">Scope boundary</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              The scanner assesses public website signals and supplied documents. It cannot prove internal access control,
              staff behavior, incident response effectiveness, data inventories, vendor performance or complete legal compliance.
              Those require operational evidence and, where appropriate, independent professional review.
            </p>
          </div>
          <Link href="/scanner" prefetch={false} className="btn btn-ghost inline-flex shrink-0 items-center gap-2 self-start">
            Verify independently <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </section>
  )
}
