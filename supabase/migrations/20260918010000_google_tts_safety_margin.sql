-- Keep 1,000 characters below the published Chirp monthly allowance.
-- Preserve usage, expiry and activation state. No new allowance is issued.
-- Rollback: disable synthesis; do not erase or refund usage counters.
begin;
alter table public.google_tts_budget_periods
  drop constraint google_chirp_budget_maximum;
update public.google_tts_budget_periods
  set character_limit = least(character_limit, 999000);
alter table public.google_tts_budget_periods
  alter column character_limit set default 999000;
alter table public.google_tts_budget_periods
  add constraint google_chirp_budget_maximum
  check (character_limit between 0 and 999000);
commit;
