import { isSixtyCardFormat } from "./formats";
import type { ResolvedDeckCard } from "./types";

const BASIC_LANDS = new Set(["plains", "island", "swamp", "mountain", "forest", "wastes"]);

function cardKey(name: string) {
  return name.toLowerCase().trim();
}

function isBasicLand(name: string) {
  return BASIC_LANDS.has(cardKey(name));
}

function formatName(format: string) {
  return format.charAt(0).toUpperCase() + format.slice(1);
}

export function deckLegalityWarnings(cards: ResolvedDeckCard[], format: string) {
  const warnings: string[] = [];
  const mainCards = cards.filter((card) => card.section !== "Sideboard" && card.section !== "Maybeboard");
  const mainQuantity = mainCards.reduce((sum, card) => sum + card.quantity, 0);

  if (isSixtyCardFormat(format) && mainQuantity < 60) {
    warnings.push(`${formatName(format)} decks usually need at least 60 main-deck cards.`);
  }

  if (format === "commander" && mainQuantity !== 100) {
    warnings.push("Commander decks are expected to have exactly 100 cards including commanders.");
  }

  for (const card of mainCards) {
    if (isBasicLand(card.name)) continue;

    if (format === "commander" && card.section !== "Commander" && card.quantity > 1) {
      warnings.push(`${card.name} has ${card.quantity} copies; Commander is singleton outside basic lands.`);
    }

    if (isSixtyCardFormat(format) && card.quantity > 4) {
      warnings.push(`${card.name} has ${card.quantity} copies; most 60-card formats allow 4.`);
    }
  }

  return warnings;
}
