export type SubscriptionTier = "free" | "pilot";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "trialing"
  | "past_due";

export interface TrustStackSubscription {
  id: string;
  user_id: string | null;
  org_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  razorpay_subscription_id: string | null;
  price_paise: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  invited_at: string;
  joined_at: string | null;
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  account_type: "individual" | "organization";
  onboarding_completed: boolean;
  created_at: string;
}

export interface DailyScanUsage {
  id: string;
  user_id: string;
  scan_date: string;
  scans_used: number;
}

export interface CanScanResult {
  can_scan: boolean;
  tier: SubscriptionTier;
  scan_type?: "pilot_daily" | "free_preview" | "prepaid";
  reason?: "daily_limit_reached" | "payment_required";
  message?: string;
  scans_remaining: number;
}

export type TrustStackFeature =
  | "templates"
  | "certifications"
  | "tools"
  | "scanner_full"
  | "trustchat"
  | "platform";

export const FEATURE_ACCESS: Record<TrustStackFeature, SubscriptionTier[]> = {
  templates: ["pilot"],
  certifications: ["pilot"],
  tools: ["pilot"],
  scanner_full: ["pilot"],
  trustchat: ["pilot"],
  platform: ["pilot"],
};

export function canAccessFeature(
  tier: SubscriptionTier,
  feature: TrustStackFeature
): boolean {
  return FEATURE_ACCESS[feature].includes(tier);
}
