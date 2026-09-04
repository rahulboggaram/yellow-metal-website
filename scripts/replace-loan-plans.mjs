#!/usr/bin/env node
/**
 * Replace published loan plans in YM Supabase with data/loan-plans.json.
 * Usage: node --env-file=.env.local scripts/replace-loan-plans.mjs
 */
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

const { data: existing, error: readError } = await supabase
  .from("loan_plans")
  .select("id");
if (readError) throw readError;

const nextIds = new Set(plans.map((plan) => plan.id));
const toDelete = (existing ?? [])
  .map((row) => String(row.id))
  .filter((id) => !nextIds.has(id));

const { error: upsertError } = await supabase
  .from("loan_plans")
  .upsert(plans.map(planToRow));
if (upsertError) throw upsertError;

if (toDelete.length > 0) {
  const { error: delError } = await supabase
    .from("loan_plans")
    .delete()
    .in("id", toDelete);
  if (delError) throw delError;
}

process.stdout.write(
  `Replaced loan plans: ${plans.length} published, ${toDelete.length} removed.\n`,
);
