import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/marketing/Hero";
import RiskQuestions from "@/components/marketing/RiskQuestions";
import Framework7D from "@/components/marketing/Framework7D";
import ServicesGrid from "@/components/marketing/ServicesGrid";
import IndustriesSection from "@/components/marketing/IndustriesSection";
import WhyAnixAI from "@/components/marketing/WhyAnixAI";
import ContactSection from "@/components/marketing/ContactSection";
import TrustChat from "@/components/chatbot/TrustChat";
import CookieConsent from "@/components/ui/CookieConsent";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <RiskQuestions />
      <Framework7D />
      <ServicesGrid />
      <IndustriesSection />
      <WhyAnixAI />
      <ContactSection />
      <Footer />

      {/* Floating widgets */}
      <TrustChat />
      <CookieConsent />
    </main>
  );
}
