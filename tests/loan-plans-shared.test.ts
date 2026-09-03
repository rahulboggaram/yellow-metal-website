import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getMatchingLoanPlansByType,
  getMaximumCoveredLoanAmount,
  type LoanPlan,
  type LoanPlanRepaymentType,
} from "../src/lib/loan-plans-shared.ts";

function plan(
  id: string,
  repaymentType: LoanPlanRepaymentType,
  minAmountInr: number,
  maxAmountInr: number | null,
  sortOrder: number,
): LoanPlan {
  return {
    id,
    amountLabel: id,
    minAmountInr,
    maxAmountInr,
    category: null,
    repaymentType,
    ltvLabel: repaymentType === "bullet" ? "up to 68%" : "up to 75%",
    tenureMonths: 6,
    annualRatePercent: 17.04,
    monthlyRatePercent: 1.42,
    interestTiers: [{ daysFrom: 0, daysTo: 180, monthlyRatePercent: 1.42 }],
    sortOrder,
    active: true,
  };
}

test("finds the highest active loan amount covered by finite plans", () => {
  const plans = [
    plan("monthly-1m-5m", "monthly", 1_000_001, 5_000_000, 1),
    plan("bullet-1m-5m", "bullet", 1_000_001, 5_000_000, 2),
  ];

  assert.equal(getMaximumCoveredLoanAmount(plans), 5_000_000);
  assert.deepEqual(
    getMatchingLoanPlansByType(5_000_000, plans).map((matched) => matched.id),
    ["monthly-1m-5m", "bullet-1m-5m"],
  );
  assert.deepEqual(getMatchingLoanPlansByType(5_000_001, plans), []);
});

test("treats any active open-ended plan as having no cap", () => {
  const plans = [
    plan("monthly-open-ended", "monthly", 1_000_001, null, 1),
    plan("bullet-1m-5m", "bullet", 1_000_001, 5_000_000, 2),
  ];

  assert.equal(getMaximumCoveredLoanAmount(plans), null);
});
