export type LoanPlanInterestTier = {
  daysFrom: number;
  daysTo: number;
  monthlyRatePercent: number;
};

export type LoanPlanRepaymentType = "monthly" | "bullet";

export type LoanPlan = {
  id: string;
  amountLabel: string;
  minAmountInr: number;
  maxAmountInr: number | null;
  category: string | null;
  repaymentType: LoanPlanRepaymentType;
  ltvLabel: string;
  tenureMonths: number;
  annualRatePercent: number;
  monthlyRatePercent: number;
  interestTiers: LoanPlanInterestTier[];
  sortOrder: number;
  active: boolean;
};

export type LoanPlanInput = Omit<LoanPlan, "id"> & { id?: string };

export function matchLoanPlan(
  amountInr: number,
  plans: LoanPlan[],
): LoanPlan | null {
  return getMatchingLoanPlansByType(amountInr, plans)[0] ?? null;
}

export function getMatchingLoanPlansByType(
  amountInr: number,
  plans: LoanPlan[],
): LoanPlan[] {
  if (!Number.isFinite(amountInr) || amountInr <= 0) return [];

  const matching = plans
    .filter(
      (plan) =>
        plan.active &&
        amountInr >= plan.minAmountInr &&
        (plan.maxAmountInr === null || amountInr <= plan.maxAmountInr),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const byType = new Map<LoanPlanRepaymentType, LoanPlan>();
  for (const plan of matching) {
    if (!byType.has(plan.repaymentType)) {
      byType.set(plan.repaymentType, plan);
    }
  }

  return Array.from(byType.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function calculateMonthlyInterestInr(
  principalInr: number,
  plan: LoanPlan,
): number {
  if (!Number.isFinite(principalInr) || principalInr <= 0) return 0;
  return (principalInr * plan.monthlyRatePercent) / 100;
}

export function formatPlanRepaymentLabel(
  repaymentType: LoanPlanRepaymentType,
): string {
  return repaymentType === "bullet" ? "Bullet Plan" : "Monthly Plan";
}

export function formatPlanRate(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

export function formatTierRange(daysFrom: number, daysTo: number): string {
  if (daysFrom === 0) return `0–${daysTo} days`;
  return `${daysFrom}–${daysTo} days`;
}

function isInterestTier(value: unknown): value is LoanPlanInterestTier {
  if (!value || typeof value !== "object") return false;
  const tier = value as LoanPlanInterestTier;
  return (
    typeof tier.daysFrom === "number" &&
    typeof tier.daysTo === "number" &&
    typeof tier.monthlyRatePercent === "number"
  );
}

export function isLoanPlan(value: unknown): value is LoanPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as LoanPlan;
  return (
    typeof plan.id === "string" &&
    typeof plan.amountLabel === "string" &&
    typeof plan.minAmountInr === "number" &&
    (plan.maxAmountInr === null || typeof plan.maxAmountInr === "number") &&
    (plan.category === null || typeof plan.category === "string") &&
    (plan.repaymentType === "monthly" || plan.repaymentType === "bullet") &&
    typeof plan.ltvLabel === "string" &&
    typeof plan.tenureMonths === "number" &&
    typeof plan.annualRatePercent === "number" &&
    typeof plan.monthlyRatePercent === "number" &&
    Array.isArray(plan.interestTiers) &&
    plan.interestTiers.every(isInterestTier) &&
    typeof plan.sortOrder === "number" &&
    typeof plan.active === "boolean"
  );
}

export function isLoanPlanInput(value: unknown): value is LoanPlanInput {
  if (!value || typeof value !== "object") return false;
  const input = value as LoanPlanInput;
  const { id: _id, ...rest } = input;
  return isLoanPlan({ id: "draft", ...rest });
}
