export const DECK_FORMATS = [
  { id: "casual", label: "Casual / Kitchen Table", minCards: 60 },
  { id: "standard", label: "Standard", minCards: 60 },
  { id: "pioneer", label: "Pioneer", minCards: 60 },
  { id: "modern", label: "Modern", minCards: 60 },
  { id: "legacy", label: "Legacy", minCards: 60 },
  { id: "vintage", label: "Vintage", minCards: 60 },
  { id: "pauper", label: "Pauper", minCards: 60 },
  { id: "commander", label: "Commander", minCards: 100 },
] as const;

export type DeckFormat = (typeof DECK_FORMATS)[number]["id"];

export const DEFAULT_FORMAT: DeckFormat = "casual";

export function formatLabel(format: string) {
  return DECK_FORMATS.find((item) => item.id === format)?.label ?? format;
}

export function isSixtyCardFormat(format: string) {
  return DECK_FORMATS.some((item) => item.id === format && item.minCards === 60);
}
