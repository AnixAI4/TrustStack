"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg text-text">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(60% 50% at 18% 8%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 65%),
            radial-gradient(50% 45% at 88% 12%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 60%),
            radial-gradient(55% 40% at 50% 100%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 55%),
            var(--bg)
          `,
        }}
      />

      <div className="relative flex min-h-full w-full items-stretch justify-center p-4 sm:p-6 md:p-8">
        <div className="flex w-full max-w-xl flex-col rounded-2xl border border-line bg-surface-2/50 p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)] backdrop-blur-md sm:min-h-[calc(100dvh-3rem)] sm:p-8 md:min-h-[calc(100dvh-4rem)] md:p-10">
          <div className="mb-8 flex shrink-0 flex-col items-center text-center">
            <Link href="/welcome" className="mb-6">
              <Logo size={36} withWordmark />
            </Link>
            <h1 className="font-display text-2xl font-semibold text-text sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-sm text-sm text-text-muted sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-1 flex-col justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
