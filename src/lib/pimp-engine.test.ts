import { describe, expect, it } from "vitest";
import { applyVibeToDeck, selectBestPrint } from "./pimp-engine";
import type { CardPrint, ResolvedDeckCard } from "./types";

function print(overrides: Partial<CardPrint>): CardPrint {
  return {
    scryfallId: "base",
    oracleId: "00000000-0000-0000-0000-000000000001",
    name: "Sol Ring",
    setCode: "cmm",
    setName: "Commander Masters",
    collectorNumber: "1",
    frame: "2015",
    finishes: ["nonfoil"],
    frameEffects: [],
    promo: false,
    digital: false,
    oversized: false,
    lang: "en",
    imageUris: { normal: "https://example.com/card.jpg" },
    prices: { usd: "1.00" },
    purchaseUris: { tcgplayer: "https://tcgplayer.com/product/1" },
    scryfallUri: "https://scryfall.com/card/x/1",
    pimpScore: 1,
    ...overrides,
  };
}

describe("selectBestPrint", () => {
  it("requires a hard retro match for retro vibe", () => {
    const normal = print({ scryfallId: "normal" });
    const retro = print({
      scryfallId: "retro",
      frame: "1997",
      prices: { usd: "3.00", usd_foil: "9.00" },
      finishes: ["nonfoil", "foil"],
    });

    expect(selectBestPrint([normal, retro], "retro")?.scryfallId).toBe("retro");
  });

  it("chooses the cheaper foil for cheap-foil vibe", () => {
    const expensive = print({ scryfallId: "expensive", finishes: ["foil"], prices: { usd_foil: "40.00" } });
    const cheap = print({ scryfallId: "cheap", finishes: ["foil"], prices: { usd_foil: "4.00" } });

    expect(selectBestPrint([expensive, cheap], "cheap-foil")?.scryfallId).toBe("cheap");
  });
});

describe("applyVibeToDeck", () => {
  it("preserves user-locked choices", () => {
    const locked = print({ scryfallId: "locked" });
    const retro = print({ scryfallId: "retro", frame: "1997" });
    const card: ResolvedDeckCard = {
      id: "1-sol-ring",
      quantity: 1,
      name: "Sol Ring",
      section: "Main",
      raw: "1 Sol Ring",
      status: "resolved",
      selectedPrint: locked,
      candidates: [locked, retro],
      userLocked: true,
    };

    expect(applyVibeToDeck([card], "retro")[0].selectedPrint?.scryfallId).toBe("locked");
  });
});
