import { Metadata } from "next";
import { WelcomeClient } from "./WelcomeClient";

export const metadata: Metadata = {
  title: "Welcome to TrustStack",
  description:
    "Choose your plan to access India's most comprehensive DPDP compliance platform.",
};

export default function WelcomePage() {
  return <WelcomeClient />;
}
