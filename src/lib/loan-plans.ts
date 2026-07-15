import "server-only";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";
import {
  type LoanPlan,
  type LoanPlanInput,
  isLoanPlan,
  validateLoanPlanInput,
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
  validateLoanPlanInput,
} from "./loan-plans-shared";

const DATA_PATH = path.join(process.cwd(), "data", "loan-plans.json");
const BLOB_PATHNAME = "loan-plans/plans.json";

function hasBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function parsePlans(raw: string): LoanPlan[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLoanPlan)) {
    throw new Error("Invalid loan plans data");
  }
  return parsed;
}

function readLocalPlans(): LoanPlan[] {
  if (!existsSync(DATA_PATH)) return [];
  return parsePlans(readFileSync(DATA_PATH, "utf8"));
}

function writeLocalPlans(plans: LoanPlan[]): void {
  const dir = path.dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  writeFileSync(DATA_PATH, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

async function readBlobPlans(): Promise<LoanPlan[] | null> {
  try {
    const result = await get(BLOB_PATHNAME, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }
    const raw = await new Response(result.stream).text();
    if (!raw.trim()) return null;
    return parsePlans(raw);
  } catch {
    return null;
  }
}

async function writeBlobPlans(plans: LoanPlan[]): Promise<void> {
  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  await put(BLOB_PATHNAME, JSON.stringify(sorted, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readAllPlans(): Promise<LoanPlan[]> {
  if (hasBlobStorage()) {
    const fromBlob = await readBlobPlans();
    if (fromBlob) return fromBlob;

    // Seed Blob from the checked-in defaults once.
    try {
      const local = readLocalPlans();
      if (local.length > 0) {
        await writeBlobPlans(local);
        return local;
      }
    } catch {
      /* ignore seed failures */
    }
    return [];
  }
  return readLocalPlans();
}

async function writeAllPlans(plans: LoanPlan[]): Promise<void> {
  if (hasBlobStorage()) {
    await writeBlobPlans(plans);
    return;
  }
  writeLocalPlans(plans);
}

export async function getLoanPlans(activeOnly = true): Promise<LoanPlan[]> {
  const plans = await readAllPlans();
  const filtered = activeOnly ? plans.filter((plan) => plan.active) : plans;
  return filtered.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getLoanPlanById(id: string): Promise<LoanPlan | null> {
  const plans = await readAllPlans();
  return plans.find((plan) => plan.id === id) ?? null;
}

function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function createLoanPlan(input: LoanPlanInput): Promise<LoanPlan> {
  const validationError = validateLoanPlanInput(input);
  if (validationError) throw new Error(validationError);

  const plans = await readAllPlans();
  const id =
    input.id?.trim() || `plan-${slugifyId(input.amountLabel)}-${Date.now()}`;

  if (plans.some((plan) => plan.id === id)) {
    throw new Error("A plan with this id already exists");
  }

  const plan: LoanPlan = { ...input, id };
  await writeAllPlans([...plans, plan]);
  return plan;
}

export async function updateLoanPlan(
  id: string,
  input: LoanPlanInput,
): Promise<LoanPlan> {
  const validationError = validateLoanPlanInput(input);
  if (validationError) throw new Error(validationError);

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
