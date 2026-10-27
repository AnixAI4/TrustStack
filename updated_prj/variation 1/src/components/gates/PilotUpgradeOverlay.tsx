"use client";

import { X, Crown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface PilotUpgradeOverlayProps {
  featureName?: string;
}

/**
 * Overlays the page to block interaction and shows a sticky popup
 * prompting Free users to upgrade to Pilot.
 */
export function PilotUpgradeOverlay({
  featureName = "this feature",
}: PilotUpgradeOverlayProps) {
  const [minimized, setMinimized] = useState(false);

  return (
    <>
      {/* Invisible overlay to block pointer events on the underlying content */}
      <div
        className="pointer-events-auto fixed inset-0 z-40 cursor-not-allowed"
        aria-hidden="true"
      />

      {/* Sticky upgrade popup */}
      <div
        className={`fixed z-50 transition-all duration-300 ${
          minimized
            ? "bottom-4 right-4"
            : "right-4 top-1/2 -translate-y-1/2 sm:right-6"
        }`}
      >
        {minimized ? (
          /* Minimized state - small button to expand */
          <button
            onClick={() => setMinimized(false)}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, var(--gold), var(--accent))",
            }}
            aria-label="Show upgrade prompt"
          >
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Upgrade</span>
          </button>
        ) : (
          /* Full popup */
          <div className="w-72 rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl sm:w-80">
            {/* Close/minimize button */}
            <button
              onClick={() => setMinimized(true)}
              className="absolute right-3 top-3 rounded-full p-1 text-text-muted transition-colors hover:bg-surface hover:text-text"
              aria-label="Minimize"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(var(--gold-rgb), 0.2), rgba(var(--accent-rgb), 0.1))",
              }}
            >
              <Crown className="h-6 w-6 text-gold" />
            </div>

            {/* Heading */}
            <h3 className="mb-2 text-lg font-semibold text-text">
              Upgrade to Pilot
            </h3>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-text-muted">
              Access to <span className="font-medium text-text">{featureName}</span>{" "}
              requires a Pilot subscription. Unlock all premium features and tools.
            </p>

            {/* CTA Button */}
            <Link
              href="/subscribe"
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 hover:shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--accent))",
              }}
            >
              <Crown className="h-4 w-4" />
              Get Pilot Access
            </Link>

            {/* Secondary info */}
            <p className="mt-3 text-center text-xs text-text-muted">
              You can view but not interact with this page
            </p>
          </div>
        )}
      </div>
    </>
  );
}
