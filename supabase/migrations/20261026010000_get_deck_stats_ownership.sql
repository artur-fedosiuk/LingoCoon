-- P0-2: get_deck_stats ownership guard (Critical IDOR / info disclosure)
-- The function returns deck statistics without verifying caller owns the deck.
-- Fix: Add ownership check using auth.uid() against decks.user_id via cards -> decks join.

SET search_path TO public;

create or replace function public.get_deck_stats(deck_uuid uuid)
returns table(total_cards bigint, cards_to_review bigint, mastered_cards bigint)
language plpgsql
security definer
as $function$
begin
  -- Verify the caller owns the deck before returning any statistics
  if not exists (
    select 1 from public.decks
    where id = deck_uuid and user_id = auth.uid()
  ) then
    return query
    select 0::bigint as total_cards, 0::bigint as cards_to_review, 0::bigint as mastered_cards;
  end if;

  return query
  select
    count(c.id) as total_cards,
    count(case when sp.next_review_date <= now() then 1 end) as cards_to_review,
    count(case when sp.repetitions >= 5 then 1 end) as mastered_cards
  from public.cards c
  left join public.study_progress sp
    on sp.card_id = c.id and sp.user_id = auth.uid()
  where c.deck_id = deck_uuid;
end;
$function$;