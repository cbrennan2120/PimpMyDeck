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
