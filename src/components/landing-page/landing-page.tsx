import CtaSection from "./cta-section";
import FeaturesSection from "./features-section";
import Footer from "./footer";
import HeroSection from "./hero-section";
import HowItWorksSection from "./how-it-works-section";
import Navbar from "./navbar";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
