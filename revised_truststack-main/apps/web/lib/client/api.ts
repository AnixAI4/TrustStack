"use client";

/** Browser-side fetch for our own `/api/v1` envelope. The cookie session authenticates. */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: { field?: string; issue: string }[] } };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      cache: "no-store",
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    return (await res.json()) as ApiResult<T>;
  } catch (error) {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: error instanceof Error ? error.message : "Network error." },
    };
  }
}
