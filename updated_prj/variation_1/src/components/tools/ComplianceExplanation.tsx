"use client";

import Link from "next/link";
import {
  BrainCircuit,
  ChevronDown,
  Eye,
  Scale,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
import { SECURITY_LEGAL_REFS } from "@/content/security-compliance-legal";
import type { FindingExplanation } from "@/lib/security-compliance-contract";

type ComplianceExplanationProps = {
  explanation: FindingExplanation;
  defaultOpen?: boolean;
};

export function ComplianceExplanation({
  explanation,
  defaultOpen = false,
}: ComplianceExplanationProps) {
  return (
    <details
      className="group mt-4 border-t border-line pt-3"
      open={defaultOpen ? true : undefined}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded px-2 py-2 text-sm font-semibold text-text hover:bg-surface-2 focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 items-center gap-2">
          <BrainCircuit className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          <span>AI explanation</span>
          <span className="badge shrink-0">AI-generated</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-text-faint transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>

      <div className="mt-2 divide-y divide-line border-y border-line bg-bg/35 px-4">
        <ExplanationRow icon={Eye} label="Observed fact">
          <p data-easy-ignore data-i18n-ignore translate="no">
            {explanation.observedFact}
          </p>
        </ExplanationRow>

        <ExplanationRow icon={BrainCircuit} label="AI interpretation">
          <p data-easy-ignore data-i18n-ignore translate="no">
            {explanation.interpretation}
          </p>
        </ExplanationRow>

        <ExplanationRow icon={Scale} label="DPDP connection">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {explanation.legalReferenceIds.map((referenceId) => {
              const reference = SECURITY_LEGAL_REFS[referenceId];
              return (
                <Link
                  key={referenceId}
                  href={reference.href}
                  className="font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
                >
                  {reference.label}
                </Link>
              );
            })}
          </div>
        </ExplanationRow>

        <ExplanationRow icon={TriangleAlert} label="Uncertainty">
          <p data-easy-ignore data-i18n-ignore translate="no">
            {explanation.uncertainty}
          </p>
        </ExplanationRow>

        <ExplanationRow icon={UserRoundCheck} label="Human check">
          <ul className="space-y-1.5" data-easy-ignore data-i18n-ignore translate="no">
            {explanation.humanChecks.map((check) => (
              <li key={check} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  &bull;
                </span>
                <span>{check}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-text-faint">
            Confidence in evidence link:{" "}
            <span data-easy-ignore data-i18n-ignore translate="no">
              {capitalize(explanation.confidence)}
            </span>
          </p>
        </ExplanationRow>
      </div>
    </details>
  );
}

function ExplanationRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Eye;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-2 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-text-muted">
        <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        {label}
      </h4>
      <div className="min-w-0 break-words text-sm leading-relaxed text-text-muted">{children}</div>
    </section>
  );
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}