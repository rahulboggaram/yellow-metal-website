import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { appendLoanPlanAudit } from "@/lib/loan-plans-audit";
import { assertStoreBackend, getYmSupabase } from "@/lib/ym-supabase";
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

let localWriteChain: Promise<void> = Promise.resolve();

function sortPlans(plans: LoanPlan[]): LoanPlan[] {
  return [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
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
  writeFileSync(DATA_PATH, `${JSON.stringify(sortPlans(plans), null, 2)}\n`, "utf8");
}

function rowToPlan(row: Record<string, unknown>): LoanPlan {
  return {
    id: String(row.id),
    amountLabel: String(row.amount_label),
    minAmountInr: Number(row.min_amount_inr),
    maxAmountInr:
      row.max_amount_inr === null || row.max_amount_inr === undefined
        ? null
        : Number(row.max_amount_inr),
    category: (row.category as string | null) ?? null,
    repaymentType: row.repayment_type as LoanPlan["repaymentType"],
    ltvLabel: String(row.ltv_label),
    tenureMonths: Number(row.tenure_months),
    annualRatePercent: Number(row.annual_rate_percent),
    monthlyRatePercent: Number(row.monthly_rate_percent),
    interestTiers: (row.interest_tiers as LoanPlan["interestTiers"]) ?? [],
    sortOrder: Number(row.sort_order ?? 0),
    active: Boolean(row.active),
  };
}

function planToRow(plan: LoanPlan) {
  return {
    id: plan.id,
    amount_label: plan.amountLabel,
    min_amount_inr: plan.minAmountInr,
    max_amount_inr: plan.maxAmountInr,
    category: plan.category,
    repayment_type: plan.repaymentType,
    ltv_label: plan.ltvLabel,
    tenure_months: plan.tenureMonths,
    annual_rate_percent: plan.annualRatePercent,
    monthly_rate_percent: plan.monthlyRatePercent,
    interest_tiers: plan.interestTiers,
    sort_order: plan.sortOrder,
    active: plan.active,
    updated_at: new Date().toISOString(),
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    Boolean(error) &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

async function seedSupabaseIfEmpty(): Promise<LoanPlan[]> {
  const { data, error } = await getYmSupabase().from("loan_plans").select("*");
  if (error) throw error;
  if (data && data.length > 0) {
    return sortPlans(data.map((row) => rowToPlan(row as Record<string, unknown>)));
  }
  const local = readLocalPlans();
  if (local.length === 0) return [];
  const { error: upsertError } = await getYmSupabase()
    .from("loan_plans")
    .upsert(local.map(planToRow));
  if (upsertError) throw upsertError;
  return sortPlans(local);
}

async function readAllPlans(): Promise<LoanPlan[]> {
  if (assertStoreBackend() === "supabase") {
    return seedSupabaseIfEmpty();
  }
  return readLocalPlans();
}

async function mutatePlans(
  mutate: (current: LoanPlan[]) => LoanPlan[],
): Promise<LoanPlan[]> {
  if (assertStoreBackend() === "supabase") {
    throw new Error("Supabase loan-plan mutations must be row-scoped");
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

async function createSupabaseLoanPlan(plan: LoanPlan): Promise<LoanPlan> {
  await seedSupabaseIfEmpty();

  const { data, error } = await getYmSupabase()
    .from("loan_plans")
    .insert(planToRow(plan))
    .select("*")
    .single();
  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A plan with this id already exists");
    }
    throw error;
  }
  return rowToPlan(data as Record<string, unknown>);
}

async function updateSupabaseLoanPlan(
  id: string,
  updated: LoanPlan,
): Promise<{ before: LoanPlan; after: LoanPlan }> {
  await seedSupabaseIfEmpty();

  const { data: existing, error: readError } = await getYmSupabase()
    .from("loan_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error("Loan plan not found");

  const { data, error } = await getYmSupabase()
    .from("loan_plans")
    .update(planToRow(updated))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Loan plan not found");

  return {
    before: rowToPlan(existing as Record<string, unknown>),
    after: rowToPlan(data as Record<string, unknown>),
  };
}

async function deleteSupabaseLoanPlan(id: string): Promise<LoanPlan> {
  await seedSupabaseIfEmpty();

  const { data: existing, error: readError } = await getYmSupabase()
    .from("loan_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error("Loan plan not found");

  const { data, error } = await getYmSupabase()
    .from("loan_plans")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Loan plan not found");

  return rowToPlan(existing as Record<string, unknown>);
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

  if (assertStoreBackend() === "supabase") {
    const created = await createSupabaseLoanPlan(plan);
    await appendLoanPlanAudit({
      action: "create",
      planId: created.id,
      before: null,
      after: created,
    });
    return created;
  }

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

  if (assertStoreBackend() === "supabase") {
    const { before, after } = await updateSupabaseLoanPlan(id, updated);
    await appendLoanPlanAudit({ action: "update", planId: id, before, after });
    return after;
  }

  let before: LoanPlan | null = null;
  const plans = await mutatePlans((current) => {
    const index = current.findIndex((plan) => plan.id === id);
    if (index === -1) throw new Error("Loan plan not found");
    before = current[index] ?? null;
    const next = [...current];
    next[index] = updated;
    return next;
  });

  const after = plans.find((item) => item.id === id) ?? updated;
  await appendLoanPlanAudit({ action: "update", planId: id, before, after });
  return after;
}

export async function deleteLoanPlan(id: string): Promise<void> {
  if (assertStoreBackend() === "supabase") {
    const before = await deleteSupabaseLoanPlan(id);
    await appendLoanPlanAudit({
      action: "delete",
      planId: id,
      before,
      after: null,
    });
    return;
  }

  let before: LoanPlan | null = null;
  await mutatePlans((current) => {
    before = current.find((plan) => plan.id === id) ?? null;
    const next = current.filter((plan) => plan.id !== id);
    if (next.length === current.length) throw new Error("Loan plan not found");
    return next;
  });
  await appendLoanPlanAudit({
    action: "delete",
    planId: id,
    before,
    after: null,
  });
}
