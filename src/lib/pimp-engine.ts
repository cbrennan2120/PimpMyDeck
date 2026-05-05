import type { CardPrint, ResolvedDeckCard, VibeDefinition, VibeId } from "./types";

export const VIBES: VibeDefinition[] = [
  { id: "retro", label: "Retro Frame", shortLabel: "Retro", description: "Prioritize old-border and retro-frame treatments." },
  { id: "showcase", label: "Showcase / Borderless", shortLabel: "Showcase", description: "Find borderless, showcase, extended-art, and special frames." },
  { id: "secret-lair", label: "Secret Lair", shortLabel: "Lair", description: "Prefer Secret Lair drops and premium promos." },
  { id: "foil", label: "Foil First", shortLabel: "Foil", description: "Pick the strongest foil-capable printing." },
  { id: "cheap-foil", label: "Cheapest Foil", shortLabel: "Budget", description: "Prefer foil availability while minimizing foil price." },
  { id: "max-flex", label: "Max Flex", shortLabel: "Flex", description: "Bias toward rare, expensive, visually loud printings." },
];

const SPECIAL_FRAME_EFFECTS = new Set([
  "showcase",
  "extendedart",
  "borderless",
  "inverted",
  "etched",
  "legendary",
  "nyxtouched",
]);

function priceNumber(value?: string | null) {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function baseScore(print: CardPrint) {
  let score = 0;
  if (print.imageUris.normal || print.imageUris.large) score += 15;
  if (print.purchaseUris.tcgplayer) score += 8;
  if (print.finishes.includes("foil")) score += 5;
  if (print.promo) score += 6;
  if (print.rarity === "mythic") score += 5;
  if (print.rarity === "rare") score += 3;
  score += Math.min(priceNumber(print.prices.usd_foil ?? print.prices.usd), 200) / 10;
  return score;
}

export function scorePrintForVibe(print: CardPrint, vibe: VibeId) {
  if (print.digital || print.oversized || print.lang !== "en") return Number.NEGATIVE_INFINITY;

  let score = baseScore(print);
  const effects = new Set(print.frameEffects);
  const setName = print.setName.toLowerCase();
  const setCode = print.setCode.toLowerCase();
  const usd = priceNumber(print.prices.usd);
  const foil = priceNumber(print.prices.usd_foil);

  if (vibe === "retro") {
    if (print.frame !== "1997" && !effects.has("retro")) return Number.NEGATIVE_INFINITY;
    score += 100;
  }

  if (vibe === "showcase") {
    const effectMatch = print.frameEffects.some((effect) => SPECIAL_FRAME_EFFECTS.has(effect));
    const borderless = print.borderColor === "borderless";
    if (!effectMatch && !borderless) return Number.NEGATIVE_INFINITY;
    score += 95;
  }

  if (vibe === "secret-lair") {
    const lair = setName.includes("secret lair") || setCode.startsWith("sl");
    if (!lair) return Number.NEGATIVE_INFINITY;
    score += 120;
  }

  if (vibe === "foil") {
    if (!print.finishes.includes("foil")) return Number.NEGATIVE_INFINITY;
    score += 75 + Math.min(foil || usd, 80) / 2;
  }

  if (vibe === "cheap-foil") {
    if (!print.finishes.includes("foil")) return Number.NEGATIVE_INFINITY;
    score += 100 - Math.min(foil || usd || 100, 100);
  }

  if (vibe === "max-flex") {
    score += Math.min(Math.max(foil, usd), 500) / 2;
    if (print.finishes.includes("etched")) score += 20;
    if (print.promo) score += 15;
    if (print.frameEffects.length > 0) score += 12;
  }

  return score;
}

export function selectBestPrint(candidates: CardPrint[], vibe: VibeId) {
  return candidates
    .map((print) => ({ print, score: scorePrintForVibe(print, vibe) }))
    .filter((candidate) => Number.isFinite(candidate.score))
    .sort((a, b) => b.score - a.score)[0]?.print;
}

export function applyVibeToDeck(cards: ResolvedDeckCard[], vibe: VibeId) {
  return cards.map((card) => {
    if (card.userLocked || card.status === "unresolved") return card;

    const best = selectBestPrint(card.candidates, vibe);
    if (!best) {
      return {
        ...card,
        reason: `No ${VIBES.find((item) => item.id === vibe)?.shortLabel ?? vibe} match found`,
      };
    }

    return { ...card, selectedPrint: best, reason: undefined };
  });
}
