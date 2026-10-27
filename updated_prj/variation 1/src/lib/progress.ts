import {
  storageGetItem,
  storageGetJSON,
  storageRemoveItem,
  storageSetJSON,
} from "./safe-storage";

export const PROGRESS_KEYS = {
  risk: "dpdp-risk-v1",
  quizBest: "dpdp-quiz-best",
  consent: "dpdp-consent",
  progress: "dpdp-progress",
  lexbot: "dpdp-lexbot-chat",
} as const;

export const PROGRESS_UPDATE_EVENT = "dpdp-progress-update";
export const OPEN_CONSENT_EVENT = "dpdp-open-consent";
export const OPEN_LEXBOT_EVENT = "dpdp-open-lexbot";

export type ProgressSignals = {
  riskAnswered: number;
  riskTotal: number;
  quizBest: number;
  consent: boolean;
  calc: boolean;
  doc: boolean;
  lexbot: number;
};

const DEFAULT_TOTAL = 11;

export function readProgressSignals(): ProgressSignals {
  const s: ProgressSignals = {
    riskAnswered: 0,
    riskTotal: DEFAULT_TOTAL,
    quizBest: 0,
    consent: false,
    calc: false,
    doc: false,
    lexbot: 0,
  };
  if (typeof window === "undefined") return s;

  const risk = storageGetJSON<unknown[]>(PROGRESS_KEYS.risk, []);
  if (Array.isArray(risk)) {
    s.riskTotal = risk.length || DEFAULT_TOTAL;
    s.riskAnswered = risk.filter((a) => a != null).length;
  }
  s.quizBest = Number(storageGetItem(PROGRESS_KEYS.quizBest) || 0);
  s.consent = !!storageGetItem(PROGRESS_KEYS.consent);
  const prog = storageGetJSON<{ calc?: boolean; doc?: boolean }>(
    PROGRESS_KEYS.progress,
    {}
  );
  s.calc = !!prog.calc;
  s.doc = !!prog.doc;
  const chat = storageGetJSON<{ who?: string }[]>(PROGRESS_KEYS.lexbot, []);
  if (Array.isArray(chat)) {
    s.lexbot = chat.filter((m) => m?.who === "user").length;
  }

  return s;
}

export function notifyProgressUpdate() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PROGRESS_UPDATE_EVENT));
}

export function markCalcUsed() {
  const p = storageGetJSON<{ calc?: boolean }>(PROGRESS_KEYS.progress, {});
  if (!p.calc) {
    p.calc = true;
    if (storageSetJSON(PROGRESS_KEYS.progress, p)) notifyProgressUpdate();
  }
}

export function markDocGenerated() {
  const p = storageGetJSON<{ doc?: boolean }>(PROGRESS_KEYS.progress, {});
  if (!p.doc) {
    p.doc = true;
    if (storageSetJSON(PROGRESS_KEYS.progress, p)) notifyProgressUpdate();
  }
}

export function resetProgress() {
  Object.values(PROGRESS_KEYS).forEach((k) => storageRemoveItem(k));
  notifyProgressUpdate();
}
