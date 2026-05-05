import { describe, expect, it } from "vitest";

import { cardPrintFromRow, createSupabasePrintCache } from "./print-cache";

const row = {
  scryfall_id: "print-1",
  oracle_id: "oracle-1",
  name: "Sol Ring",
  set_code: "sld",
  set_name: "Secret Lair Drop",
  collector_number: "777",
  frame: "2015",
  finishes: ["foil"],
  frame_effects: ["showcase"],
  promo: true,
  digital: false,
  oversized: false,
  lang: "en",
  image_uris: { normal: "https://img.example/card.jpg" },
  prices: { usd_foil: "20.00" },
  purchase_uris: { tcgplayer: "https://tcgplayer.example/product" },
  scryfall_uri: "https://scryfall.com/card/sld/777",
  pimp_score: "20",
};

describe("Supabase print cache", () => {
  it("maps database print rows into app print objects", () => {
    expect(cardPrintFromRow(row)).toMatchObject({
      scryfallId: "print-1",
      oracleId: "oracle-1",
      setCode: "sld",
      finishes: ["foil"],
      pimpScore: 20,
    });
  });

  it("loads a name-based cache from Supabase rows", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: async (_column: string, values: string[]) => ({
            data: values.includes("Sol Ring") ? [row] : [],
            error: null,
          }),
        }),
      }),
    };

    const cache = await createSupabasePrintCache(supabase, ["Sol Ring", "Sol Ring"]);

    expect(cache.size).toBe(1);
    expect(cache.lookupByName("sol ring")[0]?.scryfallId).toBe("print-1");
  });
});
