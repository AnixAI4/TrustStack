"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { TrustStackFeature } from "@/lib/supabase/types";
import { featureForHref } from "@/lib/paid-routes";
import { cn } from "@/lib/cn";

type LinkProps = ComponentProps<typeof Link>;

type PilotLockLinkProps = Omit<LinkProps, "href"> & {
  href: string;
  feature?: TrustStackFeature;
  children: ReactNode;
  /** Extra classes applied only when locked */
  lockedClassName?: string;
  showLock?: boolean;
};

/**
 * Renders a link with a lock icon for Free users.
 * TrustDeck links go straight to Pilot checkout (then return via ?next=).
 * Other paid features still open the page (overlay blocks interaction there).
 */
export function PilotLockLink({
  href,
  feature,
  children,
  className,
  lockedClassName,
  showLock = true,
  ...rest
}: PilotLockLinkProps) {
  const { canAccess } = useSubscription();
  const required = feature ?? featureForHref(href);
  // tier defaults to free until loaded - show lock for paid links until Pilot is confirmed
  const locked = Boolean(required) && !canAccess(required!);

  if (!required || !locked) {
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }

  const lockedHref =
    required === "platform" || href === "/trustdeck" || href.startsWith("/trustdeck/")
      ? `/subscribe?next=${encodeURIComponent(href)}`
      : href;

  return (
    <Link
      href={lockedHref}
      className={cn(className, lockedClassName)}
      aria-label="Pilot plan required"
      title="Pilot plan required - upgrade to continue"
      {...rest}
    >
      {children}
      {showLock ? (
        <Crown className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
      ) : null}
    </Link>
  );
}
