import type { CardPrint, ResolvedDeckCard } from "./types";

export function marketPrice(print?: CardPrint) {
  if (!print) return 0;
  const value = print.prices.usd_foil ?? print.prices.usd;
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isChangedFromDefault(card: ResolvedDeckCard) {
  const defaultPrint = card.candidates[0];
  return Boolean(
    card.selectedPrint &&
      defaultPrint &&
      card.selectedPrint.scryfallId !== defaultPrint.scryfallId,
  );
}

export function deckSummary(cards: ResolvedDeckCard[]) {
  const selectedTotal = cards.reduce(
    (sum, card) => sum + marketPrice(card.selectedPrint) * card.quantity,
    0,
  );
  const defaultTotal = cards.reduce(
    (sum, card) => sum + marketPrice(card.candidates[0]) * card.quantity,
    0,
  );

  return {
    selectedTotal,
    defaultTotal,
    delta: selectedTotal - defaultTotal,
    lockedCards: cards.filter((card) => card.userLocked).length,
    changedCards: cards.filter(isChangedFromDefault).length,
  };
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
