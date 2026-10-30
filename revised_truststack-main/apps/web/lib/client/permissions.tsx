"use client";

import type { PermissionCode } from "@truststack/core";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "./api";

export interface ActivePermissions {
  organizationId: string;
  role: string;
  roleName: string;
  permissions: PermissionCode[];
}

type State = { kind: "loading" } | { kind: "ready"; value: ActivePermissions } | { kind: "error"; message: string };

const PermissionsContext = createContext<State>({ kind: "loading" });

/** Loads `/auth/me/permissions` once per page view for the active organisation. */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    apiFetch<ActivePermissions>("/api/v1/auth/me/permissions").then((r) => {
      if (cancelled) return;
      setState(r.success ? { kind: "ready", value: r.data } : { kind: "error", message: r.error.message });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <PermissionsContext.Provider value={state}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): State {
  return useContext(PermissionsContext);
}

/**
 * Hides UI the user cannot use. This is presentation only — the API enforces
 * every permission on the server whether or not the button is shown.
 */
export function Can({ permission, children, fallback = null }: { permission: PermissionCode; children: ReactNode; fallback?: ReactNode }) {
  const state = usePermissions();
  if (state.kind !== "ready" || !state.value.permissions.includes(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
