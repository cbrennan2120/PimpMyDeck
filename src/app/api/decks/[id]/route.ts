import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("id,name,format,source_text,created_at")
    .eq("id", id)
    .single();

  if (deckError) return Response.json({ error: deckError.message }, { status: 404 });

  const { data: cards, error: cardsError } = await supabase
    .from("deck_cards")
    .select(
      "id,quantity,section,user_locked,oracle_id,selected_scryfall_id,card_prints!deck_cards_selected_scryfall_id_fkey(*)",
    )
    .eq("deck_id", id)
    .order("section");

  if (cardsError) return Response.json({ error: cardsError.message }, { status: 500 });
  return Response.json({ deck, cards: cards ?? [] });
}
