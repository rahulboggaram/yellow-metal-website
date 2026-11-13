import { HeroSection } from "@/components/hero-section";
import { LoanLendingRateBridge } from "@/components/loan-lending-rate-bridge";
import { GoldLoanCalculator } from "@/components/gold-loan-calculator";
import { FeaturesSection } from "@/components/features-section";
import { getGoldPriceSnapshot } from "@/lib/gold-price";
import type { LoanPlan } from "@/lib/loan-plans-shared";
import { getLoanPlans } from "@/lib/loan-plans";

export default async function HomePage() {
  const [plans, price] = await Promise.all([
    getLoanPlans().catch(() => [] as LoanPlan[]),
    getGoldPriceSnapshot().catch(() => null),
  ]);

  return (
    <>
      <div className="ym-hero-lending-flow">
        <HeroSection />
        <LoanLendingRateBridge />
      </div>
      <GoldLoanCalculator initialPlans={plans} initialPrice={price} />
      <FeaturesSection />
    </>
  );
}
