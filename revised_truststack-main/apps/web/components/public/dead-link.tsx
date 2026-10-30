import { BrandMark } from "@/components/shell/brand-mark";

/**
 * The one not-found page for every dead public target (Slice 10.5 B5, F5.4):
 * an unknown, malformed or closed public address, a missing notice, and an
 * unknown, expired, revoked, used or locked vendor link. It names no
 * organisation and gives no reason, so it tells nothing apart (D-084, D-086.1)
 * — only what the visitor can do next. Next.js serves it with status 404.
 */
export function DeadLinkPage() {
  return (
    <main data-public-content className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center gap-5 px-4 py-10">
      <BrandMark />
      <div data-testid="public-not-found" className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-brand-navy">This page is not available</h1>
        <p className="text-slate-700">
          The link may have expired or already been used, or the address may not be right.
        </p>
        <p className="text-slate-700">
          If someone sent you this link, ask them for a new one. If you typed the address, check it with the organisation whose page
          you were looking for.
        </p>
      </div>
      <p className="text-xs text-slate-500">TrustStack DPDP Compass</p>
    </main>
  );
}
