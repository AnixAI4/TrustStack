import { fiduciaryName, isVendorLinkToken } from "@truststack/core";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { viewVendorLink } from "@/lib/intake/rpc";
import { hashLinkToken, publicHeader, sessionCookieName, sessionHashOf } from "@/lib/vendors/link";
import { VendorQuestionnaire, type LinkView } from "./vendor-questionnaire";

export const dynamic = "force-dynamic";
// The token is in the address: never indexed, never sent on as a referrer.
export const metadata = { title: "Processor questionnaire", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

/**
 * The vendor's respondent answers the organisation's processor questionnaire
 * (Slice 10, Stage 4b). Signed-out, outside the dashboard. An unknown,
 * expired, revoked, used or locked link is the same not-found page.
 */
export default async function VendorLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isVendorLinkToken(token)) notFound();
  const tokenHash = hashLinkToken(token);
  const session = sessionHashOf((await cookies()).get(sessionCookieName(tokenHash))?.value);
  const view = await viewVendorLink(tokenHash, session);
  if (view.status === "not_found") notFound();

  const initial: LinkView =
    view.status === "open"
      ? { status: "open", ...publicHeader(view), answers: view.answers, documents: view.documents, missing: view.missing }
      : { status: "unconfirmed", ...publicHeader(view) };

  return (
    <main data-public-content className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-1 border-b-2 border-brand-navy pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{view.organization.name}</p>
        <h1 data-testid="vendor-link-title" className="text-2xl font-semibold text-brand-navy">
          Processor questionnaire — {view.vendor.name}
        </h1>
      </header>
      <VendorQuestionnaire token={token} initial={initial} />
      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500">
        {fiduciaryName(view.organization.name, view.organization.legalName)} asks its processors these questions because the Digital Personal Data
        Protection Act, 2023 lets it engage a processor only under a valid contract (s.8(2)) that provides for reasonable security
        safeguards (Rule 6(1)(f)). This page is provided by TrustStack DPDP Compass on its behalf.
      </footer>
    </main>
  );
}
