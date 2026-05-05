# Pimp My Deck

A visual-first Magic: The Gathering deck optimization tool for swapping a decklist into premium printings: retro frames, showcase treatments, foils, Secret Lairs, and high-flex versions.

## MVP Features

- Paste or load a decklist in common MTG text formats.
- Resolve card names through the Scryfall API with a 110ms request queue.
- Browse print candidates for each card.
- Apply global vibe filters: Retro, Showcase, Secret Lair, Foil, Cheapest Foil, and Max Flex.
- Lock user-selected printings so later vibe changes do not overwrite them.
- Copy set-code export lines for upgraded decklists.
- Route TCGplayer purchase links through an affiliate-ready redirect endpoint.
- Includes Supabase-compatible schema migration for the planned bulk-data cache.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm test
npm run lint
npm run build
```

## Manual Production Deploy Checklist

Deploys are intentionally manual to control Netlify usage.

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Commit and push to GitHub.
5. Trigger a Netlify deploy only after explicit approval.
6. Verify the live site and `/api/decks` after deploy.

## Affiliate Configuration

Copy `.env.example` to `.env.local` and fill in the Impact-provided TCGplayer values:

```bash
TCGPLAYER_IMPACT_BASE_URL=
TCGPLAYER_ACCOUNT_ID=
SUBID_PREFIX=pmd
```

Without those values, the redirect route preserves the TCGplayer destination and appends local UTM parameters marked `affiliate-pending`.

## Data Architecture

The current MVP works without Supabase credentials by resolving through Scryfall live search and in-memory request caching. The production path is represented in `supabase/migrations/0001_initial_schema.sql`: ingest Scryfall bulk data into `oracle_cards` and `card_prints`, then resolve uploaded decks from indexed local data instead of issuing per-card live API calls.

To generate a local print cache without Supabase:

```bash
npm run ingest:scryfall -- data/scryfall-print-cache.json
```

Then set `SCRYFALL_PRINT_CACHE_PATH=data/scryfall-print-cache.json` in `.env.local`. The resolver will use the local cache first and call live Scryfall only for cache misses.

To import that generated cache into Supabase:

```bash
npm run ingest:scryfall -- data/scryfall-print-cache.json
npm run ingest:supabase -- data/scryfall-print-cache.json
```

The Supabase ingest uses `NEXT_PUBLIC_SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY` when available, otherwise `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The app resolver checks Supabase `card_prints` first, then local file cache, then live Scryfall fallback.
