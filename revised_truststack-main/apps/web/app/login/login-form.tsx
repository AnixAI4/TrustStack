"use client";

import { useActionState } from "react";
import { Notice } from "@/components/feedback/notice";
import { signIn, type SignInState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {
    error: null,
    email: "",
  });

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-indigo-600"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-2 focus:outline-indigo-600"
        />
      </div>
      {state.error && (
        <Notice tone="error" testId="login-error">
          {state.error}
        </Notice>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-700 px-4 py-2 font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {/* Q4 (D-104.4): no self-service reset yet — that is Slice 14. Say who can help. */}
      <p data-testid="login-forgot" className="text-center text-sm text-slate-600">
        Forgot your password? Ask your organisation&apos;s admin.
      </p>
    </form>
  );
}
