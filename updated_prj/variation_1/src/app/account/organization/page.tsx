"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Users,
  UserPlus,
  ArrowLeft,
  Loader2,
  Crown,
  User,
  Trash2,
  Copy,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "dpo" | "viewer" | "board";
  email?: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
}

export default function OrganizationPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [seats, setSeats] = useState(1);
  const [inviteSecurityReady, setInviteSecurityReady] = useState(false);

  const fetchOrganization = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const supabase = createClient();

      // Get user's organization membership
      const { data: membership } = await supabase
        .from("organization_members")
        .select("org_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      // Get organization details
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.org_id)
        .single();

      if (org) {
        setOrganization(org);
        const owner = org.owner_id === user.id || membership.role === "owner";
        setIsOwner(owner);

        // Get members
        const { data: membersData } = await supabase
          .from("organization_members")
          .select("id, user_id, role")
          .eq("org_id", org.id);

        if (membersData) {
          setMembers(membersData);
        }

        if (owner) {
          const response = await fetch("/api/trustdeck/organizations/invites", {
            cache: "no-store",
          });
          if (response.ok) {
            const access = (await response.json()) as {
              seats: number;
              members: Member[];
              invites: PendingInvite[];
            };
            setSeats(access.seats);
            setMembers(access.members);
            setPendingInvites(access.invites);
            setInviteSecurityReady(true);
          } else {
            setInviteSecurityReady(false);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching organization:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      void fetchOrganization();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchOrganization]);

  async function createOrganization(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || !user) return;

    setCreating(true);
    setError(null);

    try {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const response = await fetch("/api/trustdeck/organizations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName.trim(),
          slug: `${slug}-${Date.now().toString(36)}`,
          industry: null,
          employee_count_range: null,
          revenue_range: null,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        data?: { id?: string };
      };
      if (!response.ok || !result.data?.id) {
        throw new Error(result.error || "Failed to create organization");
      }

      setShowCreateForm(false);
      setOrgName("");
      await fetchOrganization();
    } catch (err) {
      console.error("Error creating organization:", err);
      setError("Failed to create organization. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    setInviteLink(null);
    const response = await fetch("/api/trustdeck/organizations/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      invite_url?: string;
    };
    setInviting(false);
    if (!response.ok) {
      setError(
        body.error === "seat_limit_reached"
          ? "All licensed seats are already assigned or reserved."
          : body.error || "Could not create invitation."
      );
      return;
    }
    setInviteEmail("");
    setInviteLink(body.invite_url ?? null);
    await fetchOrganization();
  }

  async function revokeInvite(id: string) {
    const response = await fetch(
      `/api/trustdeck/organizations/invites?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (response.ok) await fetchOrganization();
  }

  async function removeMember(userId: string) {
    const response = await fetch(
      `/api/trustdeck/organizations/members/${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    );
    if (response.ok) await fetchOrganization();
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Please sign in.</p>
          <Link href="/auth/sign-in" className="btn btn-accent">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-1">
      <div className="container-x py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-text-muted hover:text-text text-sm mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Link>

          <h1 className="font-display text-3xl font-bold text-text mb-2 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-accent" />
            Organization
          </h1>
          <p className="text-text-muted mb-8">
            Manage your organization and team members
          </p>

          {!organization && !showCreateForm && (
            <section className="rounded-xl border border-line bg-surface-2/30 p-8 text-center">
              <Building2 className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h2 className="font-display text-xl font-semibold text-text mb-2">
                No Organization Yet
              </h2>
              <p className="text-text-muted mb-6 max-w-md mx-auto">
                Create an organization to share your Pilot subscription with
                team members. All members will have access to the same features.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn btn-accent"
              >
                <Plus className="h-4 w-4" />
                Create Organization
              </button>
            </section>
          )}

          {showCreateForm && !organization && (
            <section className="rounded-xl border border-line bg-surface-2/30 p-6">
              <h2 className="font-display text-lg font-semibold text-text mb-4">
                Create Organization
              </h2>
              <form onSubmit={(e) => void createOrganization(e)}>
                <div className="mb-4">
                  <label
                    htmlFor="orgName"
                    className="block text-sm font-medium text-text-muted mb-1"
                  >
                    Organization Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="My Company"
                    required
                    className="w-full rounded-lg border border-line bg-bg-1 px-4 py-2 text-text placeholder-text-faint focus:border-accent focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-sm mb-4">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn btn-accent"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {creating ? "Creating..." : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          )}

          {organization && (
            <>
              <section className="rounded-xl border border-line bg-surface-2/30 p-6 mb-6">
                <h2 className="font-display text-lg font-semibold text-text mb-4">
                  {organization.name}
                </h2>
                <p className="text-text-muted text-sm">
                  Organization ID: {organization.slug}
                </p>
              </section>

              <section className="rounded-xl border border-line bg-surface-2/30 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold text-text flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    Members ({members.length})
                  </h2>
                  {isOwner && (
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={!inviteSecurityReady}
                      onClick={() => setShowInviteForm((shown) => !shown)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite member
                    </button>
                  )}
                </div>

                {isOwner && inviteSecurityReady && (
                  <p className="mb-4 text-xs text-text-muted">
                    {members.length + pendingInvites.length} of {seats} seats assigned or reserved
                  </p>
                )}

                {showInviteForm && inviteSecurityReady && (
                  <form onSubmit={(e) => void inviteMember(e)} className="mb-5 grid gap-3 rounded-lg border border-line bg-bg-1/40 p-4 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="teammate@company.com"
                      className="rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text"
                    />
                    <select
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value)}
                      className="rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-text"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="dpo">DPO</option>
                      <option value="viewer">Viewer</option>
                      <option value="board">Board</option>
                    </select>
                    <button className="btn btn-accent btn-sm justify-center" disabled={inviting}>
                      {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      Send
                    </button>
                  </form>
                )}

                {inviteLink && (
                  <div className="mb-5 flex items-center gap-2 rounded-lg border border-accent/25 bg-accent/8 p-3 text-sm text-text">
                    <span className="min-w-0 flex-1 truncate">{inviteLink}</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm shrink-0"
                      title="Copy invite link"
                      onClick={() => void navigator.clipboard.writeText(inviteLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm shrink-0" title="Dismiss" onClick={() => setInviteLink(null)}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <ul className="space-y-2">
                  {members.map((member) => (
                    <li
                      key={member.id || member.user_id}
                      className="flex items-center justify-between rounded-lg bg-bg-1/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        {member.role === "owner" ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <User className="h-4 w-4 text-text-muted" />
                        )}
                        <span className="text-text">
                          {member.user_id === user.id
                            ? "You"
                            : member.email || "Member"}
                        </span>
                        <span className="text-xs text-text-muted capitalize">
                          ({member.role})
                        </span>
                      </div>
                      {isOwner && member.user_id !== user.id && (
                        <button
                          className="text-red-500 hover:text-red-400"
                          title="Remove member"
                          onClick={() => void removeMember(member.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>

                {pendingInvites.length > 0 && (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-text">Pending invitations</h3>
                    <ul className="space-y-2">
                      {pendingInvites.map((invite) => (
                        <li key={invite.id} className="flex items-center justify-between rounded-lg bg-bg-1/50 p-3 text-sm">
                          <span className="min-w-0 truncate text-text">{invite.email} <span className="capitalize text-text-muted">({invite.role})</span></span>
                          <button type="button" className="text-red-500 hover:text-red-400" title="Revoke invitation" onClick={() => void revokeInvite(invite.id)}>
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
