"use client";

import { assignableRoles, ROLE_CODES, ROLES, roleCapabilities, type RoleCode } from "@truststack/core";
import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/data/data-table";
import { Notice } from "@/components/feedback/notice";
import { useToast } from "@/components/feedback/toast";
import { apiFetch } from "@/lib/client/api";
import { Can, usePermissions } from "@/lib/client/permissions";

interface Member {
  userId: string;
  email: string | null;
  fullName: string | null;
  role: string;
  roleName: string;
  status: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; code?: string }
  | { kind: "ready"; members: Member[]; invites: Invite[] };

type DeliveryStatus = "sent" | "suppressed" | "logged";

function deliveryMessage(delivery: DeliveryStatus, email: string): string {
  if (delivery === "sent") return `Invitation emailed to ${email}.`;
  if (delivery === "suppressed") return `Invitation saved for ${email}. No email was sent: that is a reserved test address.`;
  return `Invitation saved for ${email}. No email provider is configured in this environment.`;
}

/** Every role an organisation can hold — the "What can each role do?" guide lists them all. */
const ORGANISATION_ROLES: RoleCode[] = ROLE_CODES.filter((r) => !ROLES[r].isPlatformRole);

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800",
  suspended: "bg-amber-50 text-amber-800",
  invited: "bg-slate-100 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = { active: "Active", suspended: "Suspended", invited: "Invited" };

export function UsersPanel() {
  const toast = useToast();
  const permissions = usePermissions();
  const organizationId = permissions.kind === "ready" ? permissions.value.organizationId : null;
  // F1.8: offer only the roles the server will let this person grant (assertCanAssignRole, D-068).
  const assignable = permissions.kind === "ready" ? assignableRoles(new Set(permissions.value.permissions)) : [];
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    const r = await apiFetch<{ members: Member[]; invites: Invite[] }>(`/api/v1/organizations/${organizationId}/users`);
    setState(
      r.success
        ? { kind: "ready", members: r.data.members, invites: r.data.invites }
        : { kind: "error", message: r.error.message, code: r.error.code },
    );
  }, [organizationId]);

  useEffect(() => {
    if (permissions.kind === "error") setState({ kind: "error", message: permissions.message });
    else void load();
  }, [permissions, load]);

  // The purpose line names the organisation — the same read the top bar makes.
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ organizations: { id: string; name: string; isActive: boolean }[] }>("/api/v1/auth/me/organizations").then((r) => {
      if (!cancelled && r.success) setOrganizationName(r.data.organizations.find((o) => o.id === organizationId)?.name ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function changeRole(userId: string, role: string) {
    setRowError(null);
    const r = await apiFetch(`/api/v1/organizations/${organizationId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (!r.success) setRowError(r.error.message);
    await load();
  }

  async function resend(invite: Invite) {
    setResending(invite.id);
    setNotice(null);
    const r = await apiFetch<{ delivery: DeliveryStatus }>(
      `/api/v1/organizations/${organizationId}/invites/${invite.id}/resend`,
      { method: "POST" },
    );
    setResending(null);
    if (r.success) toast.success("Invitation sent again.", deliveryMessage(r.data.delivery, invite.email));
    setNotice(
      r.success
        ? `${deliveryMessage(r.data.delivery, invite.email)} The previous link no longer works.`
        : r.error.message,
    );
    await load();
  }

  if (state.kind === "loading") {
    return (
      <section aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading users…</p>
      </section>
    );
  }

  if (state.kind === "error") {
    return (
      <Notice tone="error" testId="users-error">
        <p className="font-medium">We couldn’t load users.</p>
        <p className="text-sm">
          {state.message}
          {state.code ? ` (${state.code})` : ""}
        </p>
      </Notice>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* The top bar already says "Users" (F1.6). */}
        <p data-testid="users-purpose" className="text-sm text-slate-600">
          Who can sign in to {organizationName ?? "your organisation"}, and what each role may do.
        </p>
        <Can permission="organization.users.invite">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800"
          >
            Invite user
          </button>
        </Can>
      </div>

      {rowError && (
        <Notice tone="error" testId="users-row-error">
          {rowError}
        </Notice>
      )}

      <DataTable
        testId="members"
        rows={state.members}
        rowKey={(m) => m.userId}
        noun="members"
        search={{ label: "Search members", placeholder: "Search by name, email or role", text: (m) => `${m.fullName ?? ""} ${m.email} ${m.roleName}` }}
        columns={[
          {
            key: "name",
            header: "Name",
            sortValue: (m) => m.fullName ?? m.email,
            cell: (m) => (
              <>
                <p>{m.fullName ?? m.email}</p>
                <p className="text-xs text-slate-500">{m.email}</p>
              </>
            ),
          },
          {
            key: "role",
            header: "Role",
            sortValue: (m) => m.roleName,
            cell: (m) => (
              <Can permission="organization.users.update" fallback={<RoleBadge name={m.roleName} />}>
                {/* A role you may not grant, you may not change either — the server refuses both (D-068). */}
                {(assignable as string[]).includes(m.role) ? (
                  <select
                    aria-label={`Role for ${m.email}`}
                    value={m.role}
                    onChange={(e) => changeRole(m.userId, e.target.value)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {assignable.map((r) => (
                      <option key={r} value={r}>
                        {ROLES[r].name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <RoleBadge name={m.roleName} />
                )}
              </Can>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortValue: (m) => m.status,
            cell: (m) => (
              <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[m.status] ?? ""}`}>{STATUS_LABEL[m.status] ?? m.status}</span>
            ),
          },
        ]}
      />

      {state.invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Pending invitations</h3>
          <ul data-testid="pending-invites" className="space-y-1 text-sm">
            {state.invites.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3">
                <span>{i.email}</span>
                <span className="flex items-center gap-3 text-slate-500">
                  {ROLES[i.role as RoleCode]?.name ?? i.role} · expires {new Date(i.expiresAt).toLocaleDateString("en-IN")}
                  <button
                    type="button"
                    data-testid={`resend-${i.email}`}
                    disabled={resending === i.id}
                    onClick={() => resend(i)}
                    className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {resending === i.id ? "Sending…" : "Resend"}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {notice && (
            <Notice tone="info" compact testId="invite-notice">
              {notice}
            </Notice>
          )}
        </div>
      )}

      <RoleGuide assignable={assignable} />

      {inviteOpen && organizationId && (
        <InviteModal organizationId={organizationId} roles={assignable} onClose={() => setInviteOpen(false)} onInvited={load} />
      )}
    </section>
  );
}

