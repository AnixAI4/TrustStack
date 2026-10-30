import { Shield } from "lucide-react";

/** The TrustStack mark for signed-out pages (sign-in, invitations): the navy shield of the app's menu. */
export function BrandMark() {
  return (
    <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-white shadow-soft">
      <Shield className="h-5 w-5" />
    </span>
  );
}
