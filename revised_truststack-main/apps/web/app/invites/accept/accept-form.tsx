"use client";

import { useState } from "react";
import { Notice } from "@/components/feedback/notice";
import { apiFetch } from "@/lib/client/api";

export function AcceptInviteForm({
  token,
  email,
  signedInAs,
  loginHref,
}: {
  token: string;
  email: string;
  signedInAs: string | null;
  loginHref: string;
}) {
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept(body: Record<string, string>) {
    setPending(true);
    setError(null);
    const r = await apiFetch("/api/v1/invites/accept", { method: "POST", body: JSON.stringify({ token, ...body }) });
    if (r.success) {
      window.location.assign("/dashboard");
      return;
    }
    setError(r.error.message);
    setPending(false);
  }

  const errorBox = error && (
    <Notice tone="error" testId="accept-error">
      {error}
    </Notice>
  );

  if (signedInAs) {
    const matches = signedInAs.toLowerCase() === email.toLowerCase();
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Signed in as {signedInAs}.</p>
        {!matches && (
          <Notice tone="warning">
            This invitation is for {email}. Sign out and sign in with that account to accept it.
          </Notice>
        )}
        {errorBox}
        <button
          type="button"
          disabled={pending || !matches}
          onClick={() => accept({})}
          className="w-full rounded-md bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Joining…" : "Accept and join"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void accept({ password, ...(fullName ? { fullName } : {}) });
        }}
      >
        <p className="text-sm text-slate-600">New to TrustStack? Create your account.</p>
        <div className="space-y-1">
          <label htmlFor="full-name" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="full-name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="new-password" className="block text-sm font-medium">
            Choose a password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <p className="text-xs text-slate-500">At least 12 characters.</p>
        </div>
        {errorBox}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-indigo-700 px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Creating account…" : "Create account and join"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <a href={loginHref} className="font-medium text-indigo-700 underline">
          Sign in to accept
        </a>
      </p>
    </div>
  );
}
