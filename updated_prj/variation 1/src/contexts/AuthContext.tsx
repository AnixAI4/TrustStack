"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type AuthResult =
  | { status: "ok" }
  | { status: "error"; message: string }
  | { status: "confirm_email"; message: string }
  | { status: "already_registered"; message: string };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = supabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return undefined;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") {
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/auth/reset-password")
        ) {
          window.location.assign("/auth/reset-password");
        }
      }

      // Only kick off protected pages. Stale/invalid refresh tokens (e.g. after
      // an account was deleted) also emit SIGNED_OUT - bouncing auth/welcome
      // flows would send users in a loop back to the plan picker.
      if (event === "SIGNED_OUT" && typeof window !== "undefined") {
        const { pathname } = window.location;
        const stayPut =
          pathname === "/welcome" ||
          pathname.startsWith("/auth") ||
          pathname === "/subscribe" ||
          pathname === "/privacy" ||
          pathname === "/terms";
        if (!stayPut) {
          window.location.replace("/welcome");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        return { status: "error", message: body.error || "Sign in failed" };
      }

      const deviceResponse = await fetch("/api/auth/session/register", {
        method: "POST",
      });
      if (!deviceResponse.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        return {
          status: "error",
          message: "Could not secure this device session. Try again.",
        };
      }

      const supabase = createClient();
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      return { status: "ok" };
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const trimmed = email.trim();

      // Prefer server register (email pre-confirmed). Avoids otp_expired from
      // mail scanners that consume Supabase confirmation links.
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, password }),
        });
        const payload = (await res.json()) as { error?: string; ok?: boolean };

        if (res.status === 409) {
          return {
            status: "already_registered",
            message:
              payload.error ||
              "This email is already registered. Try signing in instead.",
          };
        }

        if (res.ok && payload.ok) {
          return signIn(trimmed, password);
        }

        // Fall through to client signUp if service key is missing.
        if (res.status !== 503) {
          return {
            status: "error",
            message: payload.error || "Could not create account.",
          };
        }
      } catch {
        // Network blip - try client signup below.
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return {
            status: "already_registered",
            message:
              "This email is already registered. Try signing in instead.",
          };
        }
        return { status: "error", message: error.message };
      }

      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        return {
          status: "already_registered",
          message: "This email is already registered. Try signing in instead.",
        };
      }

      if (data.session) {
        return { status: "ok" };
      }

      return {
        status: "confirm_email",
        message:
          "Please check your email to confirm your account before signing in.",
      };
    },
    [signIn]
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  const requestPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) {
        return { status: "error", message: error.message };
      }

      return {
        status: "ok",
      };
    },
    []
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { status: "error", message: error.message };
      }

      return { status: "ok" };
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
    }),
    [
      user,
      session,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      updatePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
