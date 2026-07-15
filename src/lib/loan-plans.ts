import "server-only";

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import {
  hasBlobStorage,
  mutatePrivateJsonBlob,
  readPrivateJsonBlob,
} from "@/lib/blob-json-store";
import { appendLoanPlanAudit } from "@/lib/loan-plans-audit";
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

const EMPTY: LoanPlan[] = [];

let localWriteChain: Promise<void> = Promise.resolve();

function parsePlans(raw: string): LoanPlan[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isLoanPlan)) {
    throw new Error("Invalid loan plans data");
  }
  return parsed;
}

function sortPlans(plans: LoanPlan[]): LoanPlan[] {
  return [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
}

function readLocalPlans(): LoanPlan[] {
  if (!existsSync(DATA_PATH)) return [];
  return parsePlans(readFileSync(DATA_PATH, "utf8"));
}

function writeLocalPlans(plans: LoanPlan[]): void {
  const dir = path.dirname(DATA_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(DATA_PATH, `${JSON.stringify(sortPlans(plans), null, 2)}\n`, "utf8");
}

async function ensureBlobSeeded(): Promise<LoanPlan[]> {
  const snapshot = await readPrivateJsonBlob(BLOB_PATHNAME, EMPTY, (raw) => {
    if (!raw.trim()) return EMPTY;
    return parsePlans(raw);
  });
  if (snapshot.etag || snapshot.data.length > 0) {
    return snapshot.data;
  }

  try {
    const local = readLocalPlans();
    if (local.length === 0) return EMPTY;
    return mutatePrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      (raw) => (raw.trim() ? parsePlans(raw) : EMPTY),
      (current) => (current.length > 0 ? current : local),
      { serialize: (plans) => JSON.stringify(sortPlans(plans), null, 2) },
    );
  } catch {
    return EMPTY;
  }
}

async function readAllPlans(): Promise<LoanPlan[]> {
  if (hasBlobStorage()) {
    return ensureBlobSeeded();
  }
  return readLocalPlans();
}

async function mutatePlans(
  mutate: (current: LoanPlan[]) => LoanPlan[],
): Promise<LoanPlan[]> {
  if (hasBlobStorage()) {
    await ensureBlobSeeded();
    return mutatePrivateJsonBlob(
      BLOB_PATHNAME,
      EMPTY,
      (raw) => (raw.trim() ? parsePlans(raw) : EMPTY),
      (current) => sortPlans(mutate(current)),
      { serialize: (plans) => JSON.stringify(plans, null, 2) },
    );
  }

  let result: LoanPlan[] = [];
  const run = localWriteChain.then(() => {
    result = sortPlans(mutate(readLocalPlans()));
    writeLocalPlans(result);
  });
  localWriteChain = run.catch(() => undefined);
  await run;
  return result;
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

  const id =
    input.id?.trim() || `plan-${slugifyId(input.amountLabel)}-${Date.now()}`;
  const plan: LoanPlan = { ...input, id };

  const plans = await mutatePlans((current) => {
    if (current.some((item) => item.id === id)) {
      throw new Error("A plan with this id already exists");
    }
    return [...current, plan];
  });

  const created = plans.find((item) => item.id === id) ?? plan;
  await appendLoanPlanAudit({
    action: "create",
    planId: created.id,
    before: null,
    after: created,
  });
  return created;
}

export async function updateLoanPlan(
  id: string,
  input: LoanPlanInput,
): Promise<LoanPlan> {
  const validationError = validateLoanPlanInput(input);
  if (validationError) throw new Error(validationError);

  const updated: LoanPlan = { ...input, id };
  let before: LoanPlan | null = null;
  const plans = await mutatePlans((current) => {
    const index = current.findIndex((plan) => plan.id === id);
    if (index === -1) {
      throw new Error("Loan plan not found");
    }
    before = current[index] ?? null;
    const next = [...current];
    next[index] = updated;
    return next;
  });

  const after = plans.find((item) => item.id === id) ?? updated;
  await appendLoanPlanAudit({
    action: "update",
    planId: id,
    before,
    after,
  });
  return after;
}

export async function deleteLoanPlan(id: string): Promise<void> {
  let before: LoanPlan | null = null;
  await mutatePlans((current) => {
    const found = current.find((plan) => plan.id === id) ?? null;
    before = found;
    const next = current.filter((plan) => plan.id !== id);
    if (next.length === current.length) {
      throw new Error("Loan plan not found");
    }
    return next;
  });
  await appendLoanPlanAudit({
    action: "delete",
    planId: id,
    before,
    after: null,
  });
}
