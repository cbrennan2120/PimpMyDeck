import { describe, expect, it } from "vitest";

import { changedCards, reviewCards, sectionNames, toCsvRows } from "./deck-actions";
import type { ResolvedDeckCard } from "./types";

function card(overrides: Partial<ResolvedDeckCard>): ResolvedDeckCard {
  return {
    id: "1-sol-ring",
    quantity: 1,
    name: "Sol Ring",
    section: "Main",
    raw: "1 Sol Ring",
    status: "resolved",
    candidates: [
      {
        scryfallId: "default",
        oracleId: "oracle",
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
        imageUris: {},
        prices: {},
        purchaseUris: {},
        scryfallUri: "https://scryfall.com/card/default",
        pimpScore: 0,
      },
    ],
    ...overrides,
  };
}

describe("deck action helpers", () => {
  it("returns only cards changed from their default candidate", () => {
    const changed = card({
      selectedPrint: { ...card({}).candidates[0], scryfallId: "premium", setCode: "sld" },
    });

    expect(changedCards([card({ selectedPrint: card({}).candidates[0] }), changed])).toEqual([
      changed,
    ]);
  });

  it("returns unresolved and reasoned cards for review", () => {
    const unresolved = card({ status: "unresolved", candidates: [] });
    const reasoned = card({ reason: "No Retro match found" });

    expect(reviewCards([card({}), unresolved, reasoned])).toEqual([unresolved, reasoned]);
  });

  it("lists sections in deck order without duplicates", () => {
    expect(sectionNames([card({ section: "Commander" }), card({ section: "Main" }), card({ section: "Main" })])).toEqual([
      "Commander",
      "Main",
    ]);
  });

  it("exports CSV rows with set and collector data", () => {
    const selected = { ...card({}).candidates[0], setCode: "sld", collectorNumber: "777" };

    expect(toCsvRows([card({ quantity: 2, selectedPrint: selected })])).toBe(
      "Quantity,Name,Section,Set,Collector Number,Scryfall ID,TCGplayer URL\r\n" +
        "2,Sol Ring,Main,SLD,777,default,",
    );
  });
});
