import { BrandMark } from "@/components/shell/brand-mark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · TrustStack DPDP Compass" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-line bg-surface p-8 shadow-card">
        <div className="space-y-3">
          <BrandMark />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">TrustStack</p>
            <h1 className="text-2xl font-semibold text-brand-navy">DPDP Compass</h1>
            <p data-testid="login-about" className="text-sm text-slate-600">
              DPDP readiness for your organisation — assessments, registers and reports.
            </p>
          </div>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  );
}
