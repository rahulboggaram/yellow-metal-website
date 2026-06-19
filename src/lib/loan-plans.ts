import "server-only";

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  type LoanPlan,
  type LoanPlanInput,
  isLoanPlan,
} from "./loan-plans-shared";

export type {
  LoanPlan,
  LoanPlanInput,
  LoanPlanInterestTier,
  LoanPlanRepaymentType,
} from "./loan-plans-shared";

export {
  formatTierRange,
  isLoanPlan,
  isLoanPlanInput,
} from "./loan-plans-shared";

const DATA_PATH = path.join(process.cwd(), "data", "loan-plans.json");

function readAllPlans(): LoanPlan[] {
  const raw = readFileSync(DATA_PATH, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLoanPlan)) {
    throw new Error("Invalid loan plans data file");
  }
  return parsed;
}

function writeAllPlans(plans: LoanPlan[]): void {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  writeFileSync(DATA_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

export function getLoanPlans(activeOnly = true): LoanPlan[] {
  const plans = readAllPlans();
  const filtered = activeOnly ? plans.filter((plan) => plan.active) : plans;
  return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getLoanPlanById(id: string): LoanPlan | null {
  return readAllPlans().find((plan) => plan.id === id) ?? null;
}

function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function createLoanPlan(input: LoanPlanInput): LoanPlan {
  const plans = readAllPlans();
  const id = input.id?.trim() || `plan-${slugifyId(input.amountLabel)}-${Date.now()}`;

  if (plans.some((plan) => plan.id === id)) {
    throw new Error("A plan with this id already exists");
  }

  const plan: LoanPlan = { ...input, id };
  writeAllPlans([...plans, plan]);
  return plan;
}

export function updateLoanPlan(id: string, input: LoanPlanInput): LoanPlan {
  const plans = readAllPlans();
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) {
    throw new Error("Loan plan not found");
  }

  const updated: LoanPlan = { ...input, id };
  plans[index] = updated;
  writeAllPlans(plans);
  return updated;
}

export function deleteLoanPlan(id: string): void {
  const plans = readAllPlans();
  const next = plans.filter((plan) => plan.id !== id);
  if (next.length === plans.length) {
    throw new Error("Loan plan not found");
  }
  writeAllPlans(next);
}

export function verifyAdminSecret(headerValue: string | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return headerValue === secret;
}
