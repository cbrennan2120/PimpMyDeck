create index if not exists idx_oracle_cards_name on public.oracle_cards(name);
create index if not exists idx_card_prints_name on public.card_prints(name);
create index if not exists idx_card_prints_lang on public.card_prints(lang);
