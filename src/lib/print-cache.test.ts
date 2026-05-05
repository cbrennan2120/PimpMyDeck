import { describe, expect, it } from "vitest";
import { createPrintCache, resolveFromPrintCache } from "./print-cache";
import type { CardPrint } from "./types";

function print(name: string, scryfallId: string): CardPrint {
  return {
    scryfallId,
    oracleId: `00000000-0000-0000-0000-${scryfallId.padStart(12, "0").slice(0, 12)}`,
    name,
    setCode: "sld",
    setName: "Secret Lair Drop",
    collectorNumber: "1",
    frame: "2015",
    finishes: ["nonfoil", "foil"],
    frameEffects: ["showcase"],
    promo: false,
    digital: false,
    oversized: false,
    lang: "en",
    imageUris: { normal: "https://example.com/card.jpg" },
    prices: { usd: "10.00", usd_foil: "15.00" },
    purchaseUris: { tcgplayer: "https://tcgplayer.com/product/1" },
    scryfallUri: "https://scryfall.com/card/sld/1/test",
    pimpScore: 15,
  };
}

describe("print cache", () => {
  it("groups print candidates by normalized card name", () => {
    const cache = createPrintCache([print("Sol Ring", "1"), print("Sol Ring", "2")]);

    expect(cache.lookupByName("sol ring")).toHaveLength(2);
    expect(cache.lookupByName("SOL RING")).toHaveLength(2);
  });

  it("resolves deck lines from cache without live fallback calls", async () => {
    let liveCalls = 0;
    const cache = createPrintCache([print("Sol Ring", "1")]);
    const resolved = await resolveFromPrintCache(
      [{ id: "1", quantity: 1, name: "Sol Ring", section: "Main", raw: "1 Sol Ring" }],
      cache,
      async () => {
        liveCalls += 1;
        return [];
      },
    );

    expect(resolved[0]).toMatchObject({ status: "resolved", oracleId: expect.any(String) });
    expect(liveCalls).toBe(0);
  });

  it("falls back only for cache misses", async () => {
    const cache = createPrintCache([print("Sol Ring", "1")]);
    const misses: string[] = [];
    const resolved = await resolveFromPrintCache(
      [
        { id: "1", quantity: 1, name: "Sol Ring", section: "Main", raw: "1 Sol Ring" },
        { id: "2", quantity: 1, name: "Counterspell", section: "Main", raw: "1 Counterspell" },
      ],
      cache,
      async (name) => {
        misses.push(name);
        return [print(name, "3")];
      },
    );

    expect(resolved).toHaveLength(2);
    expect(misses).toEqual(["Counterspell"]);
    expect(resolved[1].status).toBe("resolved");
  });
});
