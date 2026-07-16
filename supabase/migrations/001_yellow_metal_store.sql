-- Yellow Metal official store (CISO: RLS on, no anon policies = deny by default)
-- service_role bypasses RLS for server-only access.

create extension if not exists pgcrypto;

-- Website analytics (90-day retention enforced in app + optional cron)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null,
  path text not null,
  session_id text not null,
  referrer text,
  device_type text,
  browser text,
  browser_version text,
  os text,
  os_version text,
  device_vendor text,
  device_model text,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_timestamp_idx on public.analytics_events (timestamp desc);
create index if not exists analytics_events_session_idx on public.analytics_events (session_id);

-- Engagement telemetry
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('lending_rate_stop', 'calculator_entry')),
  timestamp timestamptz not null,
  session_id text not null,
  path text not null,
  duration_ms integer,
  weight_bucket text,
  weight_entered text,
  weight_grams double precision,
  karat text,
  loan_amount_inr double precision,
  country text,
  region text,
  city text,
  created_at timestamptz not null default now()
);
create index if not exists engagement_events_timestamp_idx on public.engagement_events (timestamp desc);
create index if not exists engagement_events_type_idx on public.engagement_events (type);

-- Published loan plans
create table if not exists public.loan_plans (
  id text primary key,
  amount_label text not null,
  min_amount_inr double precision not null,
  max_amount_inr double precision,
  category text,
  repayment_type text not null check (repayment_type in ('monthly', 'bullet')),
  ltv_label text not null,
  tenure_months integer not null,
  annual_rate_percent double precision not null,
  monthly_rate_percent double precision not null,
  interest_tiers jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Append-only loan plan change log
create table if not exists public.loan_plan_audit (
  id text primary key,
  at timestamptz not null,
  action text not null check (action in ('create', 'update', 'delete')),
  plan_id text not null,
  before jsonb,
  after jsonb
);
create index if not exists loan_plan_audit_at_idx on public.loan_plan_audit (at desc);

-- Revocable admin sessions
create table if not exists public.admin_sessions (
  jti text primary key,
  exp timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists admin_sessions_exp_idx on public.admin_sessions (exp);

-- Shared rate-limit buckets
create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

-- Lock down: enable RLS, grant only to service_role (no anon policies)
alter table public.analytics_events enable row level security;
alter table public.engagement_events enable row level security;
alter table public.loan_plans enable row level security;
alter table public.loan_plan_audit enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.rate_limit_buckets enable row level security;

revoke all on table public.analytics_events from anon, authenticated;
revoke all on table public.engagement_events from anon, authenticated;
revoke all on table public.loan_plans from anon, authenticated;
revoke all on table public.loan_plan_audit from anon, authenticated;
revoke all on table public.admin_sessions from anon, authenticated;
revoke all on table public.rate_limit_buckets from anon, authenticated;

grant all on table public.analytics_events to service_role;
grant all on table public.engagement_events to service_role;
grant all on table public.loan_plans to service_role;
grant all on table public.loan_plan_audit to service_role;
grant all on table public.admin_sessions to service_role;
grant all on table public.rate_limit_buckets to service_role;
