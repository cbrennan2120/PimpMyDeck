import { deckCardRow, cardPrintRow, uniqueOracleRows, uniquePrintsFromDeck } from "@/lib/supabase/deck-persistence";
import { createClient } from "@/lib/supabase/server";
import type { ResolvedDeckCard } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveDeckBody = {
  name?: string;
  format?: string;
  sourceText?: string;
  cards?: ResolvedDeckCard[];
};

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const body = (await request.json()) as SaveDeckBody;
  const cards = body.cards ?? [];
  const prints = uniquePrintsFromDeck(cards);
  const supabase = await createClient();

  if (prints.length > 0) {
    const { error: oracleError } = await supabase
      .from("oracle_cards")
      .upsert(uniqueOracleRows(prints), { onConflict: "oracle_id" });
    if (oracleError) return Response.json({ error: oracleError.message }, { status: 500 });

    const { error: printError } = await supabase
      .from("card_prints")
      .upsert(prints.map(cardPrintRow), { onConflict: "scryfall_id" });
    if (printError) return Response.json({ error: printError.message }, { status: 500 });
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({
      name: body.name?.trim() || "Pimped Deck",
      format: body.format ?? "commander",
      source_text: { text: body.sourceText ?? "" },
    })
    .select("id,name,format,created_at")
    .single();

  if (deckError) return Response.json({ error: deckError.message }, { status: 500 });

  const deckRows = cards.map((card) => deckCardRow(deck.id, card));
  if (deckRows.length > 0) {
    const { error: cardsError } = await supabase.from("deck_cards").insert(deckRows);
    if (cardsError) return Response.json({ error: cardsError.message }, { status: 500 });
  }

  return Response.json({ deck });
}

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ decks: [], configured: false });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decks")
    .select("id,name,format,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ decks: data ?? [], configured: true });
}
