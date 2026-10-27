const KEY = "truststack_pending_pilot_checkout";

export function markPilotCheckoutPending(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

export function clearPilotCheckoutPending(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function isPilotCheckoutPending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