function RoleBadge({ name }: { name: string }) {
  return <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-800">{name}</span>;
}

/**
 * "What can each role do?" (F1.8) — read from the same matrix the server
 * enforces (`roleCapabilities` over `ROLE_PERMISSIONS`), so it can never
 * promise more than a role may do.
 */
function RoleGuide({ assignable }: { assignable: RoleCode[] }) {
  return (
    <details data-testid="role-guide" className="rounded-lg border border-slate-200 p-3 text-sm">
      <summary className="cursor-pointer font-medium text-slate-800">What can each role do?</summary>
      <ul className="mt-3 space-y-3">
        {ORGANISATION_ROLES.map((r) => (
          <li key={r} data-testid={`role-guide-${r}`}>
            <p className="font-medium">
              {ROLES[r].name}
              {!assignable.includes(r) && <span className="ml-2 text-xs font-normal text-slate-500">— you cannot grant this role</span>}
            </p>
            <p className="text-xs text-slate-600">{ROLES[r].description}</p>
            <p className="mt-0.5 text-xs text-slate-600">{roleCapabilities(r).join(" · ")}.</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function InviteModal({
  organizationId,
  roles,
  onClose,
  onInvited,
}: {
  organizationId: string;
  /** Only the roles the inviter may grant (F1.8). */
  roles: RoleCode[];
  onClose: () => void;
  onInvited: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleCode>(roles.includes("department_owner") ? "department_owner" : (roles[0] ?? "department_owner"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const r = await apiFetch<{ delivery: DeliveryStatus }>(`/api/v1/organizations/${organizationId}/users/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
    setPending(false);
    if (!r.success) {
      setError(r.error.message);
      // The invite may exist even though the email failed — refresh the pending list.
      if (r.error.code === "EMAIL_DELIVERY_FAILED") await onInvited();
      return;
    }
    setSentMessage(deliveryMessage(r.data.delivery, email));
    await onInvited();
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg">
        <h3 id="invite-title" className="text-lg font-semibold">
          Invite a user
        </h3>
        {sentMessage ? (
          <div className="space-y-3">
            <p data-testid="invite-sent" className="text-sm text-slate-700">
              {sentMessage}
            </p>
            <p className="text-xs text-slate-500">
              The link goes only to the invitee’s inbox. It works once and expires in 7 days.
            </p>
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="invite-email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="invite-role" className="block text-sm font-medium">
                Role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleCode)}
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {ROLES[r].name}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <Notice tone="error" testId="invite-error">
                {error}
              </Notice>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Inviting…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
