import Navbar from "./navbar";
import HeroSection from "./hero-section";
import FeaturesSection from "./features-section";
import HowItWorksSection from "./how-it-works-section";
import CtaSection from "./cta-section";
import Footer from "./footer";

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
