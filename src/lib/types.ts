export type VibeId =
  | "retro"
  | "showcase"
  | "secret-lair"
  | "foil"
  | "cheap-foil"
  | "max-flex";

export type Prices = {
  usd?: string | null;
  usd_foil?: string | null;
  eur?: string | null;
  tix?: string | null;
};

export type PurchaseUris = {
  tcgplayer?: string;
  cardmarket?: string;
  cardhoarder?: string;
};

export type ImageUris = {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
};

export type CardPrint = {
  scryfallId: string;
  oracleId: string;
  name: string;
  setCode: string;
  setName: string;
  setType?: string;
  collectorNumber: string;
  releasedAt?: string;
  frame: string;
  borderColor?: string;
  finishes: string[];
  frameEffects: string[];
  promo: boolean;
  digital: boolean;
  oversized: boolean;
  lang: string;
  rarity?: string;
  imageUris: ImageUris;
  prices: Prices;
  purchaseUris: PurchaseUris;
  scryfallUri: string;
  pimpScore: number;
};

export type ParsedDeckLine = {
  id: string;
  quantity: number;
  name: string;
  section: string;
  raw: string;
};

export type ResolvedDeckCard = ParsedDeckLine & {
  oracleId?: string;
  status: "resolved" | "unresolved";
  selectedPrint?: CardPrint;
  candidates: CardPrint[];
  reason?: string;
  userLocked?: boolean;
};

export type ResolvedDeck = {
  cards: ResolvedDeckCard[];
  unresolved: ParsedDeckLine[];
  stats: {
    totalLines: number;
    totalQuantity: number;
    resolved: number;
    upgraded: number;
    needsReview: number;
  };
  source: "scryfall-live" | "cache" | "mixed";
};

export type VibeDefinition = {
  id: VibeId;
  label: string;
  shortLabel: string;
  description: string;
};
