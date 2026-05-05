import type { CardPrint, ResolvedDeckCard } from "../types";

export function oracleCardRow(print: CardPrint) {
  return {
    oracle_id: print.oracleId,
    name: print.name,
    type_line: null,
    legalities: {},
    color_identity: "",
  };
}

export function cardPrintRow(print: CardPrint) {
  return {
    scryfall_id: print.scryfallId,
    oracle_id: print.oracleId,
    name: print.name,
    set_code: print.setCode,
    set_name: print.setName,
    set_type: print.setType ?? null,
    collector_number: print.collectorNumber,
    released_at: print.releasedAt ?? null,
    frame: print.frame,
    border_color: print.borderColor ?? null,
    finishes: print.finishes,
    frame_effects: print.frameEffects,
    promo: print.promo,
    digital: print.digital,
    oversized: print.oversized,
    lang: print.lang,
    rarity: print.rarity ?? null,
    image_uris: print.imageUris,
    prices: print.prices,
    purchase_uris: print.purchaseUris,
    scryfall_uri: print.scryfallUri,
    pimp_score: print.pimpScore,
    refreshed_at: new Date().toISOString(),
  };
}

export function deckCardRow(deckId: string, card: ResolvedDeckCard) {
  return {
    deck_id: deckId,
    oracle_id: card.oracleId ?? null,
    selected_scryfall_id: card.selectedPrint?.scryfallId ?? null,
    quantity: card.quantity,
    section: card.section,
    user_locked: card.userLocked ?? false,
  };
}

export function uniquePrintsFromDeck(cards: ResolvedDeckCard[]) {
  const byId = new Map<string, CardPrint>();
  for (const card of cards) {
    for (const print of [card.selectedPrint, ...card.candidates]) {
      if (print) byId.set(print.scryfallId, print);
    }
  }
  return [...byId.values()];
}

export function uniqueOracleRows(prints: CardPrint[]) {
  const byId = new Map<string, ReturnType<typeof oracleCardRow>>();
  for (const print of prints) {
    byId.set(print.oracleId, oracleCardRow(print));
  }
  return [...byId.values()];
}

export function duplicateDeckName(name: string) {
  const trimmed = name.trim() || "Pimped Deck";
  const match = trimmed.match(/^(.*) Copy(?: (\d+))?$/);
  if (!match) return `${trimmed} Copy`;

  const base = match[1] ?? trimmed;
  const next = Number.parseInt(match[2] ?? "1", 10) + 1;
  return `${base} Copy ${next}`;
}
