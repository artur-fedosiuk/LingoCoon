-- Strengthen study_progress RLS: require card ownership for INSERT/UPDATE
-- A user can only create/update study progress for cards in their own decks.
-- SELECT/DELETE remain guarded by user_id = auth.uid(), which is sufficient
-- because INSERT/UPDATE now enforce card ownership at write time.

set search_path to public;

-- Drop existing insufficient policies (only check user_id, not card ownership)
drop policy if exists "Users can create own study progress" on public.study_progress;
drop policy if exists "Users can update own study progress" on public.study_progress;

-- INSERT: user_id must match auth.uid() AND card_id must reference a card in a deck owned by auth.uid()
create policy "Users can create own study progress for owned cards" on public.study_progress
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.cards c
      join public.decks d on d.id = c.deck_id
      where c.id = card_id
        and d.user_id = auth.uid()
    )
  );

-- UPDATE: user_id must match auth.uid() AND card_id must reference a card in a deck owned by auth.uid()
create policy "Users can update own study progress for owned cards" on public.study_progress
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.cards c
      join public.decks d on d.id = c.deck_id
      where c.id = card_id
        and d.user_id = auth.uid()
    )
  );