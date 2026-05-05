alter table public.decks
  alter column user_id type uuid using user_id::uuid,
  alter column user_id drop default;

alter table public.decks
  add constraint decks_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

create index if not exists idx_decks_user on public.decks(user_id);

alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;

drop policy if exists "Users can read their decks" on public.decks;
drop policy if exists "Users can insert their decks" on public.decks;
drop policy if exists "Users can update their decks" on public.decks;
drop policy if exists "Users can delete their decks" on public.decks;

create policy "Users can read their decks"
  on public.decks for select
  using (auth.uid() = user_id);

create policy "Users can insert their decks"
  on public.decks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their decks"
  on public.decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their decks"
  on public.decks for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read cards in their decks" on public.deck_cards;
drop policy if exists "Users can insert cards in their decks" on public.deck_cards;
drop policy if exists "Users can update cards in their decks" on public.deck_cards;
drop policy if exists "Users can delete cards in their decks" on public.deck_cards;

create policy "Users can read cards in their decks"
  on public.deck_cards for select
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can insert cards in their decks"
  on public.deck_cards for insert
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can update cards in their decks"
  on public.deck_cards for update
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete cards in their decks"
  on public.deck_cards for delete
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );
