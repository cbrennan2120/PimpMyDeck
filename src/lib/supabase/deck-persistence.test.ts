import { describe, expect, it } from "vitest";
import { cardPrintRow, deckCardRow, oracleCardRow, uniqueOracleRows } from "./deck-persistence";
import type { CardPrint, ResolvedDeckCard } from "../types";

const samplePrint: CardPrint = {
  scryfallId: "11111111-1111-1111-1111-111111111111",
  oracleId: "22222222-2222-2222-2222-222222222222",
  name: "Sol Ring",
  setCode: "sld",
  setName: "Secret Lair Drop",
  setType: "box",
  collectorNumber: "1",
  releasedAt: "2025-01-01",
  frame: "2015",
  borderColor: "borderless",
  finishes: ["nonfoil", "foil"],
  frameEffects: ["showcase"],
  promo: true,
  digital: false,
  oversized: false,
  lang: "en",
  rarity: "rare",
  imageUris: { normal: "https://example.com/card.jpg" },
  prices: { usd: "10.00", usd_foil: "15.00" },
  purchaseUris: { tcgplayer: "https://tcgplayer.com/product/1" },
  scryfallUri: "https://scryfall.com/card/sld/1/sol-ring",
  pimpScore: 15,
};

const sampleCard: ResolvedDeckCard = {
  id: "1-sol-ring",
  quantity: 1,
  name: "Sol Ring",
  section: "Main",
  raw: "1 Sol Ring",
  oracleId: samplePrint.oracleId,
  status: "resolved",
  selectedPrint: samplePrint,
  candidates: [samplePrint],
  userLocked: true,
};

describe("deck persistence row mapping", () => {
  it("maps oracle and print rows needed before deck cards", () => {
    expect(oracleCardRow(samplePrint)).toMatchObject({
      oracle_id: samplePrint.oracleId,
      name: "Sol Ring",
    });
    expect(cardPrintRow(samplePrint)).toMatchObject({
      scryfall_id: samplePrint.scryfallId,
      oracle_id: samplePrint.oracleId,
      set_code: "sld",
      set_name: "Secret Lair Drop",
      lang: "en",
    });
  });

  it("maps deck card rows with selected print and lock state", () => {
    expect(deckCardRow("33333333-3333-3333-3333-333333333333", sampleCard)).toMatchObject({
      deck_id: "33333333-3333-3333-3333-333333333333",
      oracle_id: samplePrint.oracleId,
      selected_scryfall_id: samplePrint.scryfallId,
      quantity: 1,
      section: "Main",
      user_locked: true,
    });
  });

  it("deduplicates oracle rows before upsert", () => {
    const variant = { ...samplePrint, scryfallId: "44444444-4444-4444-4444-444444444444" };

    expect(uniqueOracleRows([samplePrint, variant])).toHaveLength(1);
  });
});
