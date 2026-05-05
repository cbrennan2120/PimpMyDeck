import { describe, expect, it } from "vitest";
import { deckSummary, isChangedFromDefault, marketPrice } from "./deck-summary";
import type { CardPrint, ResolvedDeckCard } from "./types";

function print(id: string, usd?: string | null, usdFoil?: string | null): CardPrint {
  return {
    scryfallId: id,
    oracleId: "00000000-0000-0000-0000-000000000001",
    name: "Sol Ring",
    setCode: "sld",
    setName: "Secret Lair Drop",
    collectorNumber: "1",
    frame: "2015",
    finishes: ["nonfoil", "foil"],
    frameEffects: [],
    promo: false,
    digital: false,
    oversized: false,
    lang: "en",
    imageUris: {},
    prices: { usd, usd_foil: usdFoil },
    purchaseUris: {},
    scryfallUri: "https://scryfall.com/card/sld/1/sol-ring",
    pimpScore: 0,
  };
}

function card(quantity: number, selectedPrint: CardPrint, candidates: CardPrint[]): ResolvedDeckCard {
  return {
    id: selectedPrint.scryfallId,
    quantity,
    name: selectedPrint.name,
    section: "Main",
    raw: `${quantity} ${selectedPrint.name}`,
    status: "resolved",
    selectedPrint,
    candidates,
  };
}

describe("deck summary", () => {
  it("uses foil price first when present", () => {
    expect(marketPrice(print("a", "4.00", "9.50"))).toBe(9.5);
    expect(marketPrice(print("b", "4.00", null))).toBe(4);
  });

  it("detects selected prints that differ from the first candidate", () => {
    const defaultPrint = print("default", "1.00");
    const upgradedPrint = print("upgraded", "5.00");

    expect(isChangedFromDefault(card(1, upgradedPrint, [defaultPrint, upgradedPrint]))).toBe(true);
    expect(isChangedFromDefault(card(1, defaultPrint, [defaultPrint, upgradedPrint]))).toBe(false);
  });

  it("calculates quantity-adjusted totals", () => {
    const defaultPrint = print("default", "1.00");
    const upgradedPrint = print("upgraded", "5.00");
    const summary = deckSummary([card(2, upgradedPrint, [defaultPrint, upgradedPrint])]);

    expect(summary.selectedTotal).toBe(10);
    expect(summary.defaultTotal).toBe(2);
    expect(summary.delta).toBe(8);
    expect(summary.changedCards).toBe(1);
  });
});
