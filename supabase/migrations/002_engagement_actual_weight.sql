-- Store the actual calculator weight and estimate, not only a coarse band.
alter table public.engagement_events
  add column if not exists weight_entered text,
  add column if not exists weight_grams double precision;
