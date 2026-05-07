import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/stream-array.js";

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

async function uploadBatch(printBatch) {
  if (printBatch.length === 0) return;

  const oracleRowsById = new Map();
  for (const print of printBatch) {
    oracleRowsById.set(print.oracleId, oracleRow(print));
  }

  for (const rows of chunk([...oracleRowsById.values()], 1000)) {
    const { error } = await supabase.from("oracle_cards").upsert(rows, { onConflict: "oracle_id" });
    if (error) throw error;
  }

  for (const rows of chunk(printBatch.map(printRow), 500)) {
    const { error } = await supabase.from("card_prints").upsert(rows, { onConflict: "scryfall_id" });
    if (error) throw error;
  }
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

const { data: ingestRun, error: runError } = await supabase
  .from("ingest_runs")
  .insert({ status: "running", card_count: 0 })
  .select("id")
  .single();
if (runError) throw runError;

try {
  let uploaded = 0;
  let printBatch = [];

  const inputPipeline = chain([
    createReadStream(inputPath),
    parser(),
    streamArray(),
  ]);

  for await (const { value } of inputPipeline) {
    printBatch.push(value);
    if (printBatch.length < 500) continue;

    await uploadBatch(printBatch);
    uploaded += printBatch.length;
    console.log(`Uploaded ${uploaded} prints`);
    printBatch = [];
  }

  if (printBatch.length > 0) {
    await uploadBatch(printBatch);
    uploaded += printBatch.length;
    console.log(`Uploaded ${uploaded} prints`);
  }

  const { error: finishError } = await supabase
    .from("ingest_runs")
    .update({ status: "succeeded", card_count: uploaded, finished_at: new Date().toISOString() })
    .eq("id", ingestRun.id);
  if (finishError) throw finishError;

  console.log(`Supabase ingest complete: ${uploaded} print records`);
} catch (error) {
  await supabase
    .from("ingest_runs")
    .update({ status: "failed", card_count: 0, finished_at: new Date().toISOString() })
    .eq("id", ingestRun.id);
  throw error;
}
