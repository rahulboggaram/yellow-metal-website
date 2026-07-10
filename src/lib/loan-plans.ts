import "server-only";

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  readBlobJson,
  writeBlobJson,
} from "./blob-json-store";
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
const BLOB_PATHNAME = "loan-plans/plans.json";

function parseLoanPlans(raw: string): LoanPlan[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLoanPlan)) {
    throw new Error("Invalid loan plans data");
  }
  return parsed;
}

function readLocalPlans(): LoanPlan[] {
  const raw = readFileSync(DATA_PATH, "utf8");
  return parseLoanPlans(raw);
}

async function readAllPlans(): Promise<LoanPlan[]> {
  if (hasBlobStorage()) {
    const blobPlans = await readBlobJson<LoanPlan[] | null>(
      BLOB_PATHNAME,
      parseLoanPlans,
      null,
    );
    if (blobPlans) return blobPlans;
  }

  return readLocalPlans();
}

async function writeAllPlans(plans: LoanPlan[]): Promise<void> {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  if (hasBlobStorage()) {
    await writeBlobJson(BLOB_PATHNAME, sorted, true);
    return;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Persistent loan-plan storage is not configured. Connect Vercel Blob before editing plans.",
    );
  }

  writeFileSync(DATA_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

export async function getLoanPlans(activeOnly = true): Promise<LoanPlan[]> {
  const plans = await readAllPlans();
  const filtered = activeOnly ? plans.filter((plan) => plan.active) : plans;
  return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getLoanPlanById(id: string): Promise<LoanPlan | null> {
  return (await readAllPlans()).find((plan) => plan.id === id) ?? null;
}

function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createLoanPlan(input: LoanPlanInput): Promise<LoanPlan> {
  const plans = await readAllPlans();
  const id = input.id?.trim() || `plan-${slugifyId(input.amountLabel)}-${Date.now()}`;

  if (plans.some((plan) => plan.id === id)) {
    throw new Error("A plan with this id already exists");
  }

  const plan: LoanPlan = { ...input, id };
  await writeAllPlans([...plans, plan]);
  return plan;
}

export async function updateLoanPlan(id: string, input: LoanPlanInput): Promise<LoanPlan> {
  const plans = await readAllPlans();
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) {
    throw new Error("Loan plan not found");
  }

  const updated: LoanPlan = { ...input, id };
  plans[index] = updated;
  await writeAllPlans(plans);
  return updated;
}

export async function deleteLoanPlan(id: string): Promise<void> {
  const plans = await readAllPlans();
  const next = plans.filter((plan) => plan.id !== id);
  if (next.length === plans.length) {
    throw new Error("Loan plan not found");
  }
  await writeAllPlans(next);
}

export function verifyAdminSecret(headerValue: string | null): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return headerValue === secret;
}
