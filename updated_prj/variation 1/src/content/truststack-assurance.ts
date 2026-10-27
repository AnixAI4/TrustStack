export const TRUSTSTACK_ASSURANCE = {
  subject: 'TrustStack release candidate',
  verifiedOn: '7 August 2026',
  engine: 'TrustStack DPDP Scanner',
  releaseStatus: 'release_verified_live_pending',
  checks: {
    productionHttpsReadiness: 100,
    documentReadiness: 100,
  },
  policies: [
    { kind: 'Privacy policy', href: '/privacy', words: 1277 },
    { kind: 'Terms and disclaimer', href: '/terms', words: 601 },
    { kind: 'Cookie policy', href: '/cookies', words: 758 },
  ],
  controls: {
    weakPolicyScore: 18,
    missingPrivacyScore: 92,
  },
} as const
