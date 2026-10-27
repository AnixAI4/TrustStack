/**
 * Defensive localStorage helpers. When the browser storage quota is full (often
 * reported as "cache is full"), bare setItem calls throw and can leave React
 * widgets - especially nav menus - in a broken state. These helpers swallow
 * quota errors, prune bulky app keys, and retry once.
 */

const EVICT_ON_QUOTA = [
  "dpdp-lexbot-chat",
  "dpdp-risk-v1",
  "dpdp-quiz-best",
  "dpdp-progress",
] as const;

const MAX_LEXBOT_BYTES = 48_000;

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; code?: number };
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    e.code === 22 ||
    e.code === 1014
  );
}

function trimLexbotChat(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("dpdp-lexbot-chat");
    if (!raw || raw.length <= MAX_LEXBOT_BYTES) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      localStorage.setItem(
        "dpdp-lexbot-chat",
        JSON.stringify(parsed.slice(-20))
      );
    } else {
      localStorage.removeItem("dpdp-lexbot-chat");
    }
  } catch {
    try {
      localStorage.removeItem("dpdp-lexbot-chat");
    } catch {
      /* ignore */
    }
  }
}

function evictBulkyKeys(): void {
  if (typeof window === "undefined") return;
  for (const key of EVICT_ON_QUOTA) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Run once before React hydrates - trims oversized chat history. */
export function pruneStorage(): void {
  if (typeof window === "undefined") return;
  trimLexbotChat();
}

export function storageGetItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSetItem(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaError(err)) return false;
    trimLexbotChat();
    evictBulkyKeys();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function storageRemoveItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function storageGetJSON<T>(key: string, fallback: T): T {
  const raw = storageGetItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    storageRemoveItem(key);
    return fallback;
  }
}

export function storageSetJSON(key: string, value: unknown): boolean {
  try {
    return storageSetItem(key, JSON.stringify(value));
  } catch {
    return false;
  }
}
