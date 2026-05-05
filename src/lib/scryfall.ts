import type { CardPrint } from "./types";

type ScryfallCard = {
  id: string;
  oracle_id?: string;
  name: string;
  set: string;
  set_name: string;
  set_type?: string;
  collector_number: string;
  released_at?: string;
  frame: string;
  border_color?: string;
  finishes?: string[];
  frame_effects?: string[];
  promo?: boolean;
  digital?: boolean;
  oversized?: boolean;
  lang: string;
  rarity?: string;
  image_uris?: Record<string, string>;
  card_faces?: Array<{ image_uris?: Record<string, string> }>;
  prices?: Record<string, string | null>;
  purchase_uris?: Record<string, string>;
  scryfall_uri: string;
};

type ScryfallSearchResponse = {
  object: "list";
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string;
};

const cache = new Map<string, CardPrint[]>();
let queue = Promise.resolve();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function queuedFetch(url: string) {
  const run = queue.then(async () => {
    await wait(110);
    return fetch(url, {
      headers: {
        "User-Agent": "PimpMyDeck/0.1 (local MVP; Scryfall compliant)",
        Accept: "application/json;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: 60 * 60 * 12 },
    });
  });

  queue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

function getImageUris(card: ScryfallCard) {
  return card.image_uris ?? card.card_faces?.[0]?.image_uris ?? {};
}

export function transformScryfallCard(card: ScryfallCard): CardPrint | null {
  if (!card.oracle_id) return null;

  const usd = card.prices?.usd ?? null;
  const usdFoil = card.prices?.usd_foil ?? null;
  const price = Number.parseFloat(usdFoil ?? usd ?? "0");

  return {
    scryfallId: card.id,
    oracleId: card.oracle_id,
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    setType: card.set_type,
    collectorNumber: card.collector_number,
    releasedAt: card.released_at,
    frame: card.frame,
    borderColor: card.border_color,
    finishes: card.finishes ?? [],
    frameEffects: card.frame_effects ?? [],
    promo: card.promo ?? false,
    digital: card.digital ?? false,
    oversized: card.oversized ?? false,
    lang: card.lang,
    rarity: card.rarity,
    imageUris: getImageUris(card),
    prices: {
      usd,
      usd_foil: usdFoil,
      eur: card.prices?.eur ?? null,
      tix: card.prices?.tix ?? null,
    },
    purchaseUris: {
      tcgplayer: card.purchase_uris?.tcgplayer,
      cardmarket: card.purchase_uris?.cardmarket,
      cardhoarder: card.purchase_uris?.cardhoarder,
    },
    scryfallUri: card.scryfall_uri,
    pimpScore: Number.isFinite(price) ? price : 0,
  };
}

export async function findPrintsByName(name: string) {
  const key = name.toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const query = encodeURIComponent(`!"${name}"`);
  let url = `https://api.scryfall.com/cards/search?q=${query}&unique=prints&include_extras=true&order=released&dir=desc`;
  const prints: CardPrint[] = [];

  for (let page = 0; page < 4 && url; page += 1) {
    const response = await queuedFetch(url);
    if (response.status === 404) {
      cache.set(key, []);
      return [];
    }
    if (response.status === 429) {
      await wait(1000);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Scryfall lookup failed for ${name}: ${response.status}`);
    }

    const payload = (await response.json()) as ScryfallSearchResponse;
    prints.push(
      ...payload.data
        .map(transformScryfallCard)
        .filter((print): print is CardPrint => Boolean(print)),
    );
    url = payload.has_more ? payload.next_page ?? "" : "";
  }

  cache.set(key, prints);
  return prints;
}

export function getCachedPrintById(scryfallId: string) {
  for (const prints of cache.values()) {
    const found = prints.find((print) => print.scryfallId === scryfallId);
    if (found) return found;
  }

  return undefined;
}
