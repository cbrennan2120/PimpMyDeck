import { createPrintCache } from "../print-cache";
import type { CardPrint } from "../types";

type DbPrint = {
  scryfall_id: string;
  oracle_id: string;
  name: string;
  set_code: string;
  set_name: string;
  set_type?: string | null;
  collector_number: string;
  released_at?: string | null;
  frame: string;
  border_color?: string | null;
  finishes?: string[] | null;
  frame_effects?: string[] | null;
  promo?: boolean | null;
  digital?: boolean | null;
  oversized?: boolean | null;
  lang?: string | null;
  rarity?: string | null;
  image_uris?: CardPrint["imageUris"] | null;
  prices?: CardPrint["prices"] | null;
  purchase_uris?: CardPrint["purchaseUris"] | null;
  scryfall_uri?: string | null;
  pimp_score?: number | string | null;
};

export function cardPrintFromRow(row: DbPrint): CardPrint {
  return {
    scryfallId: row.scryfall_id,
    oracleId: row.oracle_id,
    name: row.name,
    setCode: row.set_code,
    setName: row.set_name,
    setType: row.set_type ?? undefined,
    collectorNumber: row.collector_number,
    releasedAt: row.released_at ?? undefined,
    frame: row.frame,
    borderColor: row.border_color ?? undefined,
    finishes: row.finishes ?? [],
    frameEffects: row.frame_effects ?? [],
    promo: row.promo ?? false,
    digital: row.digital ?? false,
    oversized: row.oversized ?? false,
    lang: row.lang ?? "en",
    rarity: row.rarity ?? undefined,
    imageUris: row.image_uris ?? {},
    prices: row.prices ?? {},
    purchaseUris: row.purchase_uris ?? {},
    scryfallUri: row.scryfall_uri ?? "",
    pimpScore: Number(row.pimp_score ?? 0),
  };
}

export async function createSupabasePrintCache(
  supabase: { from(table: string): unknown },
  names: string[],
) {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (uniqueNames.length === 0) return createPrintCache([]);

  const query = supabase.from("card_prints") as {
    select(columns: string): {
      in(column: string, values: string[]): PromiseLike<{ data: DbPrint[] | null; error: { message: string } | null }>;
    };
  };
  const { data, error } = await query.select("*").in("name", uniqueNames);

  if (error) throw new Error(error.message);
  return createPrintCache((data ?? []).map(cardPrintFromRow));
}
