import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const inputPath = resolve(process.argv[2] ?? "data/scryfall-print-cache.json");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function oracleRow(print) {
  return {
    oracle_id: print.oracleId,
    name: print.name,
    type_line: null,
    legalities: {},
    color_identity: "",
  };
}

function printRow(print) {
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
    finishes: print.finishes ?? [],
    frame_effects: print.frameEffects ?? [],
    promo: print.promo ?? false,
    digital: print.digital ?? false,
    oversized: print.oversized ?? false,
    lang: print.lang ?? "en",
    rarity: print.rarity ?? null,
    image_uris: print.imageUris ?? {},
    prices: print.prices ?? {},
    purchase_uris: print.purchaseUris ?? {},
    scryfall_uri: print.scryfallUri ?? null,
    pimp_score: print.pimpScore ?? 0,
    refreshed_at: new Date().toISOString(),
  };
}

const prints = JSON.parse(await readFile(inputPath, "utf8"));
const oracleRowsById = new Map();
for (const print of prints) {
  oracleRowsById.set(print.oracleId, oracleRow(print));
}

const { data: ingestRun, error: runError } = await supabase
  .from("ingest_runs")
  .insert({ status: "running", card_count: 0 })
  .select("id")
  .single();
if (runError) throw runError;

try {
  for (const rows of chunk([...oracleRowsById.values()], 1000)) {
    const { error } = await supabase.from("oracle_cards").upsert(rows, { onConflict: "oracle_id" });
    if (error) throw error;
  }

  let uploaded = 0;
  for (const rows of chunk(prints.map(printRow), 500)) {
    const { error } = await supabase.from("card_prints").upsert(rows, { onConflict: "scryfall_id" });
    if (error) throw error;
    uploaded += rows.length;
    console.log(`Uploaded ${uploaded}/${prints.length} prints`);
  }

  const { error: finishError } = await supabase
    .from("ingest_runs")
    .update({ status: "succeeded", card_count: prints.length, finished_at: new Date().toISOString() })
    .eq("id", ingestRun.id);
  if (finishError) throw finishError;

  console.log(`Supabase ingest complete: ${prints.length} print records`);
} catch (error) {
  await supabase
    .from("ingest_runs")
    .update({ status: "failed", card_count: 0, finished_at: new Date().toISOString() })
    .eq("id", ingestRun.id);
  throw error;
}
