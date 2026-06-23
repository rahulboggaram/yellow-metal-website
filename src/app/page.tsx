import { HeroSection } from "@/components/hero-section";
import { LoanLendingRateBridge } from "@/components/loan-lending-rate-bridge";
import { GoldLoanCalculator } from "@/components/gold-loan-calculator";
import { FeaturesSection } from "@/components/features-section";

export default function HomePage() {
  return (
    <>
      <div className="ym-hero-lending-flow">
        <HeroSection />
        <LoanLendingRateBridge />
      </div>
      <GoldLoanCalculator />
      <FeaturesSection />
    </>
  );
}
