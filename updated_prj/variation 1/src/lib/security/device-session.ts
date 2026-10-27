export const DEVICE_COOKIE = "truststack-device";
export const DEVICE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export function createDeviceToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validDeviceToken(value: string | null | undefined): value is string {
  return Boolean(value && /^[a-f0-9]{64}$/.test(value));
}

export async function hashDeviceToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
