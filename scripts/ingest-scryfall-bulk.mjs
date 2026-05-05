import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const outputPath = resolve(process.argv[2] ?? "data/scryfall-print-cache.json");

function pickBulkDownloadUri(entries) {
  const allCards = entries.find((entry) => entry.type === "all_cards");
  if (!allCards?.download_uri) {
    throw new Error("Scryfall all_cards bulk download was not found");
  }

  return allCards.download_uri;
}

function imageUris(card) {
  return card.image_uris ?? card.card_faces?.[0]?.image_uris ?? {};
}

function normalize(card) {
  if (!card.oracle_id || card.object !== "card") return null;

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
    imageUris: imageUris(card),
    prices: {
      usd: card.prices?.usd ?? null,
      usd_foil: card.prices?.usd_foil ?? null,
      eur: card.prices?.eur ?? null,
      tix: card.prices?.tix ?? null,
    },
    purchaseUris: {
      tcgplayer: card.purchase_uris?.tcgplayer,
      cardmarket: card.purchase_uris?.cardmarket,
      cardhoarder: card.purchase_uris?.cardhoarder,
    },
    scryfallUri: card.scryfall_uri,
    pimpScore: Number.parseFloat(card.prices?.usd_foil ?? card.prices?.usd ?? "0") || 0,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "PimpMyDeckBulkIngest/0.1",
      Accept: "application/json;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }

  return response.json();
}

const catalog = await fetchJson("https://api.scryfall.com/bulk-data");
const downloadUri = pickBulkDownloadUri(catalog.data ?? []);
const cards = await fetchJson(downloadUri);
const normalized = cards.map(normalize).filter(Boolean);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(normalized));

console.log(`Wrote ${normalized.length} print records to ${outputPath}`);
