create extension if not exists pgcrypto;

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null default 'Untitled Deck',
  format text not null default 'commander',
  source_text jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.oracle_cards (
  oracle_id uuid primary key,
  name text not null,
  type_line text,
  legalities jsonb not null default '{}'::jsonb,
  color_identity text not null default ''
);

create table if not exists public.card_prints (
  scryfall_id uuid primary key,
  oracle_id uuid not null references public.oracle_cards(oracle_id) on delete cascade,
  name text not null,
  set_code text not null,
  set_name text not null,
  set_type text,
  collector_number text not null,
  released_at date,
  frame text not null,
  border_color text,
  finishes text[] not null default '{}',
  frame_effects text[] not null default '{}',
  promo boolean not null default false,
  digital boolean not null default false,
  oversized boolean not null default false,
  lang text not null default 'en',
  rarity text,
  image_uris jsonb not null default '{}'::jsonb,
  prices jsonb not null default '{}'::jsonb,
  purchase_uris jsonb not null default '{}'::jsonb,
  scryfall_uri text,
  pimp_score numeric not null default 0,
  refreshed_at timestamptz not null default now()
);

create table if not exists public.deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  oracle_id uuid references public.oracle_cards(oracle_id),
  selected_scryfall_id uuid references public.card_prints(scryfall_id),
  quantity int not null default 1,
  section text not null default 'Main',
  user_locked boolean not null default false
);

create table if not exists public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  scryfall_id uuid references public.card_prints(scryfall_id),
  merchant text not null,
  outbound_url text not null,
  sub_id text not null,
  clicked_at timestamptz not null default now()
);

create table if not exists public.ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'scryfall_bulk',
  status text not null,
  card_count int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists idx_deck_cards_deck on public.deck_cards(deck_id);
create index if not exists idx_card_prints_oracle on public.card_prints(oracle_id);
create index if not exists idx_card_prints_vibe on public.card_prints(oracle_id, frame, promo, digital);
create index if not exists idx_card_prints_finishes on public.card_prints using gin(finishes);
create index if not exists idx_card_prints_frame_effects on public.card_prints using gin(frame_effects);
