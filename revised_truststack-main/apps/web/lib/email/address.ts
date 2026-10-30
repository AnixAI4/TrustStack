/**
 * Domains reserved for documentation and testing (RFC 2606, RFC 6761). Mail to
 * them can never be delivered, so we never hand it to the provider: every send
 * would bounce and damage our sending reputation. Seed users and e2e invitees
 * live on example.com precisely so that automated runs — including against the
 * live site — send nothing.
 */
const RESERVED_DOMAINS = ["example.com", "example.net", "example.org"];
const RESERVED_TLDS = ["test", "example", "invalid", "localhost"];

export function isReservedTestAddress(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");
  const domain = parts.length === 2 ? parts[1]! : "";
  if (!domain) return true; // not a deliverable address at all
  if (RESERVED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`))) return true;
  const tld = domain.split(".").pop() ?? "";
  return RESERVED_TLDS.includes(tld);
}
