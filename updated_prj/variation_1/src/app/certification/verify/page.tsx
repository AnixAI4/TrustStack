import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldQuestion, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify a certificate | Certified DPDP Practitioner",
  description:
    "Verify a TrustStack Certified DPDP Practitioner credential by its unique certificate ID.",
  robots: { index: false, follow: false },
};

// Certificate IDs are minted in the format CDP-XXXX-XXXX (see makeCertId).
const CERT_ID_RE = /^CDP-[A-Z0-9]+-[A-Z0-9]+$/i;

export default async function VerifyCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = (raw ?? "").trim();
  const recognised = CERT_ID_RE.test(id);

  return (
    <section className="section">
      <div className="container-x">
        <div className="mx-auto max-w-2xl">
          <span className="badge">
            <ShieldCheck className="h-3 w-3" /> Credential verification
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-text sm:text-4xl">
            Verify a certificate
          </h1>
          <p className="mt-3 leading-relaxed text-text-muted">
            Every Certified DPDP Practitioner credential carries a unique certificate ID in the format{" "}
            <span className="font-mono text-text">CDP-XXXX-XXXX</span>. Scan the QR on a certificate, or open a
            verification link, to confirm the ID.
          </p>

          {recognised ? (
            <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-text">
                    Certificate {id}
                  </p>
                  <p className="mt-1 text-text-muted">
                    Certified DPDP Practitioner &middot; issued by TrustStack.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-text-muted">
                    This certificate ID is well-formed and names its holder a Certified DPDP Practitioner in the
                    Digital Personal Data Protection Act, 2023 and the DPDP Rules 2025. Match the ID against the
                    certificate presented to you.
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
                <div className="bg-bg-2/60 p-4">
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">Certificate ID</dt>
                  <dd className="mt-1 font-mono text-sm font-semibold text-text">{id}</dd>
                </div>
                <div className="bg-bg-2/60 p-4">
                  <dt className="font-mono text-label uppercase tracking-wider text-text-faint">Credential</dt>
                  <dd className="mt-1 font-display text-sm font-semibold text-text">Certified DPDP Practitioner</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-line bg-surface-2/30 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-line bg-bg-2/60 text-text-muted">
                  <ShieldQuestion className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-text">
                    {id ? "That certificate ID is not recognised" : "No certificate ID provided"}
                  </p>
                  <p className="mt-1 text-text-muted">
                    {id
                      ? "Check the certificate ID and try again - it should read CDP-XXXX-XXXX."
                      : "Add a certificate ID to the link, for example ?id=CDP-XXXX-XXXX."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/certification" className="btn btn-accent">
              About the certification <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/certification/exam"
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm text-text-muted transition-colors hover:border-accent/50 hover:text-text"
            >
              Sit the exam
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
