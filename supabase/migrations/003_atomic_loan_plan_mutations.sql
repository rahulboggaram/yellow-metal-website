-- Keep public loan-plan mutations and their append-only audit rows atomic.
-- Each RPC runs inside one PostgreSQL transaction, so an audit insert failure
-- rolls back the live rate change instead of publishing unaudited rates.

create or replace function public.loan_plan_to_app_json(p_plan public.loan_plans)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', p_plan.id,
    'amountLabel', p_plan.amount_label,
    'minAmountInr', p_plan.min_amount_inr,
    'maxAmountInr', p_plan.max_amount_inr,
    'category', p_plan.category,
    'repaymentType', p_plan.repayment_type,
    'ltvLabel', p_plan.ltv_label,
    'tenureMonths', p_plan.tenure_months,
    'annualRatePercent', p_plan.annual_rate_percent,
    'monthlyRatePercent', p_plan.monthly_rate_percent,
    'interestTiers', coalesce(p_plan.interest_tiers, '[]'::jsonb),
    'sortOrder', p_plan.sort_order,
    'active', p_plan.active
  );
$$;

create or replace function public.create_loan_plan_with_audit(p_plan jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_after_row public.loan_plans%rowtype;
  v_after jsonb;
begin
  insert into public.loan_plans (
    id,
    amount_label,
    min_amount_inr,
    max_amount_inr,
    category,
    repayment_type,
    ltv_label,
    tenure_months,
    annual_rate_percent,
    monthly_rate_percent,
    interest_tiers,
    sort_order,
    active,
    updated_at
  )
  values (
    p_plan ->> 'id',
    p_plan ->> 'amountLabel',
    (p_plan ->> 'minAmountInr')::double precision,
    nullif(p_plan ->> 'maxAmountInr', '')::double precision,
    p_plan ->> 'category',
    p_plan ->> 'repaymentType',
    p_plan ->> 'ltvLabel',
    (p_plan ->> 'tenureMonths')::integer,
    (p_plan ->> 'annualRatePercent')::double precision,
    (p_plan ->> 'monthlyRatePercent')::double precision,
    coalesce(p_plan -> 'interestTiers', '[]'::jsonb),
    (p_plan ->> 'sortOrder')::integer,
    (p_plan ->> 'active')::boolean,
    now()
  )
  returning * into v_after_row;

  v_after := public.loan_plan_to_app_json(v_after_row);

  insert into public.loan_plan_audit (
    id,
    at,
    action,
    plan_id,
    before,
    after
  )
  values (
    gen_random_uuid()::text,
    now(),
    'create',
    v_after_row.id,
    null,
    v_after
  );

  return v_after;
end;
$$;

create or replace function public.update_loan_plan_with_audit(
  p_id text,
  p_plan jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before_row public.loan_plans%rowtype;
  v_after_row public.loan_plans%rowtype;
  v_before jsonb;
  v_after jsonb;
begin
  select *
  into v_before_row
  from public.loan_plans
  where id = p_id
  for update;

  if not found then
    raise exception 'Loan plan not found' using errcode = 'P0002';
  end if;

  update public.loan_plans
  set
    amount_label = p_plan ->> 'amountLabel',
    min_amount_inr = (p_plan ->> 'minAmountInr')::double precision,
    max_amount_inr = nullif(p_plan ->> 'maxAmountInr', '')::double precision,
    category = p_plan ->> 'category',
    repayment_type = p_plan ->> 'repaymentType',
    ltv_label = p_plan ->> 'ltvLabel',
    tenure_months = (p_plan ->> 'tenureMonths')::integer,
    annual_rate_percent = (p_plan ->> 'annualRatePercent')::double precision,
    monthly_rate_percent = (p_plan ->> 'monthlyRatePercent')::double precision,
    interest_tiers = coalesce(p_plan -> 'interestTiers', '[]'::jsonb),
    sort_order = (p_plan ->> 'sortOrder')::integer,
    active = (p_plan ->> 'active')::boolean,
    updated_at = now()
  where id = p_id
  returning * into v_after_row;

  v_before := public.loan_plan_to_app_json(v_before_row);
  v_after := public.loan_plan_to_app_json(v_after_row);

  insert into public.loan_plan_audit (
    id,
    at,
    action,
    plan_id,
    before,
    after
  )
  values (
    gen_random_uuid()::text,
    now(),
    'update',
    p_id,
    v_before,
    v_after
  );

  return v_after;
end;
$$;

create or replace function public.delete_loan_plan_with_audit(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before_row public.loan_plans%rowtype;
  v_before jsonb;
begin
  select *
  into v_before_row
  from public.loan_plans
  where id = p_id
  for update;

  if not found then
    raise exception 'Loan plan not found' using errcode = 'P0002';
  end if;

  v_before := public.loan_plan_to_app_json(v_before_row);

  delete from public.loan_plans
  where id = p_id;

  insert into public.loan_plan_audit (
    id,
    at,
    action,
    plan_id,
    before,
    after
  )
  values (
    gen_random_uuid()::text,
    now(),
    'delete',
    p_id,
    v_before,
    null
  );
end;
$$;

revoke all on function public.loan_plan_to_app_json(public.loan_plans)
from public, anon, authenticated;
revoke all on function public.create_loan_plan_with_audit(jsonb)
from public, anon, authenticated;
revoke all on function public.update_loan_plan_with_audit(text, jsonb)
from public, anon, authenticated;
revoke all on function public.delete_loan_plan_with_audit(text)
from public, anon, authenticated;

grant execute on function public.loan_plan_to_app_json(public.loan_plans)
to service_role;
grant execute on function public.create_loan_plan_with_audit(jsonb)
to service_role;
grant execute on function public.update_loan_plan_with_audit(text, jsonb)
to service_role;
grant execute on function public.delete_loan_plan_with_audit(text)
to service_role;
