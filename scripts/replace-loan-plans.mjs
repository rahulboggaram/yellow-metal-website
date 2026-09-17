#!/usr/bin/env node
/**
 * Replace published loan plans in YM Supabase with data/loan-plans.json.
 * Usage: node --env-file=.env.local scripts/replace-loan-plans.mjs
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const plans = JSON.parse(
  readFileSync(path.join(root, "data", "loan-plans.json"), "utf8"),
);

if (!Array.isArray(plans) || plans.length === 0) {
  throw new Error("data/loan-plans.json is empty");
}

const url = process.env.YM_SUPABASE_URL;
const key = process.env.YM_SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("YM_SUPABASE_URL / YM_SUPABASE_SERVICE_ROLE_KEY are not set");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function planToRow(plan) {
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

function rowToPlan(row) {
  return {
    id: String(row.id),
    amountLabel: String(row.amount_label),
    minAmountInr: Number(row.min_amount_inr),
    maxAmountInr:
      row.max_amount_inr === null || row.max_amount_inr === undefined
        ? null
        : Number(row.max_amount_inr),
    category: row.category ?? null,
    repaymentType: row.repayment_type,
    ltvLabel: String(row.ltv_label),
    tenureMonths: Number(row.tenure_months),
    annualRatePercent: Number(row.annual_rate_percent),
    monthlyRatePercent: Number(row.monthly_rate_percent),
    interestTiers: row.interest_tiers ?? [],
    sortOrder: Number(row.sort_order ?? 0),
    active: Boolean(row.active),
  };
}

function auditRow(action, planId, before, after) {
  return {
    id: randomUUID(),
    at: new Date().toISOString(),
    action,
    plan_id: planId,
    before,
    after,
  };
}

const { data: existing, error: readError } = await supabase
  .from("loan_plans")
  .select("*");
if (readError) throw readError;

const currentPlans = (existing ?? []).map(rowToPlan);
const currentById = new Map(currentPlans.map((plan) => [plan.id, plan]));
const nextIds = new Set(plans.map((plan) => plan.id));
const toDelete = currentPlans
  .filter((plan) => !nextIds.has(plan.id))
  .map((plan) => plan.id);

if (toDelete.length > 0) {
  const { error: delError } = await supabase
    .from("loan_plans")
    .delete()
    .in("id", toDelete);
  if (delError) throw delError;
}

const { error: upsertError } = await supabase
  .from("loan_plans")
  .upsert(plans.map(planToRow));
if (upsertError) throw upsertError;

const auditRows = [
  ...currentPlans
    .filter((plan) => !nextIds.has(plan.id))
    .map((plan) => auditRow("delete", plan.id, plan, null)),
  ...plans.map((plan) =>
    auditRow(
      currentById.has(plan.id) ? "update" : "create",
      plan.id,
      currentById.get(plan.id) ?? null,
      plan,
    ),
  ),
];

if (auditRows.length > 0) {
  const { error: auditError } = await supabase
    .from("loan_plan_audit")
    .insert(auditRows);
  if (auditError) throw auditError;
}

process.stdout.write(
  `Replaced loan plans: ${plans.length} published, ${toDelete.length} removed.\n`,
);
