const MIN_TOKEN_SECRET_BYTES = 32

/**
 * Resolve the server-only HMAC key used by TrustDeck public links.
 * A missing or weak key disables signing instead of falling back to a known
 * development value that would make tokens forgeable.
 */
export function getTrustDeckTokenSecret(): string {
  const value =
    process.env.TRUSTDECK_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY

  if (!value || Buffer.byteLength(value, 'utf8') < MIN_TOKEN_SECRET_BYTES) {
    throw new Error(
      'TRUSTDECK_TOKEN_SECRET or Supabase service-role key must be at least 32 bytes'
    )
  }

  return value
}
