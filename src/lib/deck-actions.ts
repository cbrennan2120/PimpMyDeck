import { isChangedFromDefault } from "./deck-summary";
import type { ResolvedDeckCard } from "./types";

function csvCell(value: string | number | undefined) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function changedCards(cards: ResolvedDeckCard[]) {
  return cards.filter(isChangedFromDefault);
}

export function reviewCards(cards: ResolvedDeckCard[]) {
  return cards.filter((card) => card.status === "unresolved" || Boolean(card.reason));
}

export function sectionNames(cards: ResolvedDeckCard[]) {
  return [...new Set(cards.map((card) => card.section))];
}

export function toCsvRows(cards: ResolvedDeckCard[]) {
  const rows = cards.map((card) =>
    [
      card.quantity,
      card.name,
      card.section,
      card.selectedPrint?.setCode.toUpperCase(),
      card.selectedPrint?.collectorNumber,
      card.selectedPrint?.scryfallId,
      card.selectedPrint?.purchaseUris.tcgplayer,
    ]
      .map(csvCell)
      .join(","),
  );

  return [
    "Quantity,Name,Section,Set,Collector Number,Scryfall ID,TCGplayer URL",
    ...rows,
  ].join("\r\n");
}
