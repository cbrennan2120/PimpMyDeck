alter table public.oracle_cards enable row level security;
alter table public.card_prints enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.ingest_runs enable row level security;

drop policy if exists "Anyone can read oracle cards" on public.oracle_cards;
drop policy if exists "Anyone can read card prints" on public.card_prints;
drop policy if exists "Anyone can read ingest status" on public.ingest_runs;

create policy "Anyone can read oracle cards"
  on public.oracle_cards for select
  using (true);

create policy "Anyone can read card prints"
  on public.card_prints for select
  using (true);

create policy "Anyone can read ingest status"
  on public.ingest_runs for select
  using (true);

drop policy if exists "No public affiliate click access" on public.affiliate_clicks;

create policy "No public affiliate click access"
  on public.affiliate_clicks for select
  using (false);
