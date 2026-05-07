import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const batchSize = Number.parseInt(process.env.PRUNE_BATCH_SIZE ?? "100", 10);
const remainingCardCount = Number.parseInt(process.env.REMAINING_CARD_COUNT ?? "0", 10);

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

let deleted = 0;

for (;;) {
  const { data, error: selectError } = await supabase
    .from("card_prints")
    .select("scryfall_id")
    .neq("lang", "en")
    .limit(batchSize);

  if (selectError) throw selectError;
  if (!data || data.length === 0) break;

  const ids = data.map((row) => row.scryfall_id);
  const { error: referenceError } = await supabase
    .from("deck_cards")
    .update({ selected_scryfall_id: null })
    .in("selected_scryfall_id", ids);
  if (referenceError) throw referenceError;

  const { error: deleteError } = await supabase.from("card_prints").delete().in("scryfall_id", ids);
  if (deleteError) throw deleteError;

  deleted += ids.length;
  console.log(`Deleted ${deleted} non-English print records`);
}

const { error: runError } = await supabase.from("ingest_runs").insert({
  source: "scryfall_bulk_en_prune",
  status: "succeeded",
  card_count: Number.isFinite(remainingCardCount) ? remainingCardCount : 0,
  finished_at: new Date().toISOString(),
});

if (runError) throw runError;

console.log(
  `Supabase prune complete: deleted ${deleted}, remaining English prints ${remainingCardCount || "not counted"}`,
);
