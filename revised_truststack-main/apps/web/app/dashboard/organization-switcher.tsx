"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/client/api";

export interface OrgOption {
  id: string;
  name: string;
  roleName: string;
  isActive: boolean;
}

/**
 * Hidden when the user belongs to one organisation. Switching reloads so every
 * panel re-reads. The top bar loads the list once and passes it in.
 */
export function OrganizationSwitcher({ orgs }: { orgs: OrgOption[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (orgs.length <= 1) return null;
  const active = orgs.find((o) => o.isActive)?.id ?? orgs[0]?.id;

  async function onChange(organizationId: string) {
    setPending(true);
    setError(null);
    const r = await apiFetch("/api/v1/auth/switch-organization", {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    });
    if (r.success) {
      window.location.reload();
    } else {
      setError(r.error.message);
      setPending(false);
    }
  }

  return (
    <div className="relative flex flex-col items-end">
      <label className="sr-only" htmlFor="organization-switcher">
        Organisation
      </label>
      <div className="relative">
        <Building2 aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <select
          id="organization-switcher"
          data-testid="organization-switcher"
          value={active}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[14rem] truncate rounded-md border border-line-strong bg-surface py-1.5 pl-7 pr-2 text-sm text-ink hover:border-brand-blue sm:max-w-[18rem]"
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.roleName}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p data-testid="switch-error" role="alert" className="absolute top-full mt-1 whitespace-nowrap rounded-md bg-danger-light px-2 py-1 text-xs text-danger-text shadow-soft">
          {error}
        </p>
      )}
    </div>
  );
}
