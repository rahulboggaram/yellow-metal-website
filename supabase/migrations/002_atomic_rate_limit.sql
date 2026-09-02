-- Consume shared rate-limit buckets atomically so parallel serverless requests
-- cannot all pass after reading the same stale count.
create or replace function public.consume_rate_limit_bucket(
  p_key text,
  p_limit integer,
  p_window_ms integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_key is null or p_key = '' or p_limit <= 0 or p_window_ms <= 0 then
    return false;
  end if;

  loop
    update public.rate_limit_buckets
    set
      count = case
        when reset_at <= v_now then 1
        else count + 1
      end,
      reset_at = case
        when reset_at <= v_now then v_now + (p_window_ms * interval '1 millisecond')
        else reset_at
      end
    where key = p_key
      and (reset_at <= v_now or count < p_limit)
    returning count, reset_at into v_count, v_reset_at;

    if found then
      return true;
    end if;

    select count, reset_at
    into v_count, v_reset_at
    from public.rate_limit_buckets
    where key = p_key;

    if found and v_reset_at > v_now and v_count >= p_limit then
      return false;
    end if;

    begin
      insert into public.rate_limit_buckets (key, count, reset_at)
      values (p_key, 1, v_now + (p_window_ms * interval '1 millisecond'));
      return true;
    exception
      when unique_violation then
        -- A concurrent request inserted/reset the row. Retry against that row.
    end;
  end loop;
end;
$$;

revoke all on function public.consume_rate_limit_bucket(text, integer, integer)
from public, anon, authenticated;
grant execute on function public.consume_rate_limit_bucket(text, integer, integer)
to service_role;
