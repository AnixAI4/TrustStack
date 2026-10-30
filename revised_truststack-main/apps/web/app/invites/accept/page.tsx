import Link from "next/link";
import { Notice } from "@/components/feedback/notice";
import { BrandMark } from "@/components/shell/brand-mark";
import { lookupInvite } from "@/lib/invites/lookup";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AcceptInviteForm } from "./accept-form";

export const dynamic = "force-dynamic";
// The token is in the URL: never leak it to another origin via Referer.
export const metadata = { title: "Accept invitation · TrustStack DPDP Compass", referrer: "no-referrer" };

/**
 * Reachable signed-out on purpose (not in middleware's PROTECTED_PREFIXES):
 * a new invitee has no account yet. It offers sign-in or account creation itself.
 */
export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const invite = await lookupInvite(token);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-line bg-surface p-8 shadow-card">
        <div className="space-y-3">
          <BrandMark />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">TrustStack</p>
            <h1 className="text-2xl font-semibold text-brand-navy">Accept invitation</h1>
          </div>
        </div>

        {invite.state === "invalid" && (
          <Notice tone="error" testId="invite-state">
            This invitation is not valid or has already been used. Ask your organisation&apos;s admin to send a new
            invitation.
          </Notice>
        )}
        {invite.state === "expired" && (
          <Notice tone="warning" testId="invite-state">
            This invitation has expired. Ask your organisation&apos;s admin to send a new invitation.
          </Notice>
        )}
        {invite.state === "open" && (
          <>
            <p className="text-sm text-slate-700" data-testid="invite-summary">
              <strong>{invite.organizationName}</strong> has invited <strong>{invite.email}</strong> to join as{" "}
              <strong>{invite.roleName}</strong>.
            </p>
            <AcceptInviteForm
              token={token}
              email={invite.email}
              signedInAs={user?.email ?? null}
              loginHref={`/login?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`}
            />
          </>
        )}
        <p className="text-xs text-slate-500">
          <Link href="/login" className="underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
