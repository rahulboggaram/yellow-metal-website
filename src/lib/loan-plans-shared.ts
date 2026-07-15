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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInterestTier(value: unknown): value is LoanPlanInterestTier {
  if (!value || typeof value !== "object") return false;
  const tier = value as LoanPlanInterestTier;
  return (
    isFiniteNumber(tier.daysFrom) &&
    isFiniteNumber(tier.daysTo) &&
    isFiniteNumber(tier.monthlyRatePercent)
  );
}

export function isLoanPlan(value: unknown): value is LoanPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as LoanPlan;
  return (
    typeof plan.id === "string" &&
    plan.id.length > 0 &&
    plan.id.length <= 64 &&
    typeof plan.amountLabel === "string" &&
    plan.amountLabel.length > 0 &&
    plan.amountLabel.length <= 80 &&
    isFiniteNumber(plan.minAmountInr) &&
    plan.minAmountInr >= 0 &&
    plan.minAmountInr <= 1_000_000_000 &&
    (plan.maxAmountInr === null ||
      (isFiniteNumber(plan.maxAmountInr) &&
        plan.maxAmountInr >= plan.minAmountInr &&
        plan.maxAmountInr <= 1_000_000_000)) &&
    (plan.category === null ||
      (typeof plan.category === "string" && plan.category.length <= 80)) &&
    (plan.repaymentType === "monthly" || plan.repaymentType === "bullet") &&
    typeof plan.ltvLabel === "string" &&
    plan.ltvLabel.length > 0 &&
    plan.ltvLabel.length <= 40 &&
    isFiniteNumber(plan.tenureMonths) &&
    plan.tenureMonths >= 1 &&
    plan.tenureMonths <= 120 &&
    isFiniteNumber(plan.annualRatePercent) &&
    plan.annualRatePercent >= 0 &&
    plan.annualRatePercent <= 100 &&
    isFiniteNumber(plan.monthlyRatePercent) &&
    plan.monthlyRatePercent >= 0 &&
    plan.monthlyRatePercent <= 20 &&
    Array.isArray(plan.interestTiers) &&
    plan.interestTiers.length >= 1 &&
    plan.interestTiers.length <= 12 &&
    plan.interestTiers.every(
      (tier) =>
        isInterestTier(tier) &&
        tier.daysFrom >= 0 &&
        tier.daysFrom <= 3650 &&
        tier.daysTo >= tier.daysFrom &&
        tier.daysTo <= 3650 &&
        tier.monthlyRatePercent >= 0 &&
        tier.monthlyRatePercent <= 20,
    ) &&
    isFiniteNumber(plan.sortOrder) &&
    plan.sortOrder >= 0 &&
    plan.sortOrder <= 10_000 &&
    typeof plan.active === "boolean"
  );
}

export function isLoanPlanInput(value: unknown): value is LoanPlanInput {
  if (!value || typeof value !== "object") return false;
  const input = value as LoanPlanInput;
  if (input.id !== undefined) {
    if (typeof input.id !== "string" || input.id.length === 0 || input.id.length > 64) {
      return false;
    }
  }
  const rest = { ...input };
  delete rest.id;
  return isLoanPlan({ id: "draft", ...rest });
}

/** Extra message for API 400 responses; null when valid. */
export function validateLoanPlanInput(input: LoanPlanInput): string | null {
  if (!isLoanPlanInput(input)) {
    return "Invalid loan plan payload.";
  }
  return null;
}
