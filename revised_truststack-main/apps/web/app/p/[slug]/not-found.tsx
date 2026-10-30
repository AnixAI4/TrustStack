import { DeadLinkPage } from "@/components/public/dead-link";

/** Every dead target under this address is the same page (F5.4, D-086.1); Next.js marks a 404 noindex. */
export default function NotFound() {
  return <DeadLinkPage />;
}
