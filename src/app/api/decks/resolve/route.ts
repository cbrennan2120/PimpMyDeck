import { parseDecklist } from "@/lib/deck-parser";
import { applyVibeToDeck } from "@/lib/pimp-engine";
import { loadPrintCacheFromFile, resolveFromPrintCache } from "@/lib/print-cache";
import { findPrintsByName } from "@/lib/scryfall";
import type { ResolvedDeck, ResolvedDeckCard, VibeId } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { decklist?: string; vibe?: VibeId };
  const parsed = parseDecklist(body.decklist ?? "");
  const cache = loadPrintCacheFromFile(process.env.SCRYFALL_PRINT_CACHE_PATH);
  const cards: ResolvedDeckCard[] = await resolveFromPrintCache(parsed, cache, async (name) => {
    try {
      return await findPrintsByName(name);
    } catch {
      return [];
    }
  });

  const resolvedCards = body.vibe ? applyVibeToDeck(cards, body.vibe) : cards;
  const response: ResolvedDeck = {
    cards: resolvedCards,
    unresolved: resolvedCards.filter((card) => card.status === "unresolved"),
    stats: {
      totalLines: resolvedCards.length,
      totalQuantity: resolvedCards.reduce((sum, card) => sum + card.quantity, 0),
      resolved: resolvedCards.filter((card) => card.status === "resolved").length,
      upgraded: resolvedCards.filter(
        (card) =>
          card.status === "resolved" &&
          card.selectedPrint &&
          card.selectedPrint.scryfallId !== card.candidates[0]?.scryfallId,
      ).length,
      needsReview: resolvedCards.filter((card) => card.status === "unresolved" || card.reason)
        .length,
    },
    source: cache.size > 0 ? "mixed" : "scryfall-live",
  };

  return Response.json(response);
}
