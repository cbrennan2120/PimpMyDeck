import { createClient } from "@/lib/supabase/server";
import { duplicateDeckName } from "@/lib/supabase/deck-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) {
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = (await request.json()) as { name?: string; format?: string };
  const updates: { name?: string; format?: string } = {};
  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.format?.trim()) updates.format = body.format.trim();

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No deck updates provided" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("decks")
    .update(updates)
    .eq("id", id)
    .select("id,name,format,created_at")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deck: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: true });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("name,format,source_text")
    .eq("id", id)
    .single();
  if (deckError) return Response.json({ error: deckError.message }, { status: 404 });

  const { data: cards, error: cardsError } = await supabase
    .from("deck_cards")
    .select("oracle_id,selected_scryfall_id,quantity,section,user_locked")
    .eq("deck_id", id);
  if (cardsError) return Response.json({ error: cardsError.message }, { status: 500 });

  const { data: copy, error: copyError } = await supabase
    .from("decks")
    .insert({
      name: duplicateDeckName(deck.name),
      format: deck.format,
      source_text: deck.source_text,
    })
    .select("id,name,format,created_at")
    .single();
  if (copyError) return Response.json({ error: copyError.message }, { status: 500 });

  const rows = (cards ?? []).map((card) => ({ ...card, deck_id: copy.id }));
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("deck_cards").insert(rows);
    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });
  }

  return Response.json({ deck: copy });
}
