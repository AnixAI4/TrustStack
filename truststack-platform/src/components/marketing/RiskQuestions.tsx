"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, XCircle } from "lucide-react";

const questions = [
  "What personal data does your organization collect across all systems?",
  "Why do you collect each type of personal data — and is the purpose documented?",
  "Where exactly is personal data stored — cloud, on-premise, third-party vendors?",
  "Who inside your organization has access to personal data?",
  "Which vendors or processors handle personal data on your behalf?",
  "Is every consent valid, traceable, and withdrawable under DPDP Rules 2025?",
  "Can users withdraw consent — and do you have a process to act on that?",
  "Can you handle Access, Correction, Erasure, and Grievance requests within deadline?",
  "What happens if personal data is breached — do you have a 72-hour response plan?",
  "Are your AI and GenAI tools using personal data safely under DPDP?",
  "Can you prove your DPDP readiness to your Board, auditors, or the regulator today?",
];

type Answer = "yes" | "partial" | "no";

const ANSWER_CONFIG: Record<Answer, { icon: typeof CheckCircle2; label: string; tip: string; active: string; row: string }> = {
  yes: {
    icon: CheckCircle2,
    label: "Yes",
    tip: "Yes — we have this covered",
    active: "bg-success-DEFAULT border-success-DEFAULT text-white shadow-sm",
    row: "answer-yes",
  },
  partial: {
    icon: CircleDashed,
    label: "Partial",
    tip: "Partial — work is in progress",
    active: "bg-warning-DEFAULT border-warning-DEFAULT text-white shadow-sm",
    row: "answer-partial",
  },
  no: {
    icon: XCircle,
    label: "No",
    tip: "No — gap identified",
    active: "bg-danger-DEFAULT border-danger-DEFAULT text-white shadow-sm",
    row: "answer-no",
  },
};

export default function RiskQuestions() {
  const [answered, setAnswered] = useState<Record<number, Answer>>({});
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const noCount      = Object.values(answered).filter((v) => v === "no").length;
  const partialCount = Object.values(answered).filter((v) => v === "partial").length;
  const answeredCount = Object.keys(answered).length;
  const riskScore    = answeredCount > 0 ? Math.round(((noCount + partialCount * 0.5) / questions.length) * 100) : 0;

  const getRisk = () => {
    if (riskScore >= 60) return { label: "Critical",  colorClass: "text-danger-text",    bar: "bg-danger-DEFAULT",   band: "answer-no" };
    if (riskScore >= 35) return { label: "High",       colorClass: "text-warning-text",   bar: "bg-warning-DEFAULT",  band: "answer-partial" };
    if (riskScore >= 15) return { label: "Medium",     colorClass: "text-warning-DEFAULT", bar: "bg-warning-DEFAULT", band: "answer-partial" };
    return                     { label: "Managed",     colorClass: "text-success-text",   bar: "bg-success-DEFAULT",  band: "answer-yes" };
  };

  const risk = getRisk();

  return (
    <section ref={ref} id="risk-check" className="section-white py-20 lg:py-28 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-center mb-12">
          <span className="badge-danger mb-4 inline-flex">
            <AlertTriangle className="w-3 h-3" /> DPDP Risk Self-Assessment
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mt-3 mb-4">
            Can Your Organization Answer{" "}
            <span className="text-gradient-danger">These 11 Questions?</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Every organization processing personal data must be able to answer these.
            Mark each one — your risk level updates live.
          </p>
        </motion.div>

        {/* Legend — always visible above questions */}
        <div className="flex items-center justify-center gap-5 mb-6 text-xs text-text-muted flex-wrap">
          {(["yes", "partial", "no"] as Answer[]).map((a) => {
            const { icon: Icon, tip, active } = ANSWER_CONFIG[a];
            return (
              <span key={a} className="flex items-center gap-1.5">
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-lg border ${active}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {tip}
              </span>
            );
          })}
        </div>

        {/* Questions */}
        <div className="space-y-2 mb-8">
          {questions.map((q, i) => {
            const ans = answered[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.03 * i }}
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                  ans ? ANSWER_CONFIG[ans].row : "border-border hover:border-border-medium"
                }`}
                style={!ans ? { background: "var(--c-bg-card-flat)" } : undefined}
              >
                <span className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-[11px] font-bold text-text-muted flex-shrink-0 mt-0.5"
                  style={{ background: "var(--c-bg-secondary)" }}>
                  {i + 1}
                </span>
                <p className="text-sm text-text-primary leading-relaxed flex-1">{q}</p>

                {/* Answer buttons with tooltips */}
                <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                  {(["yes", "partial", "no"] as Answer[]).map((val) => {
                    const { icon: Icon, tip, active } = ANSWER_CONFIG[val];
                    const isActive = ans === val;
                    return (
                      <div key={val} className="tooltip-wrap">
                        <button
                          onClick={() => setAnswered((p) => ({ ...p, [i]: val }))}
                          aria-label={tip}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-150 ${
                            isActive
                              ? active
                              : "border-border text-text-muted hover:border-border-medium hover:scale-110"
                          }`}
                          style={!isActive ? { background: "var(--c-bg-secondary)" } : undefined}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                        <span className="tt">{tip}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Live result */}
        {answeredCount >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border mb-6 ${risk.band}`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                  Your DPDP Risk Level ({answeredCount}/{questions.length} answered)
                </p>
                <p className={`text-3xl font-bold font-display ${risk.colorClass}`}>
                  {risk.label} Risk
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {noCount} gaps identified · {partialCount} partially implemented
                </p>
              </div>
              <a href="#contact" className="btn-danger text-sm">
                Get Expert Help Now <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Risk exposure</span><span>{riskScore}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden border border-border" style={{ background: "var(--c-bg-secondary)" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${riskScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full ${risk.bar}`}
                />
              </div>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }} className="text-center">
          <p className="text-text-muted text-sm mb-5">
            Don&apos;t guess your compliance status.{" "}
            <strong className="text-text-primary">DPDP Compass™</strong> gives you a professional,
            evidence-based assessment with a 90-day action roadmap.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#contact" className="btn-primary">Book DPDP Compass™ Assessment <ArrowRight className="w-4 h-4" /></a>
            <a href="#services" className="btn-secondary">Explore All Services</a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
